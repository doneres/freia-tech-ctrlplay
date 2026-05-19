package br.com.ctrlplaygoiania.feiratech.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final String INSECURE_DEFAULT =
            "feiratech-ctrlplay-goiania-secret-key-2024-jwt-secure-token-system-v1";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                "[SECURITY] JWT_SECRET não configurado. " +
                "Defina a variável JWT_SECRET no arquivo backend/.env. " +
                "Gere um valor seguro com: openssl rand -base64 32");
        }
        if (jwtSecret.equals(INSECURE_DEFAULT)) {
            throw new IllegalStateException(
                "[SECURITY] JWT_SECRET padrão detectado! " +
                "Este secret está exposto no código-fonte e permite forjar tokens. " +
                "Defina JWT_SECRET no backend/.env com um valor único. " +
                "Gere com: openssl rand -base64 32");
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException(
                "[SECURITY] JWT_SECRET muito curto (mínimo 32 caracteres). " +
                "Gere com: openssl rand -base64 32");
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        UserDetails user = (UserDetails) authentication.getPrincipal();
        return buildToken(user.getUsername());
    }

    public String generateToken(String email) {
        return buildToken(email);
    }

    private String buildToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
