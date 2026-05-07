package br.com.ctrlplaygoiania.feiratech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class FerramentaSoftwareDTO {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome é obrigatório")
        private String nome;

        private String categoria;
        private String descricao;
        private String imagemUrl;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {

        private UUID id;
        private String nome;
        private String categoria;
        private String descricao;
        private String imagemUrl;
        private Boolean ativo;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
