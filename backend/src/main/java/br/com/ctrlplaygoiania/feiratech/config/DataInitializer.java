package br.com.ctrlplaygoiania.feiratech.config;

import br.com.ctrlplaygoiania.feiratech.model.PerfilConfig;
import br.com.ctrlplaygoiania.feiratech.model.PerfilPermissao;
import br.com.ctrlplaygoiania.feiratech.model.TipoEvento;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.repository.PerfilConfigRepository;
import br.com.ctrlplaygoiania.feiratech.repository.PerfilPermissaoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.TipoEventoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final TipoEventoRepository tipoEventoRepository;
    private final PerfilConfigRepository perfilConfigRepository;
    private final PerfilPermissaoRepository perfilPermissaoRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${ADMIN_DEFAULT_PASSWORD:ctrlplay2024}")
    private String adminDefaultPassword;

    private static final Map<String, List<String>> PERFIS_BUILTIN = Map.of(
        "ADMINISTRADOR", List.of(
            "VER_PROJETOS", "CRIAR_PROJETO", "EDITAR_PROJETO", "EXCLUIR_PROJETO",
            "SUBMETER_PROJETO", "APROVAR_PROJETO", "REPROVAR_PROJETO",
            "INICIAR_ANDAMENTO_PROJETO", "CONCLUIR_PROJETO", "RESPONDER_ETAPA_APROVACAO",
            "VER_USUARIOS", "CRIAR_USUARIO", "EDITAR_USUARIO", "DESATIVAR_USUARIO",
            "VER_ESTOQUE", "CRIAR_ESTOQUE", "EDITAR_ESTOQUE", "EXCLUIR_ESTOQUE",
            "VER_SOLICITACOES", "APROVAR_MATERIAL",
            "VER_FERRAMENTAS", "GERENCIAR_FERRAMENTAS",
            "VER_EVENTOS", "GERENCIAR_EVENTOS",
            "VER_TIPOS_EVENTO", "GERENCIAR_TIPOS_EVENTO",
            "VER_RELATORIOS_ESTOQUE", "VER_RELATORIOS_PROJETOS", "VER_RELATORIOS_PROPRIOS",
            "VER_FORUM", "CRIAR_POST_FORUM", "FIXAR_POST_FORUM",
            "VER_AGENDA", "GERENCIAR_PERFIS"
        ),
        "COORDENACAO", List.of(
            "VER_PROJETOS", "EDITAR_PROJETO",
            "APROVAR_PROJETO", "REPROVAR_PROJETO",
            "INICIAR_ANDAMENTO_PROJETO", "CONCLUIR_PROJETO", "RESPONDER_ETAPA_APROVACAO",
            "VER_USUARIOS",
            "VER_ESTOQUE", "CRIAR_ESTOQUE", "EDITAR_ESTOQUE", "EXCLUIR_ESTOQUE",
            "VER_SOLICITACOES", "APROVAR_MATERIAL",
            "VER_FERRAMENTAS",
            "VER_EVENTOS", "GERENCIAR_EVENTOS",
            "VER_TIPOS_EVENTO", "GERENCIAR_TIPOS_EVENTO",
            "VER_RELATORIOS_ESTOQUE", "VER_RELATORIOS_PROJETOS", "VER_RELATORIOS_PROPRIOS",
            "VER_FORUM", "CRIAR_POST_FORUM",
            "VER_AGENDA"
        ),
        "INSTRUTOR", List.of(
            "VER_PROJETOS", "CRIAR_PROJETO", "EDITAR_PROJETO", "SUBMETER_PROJETO",
            "VER_ESTOQUE",
            "VER_FERRAMENTAS",
            "VER_EVENTOS", "VER_TIPOS_EVENTO",
            "VER_RELATORIOS_PROPRIOS",
            "VER_FORUM", "CRIAR_POST_FORUM",
            "VER_AGENDA"
        ),
        "MONITOR", List.of(
            "VER_PROJETOS",
            "VER_ESTOQUE", "CRIAR_ESTOQUE", "EDITAR_ESTOQUE", "EXCLUIR_ESTOQUE",
            "VER_FERRAMENTAS",
            "VER_RELATORIOS_ESTOQUE",
            "VER_FORUM", "CRIAR_POST_FORUM",
            "VER_AGENDA"
        ),
        "COMERCIAL", List.of(
            "VER_PROJETOS",
            "RESPONDER_ETAPA_APROVACAO",
            "VER_EVENTOS", "VER_TIPOS_EVENTO",
            "VER_FORUM",
            "VER_AGENDA"
        )
    );

    private static final Map<String, String> CORES_BUILTIN = Map.of(
        "ADMINISTRADOR", "#7c3aed",
        "COORDENACAO", "#059669",
        "INSTRUTOR", "#2563eb",
        "MONITOR", "#d97706",
        "COMERCIAL", "#db2777"
    );

    @Override
    public void run(ApplicationArguments args) {
        seedPerfis();
        seedAdmin();
        seedTipoEvento();
    }

    private void seedPerfis() {
        PERFIS_BUILTIN.forEach((nome, permissoes) -> {
            if (!perfilConfigRepository.existsByNome(nome)) {
                PerfilConfig perfil = new PerfilConfig();
                perfil.setNome(nome);
                perfil.setBuiltin(true);
                perfil.setAtivo(true);
                perfil.setCor(CORES_BUILTIN.getOrDefault(nome, "#6b7280"));
                perfil.setDescricao(descricaoBuiltin(nome));
                perfilConfigRepository.save(perfil);

                permissoes.forEach(p -> {
                    PerfilPermissao pp = new PerfilPermissao();
                    pp.setPerfilNome(nome);
                    pp.setPermissao(p);
                    perfilPermissaoRepository.save(pp);
                });
                log.info("Perfil '{}' criado com {} permissões.", nome, permissoes.size());
            }
        });
    }

    private void seedAdmin() {
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setNome("Admin");
            admin.setEmail("admin@ctrlplay.com.br");
            admin.setSenha(passwordEncoder.encode(adminDefaultPassword));
            admin.setPerfil("ADMINISTRADOR");
            admin.setAtivo(true);
            usuarioRepository.save(admin);
            log.info("Usuário admin criado: admin@ctrlplay.com.br — troque a senha no primeiro acesso.");
        }
    }

    private void seedTipoEvento() {
        if (tipoEventoRepository.count() == 0) {
            TipoEvento fairaTech = new TipoEvento();
            fairaTech.setNome("Feira Tecnológica");
            fairaTech.setDescricao("Evento anual de exposição de projetos tecnológicos dos alunos");
            fairaTech.setIcone("Trophy");
            fairaTech.setCor("#7c3aed");
            fairaTech.setUsaFormularioLegado(true);
            fairaTech.setAtivo(true);
            tipoEventoRepository.save(fairaTech);
            log.info("TipoEvento 'Feira Tecnológica' criado com formulário legado.");
        }
    }

    private String descricaoBuiltin(String nome) {
        return switch (nome) {
            case "ADMINISTRADOR" -> "Acesso total ao sistema";
            case "COORDENACAO"   -> "Coordenação pedagógica — aprova projetos e gerencia estoque";
            case "INSTRUTOR"     -> "Instrutor — cria e gerencia seus próprios projetos";
            case "MONITOR"       -> "Monitor — acompanha projetos e gerencia estoque";
            case "COMERCIAL"     -> "Equipe comercial — responde etapas de aprovação comercial";
            default -> null;
        };
    }
}
