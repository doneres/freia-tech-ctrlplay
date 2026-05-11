package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class MaterialDTO {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome do item é obrigatório")
        private String item;

        @NotNull(message = "Quantidade é obrigatória")
        @Min(value = 1, message = "Quantidade deve ser no mínimo 1")
        private Integer quantidade;

        private String unidade;
        private BigDecimal custoUnitario;
        private String imagemUrl;

        @Valid
        @Size(max = 3, message = "Material pode ter no máximo 3 links")
        private List<LinkCompraDTO.Request> links;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {

        private UUID id;
        private String item;
        private Integer quantidade;
        private String unidade;
        private BigDecimal custoUnitario;
        private BigDecimal custoTotal;
        private StatusCompra statusCompra;
        private Boolean estoqueSubtraido;
        private String imagemUrl;
        private String justificativaReprovacao;
        private List<LinkCompraDTO.Response> links;
        private ItemEstoqueDTO.Response itemEstoque;
        private LocalDateTime createdAt;
    }
}
