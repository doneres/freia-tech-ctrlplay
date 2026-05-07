package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

public class AuthDTO {

    @Data
    public static class LoginRequest {
        private String email;
        private String senha;
    }

    @Data
    @Builder
    public static class LoginResponse {
        private String token;
        private String tipo;
        private UUID id;
        private String nome;
        private String email;
        private PerfilUsuario perfil;
    }
}
