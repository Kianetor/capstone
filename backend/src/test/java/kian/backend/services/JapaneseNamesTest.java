package kian.backend.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Carte giapponesi: ricerca con l'alfabeto latino e nomi traslitterati
class JapaneseNamesTest {

    private final JapaneseNames names = new JapaneseNames();

    @Test
    @DisplayName("Il nome inglese di un Pokémon diventa quello giapponese, anche solo con l'inizio del nome")
    void latinToKatakana() {
        assertThat(names.japaneseName("pikachu")).contains("ピカチュウ");
        assertThat(names.japaneseName("Chariz")).contains("リザードン");
        assertThat(names.japaneseName("xyz")).isEmpty();
    }

    @Test
    @DisplayName("Riconosce il testo giapponese")
    void detectsJapanese() {
        assertThat(JapaneseNames.containsJapanese("リザードン")).isTrue();
        assertThat(JapaneseNames.containsJapanese("Charizard")).isFalse();
    }

    @Test
    @DisplayName("I nomi delle carte giapponesi si leggono in caratteri latini")
    void cardNamesInLatin() {
        assertThat(names.cardName("リザードンex", "6")).isEqualTo("Charizard ex");
        assertThat(names.cardName("ミュウツー", "150")).isEqualTo("Mewtwo");
        assertThat(names.cardName("メガリザードンXex", "13")).isEqualTo("Mega Charizard X ex");
    }

    @Test
    @DisplayName("I set giapponesi recenti hanno il nome inglese ufficiale")
    void setNames() {
        assertThat(names.setName("SV2a", "ポケモンカード151")).isEqualTo("Pokémon Card 151");
    }
}
