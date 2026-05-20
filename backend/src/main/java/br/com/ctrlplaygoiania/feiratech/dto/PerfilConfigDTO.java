package br.com.ctrlplaygoiania.feiratech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class PerfilConfigDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 50, message = "Nome deve ter no máximo 50 caracteres")
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Nome deve ser maiúsculo, sem espaços (ex: COMERCIAL, MEU_PERFIL)")
        private String nome;

        @Size(max = 200)
        private String descricao;

        @Size(max = 20)
        private String cor;

        private List<String> permissoes;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private UUID id;
        private String nome;
        private String descricao;
        private Boolean builtin;
        private Boolean ativo;
        private String cor;
        private List<String> permissoes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class PermissoesRequest {
        private List<String> permissoes;
    }
}
