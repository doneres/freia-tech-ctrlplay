package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.ArquivoProjetoDTO;
import br.com.ctrlplaygoiania.feiratech.service.ArquivoProjetoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projetos/{projetoId}/arquivos")
@RequiredArgsConstructor
public class ArquivoProjetoController {

    private final ArquivoProjetoService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ArquivoProjetoDTO.Response>>> listar(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(ApiResponse.ok(service.listar(projetoId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ArquivoProjetoDTO.Response>> criar(
            @PathVariable UUID projetoId,
            @RequestBody @Valid ArquivoProjetoDTO.Request dto,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.criar(projetoId, principal.getUsername(), dto)));
    }

    @DeleteMapping("/{arquivoId}")
    public ResponseEntity<Void> deletar(
            @PathVariable UUID projetoId,
            @PathVariable UUID arquivoId,
            @AuthenticationPrincipal UserDetails principal) {
        service.deletar(projetoId, arquivoId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
