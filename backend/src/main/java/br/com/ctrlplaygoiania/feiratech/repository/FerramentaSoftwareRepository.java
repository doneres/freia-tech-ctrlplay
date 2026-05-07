package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.FerramentaSoftware;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FerramentaSoftwareRepository extends JpaRepository<FerramentaSoftware, UUID> {

    List<FerramentaSoftware> findAllByOrderByCategoriaAscNomeAsc();

    List<FerramentaSoftware> findByAtivoTrueOrderByCategoriaAscNomeAsc();
}
