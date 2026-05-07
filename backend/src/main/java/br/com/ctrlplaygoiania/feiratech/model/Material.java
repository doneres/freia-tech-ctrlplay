package br.com.ctrlplaygoiania.feiratech.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "materiais")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Material {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_estoque_id")
    private ItemEstoque itemEstoque;

    @Column(nullable = false, length = 200)
    private String item;

    @Column(nullable = false)
    private Integer quantidade = 1;

    @Column(length = 50)
    private String unidade;

    @Column(precision = 10, scale = 2)
    private BigDecimal custoUnitario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusCompra statusCompra = StatusCompra.A_COMPRAR;

    @Column(nullable = false)
    private Boolean estoqueSubtraido = false;

    @Column(columnDefinition = "TEXT")
    private String justificativaReprovacao;

    @Column(length = 500)
    private String imagemUrl;

    @OneToMany(mappedBy = "material", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LinkCompra> links = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
