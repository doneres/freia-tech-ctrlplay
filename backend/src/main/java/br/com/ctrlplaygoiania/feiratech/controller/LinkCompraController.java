package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.LinkCompraDTO;
import br.com.ctrlplaygoiania.feiratech.service.LinkCompraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/links-compra")
@RequiredArgsConstructor
public class LinkCompraController {

    private final LinkCompraService linkCompraService;

    @GetMapping("/material/{materialId}")
    public ResponseEntity<ApiResponse<List<LinkCompraDTO.Response>>> listarPorMaterial(
            @PathVariable UUID materialId) {
        return ResponseEntity.ok(ApiResponse.ok(linkCompraService.listarPorMaterial(materialId)));
    }

    @PostMapping("/material/{materialId}")
    public ResponseEntity<ApiResponse<LinkCompraDTO.Response>> adicionar(
            @PathVariable UUID materialId, @RequestBody @Valid LinkCompraDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Link adicionado com sucesso", linkCompraService.adicionar(materialId, dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LinkCompraDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid LinkCompraDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(linkCompraService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        linkCompraService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
