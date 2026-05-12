package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.ArquivoProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArquivoProjetoRepository extends JpaRepository<ArquivoProjeto, UUID> {
    List<ArquivoProjeto> findByProjetoIdOrderByCreatedAtDesc(UUID projetoId);
}
