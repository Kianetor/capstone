package kian.backend.services;

import kian.backend.entities.Card;
import kian.backend.entities.Transaction;
import kian.backend.entities.TransactionType;
import kian.backend.exceptions.BadRequestException;
import kian.backend.exceptions.NotFoundException;
import kian.backend.payloads.TransactionRequest;
import kian.backend.repositories.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Acquisti e vendite cambiano le copie possedute: qui controlliamo i conti e i casi vietati
@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID CARD = UUID.randomUUID();

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CardService cardService;

    @InjectMocks
    private TransactionService transactionService;

    private Card card;

    @BeforeEach
    void setUp() {
        card = new Card();
        card.setId(CARD);
        card.setName("Charizard");
        card.setQuantity(2);
    }

    @Test
    @DisplayName("Un acquisto aumenta le copie possedute")
    void buyAddsCopies() {
        when(cardService.findOwned(USER, CARD)).thenReturn(card);

        transactionService.create(USER, CARD, request(TransactionType.BUY, 3));

        assertThat(card.getQuantity()).isEqualTo(5);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Una vendita diminuisce le copie possedute")
    void sellRemovesCopies() {
        when(cardService.findOwned(USER, CARD)).thenReturn(card);

        transactionService.create(USER, CARD, request(TransactionType.SELL, 2));

        assertThat(card.getQuantity()).isZero();
    }

    @Test
    @DisplayName("Non si possono vendere più copie di quelle possedute")
    void cannotSellMoreThanOwned() {
        when(cardService.findOwned(USER, CARD)).thenReturn(card);

        assertThatThrownBy(() -> transactionService.create(USER, CARD, request(TransactionType.SELL, 3)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ne possiedi 2");
        assertThat(card.getQuantity()).isEqualTo(2);
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Annullare una vendita restituisce le copie")
    void undoSellRestoresCopies() {
        Transaction sale = transaction(TransactionType.SELL, 1);
        when(transactionRepository.findByIdAndCardUserId(sale.getId(), USER)).thenReturn(Optional.of(sale));

        transactionService.delete(USER, sale.getId());

        assertThat(card.getQuantity()).isEqualTo(3);
        verify(transactionRepository).delete(sale);
    }

    @Test
    @DisplayName("Non si può annullare un acquisto se quelle copie sono già state vendute")
    void cannotUndoBuyOfSoldCopies() {
        Transaction purchase = transaction(TransactionType.BUY, 5);
        when(transactionRepository.findByIdAndCardUserId(purchase.getId(), USER)).thenReturn(Optional.of(purchase));

        assertThatThrownBy(() -> transactionService.delete(USER, purchase.getId()))
                .isInstanceOf(BadRequestException.class);
        assertThat(card.getQuantity()).isEqualTo(2);
        verify(transactionRepository, never()).delete(any(Transaction.class));
    }

    @Test
    @DisplayName("La transazione di un altro utente risulta inesistente")
    void otherUsersTransactionIsNotFound() {
        UUID id = UUID.randomUUID();
        when(transactionRepository.findByIdAndCardUserId(id, USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.delete(USER, id)).isInstanceOf(NotFoundException.class);
    }

    private static TransactionRequest request(TransactionType type, int quantity) {
        return new TransactionRequest(type, quantity, new BigDecimal("10.00"), LocalDate.now(), null, null, null);
    }

    private Transaction transaction(TransactionType type, int quantity) {
        Transaction t = new Transaction();
        t.setId(UUID.randomUUID());
        t.setCard(card);
        t.setType(type);
        t.setQuantity(quantity);
        t.setUnitPrice(BigDecimal.TEN);
        card.getTransactions().add(t);
        return t;
    }
}
