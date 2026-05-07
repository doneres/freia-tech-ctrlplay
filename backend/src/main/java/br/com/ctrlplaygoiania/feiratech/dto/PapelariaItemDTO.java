package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class PapelariaItemDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome do item é obrigatório")
        private String nome;

        private String imagemUrl;

        @NotNull(message = "Quantidade é obrigatória")
        @Min(value = 1, message = "Quantidade deve ser no mínimo 1")
        private Integer quantidade;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {
        private UUID id;
        private String nome;
        private String imagemUrl;
        private Integer quantidade;
        private Boolean estoqueSubtraido;
        private ItemEstoqueDTO.Response itemEstoque;
        private StatusCompra statusAquisicao;
        private String justificativaReprovacao;
        private LocalDateTime createdAt;
    }
}
