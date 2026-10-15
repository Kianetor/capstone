package kian.backend.services;

import kian.backend.entities.Card;
import kian.backend.entities.Transaction;
import kian.backend.entities.TransactionType;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.NotFoundException;
import kian.backend.payloads.PageResponse;
import kian.backend.payloads.TransactionRequest;
import kian.backend.payloads.TransactionResponse;
import kian.backend.payloads.TransactionSearchParams;
import kian.backend.repositories.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static kian.backend.services.SearchUtils.blankToNull;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final Map<String, String> SORTABLE = Map.of(
            "date", "date",
            "unitPrice", "unitPrice",
            "quantity", "quantity",
            "createdAt", "createdAt");

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "date", "createdAt");

    private final TransactionRepository transactionRepository;
    private final CardService cardService;

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> search(UUID userId, TransactionSearchParams params, Pageable pageable) {
        if (params.from() != null && params.to() != null && params.from().isAfter(params.to())) {
            throw new BadRequestException("La data iniziale è successiva a quella finale");
        }
        Pageable request = SearchUtils.withSort(pageable, SORTABLE, DEFAULT_SORT);
        return PageResponse.of(transactionRepository.findAll(TransactionSpecifications.of(userId, params), request)
                .map(TransactionResponse::of));
    }

    // Un acquisto aumenta le copie possedute, una vendita le diminuisce
    @Transactional
    public TransactionResponse create(UUID userId, UUID cardId, TransactionRequest r) {
        Card card = cardService.findOwned(userId, cardId);
        if (r.type() == TransactionType.SELL && r.quantity() > card.getQuantity()) {
            throw new BadRequestException("Copie insufficienti: ne possiedi " + card.getQuantity());
        }
        card.setQuantity(card.getQuantity() + delta(r.type(), r.quantity()));

        Transaction t = new Transaction();
        t.setCard(card);
        t.setType(r.type());
        t.setQuantity(r.quantity());
        t.setUnitPrice(r.unitPrice());
        t.setDate(r.date());
        t.setCounterparty(blankToNull(r.counterparty()));
        t.setPlatform(blankToNull(r.platform()));
        t.setNotes(blankToNull(r.notes()));
        transactionRepository.save(t);

        log.info("Registrata transazione={} tipo={} carta={}", t.getId(), t.getType(), cardId);
        return TransactionResponse.of(t);
    }

    // Annullare una transazione ne inverte l'effetto sulla quantità
    @Transactional
    public void delete(UUID userId, UUID transactionId) {
        Transaction t = transactionRepository.findByIdAndCardUserId(transactionId, userId)
                .orElseThrow(() -> new NotFoundException("Transazione non trovata"));
        Card card = t.getCard();
        int newQuantity = card.getQuantity() - delta(t.getType(), t.getQuantity());
        if (newQuantity < 0) {
            throw new BadRequestException("Impossibile annullare l'acquisto: alcune copie sono già state vendute");
        }
        card.setQuantity(newQuantity);
        card.getTransactions().remove(t);
        transactionRepository.delete(t);
        log.info("Annullata transazione={} carta={}", transactionId, card.getId());
    }

    private static int delta(TransactionType type, int quantity) {
        return type == TransactionType.BUY ? quantity : -quantity;
    }
}
