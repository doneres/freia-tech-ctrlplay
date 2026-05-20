package br.com.ctrlplaygoiania.feiratech.model;

import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "projeto_historico")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjetoHistorico {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private StatusProjeto statusAnterior;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private StatusProjeto statusNovo;

    @Column(length = 500)
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String justificativa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuarioResponsavel;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
