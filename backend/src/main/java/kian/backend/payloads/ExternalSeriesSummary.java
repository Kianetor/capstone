package kian.backend.payloads;

// Una serie dell'API esterna (es. Scarlatto e Violetto), per l'elenco delle serie
public record ExternalSeriesSummary(
        String id,
        String name,
        String logoUrl     // null se l'API non ha il logo
) {
}
