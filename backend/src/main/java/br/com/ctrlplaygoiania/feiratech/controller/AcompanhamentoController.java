package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.RegistroAcompanhamentoDTO;
import br.com.ctrlplaygoiania.feiratech.service.AcompanhamentoService;
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
@RequestMapping("/api/projetos/{projetoId}/acompanhamento")
@RequiredArgsConstructor
public class AcompanhamentoController {

    private final AcompanhamentoService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RegistroAcompanhamentoDTO.Response>>> listar(@PathVariable UUID projetoId) {
        return ResponseEntity.ok(ApiResponse.ok(service.listar(projetoId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RegistroAcompanhamentoDTO.Response>> criar(
            @PathVariable UUID projetoId,
            @RequestBody @Valid RegistroAcompanhamentoDTO.Request dto,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.criar(projetoId, principal.getUsername(), dto)));
    }

    @DeleteMapping("/{registroId}")
    public ResponseEntity<Void> deletar(
            @PathVariable UUID projetoId,
            @PathVariable UUID registroId,
            @AuthenticationPrincipal UserDetails principal) {
        service.deletar(projetoId, registroId, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
