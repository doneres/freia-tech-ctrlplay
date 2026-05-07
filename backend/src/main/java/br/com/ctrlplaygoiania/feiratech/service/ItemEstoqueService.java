package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.ItemEstoqueDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.enums.TipoItemEstoque;
import br.com.ctrlplaygoiania.feiratech.repository.ItemEstoqueRepository;
import br.com.ctrlplaygoiania.feiratech.repository.MaterialRepository;
import br.com.ctrlplaygoiania.feiratech.repository.PapelariaItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItemEstoqueService {

    private final ItemEstoqueRepository itemEstoqueRepository;
    private final MaterialRepository materialRepository;
    private final PapelariaItemRepository papelariaItemRepository;

    @Transactional(readOnly = true)
    public List<ItemEstoqueDTO.Response> listar(TipoItemEstoque tipo, String search, boolean apenasAtivos) {
        return itemEstoqueRepository.buscarComFiltros(tipo, search, apenasAtivos)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ItemEstoqueDTO.Response buscarPorId(UUID id) {
        return toResponse(buscarEntidade(id));
    }

    @Transactional
    public ItemEstoqueDTO.Response criar(ItemEstoqueDTO.Request dto) {
        ItemEstoque item = new ItemEstoque();
        mapRequestToEntity(dto, item);
        item.setQuantidadeDisponivel(dto.getQuantidadeTotal());
        return toResponse(itemEstoqueRepository.save(item));
    }

    @Transactional
    public ItemEstoqueDTO.Response atualizar(UUID id, ItemEstoqueDTO.Request dto) {
        ItemEstoque item = buscarEntidade(id);

        int diferenca = dto.getQuantidadeTotal() - item.getQuantidadeTotal();
        int novaDisponivel = item.getQuantidadeDisponivel() + diferenca;
        if (novaDisponivel < 0) {
            throw new BusinessException(
                    "Não é possível reduzir o total abaixo da quantidade já em uso. Em uso: "
                    + (item.getQuantidadeTotal() - item.getQuantidadeDisponivel()));
        }

        mapRequestToEntity(dto, item);
        item.setQuantidadeDisponivel(novaDisponivel);
        return toResponse(itemEstoqueRepository.save(item));
    }

    @Transactional
    public ItemEstoqueDTO.Response ajustarDisponivel(UUID id, int novaQuantidade) {
        ItemEstoque item = buscarEntidade(id);
        if (novaQuantidade < 0 || novaQuantidade > item.getQuantidadeTotal()) {
            throw new BusinessException("Quantidade disponível deve ser entre 0 e " + item.getQuantidadeTotal());
        }
        item.setQuantidadeDisponivel(novaQuantidade);
        return toResponse(itemEstoqueRepository.save(item));
    }

    @Transactional
    public void deletar(UUID id) {
        ItemEstoque item = buscarEntidade(id);
        if (materialRepository.existsByItemEstoqueId(id) || papelariaItemRepository.existsByItemEstoqueId(id)) {
            throw new BusinessException(
                    "Este item está vinculado a projetos e não pode ser excluído. Desative-o em vez disso.");
        }
        itemEstoqueRepository.delete(item);
    }

    @Transactional
    public void desativar(UUID id) {
        ItemEstoque item = buscarEntidade(id);
        item.setAtivo(false);
        itemEstoqueRepository.save(item);
    }

    @Transactional
    public ItemEstoqueDTO.Response reativar(UUID id) {
        ItemEstoque item = buscarEntidade(id);
        item.setAtivo(true);
        return toResponse(itemEstoqueRepository.save(item));
    }

    // ── Package-scoped para uso pelo MaterialService ──────────────────────────

    ItemEstoque buscarEntidade(UUID id) {
        return itemEstoqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ItemEstoque", id));
    }

    void salvar(ItemEstoque item) {
        itemEstoqueRepository.save(item);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private void mapRequestToEntity(ItemEstoqueDTO.Request dto, ItemEstoque item) {
        item.setNome(dto.getNome());
        item.setDescricao(dto.getDescricao());
        item.setTipo(dto.getTipo());
        item.setCategoria(dto.getCategoria());
        item.setMarca(dto.getMarca());
        item.setModelo(dto.getModelo());
        item.setQuantidadeTotal(dto.getQuantidadeTotal());
        item.setImagemUrl(dto.getImagemUrl());
    }

    ItemEstoqueDTO.Response toResponse(ItemEstoque item) {
        return ItemEstoqueDTO.Response.builder()
                .id(item.getId())
                .nome(item.getNome())
                .descricao(item.getDescricao())
                .tipo(item.getTipo())
                .categoria(item.getCategoria())
                .marca(item.getMarca())
                .modelo(item.getModelo())
                .quantidadeTotal(item.getQuantidadeTotal())
                .quantidadeDisponivel(item.getQuantidadeDisponivel())
                .imagemUrl(item.getImagemUrl())
                .ativo(item.getAtivo())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
