package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.EventoDTO;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.Evento;
import br.com.ctrlplaygoiania.feiratech.repository.EventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;

    @Transactional(readOnly = true)
    public List<EventoDTO.Response> listarTodos() {
        return eventoRepository.findAllByOrderByDataEventoDesc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Optional<EventoDTO.Response> buscarProximo() {
        return eventoRepository
                .findTopByDataEventoAfterOrderByDataEventoAsc(LocalDateTime.now())
                .map(this::toResponse);
    }

    @Transactional
    public EventoDTO.Response criar(EventoDTO.Request dto) {
        Evento evento = new Evento();
        evento.setNome(dto.getNome());
        evento.setDataEvento(dto.getDataEvento());
        evento.setDescricao(dto.getDescricao());
        return toResponse(eventoRepository.save(evento));
    }

    @Transactional
    public EventoDTO.Response atualizar(UUID id, EventoDTO.Request dto) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", id));
        evento.setNome(dto.getNome());
        evento.setDataEvento(dto.getDataEvento());
        evento.setDescricao(dto.getDescricao());
        return toResponse(eventoRepository.save(evento));
    }

    @Transactional
    public void deletar(UUID id) {
        if (!eventoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Evento", id);
        }
        eventoRepository.deleteById(id);
    }

    private EventoDTO.Response toResponse(Evento e) {
        return EventoDTO.Response.builder()
                .id(e.getId())
                .nome(e.getNome())
                .dataEvento(e.getDataEvento())
                .descricao(e.getDescricao())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
