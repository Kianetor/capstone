package kian.backend.services;

import kian.backend.exceptions.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SearchUtilsTest {

    private static final Map<String, String> SORTABLE = Map.of("name", "name");
    private static final Sort DEFAULT_SORT = Sort.by("createdAt");

    @Test
    @DisplayName("Ricerca testuale: minuscole, spazi tolti, % e _ dell'utente trattati come caratteri normali")
    void likePatternEscapesWildcards() {
        assertThat(SearchUtils.likePattern("  Char%iz_ard ")).isEqualTo("%char\\%iz\\_ard%");
    }

    @Test
    @DisplayName("Testo vuoto o di soli spazi diventa null")
    void blankToNull() {
        assertThat(SearchUtils.blankToNull("   ")).isNull();
        assertThat(SearchUtils.blankToNull(" Fiera ")).isEqualTo("Fiera");
    }

    @Test
    @DisplayName("Senza ordinamento si usa quello predefinito")
    void defaultSort() {
        Pageable result = SearchUtils.withSort(PageRequest.of(0, 12), SORTABLE, DEFAULT_SORT);

        assertThat(result.getSort()).isEqualTo(DEFAULT_SORT);
    }

    @Test
    @DisplayName("Ordinare per una colonna fuori elenco dà errore 400")
    void unknownSortIsRejected() {
        Pageable request = PageRequest.of(0, 12, Sort.by("password"));

        assertThatThrownBy(() -> SearchUtils.withSort(request, SORTABLE, DEFAULT_SORT))
                .isInstanceOf(BadRequestException.class);
    }
}
