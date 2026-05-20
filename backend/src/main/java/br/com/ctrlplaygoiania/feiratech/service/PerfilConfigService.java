package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.PerfilConfigDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.PerfilConfig;
import br.com.ctrlplaygoiania.feiratech.model.PerfilPermissao;
import br.com.ctrlplaygoiania.feiratech.repository.PerfilConfigRepository;
import br.com.ctrlplaygoiania.feiratech.repository.PerfilPermissaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PerfilConfigService {

    private final PerfilConfigRepository perfilConfigRepository;
    private final PerfilPermissaoRepository perfilPermissaoRepository;

    @Transactional(readOnly = true)
    public List<PerfilConfigDTO.Response> listarTodos() {
        return perfilConfigRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PerfilConfigDTO.Response> listarAtivos() {
        return perfilConfigRepository.findByAtivoTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PerfilConfigDTO.Response buscarPorNome(String nome) {
        PerfilConfig config = perfilConfigRepository.findByNome(nome)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + nome));
        return toResponse(config);
    }

    @Transactional
    public PerfilConfigDTO.Response criar(PerfilConfigDTO.Request dto) {
        if (perfilConfigRepository.existsByNome(dto.getNome())) {
            throw new BusinessException("Já existe um perfil com o nome: " + dto.getNome());
        }
        PerfilConfig config = new PerfilConfig();
        config.setNome(dto.getNome());
        config.setDescricao(dto.getDescricao());
        config.setCor(dto.getCor());
        config.setBuiltin(false);
        config.setAtivo(true);
        config = perfilConfigRepository.save(config);

        if (dto.getPermissoes() != null) {
            salvarPermissoes(config.getNome(), dto.getPermissoes());
        }
        return toResponse(config);
    }

    @Transactional
    public PerfilConfigDTO.Response atualizar(UUID id, PerfilConfigDTO.Request dto) {
        PerfilConfig config = buscarEntidadePorId(id);
        if (config.getBuiltin()) {
            // For built-in profiles, only allow updating description, color, and permissions
            config.setDescricao(dto.getDescricao());
            config.setCor(dto.getCor());
        } else {
            if (!config.getNome().equals(dto.getNome()) && perfilConfigRepository.existsByNome(dto.getNome())) {
                throw new BusinessException("Já existe um perfil com o nome: " + dto.getNome());
            }
            config.setNome(dto.getNome());
            config.setDescricao(dto.getDescricao());
            config.setCor(dto.getCor());
        }
        config = perfilConfigRepository.save(config);

        if (dto.getPermissoes() != null) {
            perfilPermissaoRepository.deleteByPerfilNome(config.getNome());
            salvarPermissoes(config.getNome(), dto.getPermissoes());
        }
        return toResponse(config);
    }

    @Transactional
    public void atualizarPermissoes(UUID id, List<String> permissoes) {
        PerfilConfig config = buscarEntidadePorId(id);
        perfilPermissaoRepository.deleteByPerfilNome(config.getNome());
        salvarPermissoes(config.getNome(), permissoes);
    }

    @Transactional
    public void desativar(UUID id) {
        PerfilConfig config = buscarEntidadePorId(id);
        if (config.getBuiltin()) {
            throw new BusinessException("Perfis padrão do sistema não podem ser desativados");
        }
        config.setAtivo(false);
        perfilConfigRepository.save(config);
    }

    @Transactional
    public void deletar(UUID id) {
        PerfilConfig config = buscarEntidadePorId(id);
        if (config.getBuiltin()) {
            throw new BusinessException("Perfis padrão do sistema não podem ser excluídos");
        }
        perfilPermissaoRepository.deleteByPerfilNome(config.getNome());
        perfilConfigRepository.delete(config);
    }

    @Transactional(readOnly = true)
    public List<String> listarPermissoesDoPerfilNome(String perfilNome) {
        return perfilPermissaoRepository.findByPerfilNome(perfilNome).stream()
                .map(PerfilPermissao::getPermissao)
                .toList();
    }

    public static List<String> todasPermissoesDisponiveis() {
        return List.of(
            // Projetos
            "VER_PROJETOS",
            "CRIAR_PROJETO",
            "EDITAR_PROJETO",
            "EXCLUIR_PROJETO",
            "SUBMETER_PROJETO",
            "APROVAR_PROJETO",
            "REPROVAR_PROJETO",
            "INICIAR_ANDAMENTO_PROJETO",
            "CONCLUIR_PROJETO",
            "RESPONDER_ETAPA_APROVACAO",
            // Usuários
            "VER_USUARIOS",
            "CRIAR_USUARIO",
            "EDITAR_USUARIO",
            "DESATIVAR_USUARIO",
            // Estoque
            "VER_ESTOQUE",
            "CRIAR_ESTOQUE",
            "EDITAR_ESTOQUE",
            "EXCLUIR_ESTOQUE",
            // Materiais / Solicitações
            "VER_SOLICITACOES",
            "APROVAR_MATERIAL",
            // Ferramentas
            "VER_FERRAMENTAS",
            "GERENCIAR_FERRAMENTAS",
            // Eventos / Tipos de Evento
            "VER_EVENTOS",
            "GERENCIAR_EVENTOS",
            "VER_TIPOS_EVENTO",
            "GERENCIAR_TIPOS_EVENTO",
            // Relatórios
            "VER_RELATORIOS_ESTOQUE",
            "VER_RELATORIOS_PROJETOS",
            "VER_RELATORIOS_PROPRIOS",
            // Fórum
            "VER_FORUM",
            "CRIAR_POST_FORUM",
            "FIXAR_POST_FORUM",
            // Agenda
            "VER_AGENDA",
            // Perfis
            "GERENCIAR_PERFIS"
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void salvarPermissoes(String perfilNome, List<String> permissoes) {
        List<String> validas = todasPermissoesDisponiveis();
        permissoes.stream()
                .filter(validas::contains)
                .distinct()
                .forEach(p -> {
                    PerfilPermissao pp = new PerfilPermissao();
                    pp.setPerfilNome(perfilNome);
                    pp.setPermissao(p);
                    perfilPermissaoRepository.save(pp);
                });
    }

    private PerfilConfig buscarEntidadePorId(UUID id) {
        return perfilConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil", id));
    }

    private PerfilConfigDTO.Response toResponse(PerfilConfig config) {
        List<String> permissoes = perfilPermissaoRepository.findByPerfilNome(config.getNome()).stream()
                .map(PerfilPermissao::getPermissao)
                .toList();
        return PerfilConfigDTO.Response.builder()
                .id(config.getId())
                .nome(config.getNome())
                .descricao(config.getDescricao())
                .builtin(config.getBuiltin())
                .ativo(config.getAtivo())
                .cor(config.getCor())
                .permissoes(permissoes)
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
