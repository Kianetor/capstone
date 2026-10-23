package kian.backend.repositories;

import kian.backend.entities.Transaction;
import kian.backend.entities.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    Optional<Transaction> findByIdAndCardUserId(UUID id, UUID userId);

    List<Transaction> findByCardIdOrderByDateDescCreatedAtDesc(UUID cardId);

    // La carta viene caricata nella stessa query: niente una query in più per ogni riga dello storico
    @Override
    @EntityGraph(attributePaths = "card")
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);

    // Totale (prezzo per copia x copie) di tutti gli acquisti o di tutte le vendite dell'utente
    @Query("select coalesce(sum(t.unitPrice * t.quantity), 0) from Transaction t " +
            "where t.card.user.id = :userId and t.type = :type")
    BigDecimal sumTotalByUserIdAndType(@Param("userId") UUID userId, @Param("type") TransactionType type);

    // Spesa e copie acquistate per ogni carta indicata: servono per il prezzo medio d'acquisto
    interface PurchaseTotals {
        UUID getCardId();

        BigDecimal getSpent();

        Long getCopies();
    }

    @Query("select t.card.id as cardId, sum(t.unitPrice * t.quantity) as spent, sum(t.quantity) as copies " +
            "from Transaction t where t.card.id in :cardIds and t.type = kian.backend.entities.TransactionType.BUY " +
            "group by t.card.id")
    List<PurchaseTotals> purchaseTotals(@Param("cardIds") Collection<UUID> cardIds);
}
