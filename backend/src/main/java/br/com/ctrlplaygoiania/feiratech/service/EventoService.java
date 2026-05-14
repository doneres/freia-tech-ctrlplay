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

    @Transactional(readOnly = true)
    public List<EventoDTO.Response> listarComSubmissaoAberta() {
        return eventoRepository.findComSubmissaoAberta(LocalDateTime.now())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public EventoDTO.Response criar(EventoDTO.Request dto) {
        Evento evento = new Evento();
        mapRequestToEvento(dto, evento);
        return toResponse(eventoRepository.save(evento));
    }

    @Transactional
    public EventoDTO.Response atualizar(UUID id, EventoDTO.Request dto) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento", id));
        mapRequestToEvento(dto, evento);
        return toResponse(eventoRepository.save(evento));
    }

    @Transactional
    public void deletar(UUID id) {
        if (!eventoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Evento", id);
        }
        eventoRepository.deleteById(id);
    }

    public EventoDTO.Response toResponse(Evento e) {
        LocalDateTime agora = LocalDateTime.now();
        boolean aberta = e.getDataInicioSubmissao() != null
                && !e.getDataInicioSubmissao().isAfter(agora)
                && (e.getDataFimSubmissao() == null || !e.getDataFimSubmissao().isBefore(agora));

        return EventoDTO.Response.builder()
                .id(e.getId())
                .nome(e.getNome())
                .dataEvento(e.getDataEvento())
                .dataInicioSubmissao(e.getDataInicioSubmissao())
                .dataFimSubmissao(e.getDataFimSubmissao())
                .descricao(e.getDescricao())
                .submissaoAberta(aberta)
                .localEvento(e.getLocalEvento())
                .qtdMesas(e.getQtdMesas())
                .qtdComputadores(e.getQtdComputadores())
                .qtdCelularesTablets(e.getQtdCelularesTablets())
                .qtdSalas(e.getQtdSalas())
                .qtdProjetores(e.getQtdProjetores())
                .capacidadePorTurno(e.getCapacidadePorTurno())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private void mapRequestToEvento(EventoDTO.Request dto, Evento evento) {
        evento.setNome(dto.getNome());
        evento.setDataEvento(dto.getDataEvento());
        evento.setDataInicioSubmissao(dto.getDataInicioSubmissao());
        evento.setDataFimSubmissao(dto.getDataFimSubmissao());
        evento.setDescricao(dto.getDescricao());
        evento.setLocalEvento(dto.getLocalEvento());
        evento.setQtdMesas(dto.getQtdMesas());
        evento.setQtdComputadores(dto.getQtdComputadores());
        evento.setQtdCelularesTablets(dto.getQtdCelularesTablets());
        evento.setQtdSalas(dto.getQtdSalas());
        evento.setQtdProjetores(dto.getQtdProjetores());
        evento.setCapacidadePorTurno(dto.getCapacidadePorTurno());
    }
}
