package br.com.ctrlplaygoiania.feiratech.controller;

import br.com.ctrlplaygoiania.feiratech.dto.ApiResponse;
import br.com.ctrlplaygoiania.feiratech.dto.AuthDTO;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import br.com.ctrlplaygoiania.feiratech.security.JwtTokenProvider;
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
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Login realizado com sucesso", response));
    }
}
