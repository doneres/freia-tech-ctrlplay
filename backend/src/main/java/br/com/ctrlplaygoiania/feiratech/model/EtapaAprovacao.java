package br.com.ctrlplaygoiania.feiratech.model;

import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusEtapaAprovacao;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "etapas_aprovacao")
@Data @AllArgsConstructor @NoArgsConstructor
public class EtapaAprovacao {

    @Id @GeneratedValue @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @Column(nullable = false)
    private Integer ordem;

    @Column(nullable = false, length = 200)
    private String nomeEtapa;

    // "sequential" | "parallel" — engine only executes sequential now
    @Column(nullable = false, length = 20)
    private String tipo = "sequential";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PerfilUsuario perfilResponsavel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusEtapaAprovacao status = StatusEtapaAprovacao.PENDENTE;

    @Column(columnDefinition = "TEXT")
    private String motivo;

    // JSON map of approver-specific fields defined in the workflow step's camposAnalise
    @Column(columnDefinition = "TEXT")
    private String dadosAnalise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "respondido_por_id")
    private Usuario respondidoPor;

    private LocalDateTime respondidoEm;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
