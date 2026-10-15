package kian.backend.payloads;

import kian.backend.entities.TransactionType;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

// Filtri dello storico: date in formato yyyy-MM-dd, estremi inclusi
public record TransactionSearchParams(
        TransactionType type,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        UUID cardId
) {
}
