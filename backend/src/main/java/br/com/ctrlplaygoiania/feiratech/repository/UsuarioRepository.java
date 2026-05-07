package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByPerfil(PerfilUsuario perfil);

    List<Usuario> findByAtivoTrue();

    boolean existsByEmail(String email);
}
