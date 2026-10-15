package kian.backend.payloads;

import kian.backend.entities.Card;
import kian.backend.entities.CardCondition;
import kian.backend.entities.Language;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record CardResponse(
        UUID id,
        String name,
        String setName,
        String cardNumber,
        Language language,
        CardCondition condition,
        boolean graded,
        String gradingCompany,
        Double grade,
        int quantity,
        BigDecimal estimatedValue,
        String imageUrl,
        String externalId,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CardResponse of(Card c) {
        return new CardResponse(c.getId(), c.getName(), c.getSetName(), c.getCardNumber(), c.getLanguage(),
                c.getCondition(), c.isGraded(), c.getGradingCompany(), c.getGrade(), c.getQuantity(),
                c.getEstimatedValue(), c.getImageUrl(), c.getExternalId(), c.getNotes(),
                c.getCreatedAt(), c.getUpdatedAt());
    }
}
