package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.TipoEventoDTO;
import br.com.ctrlplaygoiania.feiratech.service.TipoEventoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tipos-evento")
@RequiredArgsConstructor
public class TipoEventoController {

    private final TipoEventoService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TipoEventoDTO.Response>>> listarTodos() {
        return ResponseEntity.ok(ApiResponse.ok(service.listarTodos()));
    }

    @GetMapping("/ativos")
    public ResponseEntity<ApiResponse<List<TipoEventoDTO.Response>>> listarAtivos() {
        return ResponseEntity.ok(ApiResponse.ok(service.listarAtivos()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoEventoDTO.Response>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TipoEventoDTO.Response>> criar(
            @RequestBody @Valid TipoEventoDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tipo de evento criado com sucesso", service.criar(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TipoEventoDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid TipoEventoDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(service.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
