package br.com.ctrlplaygoiania.feiratech.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tipos_evento")
@Data @AllArgsConstructor @NoArgsConstructor
public class TipoEvento {

    @Id @GeneratedValue @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(length = 50)
    private String icone;

    @Column(length = 20)
    private String cor;

    // JSON array of FormField objects defining the dynamic submission form
    @Column(columnDefinition = "TEXT")
    private String formSchema;

    // JSON array of WorkflowStep objects defining the approval workflow
    @Column(columnDefinition = "TEXT")
    private String workflowConfig;

    @Column(nullable = false)
    private Integer schemaVersion = 1;

    // When true, uses legacy fixed form (existing Feira Tech flow) instead of formSchema
    @Column(nullable = false)
    private Boolean usaFormularioLegado = false;

    @Column(nullable = false)
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
