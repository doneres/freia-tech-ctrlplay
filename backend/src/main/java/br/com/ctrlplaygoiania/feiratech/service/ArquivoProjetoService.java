package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.ArquivoProjetoDTO;
import br.com.ctrlplaygoiania.feiratech.dto.UsuarioDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.ArquivoProjeto;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.repository.ArquivoProjetoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArquivoProjetoService {

    private final ArquivoProjetoRepository arquivoRepository;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<ArquivoProjetoDTO.Response> listar(UUID projetoId) {
        return arquivoRepository.findByProjetoIdOrderByCreatedAtDesc(projetoId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ArquivoProjetoDTO.Response criar(UUID projetoId, String emailAutor, ArquivoProjetoDTO.Request dto) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto", projetoId));
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));

        ArquivoProjeto arquivo = new ArquivoProjeto();
        arquivo.setProjeto(projeto);
        arquivo.setAutor(autor);
        arquivo.setTitulo(dto.getTitulo());
        arquivo.setUrl(dto.getUrl());
        arquivo.setTipo(dto.getTipo());
        arquivo.setDescricao(dto.getDescricao());

        return toResponse(arquivoRepository.save(arquivo));
    }

    @Transactional
    public void deletar(UUID projetoId, UUID arquivoId, String emailUsuario) {
        ArquivoProjeto arquivo = arquivoRepository.findById(arquivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Arquivo", arquivoId));
        if (!arquivo.getProjeto().getId().equals(projetoId)) {
            throw new BusinessException("Arquivo não pertence a este projeto");
        }
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
        boolean isAdmin = usuario.getPerfil() == PerfilUsuario.ADMINISTRADOR;
        boolean isAutor = arquivo.getAutor().getId().equals(usuario.getId());
        if (!isAdmin && !isAutor) {
            throw new BusinessException("Sem permissão para excluir este arquivo");
        }
        arquivoRepository.delete(arquivo);
    }

    private ArquivoProjetoDTO.Response toResponse(ArquivoProjeto a) {
        Usuario autor = a.getAutor();
        return ArquivoProjetoDTO.Response.builder()
                .id(a.getId())
                .autor(UsuarioDTO.Response.builder()
                        .id(autor.getId()).nome(autor.getNome()).email(autor.getEmail())
                        .perfil(autor.getPerfil()).ativo(autor.getAtivo()).createdAt(autor.getCreatedAt())
                        .build())
                .titulo(a.getTitulo())
                .url(a.getUrl())
                .tipo(a.getTipo())
                .descricao(a.getDescricao())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
