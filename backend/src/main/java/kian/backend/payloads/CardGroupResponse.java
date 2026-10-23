package kian.backend.payloads;

import java.math.BigDecimal;
import java.util.List;

// Copie della stessa carta raggruppate nell'inventario (es. due Charizard Base Set in condizioni diverse).
// Nome, set, numero e immagine sono quelli della prima variante; quantity è il totale delle copie
public record CardGroupResponse(
        String key,
        String name,
        String setName,
        String cardNumber,
        String imageUrl,
        int quantity,
        BigDecimal minValue,
        BigDecimal maxValue,
        List<Variant> variants
) {
    // Una riga dell'inventario con il suo prezzo medio d'acquisto (null se non ci sono acquisti registrati)
    public record Variant(CardResponse card, BigDecimal averagePurchasePrice) {
    }
}
