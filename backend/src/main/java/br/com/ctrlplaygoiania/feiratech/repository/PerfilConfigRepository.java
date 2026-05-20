package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.PerfilConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PerfilConfigRepository extends JpaRepository<PerfilConfig, UUID> {

    Optional<PerfilConfig> findByNome(String nome);

    boolean existsByNome(String nome);

    List<PerfilConfig> findByAtivoTrue();
}
