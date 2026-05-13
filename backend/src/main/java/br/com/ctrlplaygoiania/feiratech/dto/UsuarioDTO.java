package br.com.ctrlplaygoiania.feiratech.dto;

import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class UsuarioDTO {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {

        @NotBlank(message = "Nome é obrigatório")
        private String nome;

        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        private String email;

        @NotBlank(message = "Senha é obrigatória")
        @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
        private String senha;

        @NotNull(message = "Perfil é obrigatório")
        private PerfilUsuario perfil;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AtualizarRequest {

        @NotBlank(message = "Nome é obrigatório")
        private String nome;

        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        private String email;

        private String senha;

        @NotNull(message = "Perfil é obrigatório")
        private PerfilUsuario perfil;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MeRequest {

        @NotBlank(message = "Nome é obrigatório")
        private String nome;

        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        private String email;

        private String telefone;

        private String fotoPerfil;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AlterarSenhaRequest {

        @NotBlank(message = "Senha atual é obrigatória")
        private String senhaAtual;

        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = 6, message = "Nova senha deve ter no mínimo 6 caracteres")
        private String novaSenha;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {

        private UUID id;
        private String nome;
        private String email;
        private String telefone;
        private String fotoPerfil;
        private PerfilUsuario perfil;
        private Boolean ativo;
        private LocalDateTime createdAt;
    }
}
