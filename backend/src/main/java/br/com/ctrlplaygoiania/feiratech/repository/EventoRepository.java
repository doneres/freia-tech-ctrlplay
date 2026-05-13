package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventoRepository extends JpaRepository<Evento, UUID> {
    Optional<Evento> findTopByDataEventoAfterOrderByDataEventoAsc(LocalDateTime now);
    List<Evento> findAllByOrderByDataEventoDesc();

    @org.springframework.data.jpa.repository.Query("""
        SELECT e FROM Evento e
        WHERE e.dataInicioSubmissao IS NOT NULL
          AND e.dataInicioSubmissao <= :agora
          AND (e.dataFimSubmissao IS NULL OR e.dataFimSubmissao >= :agora)
        ORDER BY e.dataEvento ASC
        """)
    List<Evento> findComSubmissaoAberta(@org.springframework.data.repository.query.Param("agora") LocalDateTime agora);
}
