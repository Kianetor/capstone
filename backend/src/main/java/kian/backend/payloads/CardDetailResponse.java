package kian.backend.payloads;

import java.util.List;

// Dettaglio carta con il suo storico, dalla transazione più recente
public record CardDetailResponse(
        CardResponse card,
        List<TransactionResponse> transactions
) {
}
