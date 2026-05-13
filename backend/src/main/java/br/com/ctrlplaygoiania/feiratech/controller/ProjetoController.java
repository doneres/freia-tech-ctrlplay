package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.ProjetoDTO;
import br.com.ctrlplaygoiania.feiratech.model.enums.NivelTurma;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusSemana;
import br.com.ctrlplaygoiania.feiratech.model.enums.Turno;
import br.com.ctrlplaygoiania.feiratech.service.ProjetoService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projetos")
@RequiredArgsConstructor
public class ProjetoController {

    private final ProjetoService projetoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjetoDTO.Response>>> listarTodos(
            @RequestParam(required = false) UUID instrutorId,
            @RequestParam(required = false) Turno turno,
            @RequestParam(required = false) NivelTurma nivelTurma,
            @RequestParam(required = false) StatusSemana statusS4,
            @RequestParam(required = false) StatusProjeto statusProjeto,
            @RequestParam(required = false) UUID eventoId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID itemEstoqueId) {
        return ResponseEntity.ok(ApiResponse.ok(
                projetoService.listarTodos(instrutorId, turno, nivelTurma, statusS4, statusProjeto, eventoId, search, itemEstoqueId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(projetoService.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> criar(
            @RequestBody @Valid ProjetoDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Projeto criado com sucesso", projetoService.criar(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid ProjetoDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(projetoService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id, @AuthenticationPrincipal UserDetails principal) {
        projetoService.deletar(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/submeter")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> submeter(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(projetoService.submeter(id)));
    }

    @PatchMapping("/{id}/aprovar")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> aprovar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(projetoService.aprovar(id)));
    }

    @PatchMapping("/{id}/reprovar")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> reprovar(
            @PathVariable UUID id, @RequestBody ReprovacaoRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                projetoService.reprovar(id, request.getJustificativa())));
    }

    @PatchMapping("/{id}/iniciar-andamento")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> iniciarAndamento(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(projetoService.iniciarAndamento(id)));
    }

    @PatchMapping("/{id}/concluir")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> concluir(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(projetoService.concluir(id)));
    }

    @PatchMapping("/{id}/status-semana")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> atualizarStatusSemana(
            @PathVariable UUID id, @RequestBody StatusSemanaRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                projetoService.atualizarStatusSemana(id, request.getSemana(), request.getStatus())));
    }

    @PatchMapping("/{id}/vincular-evento")
    public ResponseEntity<ApiResponse<ProjetoDTO.Response>> vincularEvento(
            @PathVariable UUID id,
            @RequestBody ProjetoDTO.VincularEventoRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                projetoService.vincularEvento(id, request.getEventoId(), principal.getUsername())));
    }

    // ── Request bodies dos endpoints PATCH ───────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReprovacaoRequest {
        private String justificativa;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusSemanaRequest {
        private String semana;
        private StatusSemana status;
    }
}
