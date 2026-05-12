package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.ForumDTO;
import br.com.ctrlplaygoiania.feiratech.dto.UsuarioDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.PostForum;
import br.com.ctrlplaygoiania.feiratech.model.RespostaForum;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.repository.PostForumRepository;
import br.com.ctrlplaygoiania.feiratech.repository.RespostaForumRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ForumService {

    private final PostForumRepository postRepository;
    private final RespostaForumRepository respostaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<ForumDTO.PostResponse> listarPosts() {
        return postRepository.findAllByOrderByFixadoDescCreatedAtDesc()
                .stream().map(p -> toPostResponse(p, false)).toList();
    }

    @Transactional(readOnly = true)
    public ForumDTO.PostResponse buscarPost(UUID id) {
        PostForum post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));
        return toPostResponse(post, true);
    }

    @Transactional
    public ForumDTO.PostResponse criarPost(String emailAutor, ForumDTO.PostRequest dto) {
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
        PostForum post = new PostForum();
        post.setAutor(autor);
        post.setTitulo(dto.getTitulo());
        post.setConteudo(dto.getConteudo());
        post.setCategoria(dto.getCategoria());
        post.setFixado(false);
        return toPostResponse(postRepository.save(post), false);
    }

    @Transactional
    public ForumDTO.RespostaResponse responder(UUID postId, String emailAutor, ForumDTO.RespostaRequest dto) {
        PostForum post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
        RespostaForum resposta = new RespostaForum();
        resposta.setPost(post);
        resposta.setAutor(autor);
        resposta.setConteudo(dto.getConteudo());
        return toRespostaResponse(respostaRepository.save(resposta));
    }

    @Transactional
    public void deletarPost(UUID id, String emailUsuario) {
        PostForum post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
        boolean isAdmin = usuario.getPerfil() == PerfilUsuario.ADMINISTRADOR;
        boolean isAutor = post.getAutor().getId().equals(usuario.getId());
        if (!isAdmin && !isAutor) {
            throw new BusinessException("Sem permissão para excluir este post");
        }
        postRepository.delete(post);
    }

    @Transactional
    public ForumDTO.PostResponse fixar(UUID id) {
        PostForum post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));
        post.setFixado(!post.getFixado());
        return toPostResponse(postRepository.save(post), false);
    }

    private ForumDTO.PostResponse toPostResponse(PostForum p, boolean includeRespostas) {
        return ForumDTO.PostResponse.builder()
                .id(p.getId())
                .autor(toUsuarioResponse(p.getAutor()))
                .titulo(p.getTitulo())
                .conteudo(p.getConteudo())
                .categoria(p.getCategoria())
                .fixado(p.getFixado())
                .totalRespostas(p.getRespostas().size())
                .respostas(includeRespostas ? p.getRespostas().stream().map(this::toRespostaResponse).toList() : List.of())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private ForumDTO.RespostaResponse toRespostaResponse(RespostaForum r) {
        return ForumDTO.RespostaResponse.builder()
                .id(r.getId())
                .autor(toUsuarioResponse(r.getAutor()))
                .conteudo(r.getConteudo())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private UsuarioDTO.Response toUsuarioResponse(Usuario u) {
        return UsuarioDTO.Response.builder()
                .id(u.getId()).nome(u.getNome()).email(u.getEmail())
                .perfil(u.getPerfil()).ativo(u.getAtivo()).createdAt(u.getCreatedAt())
                .build();
    }
}
