package kian.backend.repositories;

import kian.backend.entities.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface CardRepository extends JpaRepository<Card, UUID>, JpaSpecificationExecutor<Card> {

    // La carta di un altro utente per noi non esiste: stessa risposta (404) di un id inesistente
    Optional<Card> findByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);

    // Somme calcolate dal database: non carichiamo tutte le carte in memoria
    @Query("select coalesce(sum(c.quantity), 0) from Card c where c.user.id = :userId")
    long sumQuantityByUserId(@Param("userId") UUID userId);

    // Le carte senza valore stimato non contano
    @Query("select coalesce(sum(c.estimatedValue * c.quantity), 0) from Card c " +
            "where c.user.id = :userId and c.estimatedValue is not null")
    BigDecimal sumInventoryValueByUserId(@Param("userId") UUID userId);
}
