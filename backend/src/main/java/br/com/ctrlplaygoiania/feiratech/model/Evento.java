package br.com.ctrlplaygoiania.feiratech.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "eventos")
@Data @AllArgsConstructor @NoArgsConstructor
public class Evento {
    @Id @GeneratedValue @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(nullable = false)
    private LocalDateTime dataEvento;

    private LocalDateTime dataInicioSubmissao;

    private LocalDateTime dataFimSubmissao;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
