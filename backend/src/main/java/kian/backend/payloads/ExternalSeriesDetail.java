package kian.backend.payloads;

import java.time.LocalDate;
import java.util.List;

// Una serie con i suoi set, dal più recente
public record ExternalSeriesDetail(
        String id,
        String name,
        String logoUrl,
        LocalDate releaseDate,
        List<ExternalSetSummary> sets
) {
}
