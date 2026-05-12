package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.UsuarioDTO;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioDTO.Response>>> listarTodos() {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.listarTodos()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioDTO.Response>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.buscarPorId(id)));
    }

    @GetMapping("/perfil/{perfil}")
    public ResponseEntity<ApiResponse<List<UsuarioDTO.Response>>> listarPorPerfil(
            @PathVariable PerfilUsuario perfil) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.listarPorPerfil(perfil)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioDTO.Response>> criar(
            @RequestBody @Valid UsuarioDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Usuário criado com sucesso", usuarioService.criar(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid UsuarioDTO.AtualizarRequest dto) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        usuarioService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    public ResponseEntity<Void> reativar(@PathVariable UUID id) {
        usuarioService.reativar(id);
        return ResponseEntity.noContent().build();
    }
}
