package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.TipoItemEstoque;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class ItemEstoqueDTO {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome é obrigatório")
        private String nome;

        private String descricao;

        @NotNull(message = "Tipo é obrigatório")
        private TipoItemEstoque tipo;

        private String categoria;
        private String marca;
        private String modelo;

        @NotNull(message = "Quantidade total é obrigatória")
        @Min(value = 0, message = "Quantidade não pode ser negativa")
        private Integer quantidadeTotal;

        private String imagemUrl;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {

        private UUID id;
        private String nome;
        private String descricao;
        private TipoItemEstoque tipo;
        private String categoria;
        private String marca;
        private String modelo;
        private Integer quantidadeTotal;
        private Integer quantidadeDisponivel;
        private String imagemUrl;
        private Boolean ativo;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
