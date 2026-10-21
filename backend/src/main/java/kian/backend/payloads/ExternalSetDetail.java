package kian.backend.payloads;

import java.time.LocalDate;
import java.util.List;

// Un set con tutte le sue carte, in ordine di numero
public record ExternalSetDetail(
        String id,
        String name,
        String logoUrl,
        LocalDate releaseDate,
        String seriesId,
        String seriesName,
        Integer officialCount,
        Integer totalCount,
        List<ExternalCardSummary> cards
) {
}
