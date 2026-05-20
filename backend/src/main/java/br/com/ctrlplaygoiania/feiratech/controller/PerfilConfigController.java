package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.PerfilConfigDTO;
import br.com.ctrlplaygoiania.feiratech.service.PerfilConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/perfis")
@RequiredArgsConstructor
public class PerfilConfigController {

    private final PerfilConfigService perfilConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PerfilConfigDTO.Response>>> listarTodos() {
        return ResponseEntity.ok(ApiResponse.ok(perfilConfigService.listarTodos()));
    }

    @GetMapping("/ativos")
    public ResponseEntity<ApiResponse<List<PerfilConfigDTO.Response>>> listarAtivos() {
        return ResponseEntity.ok(ApiResponse.ok(perfilConfigService.listarAtivos()));
    }

    @GetMapping("/permissoes-disponiveis")
    public ResponseEntity<ApiResponse<List<String>>> permissoesDisponiveis() {
        return ResponseEntity.ok(ApiResponse.ok(PerfilConfigService.todasPermissoesDisponiveis()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PerfilConfigDTO.Response>> criar(
            @RequestBody @Valid PerfilConfigDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Perfil criado com sucesso", perfilConfigService.criar(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PerfilConfigDTO.Response>> atualizar(
            @PathVariable UUID id,
            @RequestBody @Valid PerfilConfigDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(perfilConfigService.atualizar(id, dto)));
    }

    @PutMapping("/{id}/permissoes")
    public ResponseEntity<ApiResponse<Void>> atualizarPermissoes(
            @PathVariable UUID id,
            @RequestBody PerfilConfigDTO.PermissoesRequest dto) {
        perfilConfigService.atualizarPermissoes(id, dto.getPermissoes());
        return ResponseEntity.ok(ApiResponse.ok("Permissões atualizadas", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        perfilConfigService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/desativar")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        perfilConfigService.desativar(id);
        return ResponseEntity.noContent().build();
    }
}
