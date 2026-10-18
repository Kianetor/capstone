package kian.backend.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.ExternalServiceException;
import kian.backend.exceptions.NotFoundException;
import kian.backend.payloads.ExternalCardDetail;
import kian.backend.payloads.ExternalCardSummary;
import kian.backend.payloads.ExternalSearchResponse;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
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

    // L'elenco dei set cambia di rado: lo teniamo in memoria per non chiederlo a ogni ricerca
    private static final Duration SETS_CACHE_DURATION = Duration.ofHours(12);
    private final Map<String, CachedSets> setsCache = new ConcurrentHashMap<>();
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
                Optional<TcgdexCard> card = fetch(TcgdexCard.class, "/{lang}/cards/{id}", language, q);
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
                        .filter(c -> number.equals(withoutLeadingZeros(c.localId())))
                        .map(ExternalCardService::summary)
                        .toList();
                return new ExternalSearchResponse(found, false);
            }

            // 4. Solo nome, a pagine
            List<TcgdexCardBrief> found = byName(language, q, pageNumber, MAX_RESULTS);
            return new ExternalSearchResponse(found.stream().map(ExternalCardService::summary).toList(),
                    found.size() == MAX_RESULTS);
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
        CachedSets cached = setsCache.get(language);
        if (cached == null || cached.fetchedAt().plus(SETS_CACHE_DURATION).isBefore(Instant.now())) {
            TcgdexSet[] sets = restClient.get().uri("/{lang}/sets", language).retrieve().body(TcgdexSet[].class);
            cached = new CachedSets(Instant.now(), sets == null ? List.of() : List.of(sets));
            setsCache.put(language, cached);
        }
        return cached.sets();
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
                image(card.image(), "high"), trendPrice(card));
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

    // Prezzo di tendenza su Cardmarket; per le carte che esistono solo holo c'è solo "trend-holo"
    private static BigDecimal trendPrice(TcgdexCard card) {
        if (card.pricing() == null || card.pricing().cardmarket() == null) {
            return null;
        }
        Map<String, Object> cardmarket = card.pricing().cardmarket();
        for (String key : List.of("trend", "trend-holo", "avg")) {
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
    private record TcgdexSet(String id, String name, TcgdexCardCount cardCount) {
    }

    private record CachedSets(Instant fetchedAt, List<TcgdexSet> sets) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexCardCount(Integer official) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexPricing(Map<String, Object> cardmarket) {
    }
}
