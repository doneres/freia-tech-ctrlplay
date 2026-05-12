package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.CategoriaForum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ForumDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class PostRequest {
        @NotBlank(message = "Título é obrigatório")
        private String titulo;

        @NotBlank(message = "Conteúdo é obrigatório")
        private String conteudo;

        @NotNull(message = "Categoria é obrigatória")
        private CategoriaForum categoria;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class RespostaRequest {
        @NotBlank(message = "Conteúdo é obrigatório")
        private String conteudo;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class RespostaResponse {
        private UUID id;
        private UsuarioDTO.Response autor;
        private String conteudo;
        private LocalDateTime createdAt;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class PostResponse {
        private UUID id;
        private UsuarioDTO.Response autor;
        private String titulo;
        private String conteudo;
        private CategoriaForum categoria;
        private Boolean fixado;
        private int totalRespostas;
        private List<RespostaResponse> respostas;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
