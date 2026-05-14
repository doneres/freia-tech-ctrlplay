package br.com.ctrlplaygoiania.feiratech.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:feiratech@ctrlplay.com.br}")
    private String emailRemetente;

    @Async
    public void notificarProjetoSubmetido(String emailDestinatario, String nomeProjeto, String nomeInstrutor) {
        String assunto = "Novo projeto submetido para revisão: " + nomeProjeto;
        enviar(emailDestinatario, assunto, templateProjetoSubmetido(nomeProjeto, nomeInstrutor));
    }

    @Async
    public void notificarProjetoAprovado(String emailInstrutor, String nomeProjeto) {
        String assunto = "✅ Projeto aprovado: " + nomeProjeto;
        enviar(emailInstrutor, assunto, templateProjetoAprovado(nomeProjeto));
    }

    @Async
    public void notificarProjetoReprovado(String emailInstrutor, String nomeProjeto, String justificativa) {
        String assunto = "❌ Projeto reprovado: " + nomeProjeto;
        enviar(emailInstrutor, assunto, templateProjetoReprovado(nomeProjeto, justificativa));
    }

    @Async
    public void notificarCompraAprovada(String emailInstrutor, String nomeProjeto, String nomeItem) {
        String assunto = "✅ Compra aprovada: " + nomeItem;
        enviar(emailInstrutor, assunto, templateCompraAprovada(nomeProjeto, nomeItem));
    }

    @Async
    public void notificarCompraReprovada(String emailInstrutor, String nomeProjeto, String nomeItem, String justificativa) {
        String assunto = "❌ Compra reprovada: " + nomeItem;
        enviar(emailInstrutor, assunto, templateCompraReprovada(nomeProjeto, nomeItem, justificativa));
    }

    @Async
    public void notificarCodigoReset(String emailDestinatario, String nomeUsuario, String codigo) {
        String assunto = "Código para redefinição de senha — FeiraTech";
        enviar(emailDestinatario, assunto, templateCodigoReset(nomeUsuario, codigo));
    }

    @Async
    public void notificarSolicitacaoCompra(String emailCoordenacao, String nomeProjeto, String nomeItem) {
        String assunto = "Nova solicitação de compra: " + nomeItem;
        enviar(emailCoordenacao, assunto, templateSolicitacaoCompra(nomeProjeto, nomeItem));
    }

    @Async
    public void notificarEtapaAprovacaoPendente(String emailAprovador, String nomeProjeto, String nomeEtapa) {
        String assunto = "Projeto aguardando sua análise: " + nomeProjeto;
        enviar(emailAprovador, assunto, templateEtapaAprovacaoPendente(nomeProjeto, nomeEtapa));
    }

    private void enviar(String para, String assunto, String corpo) {
        if (mailSender == null) {
            log.debug("JavaMailSender não configurado — email para {} ignorado", para);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(emailRemetente);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(corpo, true);
            mailSender.send(message);
            log.info("Email enviado para {}: {}", para, assunto);
        } catch (Exception e) {
            log.warn("Falha ao enviar email para {}: {}", para, e.getMessage());
        }
    }

    // ── Templates ────────────────────────────────────────────────────────────

    private String templateProjetoSubmetido(String nomeProjeto, String nomeInstrutor) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#7c3aed;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <h2 style="font-size:18px">Novo projeto para revisão</h2>
              <p>O instrutor <strong>%s</strong> submeteu o projeto <strong>"%s"</strong> para aprovação.</p>
              <p>Acesse o sistema para avaliar o projeto.</p>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeInstrutor, nomeProjeto);
    }

    private String templateProjetoAprovado(String nomeProjeto) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#7c3aed;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;margin-bottom:24px">
                <h2 style="color:#166534;margin:0 0 8px">✅ Projeto Aprovado!</h2>
                <p style="margin:0">Seu projeto <strong>"%s"</strong> foi aprovado pela coordenação.</p>
              </div>
              <p>Você já pode avançar para a fase de execução. Boa sorte na Feira Tech!</p>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeProjeto);
    }

    private String templateProjetoReprovado(String nomeProjeto, String justificativa) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#7c3aed;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:16px;margin-bottom:24px">
                <h2 style="color:#991b1b;margin:0 0 8px">❌ Projeto Reprovado</h2>
                <p style="margin:0">Seu projeto <strong>"%s"</strong> foi reprovado pela coordenação.</p>
              </div>
              <h3>Justificativa:</h3>
              <p style="background:#f9fafb;padding:12px;border-radius:4px;border-left:4px solid #e5e7eb">%s</p>
              <p>Revise seu projeto com base no feedback e submeta novamente.</p>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeProjeto, justificativa);
    }

    private String templateCompraAprovada(String nomeProjeto, String nomeItem) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#7c3aed;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;margin-bottom:24px">
                <h2 style="color:#166534;margin:0 0 8px">✅ Compra Aprovada!</h2>
                <p style="margin:0">A compra do item <strong>"%s"</strong> do projeto <strong>"%s"</strong> foi aprovada.</p>
              </div>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeItem, nomeProjeto);
    }

    private String templateSolicitacaoCompra(String nomeProjeto, String nomeItem) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #ea580c;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#ea580c;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <h2 style="font-size:18px">Nova Solicitação de Compra</h2>
              <p>O projeto <strong>"%s"</strong> gerou uma solicitação de compra para o item <strong>"%s"</strong>.</p>
              <p>Acesse o sistema para avaliar a solicitação.</p>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeProjeto, nomeItem);
    }

    private String templateCodigoReset(String nomeUsuario, String codigo) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#7c3aed;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <h2 style="font-size:18px">Redefinição de senha</h2>
              <p>Olá, <strong>%s</strong>. Recebemos uma solicitação de redefinição de senha para a sua conta.</p>
              <p>Use o código abaixo para redefinir sua senha. Ele é válido por <strong>15 minutos</strong>.</p>
              <div style="text-align:center;margin:32px 0">
                <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#7c3aed;background:#f5f3ff;padding:16px 24px;border-radius:8px;border:2px solid #7c3aed">%s</span>
              </div>
              <p style="color:#6b7280;font-size:13px">Se você não solicitou a redefinição de senha, ignore este email. Sua senha não será alterada.</p>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeUsuario, codigo);
    }

    private String templateEtapaAprovacaoPendente(String nomeProjeto, String nomeEtapa) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#7c3aed;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:16px;margin-bottom:24px">
                <h2 style="color:#1e40af;margin:0 0 8px">Projeto aguardando sua análise</h2>
                <p style="margin:0">O projeto <strong>"%s"</strong> chegou na etapa <strong>"%s"</strong> e aguarda sua avaliação.</p>
              </div>
              <p>Acesse o sistema para analisar e responder a esta etapa.</p>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeProjeto, nomeEtapa);
    }

    private String templateCompraReprovada(String nomeProjeto, String nomeItem, String justificativa) {
        return """
            <html><body style="font-family:sans-serif;color:#1f2937;padding:24px">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
              <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
                <h1 style="color:#7c3aed;margin:0;font-size:22px">Ctrl+Play — Feira Tech</h1>
              </div>
              <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:16px;margin-bottom:24px">
                <h2 style="color:#991b1b;margin:0 0 8px">❌ Compra Reprovada</h2>
                <p style="margin:0">A compra do item <strong>"%s"</strong> do projeto <strong>"%s"</strong> foi reprovada.</p>
              </div>
              <h3>Justificativa:</h3>
              <p style="background:#f9fafb;padding:12px;border-radius:4px;border-left:4px solid #e5e7eb">%s</p>
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                Ctrl+Play Goiânia — Sistema de Gestão da Feira Tecnológica
              </div>
            </div></body></html>
            """.formatted(nomeItem, nomeProjeto, justificativa);
    }
}
