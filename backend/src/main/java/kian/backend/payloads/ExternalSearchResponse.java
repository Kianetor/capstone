package kian.backend.payloads;

import java.util.List;

// Una pagina di risultati della ricerca esterna; hasMore = c'è almeno un'altra pagina da chiedere
public record ExternalSearchResponse(
        List<ExternalCardSummary> results,
        boolean hasMore
) {
}
