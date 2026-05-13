package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.MaterialDTO;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import br.com.ctrlplaygoiania.feiratech.service.MaterialService;
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
@RequestMapping("/api/materiais")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<ApiResponse<List<MaterialDTO.Response>>> listarPorProjeto(
            @PathVariable UUID projetoId) {
        return ResponseEntity.ok(ApiResponse.ok(materialService.listarPorProjeto(projetoId)));
    }

    @GetMapping("/aguardando-aprovacao")
    public ResponseEntity<ApiResponse<List<MaterialDTO.PendenteResponse>>> listarAguardandoAprovacao() {
        return ResponseEntity.ok(ApiResponse.ok(materialService.listarAguardandoAprovacao()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaterialDTO.Response>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(materialService.buscarPorId(id)));
    }

    /** Cria uma solicitação de compra vinculada ao projeto. */
    @PostMapping("/projeto/{projetoId}")
    public ResponseEntity<ApiResponse<MaterialDTO.Response>> criar(
            @PathVariable UUID projetoId, @RequestBody @Valid MaterialDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Solicitação criada com sucesso", materialService.criar(dto, projetoId)));
    }

    /** Vincula um item já existente no estoque ao projeto. */
    @PostMapping("/projeto/{projetoId}/do-estoque/{itemEstoqueId}")
    public ResponseEntity<ApiResponse<MaterialDTO.Response>> criarDoEstoque(
            @PathVariable UUID projetoId,
            @PathVariable UUID itemEstoqueId,
            @RequestBody AdicionarEstoqueRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Item do estoque adicionado",
                        materialService.criarDoEstoque(projetoId, itemEstoqueId, body.getQuantidade())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MaterialDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid MaterialDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(materialService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        materialService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status-compra")
    public ResponseEntity<ApiResponse<MaterialDTO.Response>> atualizarStatusCompra(
            @PathVariable UUID id, @RequestBody StatusCompraRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                materialService.atualizarStatusCompra(id, request.getStatus(), request.getJustificativa())));
    }

    // ── Request bodies ───────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCompraRequest {
        private StatusCompra status;
        private String justificativa;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdicionarEstoqueRequest {
        private Integer quantidade;
    }
}
