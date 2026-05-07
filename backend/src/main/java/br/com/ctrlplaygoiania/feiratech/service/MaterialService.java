package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.ItemEstoqueDTO;
import br.com.ctrlplaygoiania.feiratech.dto.LinkCompraDTO;
import br.com.ctrlplaygoiania.feiratech.dto.MaterialDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.LinkCompra;
import br.com.ctrlplaygoiania.feiratech.model.Material;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import br.com.ctrlplaygoiania.feiratech.repository.MaterialRepository;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final ProjetoRepository projetoRepository;
    private final ItemEstoqueService itemEstoqueService;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<MaterialDTO.Response> listarPorProjeto(UUID projetoId) {
        return materialRepository.findByProjetoId(projetoId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MaterialDTO.Response buscarPorId(UUID id) {
        return toResponse(buscarEntidadePorId(id));
    }

    /** Cria uma solicitação de compra (item ainda não existe no estoque). */
    @Transactional
    public MaterialDTO.Response criar(MaterialDTO.Request dto, UUID projetoId) {
        Projeto projeto = buscarProjeto(projetoId);

        if (dto.getLinks() != null && dto.getLinks().size() > 3) {
            throw new BusinessException("Material pode ter no máximo 3 links");
        }

        Material material = new Material();
        material.setProjeto(projeto);
        mapRequestToMaterial(dto, material);

        if (dto.getLinks() != null) {
            dto.getLinks().stream()
                    .map(l -> toLinkCompraEntity(l, material))
                    .forEach(material.getLinks()::add);
        }

        return toResponse(materialRepository.save(material));
    }

    /** Vincula um item do estoque ao projeto e decrementa o disponível. */
    @Transactional
    public MaterialDTO.Response criarDoEstoque(UUID projetoId, UUID itemEstoqueId, Integer quantidade) {
        Projeto projeto = buscarProjeto(projetoId);
        ItemEstoque itemEstoque = itemEstoqueService.buscarEntidade(itemEstoqueId);

        if (!itemEstoque.getAtivo()) {
            throw new BusinessException("Este item não está mais ativo no estoque");
        }
        if (itemEstoque.getQuantidadeDisponivel() < quantidade) {
            throw new BusinessException(
                    "Quantidade insuficiente em estoque. Disponível: " + itemEstoque.getQuantidadeDisponivel());
        }

        itemEstoque.setQuantidadeDisponivel(itemEstoque.getQuantidadeDisponivel() - quantidade);
        itemEstoqueService.salvar(itemEstoque);

        Material material = new Material();
        material.setProjeto(projeto);
        material.setItemEstoque(itemEstoque);
        material.setItem(itemEstoque.getNome());
        material.setQuantidade(quantidade);
        material.setStatusCompra(StatusCompra.DISPONIVEL_ESCOLA);
        material.setEstoqueSubtraido(true);

        return toResponse(materialRepository.save(material));
    }

    @Transactional
    public MaterialDTO.Response atualizar(UUID id, MaterialDTO.Request dto) {
        Material material = buscarEntidadePorId(id);

        if (material.getItemEstoque() != null) {
            throw new BusinessException("Itens do estoque não podem ser editados. Remova e adicione novamente.");
        }
        if (dto.getLinks() != null && dto.getLinks().size() > 3) {
            throw new BusinessException("Material pode ter no máximo 3 links");
        }

        mapRequestToMaterial(dto, material);

        if (dto.getLinks() != null) {
            material.getLinks().clear();
            dto.getLinks().stream()
                    .map(l -> toLinkCompraEntity(l, material))
                    .forEach(material.getLinks()::add);
        }

        return toResponse(materialRepository.save(material));
    }

    /**
     * Atualiza o status da solicitação de compra.
     * Transições válidas:
     *   A_COMPRAR → AGUARDANDO_APROVACAO (instrutor submete)
     *   AGUARDANDO_APROVACAO → APROVADO | REPROVADO (coord/admin decide)
     *   APROVADO → EM_PROCESSO_DE_COMPRA (admin inicia processo)
     *   EM_PROCESSO_DE_COMPRA → COMPRADO_E_EM_ESTOQUE (admin confirma chegada)
     *   REPROVADO → A_COMPRAR (instrutor corrige e resubmete)
     */
    @Transactional
    public MaterialDTO.Response atualizarStatusCompra(UUID id, StatusCompra novoStatus, String justificativa) {
        Material material = buscarEntidadePorId(id);

        if (material.getItemEstoque() != null && material.getStatusCompra() == StatusCompra.DISPONIVEL_ESCOLA) {
            throw new BusinessException("Itens do estoque não passam pelo fluxo de compra");
        }

        validarTransicaoStatus(material, novoStatus, justificativa);

        if (novoStatus == StatusCompra.REPROVADO) {
            material.setJustificativaReprovacao(justificativa);
        }

        material.setStatusCompra(novoStatus);
        Material salvo = materialRepository.save(material);

        try {
            notificarPorEmail(salvo, novoStatus, justificativa);
        } catch (Exception ignored) { }

        return toResponse(salvo);
    }

    @Transactional
    public void deletar(UUID id) {
        Material material = buscarEntidadePorId(id);

        if (material.getItemEstoque() != null && Boolean.TRUE.equals(material.getEstoqueSubtraido())) {
            ItemEstoque item = material.getItemEstoque();
            item.setQuantidadeDisponivel(item.getQuantidadeDisponivel() + material.getQuantidade());
            itemEstoqueService.salvar(item);
        }

        materialRepository.delete(material);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private void validarTransicaoStatus(Material material, StatusCompra novoStatus, String justificativa) {
        StatusCompra atual = material.getStatusCompra();

        switch (novoStatus) {
            case AGUARDANDO_APROVACAO -> {
                if (atual != StatusCompra.A_COMPRAR && atual != StatusCompra.REPROVADO) {
                    throw new BusinessException("Só é possível submeter uma solicitação com status A_COMPRAR ou REPROVADO");
                }
                if (material.getLinks().isEmpty()) {
                    throw new BusinessException("Informe ao menos um link de compra antes de submeter");
                }
            }
            case APROVADO -> {
                if (atual != StatusCompra.AGUARDANDO_APROVACAO) {
                    throw new BusinessException("Só é possível aprovar uma solicitação AGUARDANDO_APROVACAO");
                }
            }
            case REPROVADO -> {
                if (atual != StatusCompra.AGUARDANDO_APROVACAO) {
                    throw new BusinessException("Só é possível reprovar uma solicitação AGUARDANDO_APROVACAO");
                }
                if (justificativa == null || justificativa.isBlank()) {
                    throw new BusinessException("Justificativa é obrigatória para reprovar");
                }
            }
            case EM_PROCESSO_DE_COMPRA -> {
                if (atual != StatusCompra.APROVADO) {
                    throw new BusinessException("Só é possível iniciar o processo de compra após APROVADO");
                }
            }
            case COMPRADO_E_EM_ESTOQUE -> {
                if (atual != StatusCompra.EM_PROCESSO_DE_COMPRA) {
                    throw new BusinessException("Só é possível marcar como chegado após EM_PROCESSO_DE_COMPRA");
                }
            }
            case A_COMPRAR -> {
                if (atual != StatusCompra.REPROVADO) {
                    throw new BusinessException("Só é possível retornar a A_COMPRAR a partir de REPROVADO");
                }
            }
            default -> throw new BusinessException("Transição para " + novoStatus + " não é permitida por esta rota");
        }
    }

    private void notificarPorEmail(Material material, StatusCompra novoStatus, String justificativa) {
        String emailInstrutor = material.getProjeto().getInstrutor().getEmail();
        String nomeProjeto = material.getProjeto().getNomeProjeto();
        String nomeItem = material.getItem();

        switch (novoStatus) {
            case AGUARDANDO_APROVACAO ->
                usuarioRepository.findByPerfil(PerfilUsuario.COORDENACAO).forEach(coord ->
                        emailService.notificarSolicitacaoCompra(coord.getEmail(), nomeProjeto, nomeItem));
            case APROVADO ->
                emailService.notificarCompraAprovada(emailInstrutor, nomeProjeto, nomeItem);
            case REPROVADO ->
                emailService.notificarCompraReprovada(emailInstrutor, nomeProjeto, nomeItem, justificativa);
            default -> { }
        }
    }

    private Projeto buscarProjeto(UUID projetoId) {
        return projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto", projetoId));
    }

    private Material buscarEntidadePorId(UUID id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material", id));
    }

    private void mapRequestToMaterial(MaterialDTO.Request dto, Material material) {
        material.setItem(dto.getItem());
        material.setQuantidade(dto.getQuantidade());
        material.setUnidade(dto.getUnidade());
        material.setCustoUnitario(dto.getCustoUnitario());
        if (dto.getStatusCompra() != null) material.setStatusCompra(dto.getStatusCompra());
        material.setImagemUrl(dto.getImagemUrl());
    }

    private LinkCompra toLinkCompraEntity(LinkCompraDTO.Request dto, Material material) {
        LinkCompra link = new LinkCompra();
        link.setMaterial(material);
        link.setNomeSite(dto.getNomeSite());
        link.setUrl(dto.getUrl());
        link.setValorEncontrado(dto.getValorEncontrado());
        return link;
    }

    private MaterialDTO.Response toResponse(Material material) {
        BigDecimal custoTotal = material.getCustoUnitario() != null
                ? material.getCustoUnitario().multiply(BigDecimal.valueOf(material.getQuantidade()))
                : BigDecimal.ZERO;

        ItemEstoqueDTO.Response itemEstoqueResponse = material.getItemEstoque() != null
                ? itemEstoqueService.toResponse(material.getItemEstoque())
                : null;

        return MaterialDTO.Response.builder()
                .id(material.getId())
                .item(material.getItem())
                .quantidade(material.getQuantidade())
                .unidade(material.getUnidade())
                .custoUnitario(material.getCustoUnitario())
                .custoTotal(custoTotal)
                .statusCompra(material.getStatusCompra())
                .estoqueSubtraido(material.getEstoqueSubtraido())
                .imagemUrl(material.getImagemUrl())
                .justificativaReprovacao(material.getJustificativaReprovacao())
                .links(material.getLinks().stream().map(this::toLinkCompraResponse).toList())
                .itemEstoque(itemEstoqueResponse)
                .createdAt(material.getCreatedAt())
                .build();
    }

    private LinkCompraDTO.Response toLinkCompraResponse(LinkCompra link) {
        return LinkCompraDTO.Response.builder()
                .id(link.getId())
                .nomeSite(link.getNomeSite())
                .url(link.getUrl())
                .valorEncontrado(link.getValorEncontrado())
                .build();
    }
}
