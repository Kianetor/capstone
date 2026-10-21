package kian.backend.services;

import kian.backend.entities.TransactionType;
import kian.backend.payloads.DashboardStatsResponse;
import kian.backend.repositories.CardRepository;
import kian.backend.repositories.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CardRepository cardRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse stats(UUID userId) {
        BigDecimal inventoryValue = money(cardRepository.sumInventoryValueByUserId(userId));
        BigDecimal spent = money(transactionRepository.sumTotalByUserIdAndType(userId, TransactionType.BUY));
        BigDecimal revenue = money(transactionRepository.sumTotalByUserIdAndType(userId, TransactionType.SELL));

        return new DashboardStatsResponse(
                cardRepository.countByUserIdAndQuantityGreaterThan(userId, 0),
                cardRepository.sumQuantityByUserId(userId),
                inventoryValue,
                spent,
                revenue,
                revenue.subtract(spent),
                inventoryValue.add(revenue).subtract(spent));
    }

    // Sempre due decimali: 0 diventa 0.00
    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
