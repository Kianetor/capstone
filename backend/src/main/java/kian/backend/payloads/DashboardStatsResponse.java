package kian.backend.payloads;

import java.math.BigDecimal;

public record DashboardStatsResponse(
        long distinctCards,         // carte diverse nell'inventario
        long totalCopies,           // copie possedute in tutto
        BigDecimal inventoryValue,  // valore stimato x copie
        BigDecimal totalSpent,      // somma degli acquisti
        BigDecimal totalRevenue,    // somma delle vendite
        BigDecimal margin,          // ricavi - spesa
        BigDecimal netBalance       // valore inventario + ricavi - spesa
) {
}
