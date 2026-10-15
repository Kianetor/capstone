package kian.backend.services;

import jakarta.persistence.criteria.Predicate;
import kian.backend.entities.Card;
import kian.backend.payloads.CardSearchParams;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static kian.backend.services.SearchUtils.like;
import static kian.backend.services.SearchUtils.present;

final class CardSpecifications {

    private CardSpecifications() {
    }

    // Il filtro sul proprietario c'è sempre, qualunque altro filtro arrivi
    static Specification<Card> of(UUID userId, CardSearchParams p) {
        return (root, query, cb) -> {
            List<Predicate> filters = new ArrayList<>();
            filters.add(cb.equal(root.get("user").get("id"), userId));

            if (present(p.q())) {
                filters.add(cb.or(
                        like(cb, root.get("name"), p.q()),
                        like(cb, root.get("setName"), p.q()),
                        like(cb, root.get("cardNumber"), p.q())));
            }
            if (present(p.name())) filters.add(like(cb, root.get("name"), p.name()));
            if (present(p.setName())) filters.add(like(cb, root.get("setName"), p.setName()));
            if (p.language() != null) filters.add(cb.equal(root.get("language"), p.language()));
            if (p.condition() != null) filters.add(cb.equal(root.get("condition"), p.condition()));
            if (p.graded() != null) filters.add(cb.equal(root.get("graded"), p.graded()));

            return cb.and(filters.toArray(Predicate[]::new));
        };
    }
}
