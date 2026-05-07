package br.com.ctrlplaygoiania.feiratech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;
import java.util.UUID;

public class LinkCompraDTO {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome do site é obrigatório")
        @Size(max = 100, message = "Nome do site deve ter no máximo 100 caracteres")
        private String nomeSite;

        @NotBlank(message = "URL é obrigatória")
        @URL(message = "URL inválida")
        private String url;

        private BigDecimal valorEncontrado;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {

        private UUID id;
        private String nomeSite;
        private String url;
        private BigDecimal valorEncontrado;
    }
}
