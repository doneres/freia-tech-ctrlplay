package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.TipoEventoDTO;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.TipoEvento;
import br.com.ctrlplaygoiania.feiratech.repository.TipoEventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TipoEventoService {

    private final TipoEventoRepository repository;

    @Transactional(readOnly = true)
    public List<TipoEventoDTO.Response> listarTodos() {
        return repository.findAllByOrderByNomeAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TipoEventoDTO.Response> listarAtivos() {
        return repository.findByAtivoTrueOrderByNomeAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TipoEventoDTO.Response buscarPorId(UUID id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public TipoEventoDTO.Response criar(TipoEventoDTO.Request dto) {
        TipoEvento tipo = new TipoEvento();
        mapRequest(dto, tipo);
        return toResponse(repository.save(tipo));
    }

    @Transactional
    public TipoEventoDTO.Response atualizar(UUID id, TipoEventoDTO.Request dto) {
        TipoEvento tipo = buscarEntidade(id);
        // Bump schemaVersion whenever the formSchema changes
        if (dto.getFormSchema() != null && !dto.getFormSchema().equals(tipo.getFormSchema())) {
            tipo.setSchemaVersion((tipo.getSchemaVersion() != null ? tipo.getSchemaVersion() : 0) + 1);
        }
        mapRequest(dto, tipo);
        return toResponse(repository.save(tipo));
    }

    @Transactional
    public void deletar(UUID id) {
        if (!repository.existsById(id)) throw new ResourceNotFoundException("TipoEvento", id);
        repository.deleteById(id);
    }

    public TipoEvento buscarEntidade(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TipoEvento", id));
    }

    public TipoEventoDTO.Resumo toResumo(TipoEvento t) {
        if (t == null) return null;
        return TipoEventoDTO.Resumo.builder()
                .id(t.getId())
                .nome(t.getNome())
                .icone(t.getIcone())
                .cor(t.getCor())
                .formSchema(t.getFormSchema())
                .workflowConfig(t.getWorkflowConfig())
                .schemaVersion(t.getSchemaVersion())
                .usaFormularioLegado(t.getUsaFormularioLegado())
                .build();
    }

    private TipoEventoDTO.Response toResponse(TipoEvento t) {
        return TipoEventoDTO.Response.builder()
                .id(t.getId())
                .nome(t.getNome())
                .descricao(t.getDescricao())
                .icone(t.getIcone())
                .cor(t.getCor())
                .formSchema(t.getFormSchema())
                .workflowConfig(t.getWorkflowConfig())
                .schemaVersion(t.getSchemaVersion())
                .usaFormularioLegado(t.getUsaFormularioLegado())
                .ativo(t.getAtivo())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private void mapRequest(TipoEventoDTO.Request dto, TipoEvento tipo) {
        tipo.setNome(dto.getNome());
        tipo.setDescricao(dto.getDescricao());
        tipo.setIcone(dto.getIcone());
        tipo.setCor(dto.getCor());
        tipo.setFormSchema(dto.getFormSchema());
        tipo.setWorkflowConfig(dto.getWorkflowConfig());
        if (dto.getUsaFormularioLegado() != null) tipo.setUsaFormularioLegado(dto.getUsaFormularioLegado());
        if (dto.getAtivo() != null) tipo.setAtivo(dto.getAtivo());
    }
}
