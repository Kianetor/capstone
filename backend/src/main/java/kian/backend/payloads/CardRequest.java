package kian.backend.payloads;

import jakarta.validation.constraints.*;
import kian.backend.entities.CardCondition;
import kian.backend.entities.Language;

import java.math.BigDecimal;

// Creazione e modifica di una carta
public record CardRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 100) String setName,
        @Size(max = 20) String cardNumber,
        @NotNull Language language,
        @NotNull CardCondition condition,
        @NotNull Boolean graded,
        @Size(max = 20) String gradingCompany,
        @DecimalMin("1.0") @DecimalMax("10.0") Double grade,
        @NotNull @PositiveOrZero @Max(9999) Integer quantity,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal estimatedValue,
        @Size(max = 500)
        @Pattern(regexp = "^https://[^\\s\"'<>]+$", message = "deve essere un indirizzo https")
        String imageUrl,
        @Size(max = 50) String externalId,
        @Size(max = 2000) String notes
) {
    // Una carta gradata deve avere compagnia e voto
    @AssertTrue(message = "per una carta gradata servono compagnia e voto")
    public boolean isGradingValid() {
        if (!Boolean.TRUE.equals(graded)) {
            return true;
        }
        return gradingCompany != null && !gradingCompany.isBlank() && grade != null;
    }
}
