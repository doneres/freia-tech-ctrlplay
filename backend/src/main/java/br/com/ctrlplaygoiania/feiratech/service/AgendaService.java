package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.AgendaDTO;
import br.com.ctrlplaygoiania.feiratech.model.Evento;
import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.Material;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.Turno;
import br.com.ctrlplaygoiania.feiratech.repository.EventoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgendaService {

    private final ProjetoRepository projetoRepository;
    private final ProjetoService projetoService;
    private final ItemEstoqueService itemEstoqueService;
    private final EventoRepository eventoRepository;

    @Transactional(readOnly = true)
    public AgendaDTO.Recomendacao gerarRecomendacao() {
        // 1. Somente projetos APROVADOS aparecem na agenda
        List<Projeto> projetos = projetoRepository.findAll().stream()
                .filter(p -> p.getStatusProjeto() == StatusProjeto.APROVADO)
                .collect(Collectors.toList());

        // 2. Busca o próximo evento para obter capacidade configurada
        Optional<Evento> proxEvento = eventoRepository
                .findTopByDataEventoAfterOrderByDataEventoAsc(LocalDateTime.now());
        Integer capacidadePorTurno = proxEvento.map(e -> {
            if (e.getCapacidadePorTurno() != null) return e.getCapacidadePorTurno();
            if (e.getQtdMesas() != null) return e.getQtdMesas();
            return null;
        }).orElse(null);
        Integer qtdComputadores = proxEvento.map(Evento::getQtdComputadores).orElse(null);
        Integer qtdMesas = proxEvento.map(Evento::getQtdMesas).orElse(null);

        // 3. Build demand map for inventory-based conflict detection
        Map<UUID, Integer> demandaTotal = new HashMap<>();
        Map<UUID, Map<UUID, Integer>> demandaPorProjeto = new HashMap<>();
        Map<UUID, ItemEstoque> itemById = new HashMap<>();

        for (Projeto p : projetos) {
            Map<UUID, Integer> projetoDemand = new HashMap<>();
            for (Material m : p.getMateriais()) {
                if (m.getItemEstoque() != null) {
                    UUID itemId = m.getItemEstoque().getId();
                    itemById.put(itemId, m.getItemEstoque());
                    int qty = m.getQuantidade();
                    demandaTotal.merge(itemId, qty, Integer::sum);
                    projetoDemand.merge(itemId, qty, Integer::sum);
                }
            }
            demandaPorProjeto.put(p.getId(), projetoDemand);
        }

        // 4. Identify oversubscribed items
        Set<UUID> superlotados = new HashSet<>();
        List<AgendaDTO.ItemSuperlotado> itensSuperlotados = new ArrayList<>();
        for (Map.Entry<UUID, Integer> entry : demandaTotal.entrySet()) {
            UUID itemId = entry.getKey();
            ItemEstoque item = itemById.get(itemId);
            if (item != null && entry.getValue() > item.getQuantidadeTotal()) {
                superlotados.add(itemId);
                itensSuperlotados.add(AgendaDTO.ItemSuperlotado.builder()
                        .item(itemEstoqueService.toResponse(item))
                        .demandaTotal(entry.getValue())
                        .disponivel(item.getQuantidadeTotal())
                        .build());
            }
        }

        // 5. Sort: prefer turno (MANHA first, then TARDE, then NOITE/null),
        //    then most constrained (most superlotados) first
        projetos.sort((a, b) -> {
            int turnoA = turnoOrdem(a.getTurno());
            int turnoB = turnoOrdem(b.getTurno());
            if (turnoA != turnoB) return Integer.compare(turnoA, turnoB);
            long countA = demandaPorProjeto.getOrDefault(a.getId(), Map.of()).keySet().stream()
                    .filter(superlotados::contains).count();
            long countB = demandaPorProjeto.getOrDefault(b.getId(), Map.of()).keySet().stream()
                    .filter(superlotados::contains).count();
            return Long.compare(countB, countA);
        });

        List<AgendaDTO.ProjetoAgendado> manha = new ArrayList<>();
        List<AgendaDTO.ProjetoAgendado> tarde = new ArrayList<>();
        List<AgendaDTO.ProjetoAgendado> naoAlocados = new ArrayList<>();

        if (capacidadePorTurno != null) {
            // Allocation based on event capacity (number of tables/computers per slot)
            alocarPorCapacidade(projetos, demandaPorProjeto, superlotados, itemById,
                    capacidadePorTurno, manha, tarde, naoAlocados);
        } else {
            // Fallback: inventory-based bin packing
            alocarPorEstoque(projetos, demandaPorProjeto, superlotados, itemById,
                    manha, tarde, naoAlocados);
        }

        return AgendaDTO.Recomendacao.builder()
                .manha(manha)
                .tarde(tarde)
                .naoAlocados(naoAlocados)
                .itensSuperlotados(itensSuperlotados)
                .capacidadePorTurno(capacidadePorTurno)
                .qtdComputadores(qtdComputadores)
                .qtdMesas(qtdMesas)
                .build();
    }

    private void alocarPorCapacidade(
            List<Projeto> projetos,
            Map<UUID, Map<UUID, Integer>> demandaPorProjeto,
            Set<UUID> superlotados,
            Map<UUID, ItemEstoque> itemById,
            int capacidade,
            List<AgendaDTO.ProjetoAgendado> manha,
            List<AgendaDTO.ProjetoAgendado> tarde,
            List<AgendaDTO.ProjetoAgendado> naoAlocados) {

        for (Projeto p : projetos) {
            Map<UUID, Integer> demand = demandaPorProjeto.getOrDefault(p.getId(), Map.of());
            List<String> conflitos = buildConflitos(demand, superlotados, itemById);
            AgendaDTO.ProjetoAgendado agendado = AgendaDTO.ProjetoAgendado.builder()
                    .projeto(projetoService.buscarPorId(p.getId()))
                    .materiaisConflitantes(conflitos)
                    .build();

            Turno turno = p.getTurno();
            boolean prefereManha = turno == null || turno == Turno.MANHA;
            boolean prefereTarde = turno == Turno.TARDE;

            if (prefereManha && manha.size() < capacidade) {
                manha.add(agendado);
            } else if (prefereTarde && tarde.size() < capacidade) {
                tarde.add(agendado);
            } else if (manha.size() < capacidade) {
                manha.add(agendado);
            } else if (tarde.size() < capacidade) {
                tarde.add(agendado);
            } else {
                naoAlocados.add(agendado);
            }
        }
    }

    private void alocarPorEstoque(
            List<Projeto> projetos,
            Map<UUID, Map<UUID, Integer>> demandaPorProjeto,
            Set<UUID> superlotados,
            Map<UUID, ItemEstoque> itemById,
            List<AgendaDTO.ProjetoAgendado> manha,
            List<AgendaDTO.ProjetoAgendado> tarde,
            List<AgendaDTO.ProjetoAgendado> naoAlocados) {

        Map<UUID, Integer> usadoManha = new HashMap<>();
        Map<UUID, Integer> usadoTarde = new HashMap<>();

        for (Projeto p : projetos) {
            Map<UUID, Integer> demand = demandaPorProjeto.getOrDefault(p.getId(), Map.of());
            List<String> conflitos = buildConflitos(demand, superlotados, itemById);
            AgendaDTO.ProjetoAgendado agendado = AgendaDTO.ProjetoAgendado.builder()
                    .projeto(projetoService.buscarPorId(p.getId()))
                    .materiaisConflitantes(conflitos)
                    .build();

            if (cabemNo(demand, superlotados, usadoManha, itemById)) {
                demand.forEach((itemId, qty) -> {
                    if (superlotados.contains(itemId)) usadoManha.merge(itemId, qty, Integer::sum);
                });
                manha.add(agendado);
            } else if (cabemNo(demand, superlotados, usadoTarde, itemById)) {
                demand.forEach((itemId, qty) -> {
                    if (superlotados.contains(itemId)) usadoTarde.merge(itemId, qty, Integer::sum);
                });
                tarde.add(agendado);
            } else {
                naoAlocados.add(agendado);
            }
        }
    }

    private List<String> buildConflitos(Map<UUID, Integer> demand, Set<UUID> superlotados, Map<UUID, ItemEstoque> itemById) {
        return demand.entrySet().stream()
                .filter(e -> superlotados.contains(e.getKey()))
                .map(e -> itemById.get(e.getKey()).getNome())
                .collect(Collectors.toList());
    }

    private int turnoOrdem(Turno turno) {
        if (turno == null || turno == Turno.MANHA) return 0;
        if (turno == Turno.TARDE) return 1;
        return 2;
    }

    private boolean cabemNo(Map<UUID, Integer> demand, Set<UUID> superlotados,
                             Map<UUID, Integer> usado, Map<UUID, ItemEstoque> itemById) {
        for (Map.Entry<UUID, Integer> e : demand.entrySet()) {
            UUID itemId = e.getKey();
            if (!superlotados.contains(itemId)) continue;
            ItemEstoque item = itemById.get(itemId);
            if (item == null) continue;
            int current = usado.getOrDefault(itemId, 0);
            if (current + e.getValue() > item.getQuantidadeTotal()) return false;
        }
        return true;
    }
}
