package kian.backend.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.ExternalServiceException;
import kian.backend.exceptions.NotFoundException;
import kian.backend.payloads.ExternalCardDetail;
import kian.backend.payloads.ExternalCardSummary;
import kian.backend.payloads.ExternalSearchResponse;
import kian.backend.payloads.ExternalSeriesDetail;
import kian.backend.payloads.ExternalSeriesSummary;
import kian.backend.payloads.ExternalSetDetail;
import kian.backend.payloads.ExternalSetSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.function.Supplier;
import java.util.regex.Pattern;

// Ricerca carte su TCGdex (api.tcgdex.net): gratuita e senza chiave.
// Il frontend passa sempre da qui, così l'indirizzo e il formato dell'API esterna restano nel backend
@Service
public class ExternalCardService {

    private static final Set<String> LANGUAGES = Set.of("it", "en", "ja", "fr", "de", "es", "pt");
    private static final Pattern EXTERNAL_ID = Pattern.compile("^[A-Za-z0-9.\\-]{1,50}$");
    private static final int MAX_RESULTS = 30;
    private static final int MAX_PAGE = 50;

    // Id di TCGdex, es. base1-4 o sv03.5-025
    private static final Pattern TCGDEX_ID = Pattern.compile("^[A-Za-z0-9.]+-[A-Za-z0-9]+$");
    // Numero stampato sulla carta, es. 4/102 o 025/165, anche dopo il nome: "charizard 4/102"
    private static final Pattern PRINTED_NUMBER =
            Pattern.compile("(?:^|\\s)#?([A-Za-z]{0,3}\\d{1,4}[a-z]?)\\s*/\\s*(\\d{1,4})(?=\\s|$)");
    // Nome seguito dal solo numero nel set, es. "pikachu 25"
    private static final Pattern NAME_AND_NUMBER = Pattern.compile("^(.*\\S)\\s+#?(\\d{1,4})$");

    // Serie, set e loro contenuto cambiano di rado: li teniamo in memoria per 12 ore invece di chiederli ogni volta
    private static final Duration CACHE_DURATION = Duration.ofHours(12);
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();
    // "Pokémon TCG Pocket" è un gioco digitale: non ha carte fisiche da collezionare
    private static final Set<String> EXCLUDED_SERIES = Set.of("tcgp");
    private static final String UNAVAILABLE = "Ricerca carte non disponibile al momento, inserisci i dati a mano";

    private final RestClient restClient;

