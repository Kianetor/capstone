package kian.backend.payloads;

import java.math.BigDecimal;
import java.time.LocalDate;

// Dati per precompilare il form "aggiungi carta"
public record ExternalCardDetail(
        String externalId,
        String name,
        String setName,
        String cardNumber,      // es. 4/102
        String rarity,
        String imageUrl,        // null se l'API non ha l'immagine
        BigDecimal marketPrice, // prezzo medio a 30 giorni su Cardmarket in euro, null se non disponibile
        MarketPrices market     // medie di Cardmarket per il grafico, null se la carta non ha prezzi
) {
    // Medie del prezzo di vendita su Cardmarket in euro (ognuna null se manca) e data dell'ultimo aggiornamento.
    // TCGdex non ha lo storico: sono medie su periodi diversi, non punti nel tempo
    public record MarketPrices(BigDecimal avg30, BigDecimal avg7, BigDecimal avg1, BigDecimal low, LocalDate updated) {
    }
}
