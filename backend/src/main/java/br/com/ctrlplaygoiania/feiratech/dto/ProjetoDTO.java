package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.NivelTurma;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusSemana;
import br.com.ctrlplaygoiania.feiratech.model.enums.TipoProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.Turno;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ProjetoDTO {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome do projeto é obrigatório")
        private String nomeProjeto;

        @NotNull(message = "Instrutor é obrigatório")
        private UUID instrutorId;

        private UUID eventoId;

        private String codigoTurma;
        private Turno turno;
        private NivelTurma nivelTurma;
        private Integer qtdAlunos;
        private List<String> integrantes;

        // ── Proposta ──────────────────────────────────────────────────────────
        private String ods;
        private String problemaIdentificado;
        private String solucaoProposta;
        private String objetivoProjeto;

        // ── Ferramentas ───────────────────────────────────────────────────────
        private TipoProjeto tipoProjeto;
        private String ferramentaPrincipal;
        private String linguagem;
        private String plataformaPublicacao;
        private String hardware;
        private Integer qtdHardware;
        private String linkProjeto;

        // ── Materiais e Infraestrutura ────────────────────────────────────────
        private String infraNecessaria;
        private BigDecimal custoEstimado;

        // ── Cronograma ────────────────────────────────────────────────────────
        private StatusSemana statusS1;
        private StatusSemana statusS2;
        private StatusSemana statusS3;
        private StatusSemana statusS4;

        // ── Pitch ─────────────────────────────────────────────────────────────
        private String pitchAto1;
        private String pitchAto2;
        private String pitchAto3;
        private Integer duracaoPitch;
        private String formatoDemo;

        // ── Observações ───────────────────────────────────────────────────────
        private String observacoes;

        // ── Ferramentas (novo fluxo) ──────────────────────────────────────────
        private List<UUID> ferramentasSoftwareIds;
        private List<EquipamentoEstoqueRequest> equipamentosEstoque;

        @Valid
        private List<MaterialDTO.Request> materiais;

        // ── Formulário dinâmico ───────────────────────────────────────────────
        private String dadosFormulario; // JSON map of dynamic field answers
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class EquipamentoEstoqueRequest {
        private UUID itemEstoqueId;
        private Integer quantidade;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {

        private UUID id;
        private String nomeProjeto;
        private UsuarioDTO.Response instrutor;
        private EventoDTO.Response evento;
        private StatusProjeto statusProjeto;
        private String justificativaReprovacao;
        private String codigoTurma;
        private Turno turno;
        private NivelTurma nivelTurma;
        private Integer qtdAlunos;
        private List<String> integrantes;

        // ── Proposta ──────────────────────────────────────────────────────────
        private String ods;
        private String problemaIdentificado;
        private String solucaoProposta;
        private String objetivoProjeto;

        // ── Ferramentas ───────────────────────────────────────────────────────
        private TipoProjeto tipoProjeto;
        private String ferramentaPrincipal;
        private String linguagem;
        private String plataformaPublicacao;
        private String hardware;
        private Integer qtdHardware;
        private String linkProjeto;

        // ── Materiais e Infraestrutura ────────────────────────────────────────
        private String infraNecessaria;
        private BigDecimal custoEstimado;

        // ── Cronograma ────────────────────────────────────────────────────────
        private StatusSemana statusS1;
        private StatusSemana statusS2;
        private StatusSemana statusS3;
        private StatusSemana statusS4;

        // ── Pitch ─────────────────────────────────────────────────────────────
        private String pitchAto1;
        private String pitchAto2;
        private String pitchAto3;
        private Integer duracaoPitch;
        private String formatoDemo;

        // ── Observações ───────────────────────────────────────────────────────
        private String observacoes;

        // ── Ferramentas (novo fluxo) ──────────────────────────────────────────
        private List<FerramentaSoftwareDTO.Response> ferramentasSoftware;

        private List<MaterialDTO.Response> materiais;
        private List<PapelariaItemDTO.Response> itensPapelaria;

        // ── Formulário dinâmico e workflow ────────────────────────────────────
        private String dadosFormulario;
        private Integer schemaVersion;
        private Integer etapaAtualOrdem;
        private List<EtapaAprovacaoDTO.Response> etapas;

        private LocalDateTime dataSubmissao;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VincularEventoRequest {
        private UUID eventoId;
    }
}
