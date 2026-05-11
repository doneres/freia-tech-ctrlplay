package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import br.com.ctrlplaygoiania.feiratech.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService relatorioService;
    private final UsuarioRepository usuarioRepository;

    /** MONITOR, COORDENACAO, ADMIN — itens do estoque */
    @GetMapping("/estoque")
    public ResponseEntity<byte[]> estoque() {
        return excel(relatorioService.relatorioEstoque(), "relatorio-estoque.xlsx");
    }

    /** COORDENACAO, ADMIN — todos os projetos */
    @GetMapping("/projetos")
    public ResponseEntity<byte[]> projetos() {
        return excel(relatorioService.relatorioProjetos(), "relatorio-projetos.xlsx");
    }

    /** COORDENACAO, ADMIN — projetos agrupados por instrutor (uma aba por instrutor) */
    @GetMapping("/projetos-por-instrutor")
    public ResponseEntity<byte[]> projetosPorInstrutor() {
        return excel(relatorioService.relatorioProjetosPorInstrutor(), "relatorio-projetos-por-instrutor.xlsx");
    }

    /** COORDENACAO, ADMIN — todas as solicitações de compra */
    @GetMapping("/solicitacoes-compra")
    public ResponseEntity<byte[]> solicitacoesCompra() {
        return excel(relatorioService.relatorioSolicitacoesCompra(), "relatorio-solicitacoes-compra.xlsx");
    }

    /** INSTRUTOR — meus projetos */
    @GetMapping("/meus-projetos")
    public ResponseEntity<byte[]> meusProjetos(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = buscarUsuario(userDetails);
        return excel(relatorioService.relatorioMeusProjetos(usuario.getId()), "relatorio-meus-projetos.xlsx");
    }

    /** INSTRUTOR — minhas solicitações de compra */
    @GetMapping("/minhas-solicitacoes")
    public ResponseEntity<byte[]> minhasSolicitacoes(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = buscarUsuario(userDetails);
        return excel(relatorioService.relatorioMinhasSolicitacoes(usuario.getId()), "relatorio-minhas-solicitacoes.xlsx");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Usuario buscarUsuario(UserDetails userDetails) {
        return usuarioRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado"));
    }

    private ResponseEntity<byte[]> excel(byte[] data, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(data.length)
                .body(data);
    }
}
