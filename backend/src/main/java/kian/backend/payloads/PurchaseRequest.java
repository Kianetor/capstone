package kian.backend.payloads;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

// Acquisto da registrare insieme a una carta nuova (le copie sono quelle della carta)
public record PurchaseRequest(
        @NotNull @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal unitPrice,
        @NotNull @PastOrPresent LocalDate date,
        @Size(max = 50) String platform
) {
}
