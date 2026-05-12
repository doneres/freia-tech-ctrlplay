package br.com.ctrlplaygoiania.feiratech.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.com.ctrlplaygoiania.feiratech.model.enums.NivelTurma;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusSemana;
import br.com.ctrlplaygoiania.feiratech.model.enums.TipoProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.Turno;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "projetos")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Projeto {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    // ── Seção 1: Identificação ────────────────────────────────────────────

    @Column(nullable = false, length = 200)
    private String nomeProjeto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrutor_id", nullable = false)
    private Usuario instrutor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusProjeto statusProjeto = StatusProjeto.RASCUNHO;

    @Column(columnDefinition = "TEXT")
    private String justificativaReprovacao;

    @Column(length = 100)
    private String codigoTurma;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Turno turno;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private NivelTurma nivelTurma;

    private Integer qtdAlunos;

    @ElementCollection
    @CollectionTable(name = "projeto_integrantes", joinColumns = @JoinColumn(name = "projeto_id"))
    @Column(name = "integrante", length = 150)
    private List<String> integrantes = new ArrayList<>();

    // ── Seção 2: Proposta ─────────────────────────────────────────────────

    @Column(length = 100)
    private String ods;

    @Column(columnDefinition = "TEXT")
    private String problemaIdentificado;

    @Column(columnDefinition = "TEXT")
    private String solucaoProposta;

    @Column(columnDefinition = "TEXT")
    private String objetivoProjeto;

    // ── Seção 3: Ferramentas ──────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoProjeto tipoProjeto;

    // Software
    @Column(length = 150)
    private String ferramentaPrincipal;

    @Column(length = 100)
    private String linguagem;

    @Column(length = 200)
    private String plataformaPublicacao;

    // Hardware
    @Column(length = 200)
    private String hardware;

    private Integer qtdHardware;

    @Column(length = 500)
    private String linkProjeto;

    // ── Seção 4: Materiais e Infraestrutura ───────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String infraNecessaria;

    @Column(precision = 10, scale = 2)
    private BigDecimal custoEstimado;

    // ── Seção 5: Cronograma ───────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private StatusSemana statusS1 = StatusSemana.NAO_INICIADO;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private StatusSemana statusS2 = StatusSemana.NAO_INICIADO;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private StatusSemana statusS3 = StatusSemana.NAO_INICIADO;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private StatusSemana statusS4 = StatusSemana.NAO_INICIADO;

    // ── Seção 6: Pitch ────────────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String pitchAto1;

    @Column(columnDefinition = "TEXT")
    private String pitchAto2;

    @Column(columnDefinition = "TEXT")
    private String pitchAto3;

    private Integer duracaoPitch;

    @Column(length = 50)
    private String formatoDemo;

    // ── Seção 7: Observações ──────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ── Relacionamentos ───────────────────────────────────────────────────

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "projeto_ferramentas_software",
            joinColumns = @JoinColumn(name = "projeto_id"),
            inverseJoinColumns = @JoinColumn(name = "ferramenta_software_id")
    )
    private List<FerramentaSoftware> ferramentasSoftware = new ArrayList<>();

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Material> materiais = new ArrayList<>();

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PapelariaItem> itensPapelaria = new ArrayList<>();

    // ── Auditoria ─────────────────────────────────────────────────────────

    private LocalDateTime dataSubmissao;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}