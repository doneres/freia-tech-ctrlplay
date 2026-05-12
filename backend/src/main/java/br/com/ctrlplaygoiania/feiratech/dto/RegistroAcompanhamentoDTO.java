package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.FaseDesignThinking;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class RegistroAcompanhamentoDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Request {
        @NotNull(message = "Fase é obrigatória")
        private FaseDesignThinking fase;

        @NotBlank(message = "Título é obrigatório")
        private String titulo;

        @NotBlank(message = "Descrição é obrigatória")
        private String descricao;

        private Integer semana;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private UUID id;
        private UsuarioDTO.Response autor;
        private FaseDesignThinking fase;
        private String titulo;
        private String descricao;
        private Integer semana;
        private LocalDateTime createdAt;
    }
}
