package kian.backend.repositories;

import kian.backend.entities.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

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
}
