package kian.backend.payloads;

import kian.backend.entities.Transaction;
import kian.backend.entities.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        UUID cardId,
        String cardName,
        TransactionType type,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal total,
        LocalDate date,
        String counterparty,
        String platform,
        String notes
) {
    public static TransactionResponse of(Transaction t) {
        return new TransactionResponse(t.getId(), t.getCard().getId(), t.getCard().getName(), t.getType(),
                t.getQuantity(), t.getUnitPrice(), t.getTotal(), t.getDate(), t.getCounterparty(),
                t.getPlatform(), t.getNotes());
    }
}
