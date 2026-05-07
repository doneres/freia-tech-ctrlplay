package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.LinkCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LinkCompraRepository extends JpaRepository<LinkCompra, UUID> {

    // Todos os links de um material
    List<LinkCompra> findByMaterialId(UUID materialId);

    // Quantidade de links cadastrados para um material (máximo permitido: 3)
    long countByMaterialId(UUID materialId);
}