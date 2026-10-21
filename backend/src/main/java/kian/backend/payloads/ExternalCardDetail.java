package kian.backend.payloads;

import java.math.BigDecimal;

// Dati per precompilare il form "aggiungi carta"
public record ExternalCardDetail(
        String externalId,
        String name,
        String setName,
        String cardNumber,      // es. 4/102
        String rarity,
        String imageUrl,        // null se l'API non ha l'immagine
        BigDecimal marketPrice  // prezzo medio a 30 giorni su Cardmarket in euro, null se non disponibile
) {
}
