package kian.backend.services;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

// Le carte giapponesi su TCGdex hanno nomi in katakana (ピカチュウ) e set in giapponese: qui li rendiamo leggibili.
// - Pokémon: nome inglese dal numero del Pokédex (tabella data/pokemon-names.json, presa da PokéAPI)
// - set e serie recenti: nomi inglesi ufficiali; gli altri traslitterati dal katakana (sistema Hepburn)
// - ricerca: "pikachu" scritto in alfabeto latino diventa ピカチュウ, l'unico modo per trovarlo su TCGdex
@Component
public class JapaneseNames {

    private record PokemonName(int dex, String en, String ja) {
    }

    // Nomi con cui i collezionisti conoscono le serie giapponesi
    private static final Map<String, String> SERIES = Map.ofEntries(
            Map.entry("PMCG", "Pocket Monsters Card Game"), Map.entry("neo", "Neo"), Map.entry("e", "e-Card"),
            Map.entry("ADV", "ADV"), Map.entry("PCG", "PCG"), Map.entry("L", "Legend"), Map.entry("XY", "XY"),
            Map.entry("XYb", "XY BREAK"), Map.entry("SM", "Sun & Moon"), Map.entry("S", "Sword & Shield"),
            Map.entry("M", "Mega"), Map.entry("SV", "Scarlet & Violet"));

    // Serie giapponesi in ordine di uscita: TCGdex mette Scarlatto e Violetto dopo Mega, che invece è la più recente
    private static final List<String> SERIES_ORDER =
            List.of("PMCG", "neo", "VS", "web", "e", "ADV", "PCG", "L", "XY", "XYb", "SM", "S", "SV", "M");

    // Nomi inglesi ufficiali dei set giapponesi recenti (Scarlatto e Violetto, Mega), quelli che si comprano oggi.
    // In ordine di uscita: TCGdex restituisce i set giapponesi in ordine sparso, questo ordine serve anche per ordinarli
    private static final Map<String, String> SETS = new LinkedHashMap<>();
    private static final List<String> SET_ORDER;

    static {
        String[] sets = {
            "SV-P", "Scarlet & Violet Promo",
            "SV1S", "Scarlet ex",
            "SV1V", "Violet ex",
            "SV1a", "Triplet Beat",
            "SV2P", "Snow Hazard",
            "SV2D", "Clay Burst",
            "SV2a", "Pokémon Card 151",
            "SV3", "Ruler of the Black Flame",
            "SV3a", "Raging Surf",
            "SV4K", "Ancient Roar",
            "SV4M", "Future Flash",
            "SV4a", "Shiny Treasure ex",
            "SV5K", "Wild Force",
            "SV5M", "Cyber Judge",
            "SV5a", "Crimson Haze",
            "SV6", "Mask of Change",
            "SV6a", "Night Wanderer",
            "SV7", "Stellar Miracle",
            "SV7a", "Paradise Dragona",
            "SV8", "Super Electric Breaker",
            "SV8a", "Terastal Festival ex",
            "SV9", "Battle Partners",
            "SV9a", "Heat Wave Arena",
            "SV10", "Glory of Team Rocket",
            "SV11B", "Black Bolt",
            "SV11W", "White Flare",
            "M-P", "Mega Promo",
            "M1L", "Mega Brave",
            "M1S", "Mega Symphonia",
            "M2", "Inferno X",
            "M2a", "MEGA Dream ex",
            "M3", "Munikis Zero",
            "M4", "Ninja Spinner",
            "M5", "Abyss Eye",
            "M6", "Storm Emerald",
            "M6a", "30th Celebration",
        };
        for (int i = 0; i < sets.length; i += 2) {
            SETS.put(sets[i], sets[i + 1]);
        }
        SET_ORDER = List.copyOf(SETS.keySet());
    }

    private static final Pattern JAPANESE = Pattern.compile("[\\p{IsHiragana}\\p{IsKatakana}\\p{IsHan}]");
    private static final Pattern HAN = Pattern.compile("\\p{IsHan}+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]");
    private static final Pattern MEGA_FORM = Pattern.compile("\\b([XY])(ex|EX)\\b");

    // Dal più lungo al più corto: "ミュウツー" (Mewtwo) va sostituito prima di "ミュウ" (Mew)
    private final List<PokemonName> byJapaneseLength;
    private final Map<String, String> japaneseByEnglish = new HashMap<>();

    public JapaneseNames() {
        try (InputStream in = new ClassPathResource("data/pokemon-names.json").getInputStream()) {
            List<PokemonName> names = new ObjectMapper().readValue(in, new TypeReference<List<PokemonName>>() {
            });
            byJapaneseLength = names.stream()
                    .sorted(Comparator.comparingInt((PokemonName p) -> p.ja().length()).reversed())
                    .toList();
            names.forEach(p -> japaneseByEnglish.put(normalize(p.en()), p.ja()));
        } catch (IOException e) {
            throw new UncheckedIOException("Tabella dei nomi dei Pokémon non leggibile", e);
        }
    }

