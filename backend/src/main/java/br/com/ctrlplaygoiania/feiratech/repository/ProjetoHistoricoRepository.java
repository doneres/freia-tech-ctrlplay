package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.ProjetoHistorico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjetoHistoricoRepository extends JpaRepository<ProjetoHistorico, UUID> {
    List<ProjetoHistorico> findByProjetoIdOrderByCreatedAtAsc(UUID projetoId);
}
