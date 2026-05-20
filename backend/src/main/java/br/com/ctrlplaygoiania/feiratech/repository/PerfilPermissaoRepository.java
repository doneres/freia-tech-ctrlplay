package br.com.ctrlplaygoiania.feiratech.repository;

import br.com.ctrlplaygoiania.feiratech.model.PerfilPermissao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PerfilPermissaoRepository extends JpaRepository<PerfilPermissao, UUID> {

    List<PerfilPermissao> findByPerfilNome(String perfilNome);

    void deleteByPerfilNome(String perfilNome);

    void deleteByPerfilNomeAndPermissao(String perfilNome, String permissao);

    boolean existsByPerfilNomeAndPermissao(String perfilNome, String permissao);

    List<String> findPermissaoByPerfilNome(String perfilNome);
}
