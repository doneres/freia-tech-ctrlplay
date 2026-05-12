package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.ForumDTO;
import br.com.ctrlplaygoiania.feiratech.service.ForumService;
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
@RequestMapping("/api/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ForumDTO.PostResponse>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(service.listarPosts()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumDTO.PostResponse>> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.buscarPost(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ForumDTO.PostResponse>> criar(
            @RequestBody @Valid ForumDTO.PostRequest dto,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.criarPost(principal.getUsername(), dto)));
    }

    @PostMapping("/{id}/respostas")
    public ResponseEntity<ApiResponse<ForumDTO.RespostaResponse>> responder(
            @PathVariable UUID id,
            @RequestBody @Valid ForumDTO.RespostaRequest dto,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.responder(id, principal.getUsername(), dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable UUID id, @AuthenticationPrincipal UserDetails principal) {
        service.deletarPost(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/fixar")
    public ResponseEntity<ApiResponse<ForumDTO.PostResponse>> fixar(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.fixar(id)));
    }
}
