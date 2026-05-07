package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.FerramentaSoftwareDTO;
import br.com.ctrlplaygoiania.feiratech.service.FerramentaSoftwareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ferramentas-software")
@RequiredArgsConstructor
public class FerramentaSoftwareController {

    private final FerramentaSoftwareService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FerramentaSoftwareDTO.Response>>> listar(
            @RequestParam(defaultValue = "true") boolean apenasAtivas) {
        return ResponseEntity.ok(ApiResponse.ok(service.listar(apenasAtivas)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FerramentaSoftwareDTO.Response>> criar(
            @RequestBody @Valid FerramentaSoftwareDTO.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Ferramenta criada com sucesso", service.criar(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FerramentaSoftwareDTO.Response>> atualizar(
            @PathVariable UUID id, @RequestBody @Valid FerramentaSoftwareDTO.Request dto) {
        return ResponseEntity.ok(ApiResponse.ok(service.atualizar(id, dto)));
    }

    @PatchMapping("/{id}/desativar")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        service.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    public ResponseEntity<ApiResponse<FerramentaSoftwareDTO.Response>> reativar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.reativar(id)));
    }
}