    public static boolean containsJapanese(String text) {
        return text != null && JAPANESE.matcher(text).find();
    }

    // "pikachu" -> ピカチュウ; anche l'inizio del nome ("chariz" -> リザードン). Vuoto se non è un Pokémon
    public Optional<String> japaneseName(String latin) {
        String key = normalize(latin);
        if (key.isEmpty()) {
            return Optional.empty();
        }
        String exact = japaneseByEnglish.get(key);
        if (exact != null || key.length() < 3) {
            return Optional.ofNullable(exact);
        }
        return japaneseByEnglish.entrySet().stream()
                .filter(e -> e.getKey().startsWith(key))
                .min(Comparator.comparingInt(e -> e.getKey().length()))
                .map(Map.Entry::getValue);
    }

    // Nome di una carta: "リザードンex" -> "Charizard ex", "セレビィ&フシギバナGX" -> "Celebi & Venusaur GX"
    public String cardName(String name, String number) {
        if (!containsJapanese(name)) {
            return name;
        }
        String latin = HAN.matcher(toLatin(name)).replaceAll(" ").replaceAll("\\s+", " ").trim();
        // Rimasti solo ideogrammi (es. carte allenatore): senza dizionario non si traslitterano
        return latin.replaceAll("[^A-Za-z]", "").length() < 3 ? "Carta n. " + number : latin;
    }

    public String seriesName(String id, String name) {
        if (!containsJapanese(name)) {
            return name;
        }
        return SERIES.getOrDefault(id, fallback(id, name));
    }

    // Più alto = più recente, come recency per i set
    public int seriesRecency(String seriesId) {
        return SERIES_ORDER.indexOf(seriesId);
    }

    // Più alto = più recente; i set fuori tabella (prodotti speciali, set vecchi) in fondo
    public int recency(String setId) {
        return SET_ORDER.indexOf(setId);
    }

    public String setName(String id, String name) {
        if (SETS.containsKey(id)) {
            return SETS.get(id);
        }
        return containsJapanese(name) ? fallback(id, name) : name;
    }

    // Traslitterazione; se restano ideogrammi meglio il codice del set (es. "S12a") di un nome a metà
    private String fallback(String id, String name) {
        String latin = toLatin(name);
        return HAN.matcher(latin).find() ? id : latin;
    }

    private String toLatin(String text) {
        String s = Normalizer.normalize(text, Normalizer.Form.NFKC);
        for (PokemonName p : byJapaneseLength) {
            if (s.contains(p.ja())) {
                s = s.replace(p.ja(), " " + p.en() + " ");
            }
        }
        s = s.replace("メガ", " Mega ").replace("&", " & ").replace("・", " ");
        // "Mega Charizard Xex" -> "Mega Charizard X ex": la forma X/Y è attaccata al suffisso nel nome giapponese
        return MEGA_FORM.matcher(Romaji.of(s)).replaceAll("$1 $2").replaceAll("\\s+", " ").trim();
    }

    private static String normalize(String text) {
        String ascii = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return NON_ALNUM.matcher(ascii.toLowerCase(Locale.ROOT)).replaceAll("");
    }

    // Katakana e hiragana -> alfabeto latino (Hepburn). Il resto del testo resta com'è
    static final class Romaji {

        private static final Map<String, String> KANA = new HashMap<>();

