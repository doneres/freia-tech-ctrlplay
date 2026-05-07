package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.FerramentaSoftwareDTO;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.FerramentaSoftware;
import br.com.ctrlplaygoiania.feiratech.repository.FerramentaSoftwareRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FerramentaSoftwareService {

    private final FerramentaSoftwareRepository repository;

    @Transactional(readOnly = true)
    public List<FerramentaSoftwareDTO.Response> listar(boolean apenasAtivas) {
        List<FerramentaSoftware> lista = apenasAtivas
                ? repository.findByAtivoTrueOrderByCategoriaAscNomeAsc()
                : repository.findAllByOrderByCategoriaAscNomeAsc();
        return lista.stream().map(this::toResponse).toList();
    }

    @Transactional
    public FerramentaSoftwareDTO.Response criar(FerramentaSoftwareDTO.Request dto) {
        FerramentaSoftware ferramenta = new FerramentaSoftware();
        mapRequest(dto, ferramenta);
        return toResponse(repository.save(ferramenta));
    }

    @Transactional
    public FerramentaSoftwareDTO.Response atualizar(UUID id, FerramentaSoftwareDTO.Request dto) {
        FerramentaSoftware ferramenta = buscarEntidade(id);
        mapRequest(dto, ferramenta);
        return toResponse(repository.save(ferramenta));
    }

    @Transactional
    public void desativar(UUID id) {
        FerramentaSoftware ferramenta = buscarEntidade(id);
        ferramenta.setAtivo(false);
        repository.save(ferramenta);
    }

    @Transactional
    public FerramentaSoftwareDTO.Response reativar(UUID id) {
        FerramentaSoftware ferramenta = buscarEntidade(id);
        ferramenta.setAtivo(true);
        return toResponse(repository.save(ferramenta));
    }

    // ── Package-scoped ────────────────────────────────────────────────────────

    FerramentaSoftware buscarEntidade(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FerramentaSoftware", id));
    }

    FerramentaSoftwareDTO.Response toResponse(FerramentaSoftware f) {
        return FerramentaSoftwareDTO.Response.builder()
                .id(f.getId())
                .nome(f.getNome())
                .categoria(f.getCategoria())
                .descricao(f.getDescricao())
                .imagemUrl(f.getImagemUrl())
                .ativo(f.getAtivo())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private void mapRequest(FerramentaSoftwareDTO.Request dto, FerramentaSoftware ferramenta) {
        ferramenta.setNome(dto.getNome());
        ferramenta.setCategoria(dto.getCategoria());
        ferramenta.setDescricao(dto.getDescricao());
        ferramenta.setImagemUrl(dto.getImagemUrl());
    }
}
