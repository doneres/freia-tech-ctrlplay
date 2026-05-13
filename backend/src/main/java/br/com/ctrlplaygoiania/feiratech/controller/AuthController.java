package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.AuthDTO;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import br.com.ctrlplaygoiania.feiratech.security.JwtTokenProvider;
import br.com.ctrlplaygoiania.feiratech.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDTO.LoginResponse>> login(
            @RequestBody AuthDTO.LoginRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha())
        );

        String token = tokenProvider.generateToken(authentication);

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail()).orElseThrow();

        AuthDTO.LoginResponse response = AuthDTO.LoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .perfil(usuario.getPerfil())
                .telefone(usuario.getTelefone())
                .fotoPerfil(usuario.getFotoPerfil())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Login realizado com sucesso", response));
    }

    @PostMapping("/solicitar-reset")
    public ResponseEntity<ApiResponse<Void>> solicitarReset(
            @RequestBody AuthDTO.SolicitarResetRequest request) {
        usuarioService.solicitarReset(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(
                "Se o email estiver cadastrado, você receberá um código em breve.", null));
    }

    @PostMapping("/confirmar-reset")
    public ResponseEntity<ApiResponse<Void>> confirmarReset(
            @RequestBody AuthDTO.ConfirmarResetRequest request) {
        usuarioService.confirmarReset(request.getEmail(), request.getCodigo(), request.getNovaSenha());
        return ResponseEntity.ok(ApiResponse.ok("Senha alterada com sucesso.", null));
    }
}
