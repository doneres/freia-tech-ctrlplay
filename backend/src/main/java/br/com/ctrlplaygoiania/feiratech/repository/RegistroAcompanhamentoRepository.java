package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.RegistroAcompanhamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RegistroAcompanhamentoRepository extends JpaRepository<RegistroAcompanhamento, UUID> {
    List<RegistroAcompanhamento> findByProjetoIdOrderByCreatedAtDesc(UUID projetoId);
}
