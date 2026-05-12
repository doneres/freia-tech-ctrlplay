package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.EventoDTO;
import br.com.ctrlplaygoiania.feiratech.service.EventoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService eventoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventoDTO.Response>>> listarTodos() {
        return ResponseEntity.ok(ApiResponse.ok(eventoService.listarTodos()));
    }

    @GetMapping("/proximo")
    public ResponseEntity<ApiResponse<EventoDTO.Response>> buscarProximo() {
        return eventoService.buscarProximo()
                .map(e -> ResponseEntity.ok(ApiResponse.ok(e)))
                .orElse(ResponseEntity.ok(ApiResponse.ok(null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventoDTO.Response>> criar(@RequestBody @Valid EventoDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Evento criado com sucesso", eventoService.criar(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventoDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid EventoDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(eventoService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        eventoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
