package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class ProjetoHistoricoDTO {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {
        private UUID id;
        private StatusProjeto statusAnterior;
        private StatusProjeto statusNovo;
        private String descricao;
        private String justificativa;
        private String nomeUsuario;
        private LocalDateTime createdAt;
    }
}
