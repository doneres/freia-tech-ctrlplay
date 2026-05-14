package br.com.ctrlplaygoiania.feiratech.event;

import br.com.ctrlplaygoiania.feiratech.model.EtapaAprovacao;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ProjetoStatusChangedEvent extends ApplicationEvent {

    private final Projeto projeto;
    private final StatusProjeto statusAnterior;
    private final StatusProjeto statusNovo;
    private final EtapaAprovacao etapa; // null when not a workflow transition

    public ProjetoStatusChangedEvent(Object source, Projeto projeto,
                                     StatusProjeto statusAnterior, StatusProjeto statusNovo,
                                     EtapaAprovacao etapa) {
        super(source);
        this.projeto = projeto;
        this.statusAnterior = statusAnterior;
        this.statusNovo = statusNovo;
        this.etapa = etapa;
    }
}
