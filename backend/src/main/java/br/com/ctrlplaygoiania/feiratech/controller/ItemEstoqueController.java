package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.ItemEstoqueDTO;
import br.com.ctrlplaygoiania.feiratech.model.enums.TipoItemEstoque;
import br.com.ctrlplaygoiania.feiratech.service.ItemEstoqueService;
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
@RequestMapping("/api/estoque")
@RequiredArgsConstructor
public class ItemEstoqueController {

    private final ItemEstoqueService itemEstoqueService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemEstoqueDTO.Response>>> listar(
            @RequestParam(required = false) TipoItemEstoque tipo,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean apenasAtivos) {
        return ResponseEntity.ok(ApiResponse.ok(itemEstoqueService.listar(tipo, search, apenasAtivos)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemEstoqueDTO.Response>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(itemEstoqueService.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ItemEstoqueDTO.Response>> criar(
            @RequestBody @Valid ItemEstoqueDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Item criado com sucesso", itemEstoqueService.criar(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemEstoqueDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid ItemEstoqueDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(itemEstoqueService.atualizar(id, dto)));
    }

    @PatchMapping("/{id}/ajustar-disponivel")
    public ResponseEntity<ApiResponse<ItemEstoqueDTO.Response>> ajustarDisponivel(
            @PathVariable UUID id, @RequestBody AjusteDisponivel body) {
        return ResponseEntity.ok(ApiResponse.ok(itemEstoqueService.ajustarDisponivel(id, body.getQuantidade())));
    }

    @PatchMapping("/{id}/desativar")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        itemEstoqueService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    public ResponseEntity<ApiResponse<ItemEstoqueDTO.Response>> reativar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(itemEstoqueService.reativar(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        itemEstoqueService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AjusteDisponivel {
        private int quantidade;
    }
}