        static {
            String[][] table = {
                    {"キャ", "kya"}, {"キュ", "kyu"}, {"キョ", "kyo"}, {"シャ", "sha"}, {"シュ", "shu"}, {"ショ", "sho"},
                    {"チャ", "cha"}, {"チュ", "chu"}, {"チョ", "cho"}, {"ニャ", "nya"}, {"ニュ", "nyu"}, {"ニョ", "nyo"},
                    {"ヒャ", "hya"}, {"ヒュ", "hyu"}, {"ヒョ", "hyo"}, {"ミャ", "mya"}, {"ミュ", "myu"}, {"ミョ", "myo"},
                    {"リャ", "rya"}, {"リュ", "ryu"}, {"リョ", "ryo"}, {"ギャ", "gya"}, {"ギュ", "gyu"}, {"ギョ", "gyo"},
                    {"ジャ", "ja"}, {"ジュ", "ju"}, {"ジョ", "jo"}, {"ビャ", "bya"}, {"ビュ", "byu"}, {"ビョ", "byo"},
                    {"ピャ", "pya"}, {"ピュ", "pyu"}, {"ピョ", "pyo"}, {"ファ", "fa"}, {"フィ", "fi"}, {"フェ", "fe"},
                    {"フォ", "fo"}, {"ティ", "ti"}, {"ディ", "di"}, {"トゥ", "tu"}, {"ドゥ", "du"}, {"ウィ", "wi"},
                    {"ウェ", "we"}, {"ウォ", "wo"}, {"ヴァ", "va"}, {"ヴィ", "vi"}, {"ヴェ", "ve"}, {"ヴォ", "vo"},
                    {"シェ", "she"}, {"ジェ", "je"}, {"チェ", "che"}, {"イェ", "ye"}, {"ツァ", "tsa"},
                    {"ア", "a"}, {"イ", "i"}, {"ウ", "u"}, {"エ", "e"}, {"オ", "o"},
                    {"カ", "ka"}, {"キ", "ki"}, {"ク", "ku"}, {"ケ", "ke"}, {"コ", "ko"},
                    {"サ", "sa"}, {"シ", "shi"}, {"ス", "su"}, {"セ", "se"}, {"ソ", "so"},
                    {"タ", "ta"}, {"チ", "chi"}, {"ツ", "tsu"}, {"テ", "te"}, {"ト", "to"},
                    {"ナ", "na"}, {"ニ", "ni"}, {"ヌ", "nu"}, {"ネ", "ne"}, {"ノ", "no"},
                    {"ハ", "ha"}, {"ヒ", "hi"}, {"フ", "fu"}, {"ヘ", "he"}, {"ホ", "ho"},
                    {"マ", "ma"}, {"ミ", "mi"}, {"ム", "mu"}, {"メ", "me"}, {"モ", "mo"},
                    {"ヤ", "ya"}, {"ユ", "yu"}, {"ヨ", "yo"}, {"ラ", "ra"}, {"リ", "ri"}, {"ル", "ru"}, {"レ", "re"},
                    {"ロ", "ro"}, {"ワ", "wa"}, {"ヲ", "o"}, {"ン", "n"},
                    {"ガ", "ga"}, {"ギ", "gi"}, {"グ", "gu"}, {"ゲ", "ge"}, {"ゴ", "go"},
                    {"ザ", "za"}, {"ジ", "ji"}, {"ズ", "zu"}, {"ゼ", "ze"}, {"ゾ", "zo"},
                    {"ダ", "da"}, {"ヂ", "ji"}, {"ヅ", "zu"}, {"デ", "de"}, {"ド", "do"},
                    {"バ", "ba"}, {"ビ", "bi"}, {"ブ", "bu"}, {"ベ", "be"}, {"ボ", "bo"},
                    {"パ", "pa"}, {"ピ", "pi"}, {"プ", "pu"}, {"ペ", "pe"}, {"ポ", "po"}, {"ヴ", "vu"},
                    {"ァ", "a"}, {"ィ", "i"}, {"ゥ", "u"}, {"ェ", "e"}, {"ォ", "o"}, {"ャ", "ya"}, {"ュ", "yu"}, {"ョ", "yo"},
            };
            for (String[] row : table) {
                KANA.put(row[0], row[1]);
            }
        }

        private Romaji() {
        }

        static String of(String text) {
            // Hiragana -> katakana: stessi suoni, stesso spostamento nella tabella Unicode
            StringBuilder kata = new StringBuilder();
            for (char ch : text.toCharArray()) {
                kata.append(ch >= 'ぁ' && ch <= 'ゖ' ? (char) (ch + 0x60) : ch);
            }
            String s = kata.toString();
            StringBuilder out = new StringBuilder();
            boolean doubleNext = false;
            int wordStart = -1;
            for (int i = 0; i < s.length(); i++) {
                char ch = s.charAt(i);
                String two = i + 1 < s.length() ? s.substring(i, i + 2) : null;
                String romaji = two != null && KANA.containsKey(two) ? KANA.get(two) : KANA.get(String.valueOf(ch));
                if (ch == 'ッ') {
                    doubleNext = true;
                    continue;
                }
                if (ch == 'ー' && !out.isEmpty()) {
                    out.append(out.charAt(out.length() - 1)); // vocale lunga: si ripete l'ultima vocale
                    continue;
                }
                if (romaji == null) {
                    wordStart = -1;
                    out.append(ch);
                    continue;
                }
                if (doubleNext) {
                    out.append(romaji.startsWith("ch") ? 't' : romaji.charAt(0));
                    doubleNext = false;
                }
                if (wordStart < 0) {
                    wordStart = out.length();
                    romaji = Character.toUpperCase(romaji.charAt(0)) + romaji.substring(1);
                }
                out.append(romaji);
                if (two != null && KANA.containsKey(two)) {
                    i++;
                }
            }
            return out.toString();
        }
    }
}
