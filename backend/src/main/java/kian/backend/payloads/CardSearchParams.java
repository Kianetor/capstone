package kian.backend.payloads;

import kian.backend.entities.CardCondition;
import kian.backend.entities.Language;

// Filtri dell'inventario da query string, tutti facoltativi e combinati in AND
public record CardSearchParams(
        String q,                 // testo libero su nome, set e numero
        String name,
        String setName,
        Language language,
        CardCondition condition,
        Boolean graded
) {
}
