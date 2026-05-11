package br.com.ctrlplaygoiania.feiratech.config;

import br.com.ctrlplaygoiania.feiratech.security.JwtAuthenticationFilter;
import br.com.ctrlplaygoiania.feiratech.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    // Em produção defina CORS_ALLOWED_ORIGINS com a origem exata do frontend, ex: https://feiratech.ctrlplay.com.br
    @Value("${CORS_ALLOWED_ORIGINS:*}")
    private String corsAllowedOrigins;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**")
                        .permitAll()
                        // Gestão de usuários: somente ADMINISTRADOR pode escrever
                        .requestMatchers(HttpMethod.POST, "/api/usuarios").hasAuthority("ROLE_ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/**").hasAuthority("ROLE_ADMINISTRADOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/usuarios/**").hasAuthority("ROLE_ADMINISTRADOR")
                        // Estoque: ADMINISTRADOR, COORDENACAO e MONITOR podem escrever
                        .requestMatchers(HttpMethod.POST, "/api/estoque/**").hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO", "ROLE_MONITOR")
                        .requestMatchers(HttpMethod.PUT, "/api/estoque/**").hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO", "ROLE_MONITOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/estoque/**").hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO", "ROLE_MONITOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/estoque/**").hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO", "ROLE_MONITOR")
                        // Ferramentas software: somente ADMINISTRADOR pode escrever
                        .requestMatchers(HttpMethod.POST, "/api/ferramentas-software/**").hasAuthority("ROLE_ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/api/ferramentas-software/**").hasAuthority("ROLE_ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/ferramentas-software/**").hasAuthority("ROLE_ADMINISTRADOR")
                        // Relatórios: acesso restrito por perfil
                        .requestMatchers(HttpMethod.GET, "/api/relatorios/estoque")
                            .hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO", "ROLE_MONITOR")
                        .requestMatchers(HttpMethod.GET, "/api/relatorios/projetos")
                            .hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO")
                        .requestMatchers(HttpMethod.GET, "/api/relatorios/projetos-por-instrutor")
                            .hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO")
                        .requestMatchers(HttpMethod.GET, "/api/relatorios/solicitacoes-compra")
                            .hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_COORDENACAO")
                        .requestMatchers(HttpMethod.GET, "/api/relatorios/meus-projetos")
                            .hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_INSTRUTOR")
                        .requestMatchers(HttpMethod.GET, "/api/relatorios/minhas-solicitacoes")
                            .hasAnyAuthority("ROLE_ADMINISTRADOR", "ROLE_INSTRUTOR")
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.asList(corsAllowedOrigins.split(","));
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
