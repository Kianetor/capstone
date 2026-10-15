package kian.backend.services;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import kian.backend.exceptions.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Locale;
import java.util.Map;

// Ricerche costruite con la Criteria API: i valori arrivano al database come parametri legati, mai concatenati
final class SearchUtils {

    private SearchUtils() {
    }

    static Predicate like(CriteriaBuilder cb, Expression<String> field, String text) {
        return cb.like(cb.lower(field), likePattern(text), '\\');
    }

    // "Contiene", senza distinguere maiuscole; % e _ scritti dall'utente valgono come caratteri normali
    static String likePattern(String text) {
        String escaped = text.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    static boolean present(String s) {
        return s != null && !s.isBlank();
    }

    static String blankToNull(String s) {
        return present(s) ? s.trim() : null;
    }

    // Il nome della colonna di ordinamento non si può legare come parametro:
    // lo confrontiamo con un elenco chiuso e lo traduciamo nella proprietà JPA. Fuori elenco -> 400
    static Pageable withSort(Pageable pageable, Map<String, String> allowed, Sort defaultSort) {
        Sort requested = pageable.getSort();
        Sort sort = requested.isUnsorted() ? defaultSort : Sort.by(requested.stream()
                .map(o -> {
                    String property = allowed.get(o.getProperty());
                    if (property == null) {
                        throw new BadRequestException("Ordinamento non consentito. Valori ammessi: " + allowed.keySet());
                    }
                    return new Sort.Order(o.getDirection(), property);
                })
                .toList());
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }
}
