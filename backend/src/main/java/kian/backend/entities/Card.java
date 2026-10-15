package kian.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "cards")
@Check(name = "cards_quantity_check", constraints = "quantity >= 0")
@Getter
@Setter
@NoArgsConstructor
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Proprietario: ogni query sulle carte filtra sempre per questo
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "set_name", length = 100)
    private String setName;

    @Column(name = "card_number", length = 20)
    private String cardNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Language language;

    // "condition" è una parola riservata in SQL
    @Enumerated(EnumType.STRING)
    @Column(name = "card_condition", nullable = false, length = 20)
    private CardCondition condition;

    @Column(nullable = false)
    private boolean graded = false;

    // PSA, BGS, CGC: null se la carta non è gradata
    @Column(name = "grading_company", length = 20)
    private String gradingCompany;

    private Double grade;

    // Copie possedute ora: la aggiornano acquisti e vendite
    @Column(nullable = false)
    private int quantity;

    // Valore attuale stimato di una copia, inserito a mano
    @Column(name = "estimated_value", precision = 10, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Id della carta nell'API esterna, se è stata aggiunta da lì
    @Column(name = "external_id", length = 50)
    private String externalId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Eliminando la carta si eliminano anche le sue transazioni
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Transaction> transactions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Blocco ottimistico: due modifiche contemporanee della quantità non si sovrascrivono in silenzio
    @Version
    private Long version;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
