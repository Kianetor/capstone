package kian.backend.services;

import kian.backend.entities.Card;
import kian.backend.entities.Transaction;
import kian.backend.entities.TransactionType;
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
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

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
    private final ImageService imageService;

    @Transactional(readOnly = true)
    public PageResponse<CardResponse> search(UUID userId, CardSearchParams params, Pageable pageable) {
        Pageable request = SearchUtils.withSort(pageable, SORTABLE, DEFAULT_SORT);
        return PageResponse.of(cardRepository.findAll(CardSpecifications.of(userId, params), request)
                .map(CardResponse::of));
    }

    // Inventario con le copie della stessa carta raggruppate. Le carte di un utente sono poche centinaia:
    // le carichiamo tutte già filtrate e ordinate, le raggruppiamo e poi prendiamo la pagina richiesta.
    // Un gruppo prende il posto della sua prima carta nell'ordine scelto
    @Transactional(readOnly = true)
    public PageResponse<CardGroupResponse> searchGroups(UUID userId, CardSearchParams params, Pageable pageable) {
        Sort sort = SearchUtils.withSort(pageable, SORTABLE, DEFAULT_SORT).getSort();
        Map<String, List<Card>> groups = new LinkedHashMap<>();
        for (Card card : cardRepository.findAll(CardSpecifications.of(userId, params), sort)) {
            groups.computeIfAbsent(groupKey(card), k -> new ArrayList<>()).add(card);
        }

        List<Map.Entry<String, List<Card>>> all = new ArrayList<>(groups.entrySet());
        // "Più copie" conta tutte le copie del gruppo, non solo quelle della prima versione
        Sort.Order byQuantity = sort.getOrderFor("quantity");
        if (byQuantity != null) {
            Comparator<Map.Entry<String, List<Card>>> total =
                    Comparator.comparingInt(e -> e.getValue().stream().mapToInt(Card::getQuantity).sum());
            all.sort(byQuantity.isAscending() ? total : total.reversed());
        }

        int size = pageable.getPageSize();
        int from = Math.min((int) pageable.getOffset(), all.size());
        List<Map.Entry<String, List<Card>>> page = all.subList(from, Math.min(from + size, all.size()));

        Map<UUID, BigDecimal> purchasePrices = averagePurchasePrices(page.stream()
                .flatMap(e -> e.getValue().stream())
                .map(Card::getId)
                .toList());
        List<CardGroupResponse> content = page.stream()
                .map(e -> toGroup(e.getKey(), e.getValue(), purchasePrices))
                .toList();
        int totalPages = (groups.size() + size - 1) / size;
        return new PageResponse<>(content, pageable.getPageNumber(), size, groups.size(), totalPages);
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

        // Carta e acquisto nella stessa transazione del database: o si salvano entrambi o nessuno dei due.
        // Le copie della carta sono già quelle acquistate, quindi qui non si sommano di nuovo
        if (r.purchase() != null) {
            Transaction purchase = new Transaction();
            purchase.setCard(card);
            purchase.setType(TransactionType.BUY);
            purchase.setQuantity(r.quantity());
            purchase.setUnitPrice(r.purchase().unitPrice());
            purchase.setDate(r.purchase().date());
            purchase.setPlatform(blankToNull(r.purchase().platform()));
            transactionRepository.save(purchase);
            log.info("Registrato acquisto iniziale carta={}", card.getId());
        }
        return CardResponse.of(card);
    }

    @Transactional
    public CardResponse update(UUID userId, UUID cardId, CardRequest r) {
        Card card = findOwned(userId, cardId);
        apply(card, r);
        return CardResponse.of(card);
    }

    // Prima controlliamo che la carta sia dell'utente, poi carichiamo: niente upload per carte altrui
    @Transactional
    public CardResponse uploadImage(UUID userId, UUID cardId, MultipartFile file) {
        Card card = findOwned(userId, cardId);
        card.setImageUrl(imageService.upload(file));
        log.info("Foto caricata carta={}", cardId);
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

    // Stessa carta = stesso id del catalogo; per quelle inserite a mano, stesso nome, set e numero
    private static String groupKey(Card card) {
        if (card.getExternalId() != null) {
            return card.getExternalId();
        }
        return String.join("|", card.getName(), Objects.toString(card.getSetName(), ""),
                Objects.toString(card.getCardNumber(), "")).toLowerCase(Locale.ROOT);
    }

    private static CardGroupResponse toGroup(String key, List<Card> cards, Map<UUID, BigDecimal> purchasePrices) {
        Card first = cards.getFirst();
        List<BigDecimal> values = cards.stream().map(Card::getEstimatedValue).filter(Objects::nonNull).toList();
        return new CardGroupResponse(key, first.getName(), first.getSetName(), first.getCardNumber(),
                cards.stream().map(Card::getImageUrl).filter(Objects::nonNull).findFirst().orElse(null),
                cards.stream().mapToInt(Card::getQuantity).sum(),
                values.stream().min(Comparator.naturalOrder()).orElse(null),
                values.stream().max(Comparator.naturalOrder()).orElse(null),
                cards.stream()
                        .map(c -> new CardGroupResponse.Variant(CardResponse.of(c), purchasePrices.get(c.getId())))
                        .toList());
    }

    // Prezzo medio per copia degli acquisti di ogni carta: spesa totale / copie acquistate
    private Map<UUID, BigDecimal> averagePurchasePrices(List<UUID> cardIds) {
        if (cardIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, BigDecimal> prices = new HashMap<>();
        for (TransactionRepository.PurchaseTotals t : transactionRepository.purchaseTotals(cardIds)) {
            if (t.getCopies() > 0) {
                prices.put(t.getCardId(), t.getSpent().divide(BigDecimal.valueOf(t.getCopies()), 2, RoundingMode.HALF_UP));
            }
        }
        return prices;
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
