package br.com.ctrlplaygoiania.feiratech.model;

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
@Table(name = "ferramentas_software")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FerramentaSoftware {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 100)
    private String categoria;

    @Column(columnDefinition = "TEXT")
    private String descricao;

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
