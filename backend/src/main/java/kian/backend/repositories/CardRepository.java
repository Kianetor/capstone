package kian.backend.repositories;

import kian.backend.entities.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface CardRepository extends JpaRepository<Card, UUID>, JpaSpecificationExecutor<Card> {

    // La carta di un altro utente per noi non esiste: stessa risposta (404) di un id inesistente
    Optional<Card> findByIdAndUserId(UUID id, UUID userId);
}
