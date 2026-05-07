package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.PapelariaItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PapelariaItemRepository extends JpaRepository<PapelariaItem, UUID> {
    List<PapelariaItem> findByProjetoId(UUID projetoId);
    boolean existsByItemEstoqueId(UUID itemEstoqueId);
}
