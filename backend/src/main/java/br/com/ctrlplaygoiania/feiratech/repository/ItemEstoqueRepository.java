package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.enums.TipoItemEstoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemEstoqueRepository extends JpaRepository<ItemEstoque, UUID> {

    @Query("""
            SELECT i FROM ItemEstoque i
            WHERE (:tipo IS NULL OR i.tipo = :tipo)
              AND (:search IS NULL
                   OR LOWER(i.nome) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(COALESCE(i.categoria, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(COALESCE(i.modelo, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
              AND (:apenasAtivos = false OR i.ativo = true)
            ORDER BY i.tipo, i.nome
            """)
    List<ItemEstoque> buscarComFiltros(
            @Param("tipo") TipoItemEstoque tipo,
            @Param("search") String search,
            @Param("apenasAtivos") boolean apenasAtivos);
}