    public ExternalCardService(@Value("${app.tcgdex.base-url}") String baseUrl) {
        // Se l'API è lenta non blocchiamo l'utente: dopo 5 secondi si passa all'inserimento manuale
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    // Cerca per nome (a pagine da 30), per numero stampato sulla carta (4/102), per nome + numero o per id TCGdex
    public ExternalSearchResponse search(String query, String lang, Integer page) {
        if (query == null || query.trim().length() < 2 || query.length() > 50) {
            throw new BadRequestException("Scrivi da 2 a 50 caratteri");
        }
        String language = checkLanguage(lang);
        int pageNumber = page == null ? 1 : page;
        if (pageNumber < 1 || pageNumber > MAX_PAGE) {
            throw new BadRequestException("Pagina non valida");
        }
        String q = query.trim();

        try {
            // 1. Id di TCGdex (base1-4): se esiste è la carta cercata, altrimenti era un nome col trattino (ho-oh)
            if (pageNumber == 1 && TCGDEX_ID.matcher(q).matches() && q.chars().anyMatch(Character::isDigit)) {
                Optional<TcgdexCard> card = fetch(TcgdexCard.class, "/{lang}/cards/{id}", language, q)
                        .filter(c -> isPhysical(language, c.id()));
                if (card.isPresent()) {
                    return new ExternalSearchResponse(List.of(summary(card.get())), false);
                }
            }

            // 2. Numero stampato sulla carta, con o senza nome: 4/102, charizard 4/102
            Matcher printed = PRINTED_NUMBER.matcher(q);
            if (printed.find()) {
                String name = (q.substring(0, printed.start()) + " " + q.substring(printed.end())).trim();
                List<ExternalCardSummary> found = byPrintedNumber(language, printed.group(1),
                        Integer.parseInt(printed.group(2)), name);
                return new ExternalSearchResponse(found, false);
            }

            // 3. Nome e numero nel set: pikachu 25
            Matcher nameAndNumber = NAME_AND_NUMBER.matcher(q);
            if (nameAndNumber.matches()) {
                String number = withoutLeadingZeros(nameAndNumber.group(2));
                List<ExternalCardSummary> found = byName(language, nameAndNumber.group(1), 1, 250).stream()
                        .filter(c -> isPhysical(language, c.id()))
                        .filter(c -> number.equals(withoutLeadingZeros(c.localId())))
                        .map(ExternalCardService::summary)
                        .toList();
                return new ExternalSearchResponse(found, false);
            }

            // 4. Solo nome, a pagine. hasMore guarda la pagina intera di TCGdex, prima di togliere le carte Pocket
            List<TcgdexCardBrief> found = byName(language, q, pageNumber, MAX_RESULTS);
            return new ExternalSearchResponse(found.stream()
                    .filter(c -> isPhysical(language, c.id()))
                    .map(ExternalCardService::summary)
                    .toList(), found.size() == MAX_RESULTS);
        } catch (RestClientException e) {
            throw new ExternalServiceException(UNAVAILABLE, e);
        }
    }

    private List<TcgdexCardBrief> byName(String language, String name, int page, int perPage) {
        TcgdexCardBrief[] results = restClient.get()
                .uri(uri -> uri.path("/{lang}/cards")
                        .queryParam("name", name)
                        .queryParam("pagination:page", page)
                        .queryParam("pagination:itemsPerPage", perPage)
                        .build(language))
                .retrieve()
                .body(TcgdexCardBrief[].class);
        return results == null ? List.of() : Arrays.asList(results);
    }

    // 4/102: cerchiamo la carta n. 4 in ogni set con 102 carte ufficiali (di solito sono uno o due)
    private List<ExternalCardSummary> byPrintedNumber(String language, String number, int setSize, String name) {
        List<ExternalCardSummary> found = new ArrayList<>();
        for (TcgdexSet set : sets(language)) {
            if (excludedSetIds(language).contains(set.id())) {
                continue;
            }
            if (set.cardCount() == null || set.cardCount().official() == null || set.cardCount().official() != setSize) {
                continue;
            }
            // Alcuni set vogliono "025", altri "4" invece di "004": proviamo il numero com'è e senza zeri iniziali
            Optional<TcgdexCard> card = fetch(TcgdexCard.class, "/{lang}/sets/{set}/{number}", language, set.id(), number);
            if (card.isEmpty() && !number.equals(withoutLeadingZeros(number))) {
                card = fetch(TcgdexCard.class, "/{lang}/sets/{set}/{number}", language, set.id(), withoutLeadingZeros(number));
            }
            card.filter(c -> name.isBlank() || c.name().toLowerCase(Locale.ROOT).contains(name.toLowerCase(Locale.ROOT)))
                    .map(ExternalCardService::summary)
                    .ifPresent(found::add);
        }
        return found;
    }

    private List<TcgdexSet> sets(String language) {
        return cached("sets:" + language, () -> {
            TcgdexSet[] sets = restClient.get().uri("/{lang}/sets", language).retrieve().body(TcgdexSet[].class);
            return sets == null ? List.<TcgdexSet>of() : List.of(sets);
        });
    }

    // Id dei set delle serie escluse (Pokémon TCG Pocket): le loro carte esistono solo nel gioco digitale
    private Set<String> excludedSetIds(String language) {
        return cached("excluded:" + language, () -> {
            Set<String> ids = new HashSet<>();
            for (String serieId : EXCLUDED_SERIES) {
                fetch(TcgdexSerie.class, "/{lang}/series/{id}", language, serieId)
                        .map(TcgdexSerie::sets)
                        .ifPresent(sets -> sets.forEach(set -> ids.add(set.id())));
            }
            return Set.copyOf(ids);
        });
    }

    // Una carta è fisica se il suo set (la parte dell'id prima dell'ultimo trattino) non è di una serie esclusa
    private boolean isPhysical(String language, String cardId) {
        int dash = cardId.lastIndexOf('-');
        return dash < 0 || !excludedSetIds(language).contains(cardId.substring(0, dash));
    }

    // ---- Catalogo pubblico: serie, set e loro carte ----

    // Tutte le serie, dalla più recente
    public List<ExternalSeriesSummary> series(String lang) {
        String language = checkLanguage(lang);
        return external(() -> cached("series:" + language, () -> {
            TcgdexSerieBrief[] series = restClient.get().uri("/{lang}/series", language).retrieve()
                    .body(TcgdexSerieBrief[].class);
            List<ExternalSeriesSummary> result = new ArrayList<>();
            for (TcgdexSerieBrief s : series == null ? new TcgdexSerieBrief[0] : series) {
                if (!EXCLUDED_SERIES.contains(s.id())) {
                    result.add(new ExternalSeriesSummary(s.id(), s.name(), logo(s.logo())));
                }
            }
            return result.reversed();
        }));
    }

    // Una serie con i suoi set, dal più recente
    public ExternalSeriesDetail seriesDetail(String seriesId, String lang) {
        String id = checkId(seriesId, "Id serie non valido");
        String language = checkLanguage(lang);
        return external(() -> cached("serie:" + language + ":" + id, () -> {
            TcgdexSerie serie = fetch(TcgdexSerie.class, "/{lang}/series/{id}", language, id)
                    .orElseThrow(() -> new NotFoundException("Serie non trovata"));
            List<ExternalSetSummary> sets = (serie.sets() == null ? List.<TcgdexSet>of() : serie.sets()).stream()
                    .map(ExternalCardService::setSummary)
                    .toList()
                    .reversed();
            return new ExternalSeriesDetail(serie.id(), serie.name(), logo(serie.logo()), date(serie.releaseDate()), sets);
        }));
    }

    // Un set con tutte le sue carte, in ordine di numero
    public ExternalSetDetail setDetail(String setId, String lang) {
        String id = checkId(setId, "Id set non valido");
        String language = checkLanguage(lang);
        return external(() -> cached("set:" + language + ":" + id, () -> {
            TcgdexSetFull set = fetch(TcgdexSetFull.class, "/{lang}/sets/{id}", language, id)
                    .orElseThrow(() -> new NotFoundException("Set non trovato"));
            TcgdexCardCount count = set.cardCount();
            return new ExternalSetDetail(set.id(), set.name(), logo(set.logo()), date(set.releaseDate()),
                    set.serie() != null ? set.serie().id() : null, set.serie() != null ? set.serie().name() : null,
                    count != null ? count.official() : null, count != null ? count.total() : null,
                    (set.cards() == null ? List.<TcgdexCardBrief>of() : set.cards()).stream()
                            .map(ExternalCardService::summary)
                            .toList());
        }));
    }

    // Gli ultimi set usciti con un logo, scorrendo le serie dalla più recente: per la vetrina della landing page
    public List<ExternalSetSummary> latestSets(String lang, Integer limit) {
        int max = limit == null ? 12 : limit;
        if (max < 1 || max > 30) {
            throw new BadRequestException("Il limite deve essere tra 1 e 30");
        }
        List<ExternalSetSummary> result = new ArrayList<>();
        for (ExternalSeriesSummary serie : series(lang)) {
            for (ExternalSetSummary set : seriesDetail(serie.id(), lang).sets()) {
                if (result.size() == max) {
                    return result;
                }
                if (set.logoUrl() != null) {
                    result.add(set);
                }
            }
        }
        return result;
    }

    // Valore in memoria se ha meno di 12 ore, altrimenti lo ricarica con loader
    @SuppressWarnings("unchecked")
    private <T> T cached(String key, Supplier<T> loader) {
        Cached hit = cache.get(key);
        if (hit != null && hit.storedAt().plus(CACHE_DURATION).isAfter(Instant.now())) {
            return (T) hit.value();
        }
        T value = loader.get();
        cache.put(key, new Cached(Instant.now(), value));
        return value;
    }

    // Errori di rete o di TCGdex -> 503 con il messaggio per l'utente
    private static <T> T external(Supplier<T> call) {
        try {
            return call.get();
        } catch (RestClientException e) {
            throw new ExternalServiceException("Catalogo carte non disponibile al momento, riprova tra poco", e);
        }
    }

    private static String checkId(String id, String message) {
        if (id == null || !EXTERNAL_ID.matcher(id).matches()) {
            throw new BadRequestException(message);
        }
        return id;
    }

    private static ExternalSetSummary setSummary(TcgdexSet s) {
        TcgdexCardCount count = s.cardCount();
        return new ExternalSetSummary(s.id(), s.name(), logo(s.logo()),
                count != null ? count.official() : null, count != null ? count.total() : null);
    }

    // Come per le immagini delle carte, TCGdex dà l'indirizzo del logo senza estensione
    private static String logo(String base) {
        return base == null ? null : base + ".webp";
    }

    private static LocalDate date(String value) {
        return value == null || value.isBlank() ? null : LocalDate.parse(value.substring(0, 10));
    }

    // Una risorsa di TCGdex che potrebbe non esistere: 404 -> vuoto, gli altri errori salgono al chiamante
    private <T> Optional<T> fetch(Class<T> type, String path, Object... params) {
        try {
            return Optional.ofNullable(restClient.get().uri(path, params).retrieve().body(type));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        }
    }

    private static ExternalCardSummary summary(TcgdexCardBrief c) {
        return new ExternalCardSummary(c.id(), c.name(), c.localId(), image(c.image(), "low"));
    }

    private static ExternalCardSummary summary(TcgdexCard c) {
        return new ExternalCardSummary(c.id(), c.name(), c.localId(), image(c.image(), "low"));
    }

    private static String withoutLeadingZeros(String number) {
        return number != null && number.matches("\\d+") ? String.valueOf(Integer.parseInt(number)) : number;
    }

    public ExternalCardDetail detail(String externalId, String lang) {
        if (externalId == null || !EXTERNAL_ID.matcher(externalId).matches()) {
            throw new BadRequestException("Id carta non valido");
        }
        String language = checkLanguage(lang);
        TcgdexCard card;
        try {
            card = restClient.get()
                    .uri("/{lang}/cards/{id}", language, externalId)
                    .retrieve()
                    .body(TcgdexCard.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new NotFoundException("Carta non trovata nell'API esterna");
        } catch (RestClientException e) {
            throw new ExternalServiceException(UNAVAILABLE, e);
        }
        if (card == null) {
            throw new NotFoundException("Carta non trovata nell'API esterna");
        }

        String setName = card.set() != null ? card.set().name() : null;
        return new ExternalCardDetail(card.id(), card.name(), setName, cardNumber(card), card.rarity(),
                image(card.image(), "high"), marketPrice(card));
    }

    private static String checkLanguage(String lang) {
        String language = lang == null || lang.isBlank() ? "it" : lang.trim().toLowerCase();
        if (!LANGUAGES.contains(language)) {
            throw new BadRequestException("Lingua non supportata. Valori ammessi: " + LANGUAGES);
        }
        return language;
    }

    // TCGdex dà l'indirizzo base dell'immagine: qualità e formato si aggiungono in fondo
    private static String image(String base, String quality) {
        return base == null ? null : base + "/" + quality + ".webp";
    }

    // Numero come sulla carta: 4/102 (numero nel set / carte ufficiali del set)
    private static String cardNumber(TcgdexCard card) {
        if (card.set() != null && card.set().cardCount() != null && card.set().cardCount().official() != null) {
            return card.localId() + "/" + card.set().cardCount().official();
        }
        return card.localId();
    }

    // Prezzo di mercato su Cardmarket. Usiamo la media degli ultimi 30 giorni: il "trend" di TCGdex a volte è
    // sballato (Charizard Base Set: trend 0,02 € con media a 30 giorni di 682 €). I campi "-holo" non li usiamo:
    // per le carte moderne sono il prezzo della versione reverse holo, non della carta
    private static BigDecimal marketPrice(TcgdexCard card) {
        if (card.pricing() == null || card.pricing().cardmarket() == null) {
            return null;
        }
        Map<String, Object> cardmarket = card.pricing().cardmarket();
        for (String key : List.of("avg30", "avg7", "trend", "avg")) {
            if (cardmarket.get(key) instanceof Number n && n.doubleValue() > 0) {
                return BigDecimal.valueOf(n.doubleValue()).setScale(2, RoundingMode.HALF_UP);
            }
        }
        return null;
    }

    // Solo i campi della risposta di TCGdex che ci servono
    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexCardBrief(String id, String localId, String name, String image) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexCard(String id, String localId, String name, String image, String rarity,
                              TcgdexSet set, TcgdexPricing pricing) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexSet(String id, String name, String logo, TcgdexCardCount cardCount) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexSetFull(String id, String name, String logo, String releaseDate, TcgdexSerieBrief serie,
                                 TcgdexCardCount cardCount, List<TcgdexCardBrief> cards) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexSerieBrief(String id, String name, String logo) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexSerie(String id, String name, String logo, String releaseDate, List<TcgdexSet> sets) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexCardCount(Integer official, Integer total) {
    }

    private record Cached(Instant storedAt, Object value) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexPricing(Map<String, Object> cardmarket) {
    }
}
