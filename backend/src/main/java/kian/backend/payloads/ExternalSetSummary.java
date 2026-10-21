package kian.backend.payloads;

// Un set (espansione) dell'API esterna, per le griglie di loghi
public record ExternalSetSummary(
        String id,
        String name,
        String logoUrl,          // null se l'API non ha il logo
        Integer officialCount,   // carte numerate (il 102 di 4/102)
        Integer totalCount       // comprese le carte segrete
) {
}
