package br.com.ctrlplaygoiania.feiratech.dto;

import lombok.*;

import java.util.List;

public class AgendaDTO {

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ItemSuperlotado {
        private ItemEstoqueDTO.Response item;
        private int demandaTotal;
        private int disponivel;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ProjetoAgendado {
        private ProjetoDTO.Response projeto;
        private List<String> materiaisConflitantes;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Recomendacao {
        private List<ProjetoAgendado> manha;
        private List<ProjetoAgendado> tarde;
        private List<ProjetoAgendado> naoAlocados;
        private List<ItemSuperlotado> itensSuperlotados;
    }
}
