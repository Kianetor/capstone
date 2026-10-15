package kian.backend.services;

import kian.backend.entities.Card;
import kian.backend.exceptions.NotFoundException;
import kian.backend.payloads.*;
import kian.backend.repositories.CardRepository;
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
public class CardService {

    // Colonne ordinabili: nome nel parametro sort -> proprietà JPA
    private static final Map<String, String> SORTABLE = Map.of(
            "name", "name",
            "setName", "setName",
            "cardNumber", "cardNumber",
            "estimatedValue", "estimatedValue",
            "quantity", "quantity",
            "createdAt", "createdAt",
            "updatedAt", "updatedAt");

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private final CardRepository cardRepository;
    private final TransactionRepository transactionRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public PageResponse<CardResponse> search(UUID userId, CardSearchParams params, Pageable pageable) {
        Pageable request = SearchUtils.withSort(pageable, SORTABLE, DEFAULT_SORT);
        return PageResponse.of(cardRepository.findAll(CardSpecifications.of(userId, params), request)
                .map(CardResponse::of));
    }

    @Transactional(readOnly = true)
    public CardDetailResponse detail(UUID userId, UUID cardId) {
        Card card = findOwned(userId, cardId);
        return new CardDetailResponse(CardResponse.of(card),
                transactionRepository.findByCardIdOrderByDateDescCreatedAtDesc(card.getId()).stream()
                        .map(TransactionResponse::of)
                        .toList());
    }

    @Transactional
    public CardResponse create(UUID userId, CardRequest r) {
        Card card = new Card();
        card.setUser(userService.findById(userId));
        apply(card, r);
        cardRepository.save(card);
        log.info("Creata carta={} utente={}", card.getId(), userId);
        return CardResponse.of(card);
    }

    @Transactional
    public CardResponse update(UUID userId, UUID cardId, CardRequest r) {
        Card card = findOwned(userId, cardId);
        apply(card, r);
        return CardResponse.of(card);
    }

    // Le transazioni della carta vengono eliminate a cascata
    @Transactional
    public void delete(UUID userId, UUID cardId) {
        Card card = findOwned(userId, cardId);
        cardRepository.delete(card);
        log.info("Eliminata carta={} utente={}", cardId, userId);
    }

    // Usato anche da TransactionService: la carta deve appartenere all'utente del token
    Card findOwned(UUID userId, UUID cardId) {
        return cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new NotFoundException("Carta non trovata"));
    }

    private static void apply(Card card, CardRequest r) {
        card.setName(r.name().trim());
        card.setSetName(blankToNull(r.setName()));
        card.setCardNumber(blankToNull(r.cardNumber()));
        card.setLanguage(r.language());
        card.setCondition(r.condition());
        card.setGraded(r.graded());
        // Compagnia e voto hanno senso solo per una carta gradata
        card.setGradingCompany(r.graded() ? blankToNull(r.gradingCompany()) : null);
        card.setGrade(r.graded() ? r.grade() : null);
        card.setQuantity(r.quantity());
        card.setEstimatedValue(r.estimatedValue());
        card.setImageUrl(blankToNull(r.imageUrl()));
        card.setExternalId(blankToNull(r.externalId()));
        card.setNotes(blankToNull(r.notes()));
    }
}
