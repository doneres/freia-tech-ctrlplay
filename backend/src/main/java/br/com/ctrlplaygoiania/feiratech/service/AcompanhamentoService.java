package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.RegistroAcompanhamentoDTO;
import br.com.ctrlplaygoiania.feiratech.dto.UsuarioDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.RegistroAcompanhamento;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.RegistroAcompanhamentoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AcompanhamentoService {

    private final RegistroAcompanhamentoRepository acompanhamentoRepository;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<RegistroAcompanhamentoDTO.Response> listar(UUID projetoId) {
        return acompanhamentoRepository.findByProjetoIdOrderByCreatedAtDesc(projetoId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public RegistroAcompanhamentoDTO.Response criar(UUID projetoId, String emailAutor, RegistroAcompanhamentoDTO.Request dto) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto", projetoId));
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));

        RegistroAcompanhamento registro = new RegistroAcompanhamento();
        registro.setProjeto(projeto);
        registro.setAutor(autor);
        registro.setFase(dto.getFase());
        registro.setTitulo(dto.getTitulo());
        registro.setDescricao(dto.getDescricao());
        registro.setSemana(dto.getSemana());

        return toResponse(acompanhamentoRepository.save(registro));
    }

    @Transactional
    public void deletar(UUID projetoId, UUID registroId, String emailUsuario) {
        RegistroAcompanhamento registro = acompanhamentoRepository.findById(registroId)
                .orElseThrow(() -> new ResourceNotFoundException("Registro", registroId));
        if (!registro.getProjeto().getId().equals(projetoId)) {
            throw new BusinessException("Registro não pertence a este projeto");
        }
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado"));
        boolean isAdmin = usuario.getPerfil() == PerfilUsuario.ADMINISTRADOR;
        boolean isAutor = registro.getAutor().getId().equals(usuario.getId());
        if (!isAdmin && !isAutor) {
            throw new BusinessException("Sem permissão para excluir este registro");
        }
        acompanhamentoRepository.delete(registro);
    }

    private RegistroAcompanhamentoDTO.Response toResponse(RegistroAcompanhamento r) {
        Usuario autor = r.getAutor();
        return RegistroAcompanhamentoDTO.Response.builder()
                .id(r.getId())
                .autor(UsuarioDTO.Response.builder()
                        .id(autor.getId()).nome(autor.getNome()).email(autor.getEmail())
                        .perfil(autor.getPerfil()).ativo(autor.getAtivo()).createdAt(autor.getCreatedAt())
                        .build())
                .fase(r.getFase())
                .titulo(r.getTitulo())
                .descricao(r.getDescricao())
                .semana(r.getSemana())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
