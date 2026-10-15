package kian.backend.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.ExternalServiceException;
import kian.backend.exceptions.NotFoundException;
import kian.backend.payloads.ExternalCardDetail;
import kian.backend.payloads.ExternalCardSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

// Ricerca carte su TCGdex (api.tcgdex.net): gratuita e senza chiave.
// Il frontend passa sempre da qui, così l'indirizzo e il formato dell'API esterna restano nel backend
@Service
public class ExternalCardService {

    private static final Set<String> LANGUAGES = Set.of("it", "en", "ja", "fr", "de", "es", "pt");
    private static final Pattern EXTERNAL_ID = Pattern.compile("^[A-Za-z0-9.\\-]{1,50}$");
    private static final int MAX_RESULTS = 30;
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

    public List<ExternalCardSummary> search(String query, String lang) {
        if (query == null || query.trim().length() < 2 || query.length() > 50) {
            throw new BadRequestException("Scrivi da 2 a 50 caratteri");
        }
        String language = checkLanguage(lang);
        try {
            TcgdexCardBrief[] results = restClient.get()
                    .uri(uri -> uri.path("/{lang}/cards")
                            .queryParam("name", query.trim())
                            .queryParam("pagination:itemsPerPage", MAX_RESULTS)
                            .build(language))
                    .retrieve()
                    .body(TcgdexCardBrief[].class);
            if (results == null) {
                return List.of();
            }
            return Arrays.stream(results)
                    .map(c -> new ExternalCardSummary(c.id(), c.name(), c.localId(), image(c.image(), "low")))
                    .toList();
        } catch (RestClientException e) {
            throw new ExternalServiceException(UNAVAILABLE, e);
        }
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
    private record TcgdexSet(String name, TcgdexCardCount cardCount) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexCardCount(Integer official) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TcgdexPricing(Map<String, Object> cardmarket) {
    }
}
