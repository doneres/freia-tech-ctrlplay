package br.com.ctrlplaygoiania.feiratech.model;

import br.com.ctrlplaygoiania.feiratech.model.enums.TipoItemEstoque;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "itens_estoque")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemEstoque {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoItemEstoque tipo;

    @Column(length = 100)
    private String categoria;

    @Column(length = 100)
    private String marca;

    @Column(length = 200)
    private String modelo;

    @Column(nullable = false)
    private Integer quantidadeTotal = 0;

    @Column(nullable = false)
    private Integer quantidadeDisponivel = 0;

    @Column(length = 500)
    private String imagemUrl;

    @Column(nullable = false)
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
