package br.com.ctrlplaygoiania.feiratech.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FeiraTech API")
                        .description("Sistema de Gestão da Feira Tecnológica - Ctrl+Play Goiânia")
                        .version("1.0.0"));
    }
}
