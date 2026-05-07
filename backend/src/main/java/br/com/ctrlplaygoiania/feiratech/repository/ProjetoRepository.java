package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.NivelTurma;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusSemana;
import br.com.ctrlplaygoiania.feiratech.model.enums.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, UUID> {

    List<Projeto> findByInstrutor(Usuario instrutor);

    List<Projeto> findByInstrutor_Id(UUID instrutorId);

    List<Projeto> findByTurno(Turno turno);

    List<Projeto> findByNivelTurma(NivelTurma nivelTurma);

    List<Projeto> findByStatusS4(StatusSemana statusS4);

    List<Projeto> findByStatusProjeto(StatusProjeto statusProjeto);

    @Query("""
            SELECT p FROM Projeto p
            WHERE (:instrutorId   IS NULL OR p.instrutor.id   = :instrutorId)
              AND (:turno         IS NULL OR p.turno          = :turno)
              AND (:nivelTurma    IS NULL OR p.nivelTurma     = :nivelTurma)
              AND (:statusS4      IS NULL OR p.statusS4       = :statusS4)
              AND (:statusProjeto IS NULL OR p.statusProjeto  = :statusProjeto)
              AND (:search        IS NULL
                   OR LOWER(p.nomeProjeto)  LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(p.codigoTurma)  LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            ORDER BY p.createdAt DESC
            """)
    List<Projeto> buscarComFiltros(
            @Param("instrutorId")   UUID instrutorId,
            @Param("turno")         Turno turno,
            @Param("nivelTurma")    NivelTurma nivelTurma,
            @Param("statusS4")      StatusSemana statusS4,
            @Param("statusProjeto") StatusProjeto statusProjeto,
            @Param("search")        String search);
}
