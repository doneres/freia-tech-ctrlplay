package br.com.ctrlplaygoiania.feiratech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class EventoDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Request {
        @NotBlank(message = "Nome do evento é obrigatório")
        private String nome;

        @NotNull(message = "Data do evento é obrigatória")
        private LocalDateTime dataEvento;

        private LocalDateTime dataInicioSubmissao;
        private LocalDateTime dataFimSubmissao;
        private String descricao;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private UUID id;
        private String nome;
        private LocalDateTime dataEvento;
        private LocalDateTime dataInicioSubmissao;
        private LocalDateTime dataFimSubmissao;
        private String descricao;
        private boolean submissaoAberta;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
