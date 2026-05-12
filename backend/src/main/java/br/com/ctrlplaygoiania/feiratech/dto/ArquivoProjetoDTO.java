package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.TipoArquivo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class ArquivoProjetoDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Request {
        @NotBlank(message = "Título é obrigatório")
        private String titulo;

        @NotBlank(message = "URL é obrigatória")
        private String url;

        @NotNull(message = "Tipo é obrigatório")
        private TipoArquivo tipo;

        private String descricao;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private UUID id;
        private UsuarioDTO.Response autor;
        private String titulo;
        private String url;
        private TipoArquivo tipo;
        private String descricao;
        private LocalDateTime createdAt;
    }
}
