package br.com.ctrlplaygoiania.feiratech.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "perfis_permissoes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"perfil_nome", "permissao"}))
@Data @AllArgsConstructor @NoArgsConstructor
public class PerfilPermissao {

    @Id @GeneratedValue @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "perfil_nome", nullable = false, length = 50)
    private String perfilNome;

    @Column(nullable = false, length = 80)
    private String permissao;
}
