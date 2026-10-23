package kian.backend.config;

import kian.backend.entities.*;
import kian.backend.repositories.CardRepository;
import kian.backend.repositories.TransactionRepository;
import kian.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// Account dimostrativo per chi apre la versione online: 15 carte vere (dati e prezzi da TCGdex/Cardmarket)
// con acquisti e qualche vendita. Si crea solo se l'account non esiste, quindi non tocca mai altri dati.
// Attivo con app.demo.enabled=true (profilo prod)
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
public class DemoDataInitializer implements ApplicationRunner {

    private record Sale(int quantity, String unitPrice, String date, String platform) {
    }

    private record DemoCard(String name, String setName, String cardNumber, Language language, CardCondition condition,
                            String gradingCompany, Double grade, String estimatedValue, String imageUrl, String externalId,
                            int boughtQuantity, String boughtPrice, String boughtDate, String boughtPlatform, Sale sale) {
    }

    private static final List<DemoCard> CARDS = List.of(
            new DemoCard("Charizard", "Base Set", "4/102", Language.ENG, CardCondition.EXCELLENT, null, null,
                    "682.59", "https://assets.tcgdex.net/en/base/base1/4/high.webp", "base1-4",
                    1, "520.00", "2026-06-08", "Fiera", null),
            new DemoCard("Lugia", "Neo Genesis", "9/111", Language.ENG, CardCondition.GOOD, null, null,
                    "760.83", "https://assets.tcgdex.net/en/neo/neo1/9/high.webp", "neo1-9",
                    1, "480.00", "2026-06-21", "Cardmarket", null),
            new DemoCard("Umbreon VMAX", "Evolving Skies", "215/203", Language.ENG, CardCondition.MINT, "PSA", 10.0,
                    "1772.15", "https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp", "swsh7-215",
                    1, "1350.00", "2026-07-03", "Cardmarket", null),
            new DemoCard("Umbreon-ex", "Evoluzioni Prismatiche", "161/131", Language.ITA, CardCondition.NEAR_MINT, null, null,
                    "1050.83", "https://assets.tcgdex.net/it/sv/sv08.5/161/high.webp", "sv08.5-161",
                    1, "780.00", "2026-07-15", "Cardmarket", null),
            new DemoCard("Charizard-ex", "151", "199/165", Language.ITA, CardCondition.NEAR_MINT, "CGC", 9.5,
                    "361.93", "https://assets.tcgdex.net/it/sv/sv03.5/199/high.webp", "sv03.5-199",
                    1, "290.00", "2026-07-22", "eBay", null),
            new DemoCard("Gengar", "Fossil", "5/62", Language.ENG, CardCondition.EXCELLENT, null, null,
                    "130.60", "https://assets.tcgdex.net/en/base/base3/5/high.webp", "base3-5",
                    1, "95.00", "2026-08-02", "Privato", null),
            new DemoCard("Blastoise", "Base Set", "2/102", Language.ENG, CardCondition.GOOD, null, null,
                    "135.80", "https://assets.tcgdex.net/en/base/base1/2/high.webp", "base1-2",
                    2, "85.00", "2026-08-09", "Fiera", new Sale(1, "150", "2026-09-28", "Cardmarket")),
            new DemoCard("Venusaur", "Base Set", "15/102", Language.ENG, CardCondition.PLAYED, null, null,
                    "89.75", "https://assets.tcgdex.net/en/base/base1/15/high.webp", "base1-15",
                    1, "60.00", "2026-08-09", "Fiera", null),
            new DemoCard("Charizard", "Evolutions", "11/108", Language.ENG, CardCondition.NEAR_MINT, null, null,
                    "83.27", "https://assets.tcgdex.net/en/xy/xy12/11/high.webp", "xy12-11",
                    1, "55.00", "2026-08-18", "Cardmarket", null),
            new DemoCard("Venusaur & Snivy GX", "Cosmic Eclipse", "1/236", Language.ENG, CardCondition.NEAR_MINT, null, null,
                    "24.06", "https://assets.tcgdex.net/en/sm/sm12/1/high.webp", "sm12-1",
                    1, "18.00", "2026-08-25", "Vinted", null),
            new DemoCard("Charizard-ex", "151", "006/165", Language.ITA, CardCondition.MINT, null, null,
                    "7.84", "https://assets.tcgdex.net/it/sv/sv03.5/006/high.webp", "sv03.5-006",
                    2, "6.00", "2026-09-04", "Negozio", null),
            new DemoCard("Pikachu", "Gran Festa", "5/25", Language.ITA, CardCondition.NEAR_MINT, null, null,
                    "4.17", "https://assets.tcgdex.net/it/swsh/cel25/5/high.webp", "cel25-5",
                    1, "3.00", "2026-09-04", "Negozio", null),
            new DemoCard("Pikachu", "151", "025/165", Language.ITA, CardCondition.MINT, null, null,
                    "0.16", "https://assets.tcgdex.net/it/sv/sv03.5/025/high.webp", "sv03.5-025",
                    5, "0.10", "2026-09-12", "Negozio", new Sale(2, "0.5", "2026-10-05", "Vinted")),
            new DemoCard("Dragapult-ex", "Crepuscolo Mascherato", "130/167", Language.ITA, CardCondition.NEAR_MINT, null, null,
                    "1.43", "https://assets.tcgdex.net/it/sv/sv06/130/high.webp", "sv06-130",
                    3, "1.00", "2026-09-20", "Cardmarket", new Sale(1, "2", "2026-10-10", "Cardmarket")),
            new DemoCard("Mewtwo", "Base Set", "10/102", Language.ENG, CardCondition.EXCELLENT, null, null,
                    "31.71", "https://assets.tcgdex.net/en/base/base1/10/high.webp", "base1-10",
                    1, "22.00", "2026-07-10", "Fiera", new Sale(1, "35", "2026-10-14", "eBay"))
    );

    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.email}")
    private String email;

    @Value("${app.demo.password}")
    private String password;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User demo = new User();
        demo.setUsername("demo");
        demo.setEmail(email);
        demo.setPassword(passwordEncoder.encode(password));
        demo.setRole(Role.USER);
        demo.setAvatarDex(25); // Pikachu
        userRepository.save(demo);

        CARDS.forEach(c -> createCard(demo, c));
        log.info("Creato account demo con {} carte", CARDS.size());
    }

    // Le copie della carta sono quelle comprate meno quelle vendute, come se le transazioni fossero state registrate dall'app
    private void createCard(User owner, DemoCard c) {
        int sold = c.sale() == null ? 0 : c.sale().quantity();
        Card card = new Card();
        card.setUser(owner);
        card.setName(c.name());
        card.setSetName(c.setName());
        card.setCardNumber(c.cardNumber());
        card.setLanguage(c.language());
        card.setCondition(c.condition());
        card.setGraded(c.gradingCompany() != null);
        card.setGradingCompany(c.gradingCompany());
        card.setGrade(c.grade());
        card.setQuantity(c.boughtQuantity() - sold);
        card.setEstimatedValue(new BigDecimal(c.estimatedValue()));
        card.setImageUrl(c.imageUrl());
        card.setExternalId(c.externalId());
        cardRepository.save(card);

        transactionRepository.save(transaction(card, TransactionType.BUY, c.boughtQuantity(), c.boughtPrice(),
                c.boughtDate(), c.boughtPlatform()));
        if (c.sale() != null) {
            transactionRepository.save(transaction(card, TransactionType.SELL, sold, c.sale().unitPrice(),
                    c.sale().date(), c.sale().platform()));
        }
    }

    private static Transaction transaction(Card card, TransactionType type, int quantity, String unitPrice,
                                           String date, String platform) {
        Transaction t = new Transaction();
        t.setCard(card);
        t.setType(type);
        t.setQuantity(quantity);
        t.setUnitPrice(new BigDecimal(unitPrice));
        t.setDate(LocalDate.parse(date));
        t.setPlatform(platform);
        return t;
    }
}
