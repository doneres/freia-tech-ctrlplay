package br.com.ctrlplaygoiania.feiratech.model;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "links_compra")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LinkCompra {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    // ── Relacionamento ────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    // ── Dados do Link ─────────────────────────────────────────────────────

    /**
     * Nome do site onde o valor foi pesquisado.
     * Ex: "Mercado Livre", "Amazon", "Robocore"
     */
    @Column(nullable = false, length = 100)
    private String nomeSite;

    /**
     * URL direta do produto no site.
     */
    @Column(nullable = false, length = 500)
    private String url;

    /**
     * Valor encontrado neste site no momento da pesquisa.
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal valorEncontrado;
}