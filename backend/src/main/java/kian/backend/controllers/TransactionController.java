package kian.backend.controllers;

import kian.backend.payloads.PageResponse;
import kian.backend.payloads.TransactionResponse;
import kian.backend.payloads.TransactionSearchParams;
import kian.backend.services.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // Esempio: /api/transactions?type=SELL&from=2026-01-01&to=2026-10-31&page=0&size=20
    @GetMapping
    public PageResponse<TransactionResponse> search(@AuthenticationPrincipal Jwt jwt,
                                                    @ModelAttribute TransactionSearchParams params,
                                                    @PageableDefault(size = 20) Pageable pageable) {
        return transactionService.search(UUID.fromString(jwt.getSubject()), params, pageable);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        transactionService.delete(UUID.fromString(jwt.getSubject()), id);
    }
}
