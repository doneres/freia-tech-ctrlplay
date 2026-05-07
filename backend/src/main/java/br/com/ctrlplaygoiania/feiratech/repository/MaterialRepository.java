package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.Material;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {

    // Todos os materiais de um projeto
    List<Material> findByProjetoId(UUID projetoId);

    // Materiais de um projeto filtrados por status
    List<Material> findByProjetoIdAndStatusCompra(UUID projetoId, StatusCompra statusCompra);

    // Todos os materiais com status A_COMPRAR (visão geral de compras)
    List<Material> findByStatusCompra(StatusCompra statusCompra);

    // Materiais disponíveis na escola que ainda não foram subtraídos do estoque
    List<Material> findByStatusCompraAndEstoqueSubtraido(StatusCompra statusCompra, Boolean estoqueSubtraido);

    // Custo total estimado de todos os materiais de um projeto
    @Query("""
                SELECT COALESCE(SUM(m.custoUnitario * m.quantidade), 0)
                FROM Material m
                WHERE m.projeto.id = :projetoId
                  AND m.statusCompra = 'A_COMPRAR'
            """)
    BigDecimal calcularCustoTotalPorProjeto(@Param("projetoId") UUID projetoId);

    // Custo total geral de todos os materiais a comprar (visão da coordenação)
    @Query("""
                SELECT COALESCE(SUM(m.custoUnitario * m.quantidade), 0)
                FROM Material m
                WHERE m.statusCompra = 'A_COMPRAR'
            """)
    BigDecimal calcularCustoTotalGeral();

    boolean existsByItemEstoqueId(UUID itemEstoqueId);
}