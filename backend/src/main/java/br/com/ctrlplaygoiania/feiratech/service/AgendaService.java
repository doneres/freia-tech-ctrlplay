package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.AgendaDTO;
import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.Material;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgendaService {

    private final ProjetoRepository projetoRepository;
    private final ProjetoService projetoService;
    private final ItemEstoqueService itemEstoqueService;

    @Transactional(readOnly = true)
    public AgendaDTO.Recomendacao gerarRecomendacao() {
        // 1. Load relevant projects
        List<StatusProjeto> statusRelevantes = List.of(
                StatusProjeto.SUBMETIDO, StatusProjeto.APROVADO, StatusProjeto.EM_ANDAMENTO);
        List<Projeto> projetos = projetoRepository.findAll().stream()
                .filter(p -> statusRelevantes.contains(p.getStatusProjeto()))
                .collect(Collectors.toList());

        // 2. Build demand map: itemId -> total demand across all projects
        // Also build per-project demand: projetoId -> {itemId -> quantidade}
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

        // 3. Find oversubscribed items
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

        // 4. Sort projects: most constrained first (most oversubscribed items used)
        projetos.sort((a, b) -> {
            long countA = demandaPorProjeto.getOrDefault(a.getId(), Map.of()).keySet().stream()
                    .filter(superlotados::contains).count();
            long countB = demandaPorProjeto.getOrDefault(b.getId(), Map.of()).keySet().stream()
                    .filter(superlotados::contains).count();
            return Long.compare(countB, countA);
        });

        // 5. Greedy bin packing
        Map<UUID, Integer> usadoManha = new HashMap<>();
        Map<UUID, Integer> usadoTarde = new HashMap<>();
        List<AgendaDTO.ProjetoAgendado> manha = new ArrayList<>();
        List<AgendaDTO.ProjetoAgendado> tarde = new ArrayList<>();
        List<AgendaDTO.ProjetoAgendado> naoAlocados = new ArrayList<>();

        for (Projeto p : projetos) {
            Map<UUID, Integer> demand = demandaPorProjeto.getOrDefault(p.getId(), Map.of());
            List<String> conflitos = demand.entrySet().stream()
                    .filter(e -> superlotados.contains(e.getKey()))
                    .map(e -> itemById.get(e.getKey()).getNome())
                    .collect(Collectors.toList());

            AgendaDTO.ProjetoAgendado agendado = AgendaDTO.ProjetoAgendado.builder()
                    .projeto(projetoService.buscarPorId(p.getId()))
                    .materiaisConflitantes(conflitos)
                    .build();

            // Try morning slot
            if (cabemNo(demand, superlotados, usadoManha, itemById)) {
                demand.forEach((itemId, qty) -> {
                    if (superlotados.contains(itemId)) usadoManha.merge(itemId, qty, Integer::sum);
                });
                manha.add(agendado);
            // Try afternoon slot
            } else if (cabemNo(demand, superlotados, usadoTarde, itemById)) {
                demand.forEach((itemId, qty) -> {
                    if (superlotados.contains(itemId)) usadoTarde.merge(itemId, qty, Integer::sum);
                });
                tarde.add(agendado);
            } else {
                naoAlocados.add(agendado);
            }
        }

        return AgendaDTO.Recomendacao.builder()
                .manha(manha)
                .tarde(tarde)
                .naoAlocados(naoAlocados)
                .itensSuperlotados(itensSuperlotados)
                .build();
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
