package br.com.ctrlplaygoiania.feiratech.config;

import br.com.ctrlplaygoiania.feiratech.model.TipoEvento;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.repository.TipoEventoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final TipoEventoRepository tipoEventoRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    // Configure ADMIN_DEFAULT_PASSWORD no .env para sobrescrever o padrão de desenvolvimento
    @Value("${ADMIN_DEFAULT_PASSWORD:ctrlplay2024}")
    private String adminDefaultPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setNome("Admin");
            admin.setEmail("admin@ctrlplay.com.br");
            admin.setSenha(passwordEncoder.encode(adminDefaultPassword));
            admin.setPerfil(PerfilUsuario.ADMINISTRADOR);
            admin.setAtivo(true);
            usuarioRepository.save(admin);
            log.info("Usuário admin criado: admin@ctrlplay.com.br — troque a senha no primeiro acesso.");
        }

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
}
