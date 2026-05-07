package br.com.ctrlplaygoiania.feiratech.config;

import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setNome("Admin");
            admin.setEmail("admin@ctrlplay.com.br");
            admin.setSenha(passwordEncoder.encode("ctrlplay2024"));
            admin.setPerfil(PerfilUsuario.ADMINISTRADOR);
            admin.setAtivo(true);
            usuarioRepository.save(admin);
            log.info("Usuário admin criado: admin@ctrlplay.com.br / ctrlplay2024");
        }
    }
}
