package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.PapelariaItemDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.PapelariaItem;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import br.com.ctrlplaygoiania.feiratech.repository.PapelariaItemRepository;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PapelariaItemService {

    private final PapelariaItemRepository papelariaItemRepository;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ItemEstoqueService itemEstoqueService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<PapelariaItemDTO.Response> listarPorProjeto(UUID projetoId) {
        return papelariaItemRepository.findByProjetoId(projetoId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PapelariaItemDTO.Response criar(UUID projetoId, PapelariaItemDTO.Request dto) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto", projetoId));

        PapelariaItem item = new PapelariaItem();
        item.setProjeto(projeto);
        item.setNome(dto.getNome());
        item.setImagemUrl(dto.getImagemUrl());
        item.setQuantidade(dto.getQuantidade());

        return toResponse(papelariaItemRepository.save(item));
    }

    /** Vincula um item do estoque de papelaria ao projeto e decrementa o disponível. */
    @Transactional
    public PapelariaItemDTO.Response criarDoEstoque(UUID projetoId, UUID itemEstoqueId, Integer quantidade) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto", projetoId));
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

        PapelariaItem item = new PapelariaItem();
        item.setProjeto(projeto);
        item.setItemEstoque(itemEstoque);
        item.setNome(itemEstoque.getNome());
        item.setImagemUrl(itemEstoque.getImagemUrl());
        item.setQuantidade(quantidade);
        item.setStatusAquisicao(StatusCompra.DISPONIVEL_ESCOLA);
        item.setEstoqueSubtraido(true);

        return toResponse(papelariaItemRepository.save(item));
    }

    @Transactional
    public PapelariaItemDTO.Response atualizarStatus(UUID id, StatusCompra novoStatus, String justificativa) {
        PapelariaItem item = buscarPorId(id);

        if (Boolean.TRUE.equals(item.getEstoqueSubtraido())) {
            throw new BusinessException("Itens retirados do estoque não passam pelo fluxo de aprovação");
        }

        validarTransicao(item, novoStatus, justificativa);

        if (novoStatus == StatusCompra.REPROVADO) {
            item.setJustificativaReprovacao(justificativa);
        }

        item.setStatusAquisicao(novoStatus);
        PapelariaItem salvo = papelariaItemRepository.save(item);

        try {
            notificarPorEmail(salvo, novoStatus, justificativa);
        } catch (Exception ignored) { }

        return toResponse(salvo);
    }

    @Transactional
    public void deletar(UUID id) {
        PapelariaItem item = buscarPorId(id);

        if (item.getItemEstoque() != null && Boolean.TRUE.equals(item.getEstoqueSubtraido())) {
            ItemEstoque estoque = item.getItemEstoque();
            estoque.setQuantidadeDisponivel(estoque.getQuantidadeDisponivel() + item.getQuantidade());
            itemEstoqueService.salvar(estoque);
        }

        papelariaItemRepository.delete(item);
    }

    public PapelariaItemDTO.Response toResponse(PapelariaItem item) {
        return PapelariaItemDTO.Response.builder()
                .id(item.getId())
                .nome(item.getNome())
                .imagemUrl(item.getImagemUrl())
                .quantidade(item.getQuantidade())
                .estoqueSubtraido(item.getEstoqueSubtraido())
                .itemEstoque(item.getItemEstoque() != null
                        ? itemEstoqueService.toResponse(item.getItemEstoque())
                        : null)
                .statusAquisicao(item.getStatusAquisicao())
                .justificativaReprovacao(item.getJustificativaReprovacao())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private PapelariaItem buscarPorId(UUID id) {
        return papelariaItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PapelariaItem", id));
    }

    private void validarTransicao(PapelariaItem item, StatusCompra novoStatus, String justificativa) {
        StatusCompra atual = item.getStatusAquisicao();
        switch (novoStatus) {
            case AGUARDANDO_APROVACAO -> {
                if (atual != StatusCompra.A_COMPRAR && atual != StatusCompra.REPROVADO) {
                    throw new BusinessException("Só é possível submeter uma solicitação com status A_COMPRAR ou REPROVADO");
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
            default -> throw new BusinessException("Transição para " + novoStatus + " não é permitida");
        }
    }

    private void notificarPorEmail(PapelariaItem item, StatusCompra novoStatus, String justificativa) {
        String emailInstrutor = item.getProjeto().getInstrutor().getEmail();
        String nomeProjeto = item.getProjeto().getNomeProjeto();
        String nomeItem = item.getNome();

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
}
