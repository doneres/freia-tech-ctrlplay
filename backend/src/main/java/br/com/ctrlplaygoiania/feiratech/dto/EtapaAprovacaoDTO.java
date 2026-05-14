package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusEtapaAprovacao;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

public class EtapaAprovacaoDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private UUID id;
        private Integer ordem;
        private String nomeEtapa;
        private String tipo;
        private PerfilUsuario perfilResponsavel;
        private StatusEtapaAprovacao status;
        private String motivo;
        private String dadosAnalise;
        private UsuarioDTO.Response respondidoPor;
        private LocalDateTime respondidoEm;
        private LocalDateTime createdAt;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class RespostaRequest {
        @NotNull(message = "Status é obrigatório")
        private StatusEtapaAprovacao status;
        private String motivo;
        private String dadosAnalise; // JSON string
    }
}
