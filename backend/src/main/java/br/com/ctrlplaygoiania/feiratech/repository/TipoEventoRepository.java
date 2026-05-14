package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.TipoEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TipoEventoRepository extends JpaRepository<TipoEvento, UUID> {
    List<TipoEvento> findAllByOrderByNomeAsc();
    List<TipoEvento> findByAtivoTrueOrderByNomeAsc();
}
