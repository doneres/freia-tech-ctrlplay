package br.com.ctrlplaygoiania.feiratech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class TipoEventoDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Request {
        @NotBlank(message = "Nome é obrigatório")
        private String nome;
        private String descricao;
        private String icone;
        private String cor;
        private String formSchema;
        private String workflowConfig;
        private Boolean usaFormularioLegado;
        private Boolean ativo;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private UUID id;
        private String nome;
        private String descricao;
        private String icone;
        private String cor;
        private String formSchema;
        private String workflowConfig;
        private Integer schemaVersion;
        private Boolean usaFormularioLegado;
        private Boolean ativo;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // Slim projection used inside EventoDTO to avoid bloating projeto responses
    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Resumo {
        private UUID id;
        private String nome;
        private String icone;
        private String cor;
        private String formSchema;
        private String workflowConfig;
        private Integer schemaVersion;
        private Boolean usaFormularioLegado;
    }
}
