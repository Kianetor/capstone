package kian.backend.payloads;

// Un risultato della ricerca nell'API esterna: quanto basta per mostrare l'elenco
public record ExternalCardSummary(
        String externalId,
        String name,
        String number,
        String thumbnailUrl     // null se l'API non ha l'immagine
) {
}
