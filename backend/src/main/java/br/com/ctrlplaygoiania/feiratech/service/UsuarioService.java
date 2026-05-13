package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.UsuarioDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<UsuarioDTO.Response> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioDTO.Response buscarPorId(UUID id) {
        return toResponse(buscarEntidadePorId(id));
    }

    @Transactional(readOnly = true)
    public UsuarioDTO.Response buscarPorEmail(String email) {
        return toResponse(usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + email)));
    }

    @Transactional
    public UsuarioDTO.Response criar(UsuarioDTO.Request dto) {
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessException("Email já cadastrado: " + dto.getEmail());
        }
        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        usuario.setPerfil(dto.getPerfil());
        usuario.setAtivo(true);
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDTO.Response atualizar(UUID id, UsuarioDTO.AtualizarRequest dto) {
        Usuario usuario = buscarEntidadePorId(id);
        if (!usuario.getEmail().equals(dto.getEmail()) && usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessException("Email já cadastrado: " + dto.getEmail());
        }
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            if (dto.getSenha().length() < 6) {
                throw new BusinessException("Senha deve ter no mínimo 6 caracteres");
            }
            usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        }
        usuario.setPerfil(dto.getPerfil());
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDTO.Response atualizarMeuPerfil(String emailAutenticado, UsuarioDTO.MeRequest dto) {
        Usuario usuario = usuarioRepository.findByEmail(emailAutenticado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + emailAutenticado));
        if (!usuario.getEmail().equals(dto.getEmail()) && usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessException("Email já cadastrado: " + dto.getEmail());
        }
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefone(dto.getTelefone());
        if (dto.getFotoPerfil() != null) {
            usuario.setFotoPerfil(dto.getFotoPerfil());
        }
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void alterarMinhaSenha(String emailAutenticado, UsuarioDTO.AlterarSenhaRequest dto) {
        Usuario usuario = usuarioRepository.findByEmail(emailAutenticado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + emailAutenticado));
        if (!passwordEncoder.matches(dto.getSenhaAtual(), usuario.getSenha())) {
            throw new BusinessException("Senha atual incorreta");
        }
        usuario.setSenha(passwordEncoder.encode(dto.getNovaSenha()));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void desativar(UUID id) {
        Usuario usuario = buscarEntidadePorId(id);
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void reativar(UUID id) {
        Usuario usuario = buscarEntidadePorId(id);
        usuario.setAtivo(true);
        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO.Response> listarPorPerfil(PerfilUsuario perfil) {
        return usuarioRepository.findByPerfil(perfil).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void solicitarReset(String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return;
        Usuario usuario = opt.get();
        String codigo = String.format("%06d", new Random().nextInt(1_000_000));
        usuario.setResetCode(codigo);
        usuario.setResetCodeExpiry(LocalDateTime.now().plusMinutes(15));
        usuarioRepository.save(usuario);
        emailService.notificarCodigoReset(email, usuario.getNome(), codigo);
    }

    @Transactional
    public void confirmarReset(String email, String codigo, String novaSenha) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Código inválido ou expirado"));
        if (usuario.getResetCode() == null || !usuario.getResetCode().equals(codigo)) {
            throw new BusinessException("Código inválido ou expirado");
        }
        if (LocalDateTime.now().isAfter(usuario.getResetCodeExpiry())) {
            throw new BusinessException("Código expirado. Solicite um novo.");
        }
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setResetCode(null);
        usuario.setResetCodeExpiry(null);
        usuarioRepository.save(usuario);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private Usuario buscarEntidadePorId(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", id));
    }

    private UsuarioDTO.Response toResponse(Usuario usuario) {
        return UsuarioDTO.Response.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .telefone(usuario.getTelefone())
                .fotoPerfil(usuario.getFotoPerfil())
                .perfil(usuario.getPerfil())
                .ativo(usuario.getAtivo())
                .createdAt(usuario.getCreatedAt())
                .build();
    }
}
