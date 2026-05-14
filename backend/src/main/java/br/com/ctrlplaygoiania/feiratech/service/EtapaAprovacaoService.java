package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.EtapaAprovacaoDTO;
import br.com.ctrlplaygoiania.feiratech.dto.UsuarioDTO;
import br.com.ctrlplaygoiania.feiratech.event.ProjetoStatusChangedEvent;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.EtapaAprovacao;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusEtapaAprovacao;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.repository.EtapaAprovacaoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EtapaAprovacaoService {

    private final EtapaAprovacaoRepository etapaRepository;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<EtapaAprovacaoDTO.Response> listarPorProjeto(UUID projetoId) {
        return etapaRepository.findByProjetoIdOrderByOrdemAsc(projetoId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void responderEtapa(UUID projetoId, EtapaAprovacaoDTO.RespostaRequest dto, String emailUsuario) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto", projetoId));

        if (projeto.getStatusProjeto() != StatusProjeto.SUBMETIDO) {
            throw new BusinessException("Apenas projetos SUBMETIDOS podem ter etapas respondidas");
        }

        Integer ordemAtual = projeto.getEtapaAtualOrdem();
        if (ordemAtual == null) {
            throw new BusinessException("Este projeto não possui workflow de aprovação ativo");
        }

        EtapaAprovacao etapa = etapaRepository.findByProjetoIdAndOrdem(projetoId, ordemAtual)
                .orElseThrow(() -> new BusinessException("Etapa de aprovação não encontrada para a ordem " + ordemAtual));

        if (etapa.getStatus() != StatusEtapaAprovacao.PENDENTE) {
            throw new BusinessException("Esta etapa já foi respondida");
        }

        Usuario respondente = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new BusinessException("Usuário autenticado não encontrado"));

        if (respondente.getPerfil() != etapa.getPerfilResponsavel()
                && respondente.getPerfil() != PerfilUsuario.ADMINISTRADOR) {
            throw new BusinessException("Você não tem permissão para responder esta etapa de aprovação");
        }

        etapa.setStatus(dto.getStatus());
        etapa.setMotivo(dto.getMotivo());
        etapa.setDadosAnalise(dto.getDadosAnalise());
        etapa.setRespondidoPor(respondente);
        etapa.setRespondidoEm(LocalDateTime.now());
        etapaRepository.save(etapa);

        StatusProjeto statusAnterior = projeto.getStatusProjeto();

        if (dto.getStatus() == StatusEtapaAprovacao.REPROVADO) {
            projeto.setStatusProjeto(StatusProjeto.REPROVADO);
            projeto.setJustificativaReprovacao(dto.getMotivo());
            projetoRepository.save(projeto);

            emailService.notificarProjetoReprovado(
                    projeto.getInstrutor().getEmail(),
                    projeto.getNomeProjeto(),
                    dto.getMotivo() != null ? dto.getMotivo() : "Reprovado na etapa: " + etapa.getNomeEtapa());

            eventPublisher.publishEvent(new ProjetoStatusChangedEvent(
                    this, projeto, statusAnterior, StatusProjeto.REPROVADO, etapa));

        } else {
            // Check if there is a next step
            List<EtapaAprovacao> todasEtapas = etapaRepository.findByProjetoIdOrderByOrdemAsc(projetoId);
            boolean temProxima = todasEtapas.stream()
                    .anyMatch(e -> e.getOrdem() > ordemAtual);

            if (temProxima) {
                int proximaOrdem = todasEtapas.stream()
                        .filter(e -> e.getOrdem() > ordemAtual)
                        .mapToInt(EtapaAprovacao::getOrdem)
                        .min().getAsInt();
                projeto.setEtapaAtualOrdem(proximaOrdem);
                projetoRepository.save(projeto);

                // Notify approvers of the next step
                EtapaAprovacao proxima = etapaRepository
                        .findByProjetoIdAndOrdem(projetoId, proximaOrdem).orElseThrow();
                notificarAprovadoresDaEtapa(projeto, proxima);
            } else {
                projeto.setStatusProjeto(StatusProjeto.APROVADO);
                projetoRepository.save(projeto);

                emailService.notificarProjetoAprovado(
                        projeto.getInstrutor().getEmail(),
                        projeto.getNomeProjeto());

                eventPublisher.publishEvent(new ProjetoStatusChangedEvent(
                        this, projeto, statusAnterior, StatusProjeto.APROVADO, etapa));
            }
        }
    }

    void notificarAprovadoresDaEtapa(Projeto projeto, EtapaAprovacao etapa) {
        usuarioRepository.findByPerfil(etapa.getPerfilResponsavel()).forEach(u ->
                emailService.notificarEtapaAprovacaoPendente(
                        u.getEmail(), projeto.getNomeProjeto(), etapa.getNomeEtapa())
        );
    }

    public EtapaAprovacaoDTO.Response toResponse(EtapaAprovacao e) {
        UsuarioDTO.Response respondidoPorDto = null;
        if (e.getRespondidoPor() != null) {
            Usuario u = e.getRespondidoPor();
            respondidoPorDto = UsuarioDTO.Response.builder()
                    .id(u.getId())
                    .nome(u.getNome())
                    .email(u.getEmail())
                    .perfil(u.getPerfil())
                    .ativo(u.getAtivo())
                    .createdAt(u.getCreatedAt())
                    .build();
        }
        return EtapaAprovacaoDTO.Response.builder()
                .id(e.getId())
                .ordem(e.getOrdem())
                .nomeEtapa(e.getNomeEtapa())
                .tipo(e.getTipo())
                .perfilResponsavel(e.getPerfilResponsavel())
                .status(e.getStatus())
                .motivo(e.getMotivo())
                .dadosAnalise(e.getDadosAnalise())
                .respondidoPor(respondidoPorDto)
                .respondidoEm(e.getRespondidoEm())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
