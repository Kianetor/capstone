package kian.backend.controllers;

import jakarta.validation.Valid;
import kian.backend.payloads.*;
import kian.backend.services.CardService;
import kian.backend.services.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

// Inventario dell'utente del token: le carte degli altri non sono raggiungibili
@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;
    private final TransactionService transactionService;

    // Esempio: /api/cards?q=charizard&language=ITA&graded=true&sort=estimatedValue,desc&page=0&size=12
    @GetMapping
    public PageResponse<CardResponse> search(@AuthenticationPrincipal Jwt jwt,
                                             @ModelAttribute CardSearchParams params,
                                             @PageableDefault(size = 12) Pageable pageable) {
        return cardService.search(userId(jwt), params, pageable);
    }

    // Stessi filtri di /api/cards, ma le copie della stessa carta arrivano raggruppate
    @GetMapping("/groups")
    public PageResponse<CardGroupResponse> searchGroups(@AuthenticationPrincipal Jwt jwt,
                                                        @ModelAttribute CardSearchParams params,
                                                        @PageableDefault(size = 12) Pageable pageable) {
        return cardService.searchGroups(userId(jwt), params, pageable);
    }

    @GetMapping("/{id}")
    public CardDetailResponse detail(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return cardService.detail(userId(jwt), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CardResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CardRequest request) {
        return cardService.create(userId(jwt), request);
    }

    @PutMapping("/{id}")
    public CardResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                               @Valid @RequestBody CardRequest request) {
        return cardService.update(userId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        cardService.delete(userId(jwt), id);
    }

    // multipart/form-data con il file nel campo "file"
    @PostMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CardResponse uploadImage(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                    @RequestParam("file") MultipartFile file) {
        return cardService.uploadImage(userId(jwt), id, file);
    }

    @PostMapping("/{id}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse addTransaction(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                              @Valid @RequestBody TransactionRequest request) {
        return transactionService.create(userId(jwt), id, request);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
