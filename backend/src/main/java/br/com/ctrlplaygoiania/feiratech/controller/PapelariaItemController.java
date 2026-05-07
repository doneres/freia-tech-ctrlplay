package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.PapelariaItemDTO;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import br.com.ctrlplaygoiania.feiratech.service.PapelariaItemService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/papelaria")
@RequiredArgsConstructor
public class PapelariaItemController {

    private final PapelariaItemService papelariaItemService;

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<ApiResponse<List<PapelariaItemDTO.Response>>> listarPorProjeto(
            @PathVariable UUID projetoId) {
        return ResponseEntity.ok(ApiResponse.ok(papelariaItemService.listarPorProjeto(projetoId)));
    }

    @PostMapping("/projeto/{projetoId}")
    public ResponseEntity<ApiResponse<PapelariaItemDTO.Response>> criar(
            @PathVariable UUID projetoId,
            @RequestBody @Valid PapelariaItemDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Item de papelaria criado", papelariaItemService.criar(projetoId, dto)));
    }

    @PostMapping("/projeto/{projetoId}/do-estoque/{itemEstoqueId}")
    public ResponseEntity<ApiResponse<PapelariaItemDTO.Response>> criarDoEstoque(
            @PathVariable UUID projetoId,
            @PathVariable UUID itemEstoqueId,
            @RequestParam(defaultValue = "1") Integer quantidade) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Item de papelaria adicionado do estoque",
                        papelariaItemService.criarDoEstoque(projetoId, itemEstoqueId, quantidade)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PapelariaItemDTO.Response>> atualizarStatus(
            @PathVariable UUID id,
            @RequestBody StatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                papelariaItemService.atualizarStatus(id, request.getStatus(), request.getJustificativa())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        papelariaItemService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusRequest {
        private StatusCompra status;
        private String justificativa;
    }
}
