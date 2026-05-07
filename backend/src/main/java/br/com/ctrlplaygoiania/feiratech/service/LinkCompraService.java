package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.LinkCompraDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.LinkCompra;
import br.com.ctrlplaygoiania.feiratech.model.Material;
import br.com.ctrlplaygoiania.feiratech.repository.LinkCompraRepository;
import br.com.ctrlplaygoiania.feiratech.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LinkCompraService {

    private final LinkCompraRepository linkCompraRepository;
    private final MaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public List<LinkCompraDTO.Response> listarPorMaterial(UUID materialId) {
        return linkCompraRepository.findByMaterialId(materialId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LinkCompraDTO.Response adicionar(UUID materialId, LinkCompraDTO.Request dto) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material", materialId));

        if (linkCompraRepository.countByMaterialId(materialId) >= 3) {
            throw new BusinessException("Material já possui 3 links cadastrados");
        }

        LinkCompra link = new LinkCompra();
        link.setMaterial(material);
        link.setNomeSite(dto.getNomeSite());
        link.setUrl(dto.getUrl());
        link.setValorEncontrado(dto.getValorEncontrado());

        return toResponse(linkCompraRepository.save(link));
    }

    @Transactional
    public LinkCompraDTO.Response atualizar(UUID id, LinkCompraDTO.Request dto) {
        LinkCompra link = buscarEntidadePorId(id);
        link.setNomeSite(dto.getNomeSite());
        link.setUrl(dto.getUrl());
        link.setValorEncontrado(dto.getValorEncontrado());
        return toResponse(linkCompraRepository.save(link));
    }

    @Transactional
    public void deletar(UUID id) {
        linkCompraRepository.delete(buscarEntidadePorId(id));
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private LinkCompra buscarEntidadePorId(UUID id) {
        return linkCompraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LinkCompra", id));
    }

    private LinkCompraDTO.Response toResponse(LinkCompra link) {
        return LinkCompraDTO.Response.builder()
                .id(link.getId())
                .nomeSite(link.getNomeSite())
                .url(link.getUrl())
                .valorEncontrado(link.getValorEncontrado())
                .build();
    }
}
