package kian.backend.services;

import kian.backend.entities.Card;
import kian.backend.entities.CardCondition;
import kian.backend.entities.Language;
import kian.backend.exceptions.NotFoundException;
import kian.backend.payloads.CardGroupResponse;
import kian.backend.payloads.CardSearchParams;
import kian.backend.payloads.PageResponse;
import kian.backend.repositories.CardRepository;
import kian.backend.repositories.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

// Inventario raggruppato: le copie della stessa carta finiscono in un unico gruppo
@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final CardSearchParams NO_FILTERS = new CardSearchParams(null, null, null, null, null, null, null);

    @Mock
    private CardRepository cardRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserService userService;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private CardService cardService;

    @Test
    @DisplayName("Stessa carta del catalogo in condizioni diverse: un solo gruppo con il totale delle copie")
    void groupsByCatalogId() {
        Card played = card("Charizard", "base1-4", CardCondition.PLAYED, 2, "310.00");
        Card graded = card("Charizard", "base1-4", CardCondition.NEAR_MINT, 1, "2900.00");
        Card lugia = card("Lugia", "neo1-9", CardCondition.GOOD, 1, "760.83");
        mockCards(played, lugia, graded);

        PageResponse<CardGroupResponse> page = cardService.searchGroups(USER, NO_FILTERS, PageRequest.of(0, 12));

        assertThat(page.totalElements()).isEqualTo(2);
        CardGroupResponse charizard = page.content().getFirst();
        assertThat(charizard.name()).isEqualTo("Charizard");
        assertThat(charizard.quantity()).isEqualTo(3);
        assertThat(charizard.variants()).hasSize(2);
        assertThat(charizard.minValue()).isEqualByComparingTo("310.00");
        assertThat(charizard.maxValue()).isEqualByComparingTo("2900.00");
    }

    @Test
    @DisplayName("Carte inserite a mano: si raggruppano per nome, set e numero senza badare alle maiuscole")
    void groupsManualCardsByNameSetAndNumber() {
        Card first = card("Pikachu", null, CardCondition.MINT, 1, "1.00");
        Card second = card("PIKACHU", null, CardCondition.PLAYED, 1, "0.50");
        mockCards(first, second);

        PageResponse<CardGroupResponse> page = cardService.searchGroups(USER, NO_FILTERS, PageRequest.of(0, 12));

        assertThat(page.content()).singleElement().satisfies(g -> assertThat(g.quantity()).isEqualTo(2));
    }

    @Test
    @DisplayName("La paginazione conta i gruppi, non le singole carte")
    void paginatesGroups() {
        mockCards(card("A", "a-1", CardCondition.MINT, 1, "1"), card("A", "a-1", CardCondition.GOOD, 1, "1"),
                card("B", "b-1", CardCondition.MINT, 1, "1"), card("C", "c-1", CardCondition.MINT, 1, "1"));

        PageResponse<CardGroupResponse> page = cardService.searchGroups(USER, NO_FILTERS, PageRequest.of(1, 2));

        assertThat(page.totalElements()).isEqualTo(3);
        assertThat(page.totalPages()).isEqualTo(2);
        assertThat(page.content()).extracting(CardGroupResponse::name).containsExactly("C");
    }

    @Test
    @DisplayName("Ordinando per copie conta il totale del gruppo")
    void sortsByTotalQuantity() {
        mockCards(card("Uno", "x-1", CardCondition.MINT, 3, "1"),
                card("Due", "x-2", CardCondition.MINT, 2, "1"), card("Due", "x-2", CardCondition.GOOD, 2, "1"));

        PageResponse<CardGroupResponse> page = cardService.searchGroups(USER, NO_FILTERS,
                PageRequest.of(0, 12, Sort.by(Sort.Direction.DESC, "quantity")));

        assertThat(page.content()).extracting(CardGroupResponse::name).containsExactly("Due", "Uno");
    }

    @Test
    @DisplayName("Prezzo medio d'acquisto: spesa totale diviso copie comprate")
    void averagePurchasePrice() {
        Card card = card("Lugia", "neo1-9", CardCondition.GOOD, 3, "760.83");
        mockCards(card);
        when(transactionRepository.purchaseTotals(anyCollection()))
                .thenReturn(List.of(totals(card.getId(), "1000.00", 3)));

        PageResponse<CardGroupResponse> page = cardService.searchGroups(USER, NO_FILTERS, PageRequest.of(0, 12));

        assertThat(page.content().getFirst().variants().getFirst().averagePurchasePrice()).isEqualByComparingTo("333.33");
    }

    @Test
    @DisplayName("La carta di un altro utente risulta inesistente")
    void otherUsersCardIsNotFound() {
        UUID id = UUID.randomUUID();
        when(cardRepository.findByIdAndUserId(id, USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cardService.findOwned(USER, id)).isInstanceOf(NotFoundException.class);
    }

    @SuppressWarnings("unchecked")
    private void mockCards(Card... cards) {
        when(cardRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(cards));
    }

    private static Card card(String name, String externalId, CardCondition condition, int quantity, String value) {
        Card c = new Card();
        c.setId(UUID.randomUUID());
        c.setName(name);
        c.setSetName("Base Set");
        c.setCardNumber("4/102");
        c.setExternalId(externalId);
        c.setLanguage(Language.ENG);
        c.setCondition(condition);
        c.setQuantity(quantity);
        c.setEstimatedValue(new BigDecimal(value));
        return c;
    }

    private static TransactionRepository.PurchaseTotals totals(UUID cardId, String spent, long copies) {
        return new TransactionRepository.PurchaseTotals() {
            public UUID getCardId() {
                return cardId;
            }

            public BigDecimal getSpent() {
                return new BigDecimal(spent);
            }

            public Long getCopies() {
                return copies;
            }
        };
    }
}
