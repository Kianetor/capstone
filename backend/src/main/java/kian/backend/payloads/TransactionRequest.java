package kian.backend.payloads;

import jakarta.validation.constraints.*;
import kian.backend.entities.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull TransactionType type,
        @NotNull @Positive @Max(9999) Integer quantity,
        @NotNull @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal unitPrice,
        @NotNull @PastOrPresent LocalDate date,
        @Size(max = 100) String counterparty,
        @Size(max = 50) String platform,
        @Size(max = 2000) String notes
) {
}
