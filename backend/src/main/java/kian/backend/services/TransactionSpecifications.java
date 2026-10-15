package kian.backend.services;

import jakarta.persistence.criteria.Predicate;
import kian.backend.entities.Transaction;
import kian.backend.payloads.TransactionSearchParams;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

final class TransactionSpecifications {

    private TransactionSpecifications() {
    }

    // Solo le transazioni delle carte dell'utente
    static Specification<Transaction> of(UUID userId, TransactionSearchParams p) {
        return (root, query, cb) -> {
            List<Predicate> filters = new ArrayList<>();
            filters.add(cb.equal(root.get("card").get("user").get("id"), userId));

            if (p.type() != null) filters.add(cb.equal(root.get("type"), p.type()));
            if (p.from() != null) filters.add(cb.greaterThanOrEqualTo(root.get("date"), p.from()));
            if (p.to() != null) filters.add(cb.lessThanOrEqualTo(root.get("date"), p.to()));
            if (p.cardId() != null) filters.add(cb.equal(root.get("card").get("id"), p.cardId()));

            return cb.and(filters.toArray(Predicate[]::new));
        };
    }
}
