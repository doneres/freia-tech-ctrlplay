package br.com.ctrlplaygoiania.feiratech.model;

import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "papelaria_itens")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PapelariaItem {

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
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String imagemUrl;

    @Column(nullable = false)
    private Integer quantidade = 1;

    @Column(nullable = false)
    private Boolean estoqueSubtraido = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusCompra statusAquisicao = StatusCompra.A_COMPRAR;

    @Column(columnDefinition = "TEXT")
    private String justificativaReprovacao;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
