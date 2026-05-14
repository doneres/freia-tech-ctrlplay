package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.EtapaAprovacao;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusEtapaAprovacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EtapaAprovacaoRepository extends JpaRepository<EtapaAprovacao, UUID> {
    List<EtapaAprovacao> findByProjetoIdOrderByOrdemAsc(UUID projetoId);
    Optional<EtapaAprovacao> findByProjetoIdAndOrdem(UUID projetoId, Integer ordem);
    List<EtapaAprovacao> findByProjetoIdAndStatus(UUID projetoId, StatusEtapaAprovacao status);
}
