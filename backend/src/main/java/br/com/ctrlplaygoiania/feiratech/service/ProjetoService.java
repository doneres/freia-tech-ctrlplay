package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.dto.FerramentaSoftwareDTO;
import br.com.ctrlplaygoiania.feiratech.dto.ItemEstoqueDTO;
import br.com.ctrlplaygoiania.feiratech.dto.LinkCompraDTO;
import br.com.ctrlplaygoiania.feiratech.dto.MaterialDTO;
import br.com.ctrlplaygoiania.feiratech.dto.PapelariaItemDTO;
import br.com.ctrlplaygoiania.feiratech.dto.ProjetoDTO;
import br.com.ctrlplaygoiania.feiratech.dto.UsuarioDTO;
import br.com.ctrlplaygoiania.feiratech.exception.BusinessException;
import br.com.ctrlplaygoiania.feiratech.exception.ResourceNotFoundException;
import br.com.ctrlplaygoiania.feiratech.model.FerramentaSoftware;
import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.LinkCompra;
import br.com.ctrlplaygoiania.feiratech.model.Material;
import br.com.ctrlplaygoiania.feiratech.model.PapelariaItem;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.Usuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.NivelTurma;
import br.com.ctrlplaygoiania.feiratech.model.enums.PerfilUsuario;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusProjeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusSemana;
import br.com.ctrlplaygoiania.feiratech.model.enums.Turno;
import br.com.ctrlplaygoiania.feiratech.repository.FerramentaSoftwareRepository;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import br.com.ctrlplaygoiania.feiratech.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjetoService {

    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final FerramentaSoftwareRepository ferramentaSoftwareRepository;
    private final ItemEstoqueService itemEstoqueService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<ProjetoDTO.Response> listarTodos(
            UUID instrutorId, Turno turno, NivelTurma nivelTurma,
            StatusSemana statusS4, StatusProjeto statusProjeto, String search) {
        return projetoRepository
                .buscarComFiltros(instrutorId, turno, nivelTurma, statusS4, statusProjeto, search)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjetoDTO.Response buscarPorId(UUID id) {
        return toResponse(buscarEntidadePorId(id));
    }

    @Transactional
    public ProjetoDTO.Response criar(ProjetoDTO.Request dto) {
        Usuario instrutor = buscarInstrutor(dto.getInstrutorId());

        Projeto projeto = new Projeto();
        mapRequestToProjeto(dto, projeto);
        projeto.setInstrutor(instrutor);
        projeto.setStatusProjeto(StatusProjeto.RASCUNHO);

        if (dto.getMateriais() != null) {
            dto.getMateriais().stream()
                    .map(m -> toMaterialEntity(m, projeto))
                    .forEach(projeto.getMateriais()::add);
        }

        if (dto.getFerramentasSoftwareIds() != null && !dto.getFerramentasSoftwareIds().isEmpty()) {
            List<FerramentaSoftware> ferramentas = ferramentaSoftwareRepository
                    .findAllById(dto.getFerramentasSoftwareIds());
            projeto.setFerramentasSoftware(new ArrayList<>(ferramentas));
        }

        if (dto.getEquipamentosEstoque() != null) {
            for (ProjetoDTO.EquipamentoEstoqueRequest eq : dto.getEquipamentosEstoque()) {
                projeto.getMateriais().add(criarMaterialDoEstoque(eq.getItemEstoqueId(), eq.getQuantidade(), projeto));
            }
        }

        return toResponse(projetoRepository.save(projeto));
    }

    @Transactional
    public ProjetoDTO.Response atualizar(UUID id, ProjetoDTO.Request dto) {
        Projeto projeto = buscarEntidadePorId(id);

        if (projeto.getStatusProjeto() == StatusProjeto.APROVADO
                || projeto.getStatusProjeto() == StatusProjeto.CONCLUIDO) {
            throw new BusinessException(
                    "Projeto com status " + projeto.getStatusProjeto() + " não pode ser editado");
        }

        // Projeto reprovado volta a RASCUNHO ao ser editado para poder ser submetido novamente
        if (projeto.getStatusProjeto() == StatusProjeto.REPROVADO) {
            projeto.setStatusProjeto(StatusProjeto.RASCUNHO);
            projeto.setJustificativaReprovacao(null);
        }

        mapRequestToProjeto(dto, projeto);
        projeto.setInstrutor(buscarInstrutor(dto.getInstrutorId()));

        if (dto.getFerramentasSoftwareIds() != null) {
            List<FerramentaSoftware> ferramentas = ferramentaSoftwareRepository
                    .findAllById(dto.getFerramentasSoftwareIds());
            projeto.setFerramentasSoftware(new ArrayList<>(ferramentas));
        }

        if (dto.getMateriais() != null) {
            projeto.getMateriais().clear();
            dto.getMateriais().stream()
                    .map(m -> toMaterialEntity(m, projeto))
                    .forEach(projeto.getMateriais()::add);
        }

        return toResponse(projetoRepository.save(projeto));
    }

    @Transactional
    public ProjetoDTO.Response submeter(UUID id) {
        Projeto projeto = buscarEntidadePorId(id);

        if (projeto.getStatusProjeto() != StatusProjeto.RASCUNHO
                && projeto.getStatusProjeto() != StatusProjeto.REPROVADO) {
            throw new BusinessException("Apenas projetos em RASCUNHO ou REPROVADO podem ser submetidos");
        }
        if (projeto.getNomeProjeto() == null || projeto.getNomeProjeto().isBlank()) {
            throw new BusinessException("Nome do projeto é obrigatório para submeter");
        }
        if (projeto.getOds() == null || projeto.getOds().isBlank()) {
            throw new BusinessException("ODS é obrigatório para submeter");
        }

        projeto.setStatusProjeto(StatusProjeto.SUBMETIDO);
        Projeto salvo = projetoRepository.save(projeto);

        String nomeInstrutor = projeto.getInstrutor().getNome();
        String nomeProjeto = projeto.getNomeProjeto();
        usuarioRepository.findByPerfil(PerfilUsuario.COORDENACAO).forEach(coord ->
                emailService.notificarProjetoSubmetido(coord.getEmail(), nomeProjeto, nomeInstrutor)
        );

        return toResponse(salvo);
    }

    @Transactional
    public ProjetoDTO.Response aprovar(UUID id) {
        Projeto projeto = buscarEntidadePorId(id);

        if (projeto.getStatusProjeto() != StatusProjeto.SUBMETIDO) {
            throw new BusinessException("Apenas projetos SUBMETIDOS podem ser aprovados");
        }

        projeto.setStatusProjeto(StatusProjeto.APROVADO);
        Projeto salvo = projetoRepository.save(projeto);

        emailService.notificarProjetoAprovado(
                projeto.getInstrutor().getEmail(), projeto.getNomeProjeto());

        return toResponse(salvo);
    }

    @Transactional
    public ProjetoDTO.Response reprovar(UUID id, String justificativa) {
        if (justificativa == null || justificativa.isBlank()) {
            throw new BusinessException("Justificativa é obrigatória para reprovar um projeto");
        }

        Projeto projeto = buscarEntidadePorId(id);

        if (projeto.getStatusProjeto() != StatusProjeto.SUBMETIDO) {
            throw new BusinessException("Apenas projetos SUBMETIDOS podem ser reprovados");
        }

        projeto.setStatusProjeto(StatusProjeto.REPROVADO);
        projeto.setJustificativaReprovacao(justificativa);

        projeto.getMateriais().stream()
                .filter(m -> m.getStatusCompra() == StatusCompra.AGUARDANDO_APROVACAO)
                .forEach(m -> m.setStatusCompra(StatusCompra.A_COMPRAR));

        projeto.getItensPapelaria().stream()
                .filter(p -> p.getStatusAquisicao() == StatusCompra.AGUARDANDO_APROVACAO)
                .forEach(p -> p.setStatusAquisicao(StatusCompra.A_COMPRAR));

        Projeto salvo = projetoRepository.save(projeto);

        emailService.notificarProjetoReprovado(
                projeto.getInstrutor().getEmail(), projeto.getNomeProjeto(), justificativa);

        return toResponse(salvo);
    }

    @Transactional
    public ProjetoDTO.Response atualizarStatusSemana(UUID id, String semana, StatusSemana status) {
        Projeto projeto = buscarEntidadePorId(id);

        switch (semana.toUpperCase()) {
            case "S1" -> projeto.setStatusS1(status);
            case "S2" -> projeto.setStatusS2(status);
            case "S3" -> projeto.setStatusS3(status);
            case "S4" -> projeto.setStatusS4(status);
            default -> throw new BusinessException(
                    "Semana inválida: '" + semana + "'. Use S1, S2, S3 ou S4");
        }

        return toResponse(projetoRepository.save(projeto));
    }

    @Transactional
    public void deletar(UUID id, String emailUsuario) {
        Projeto projeto = buscarEntidadePorId(id);
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new BusinessException("Usuário autenticado não encontrado"));

        if (usuario.getPerfil() == PerfilUsuario.ADMINISTRADOR) {
            // admin pode excluir qualquer projeto
        } else if (usuario.getPerfil() == PerfilUsuario.INSTRUTOR) {
            if (!projeto.getInstrutor().getId().equals(usuario.getId())) {
                throw new BusinessException("Você não tem permissão para excluir este projeto");
            }
            if (projeto.getStatusProjeto() != StatusProjeto.RASCUNHO) {
                throw new BusinessException("Apenas projetos em RASCUNHO podem ser excluídos");
            }
        } else {
            throw new BusinessException("Você não tem permissão para excluir projetos");
        }

        projeto.getMateriais().stream()
                .filter(m -> Boolean.TRUE.equals(m.getEstoqueSubtraido()) && m.getItemEstoque() != null)
                .forEach(m -> {
                    ItemEstoque item = m.getItemEstoque();
                    item.setQuantidadeDisponivel(item.getQuantidadeDisponivel() + m.getQuantidade());
                    itemEstoqueService.salvar(item);
                });

        projetoRepository.delete(projeto);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private Material criarMaterialDoEstoque(UUID itemEstoqueId, int quantidade, Projeto projeto) {
        ItemEstoque itemEstoque = itemEstoqueService.buscarEntidade(itemEstoqueId);

        if (!itemEstoque.getAtivo()) {
            throw new BusinessException("Item '" + itemEstoque.getNome() + "' não está ativo no estoque");
        }
        if (itemEstoque.getQuantidadeDisponivel() < quantidade) {
            throw new BusinessException(
                    "Estoque insuficiente para '" + itemEstoque.getNome() +
                    "'. Disponível: " + itemEstoque.getQuantidadeDisponivel());
        }

        itemEstoque.setQuantidadeDisponivel(itemEstoque.getQuantidadeDisponivel() - quantidade);
        itemEstoqueService.salvar(itemEstoque);

        Material material = new Material();
        material.setProjeto(projeto);
        material.setItemEstoque(itemEstoque);
        material.setItem(itemEstoque.getNome());
        material.setQuantidade(quantidade);
        material.setStatusCompra(StatusCompra.DISPONIVEL_ESCOLA);
        material.setEstoqueSubtraido(true);
        return material;
    }

    private Projeto buscarEntidadePorId(UUID id) {
        return projetoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto", id));
    }

    private Usuario buscarInstrutor(UUID instrutorId) {
        Usuario instrutor = usuarioRepository.findById(instrutorId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", instrutorId));
        if (instrutor.getPerfil() != PerfilUsuario.INSTRUTOR) {
            throw new BusinessException("Apenas instrutores podem ser vinculados a projetos");
        }
        return instrutor;
    }

    private void mapRequestToProjeto(ProjetoDTO.Request dto, Projeto projeto) {
        projeto.setNomeProjeto(dto.getNomeProjeto());
        projeto.setCodigoTurma(dto.getCodigoTurma());
        projeto.setTurno(dto.getTurno());
        projeto.setNivelTurma(dto.getNivelTurma());
        projeto.setQtdAlunos(dto.getQtdAlunos());
        projeto.setIntegrantes(dto.getIntegrantes() != null ? dto.getIntegrantes() : new ArrayList<>());
        projeto.setOds(dto.getOds());
        projeto.setProblemaIdentificado(dto.getProblemaIdentificado());
        projeto.setSolucaoProposta(dto.getSolucaoProposta());
        projeto.setObjetivoProjeto(dto.getObjetivoProjeto());
        projeto.setTipoProjeto(dto.getTipoProjeto());
        projeto.setFerramentaPrincipal(dto.getFerramentaPrincipal());
        projeto.setLinguagem(dto.getLinguagem());
        projeto.setPlataformaPublicacao(dto.getPlataformaPublicacao());
        projeto.setHardware(dto.getHardware());
        projeto.setQtdHardware(dto.getQtdHardware());
        projeto.setLinkProjeto(dto.getLinkProjeto());
        projeto.setInfraNecessaria(dto.getInfraNecessaria());
        projeto.setCustoEstimado(dto.getCustoEstimado());
        if (dto.getStatusS1() != null) projeto.setStatusS1(dto.getStatusS1());
        if (dto.getStatusS2() != null) projeto.setStatusS2(dto.getStatusS2());
        if (dto.getStatusS3() != null) projeto.setStatusS3(dto.getStatusS3());
        if (dto.getStatusS4() != null) projeto.setStatusS4(dto.getStatusS4());
        projeto.setPitchAto1(dto.getPitchAto1());
        projeto.setPitchAto2(dto.getPitchAto2());
        projeto.setPitchAto3(dto.getPitchAto3());
        projeto.setDuracaoPitch(dto.getDuracaoPitch());
        projeto.setFormatoDemo(dto.getFormatoDemo());
        projeto.setObservacoes(dto.getObservacoes());
    }

    private Material toMaterialEntity(MaterialDTO.Request dto, Projeto projeto) {
        Material material = new Material();
        material.setProjeto(projeto);
        material.setItem(dto.getItem());
        material.setQuantidade(dto.getQuantidade());
        material.setUnidade(dto.getUnidade());
        material.setCustoUnitario(dto.getCustoUnitario());
        material.setStatusCompra(dto.getStatusCompra() != null ? dto.getStatusCompra() : StatusCompra.A_COMPRAR);
        material.setImagemUrl(dto.getImagemUrl());

        if (dto.getLinks() != null) {
            dto.getLinks().stream()
                    .map(l -> toLinkCompraEntity(l, material))
                    .forEach(material.getLinks()::add);
        }

        return material;
    }

    private LinkCompra toLinkCompraEntity(LinkCompraDTO.Request dto, Material material) {
        LinkCompra link = new LinkCompra();
        link.setMaterial(material);
        link.setNomeSite(dto.getNomeSite());
        link.setUrl(dto.getUrl());
        link.setValorEncontrado(dto.getValorEncontrado());
        return link;
    }

    private ProjetoDTO.Response toResponse(Projeto projeto) {
        return ProjetoDTO.Response.builder()
                .id(projeto.getId())
                .nomeProjeto(projeto.getNomeProjeto())
                .instrutor(toUsuarioResponse(projeto.getInstrutor()))
                .statusProjeto(projeto.getStatusProjeto())
                .justificativaReprovacao(projeto.getJustificativaReprovacao())
                .codigoTurma(projeto.getCodigoTurma())
                .turno(projeto.getTurno())
                .nivelTurma(projeto.getNivelTurma())
                .qtdAlunos(projeto.getQtdAlunos())
                .integrantes(new ArrayList<>(projeto.getIntegrantes()))
                .ods(projeto.getOds())
                .problemaIdentificado(projeto.getProblemaIdentificado())
                .solucaoProposta(projeto.getSolucaoProposta())
                .objetivoProjeto(projeto.getObjetivoProjeto())
                .tipoProjeto(projeto.getTipoProjeto())
                .ferramentaPrincipal(projeto.getFerramentaPrincipal())
                .linguagem(projeto.getLinguagem())
                .plataformaPublicacao(projeto.getPlataformaPublicacao())
                .hardware(projeto.getHardware())
                .qtdHardware(projeto.getQtdHardware())
                .linkProjeto(projeto.getLinkProjeto())
                .infraNecessaria(projeto.getInfraNecessaria())
                .custoEstimado(projeto.getCustoEstimado())
                .statusS1(projeto.getStatusS1())
                .statusS2(projeto.getStatusS2())
                .statusS3(projeto.getStatusS3())
                .statusS4(projeto.getStatusS4())
                .pitchAto1(projeto.getPitchAto1())
                .pitchAto2(projeto.getPitchAto2())
                .pitchAto3(projeto.getPitchAto3())
                .duracaoPitch(projeto.getDuracaoPitch())
                .formatoDemo(projeto.getFormatoDemo())
                .observacoes(projeto.getObservacoes())
                .ferramentasSoftware(projeto.getFerramentasSoftware().stream()
                        .map(this::toFerramentaSoftwareResponse)
                        .toList())
                .materiais(projeto.getMateriais().stream().map(this::toMaterialResponse).toList())
                .itensPapelaria(projeto.getItensPapelaria().stream().map(this::toPapelariaResponse).toList())
                .createdAt(projeto.getCreatedAt())
                .updatedAt(projeto.getUpdatedAt())
                .build();
    }

    private MaterialDTO.Response toMaterialResponse(Material material) {
        BigDecimal custoTotal = material.getCustoUnitario() != null
                ? material.getCustoUnitario().multiply(BigDecimal.valueOf(material.getQuantidade()))
                : BigDecimal.ZERO;

        ItemEstoqueDTO.Response itemEstoqueResponse = material.getItemEstoque() != null
                ? itemEstoqueService.toResponse(material.getItemEstoque())
                : null;

        return MaterialDTO.Response.builder()
                .id(material.getId())
                .item(material.getItem())
                .quantidade(material.getQuantidade())
                .unidade(material.getUnidade())
                .custoUnitario(material.getCustoUnitario())
                .custoTotal(custoTotal)
                .statusCompra(material.getStatusCompra())
                .estoqueSubtraido(material.getEstoqueSubtraido())
                .imagemUrl(material.getImagemUrl())
                .justificativaReprovacao(material.getJustificativaReprovacao())
                .links(material.getLinks().stream().map(this::toLinkCompraResponse).toList())
                .itemEstoque(itemEstoqueResponse)
                .createdAt(material.getCreatedAt())
                .build();
    }

    private LinkCompraDTO.Response toLinkCompraResponse(LinkCompra link) {
        return LinkCompraDTO.Response.builder()
                .id(link.getId())
                .nomeSite(link.getNomeSite())
                .url(link.getUrl())
                .valorEncontrado(link.getValorEncontrado())
                .build();
    }

    private FerramentaSoftwareDTO.Response toFerramentaSoftwareResponse(FerramentaSoftware f) {
        return FerramentaSoftwareDTO.Response.builder()
                .id(f.getId())
                .nome(f.getNome())
                .categoria(f.getCategoria())
                .descricao(f.getDescricao())
                .imagemUrl(f.getImagemUrl())
                .ativo(f.getAtivo())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }

    private PapelariaItemDTO.Response toPapelariaResponse(PapelariaItem item) {
        return PapelariaItemDTO.Response.builder()
                .id(item.getId())
                .nome(item.getNome())
                .imagemUrl(item.getImagemUrl())
                .quantidade(item.getQuantidade())
                .estoqueSubtraido(item.getEstoqueSubtraido())
                .itemEstoque(item.getItemEstoque() != null
                        ? itemEstoqueService.toResponse(item.getItemEstoque())
                        : null)
                .statusAquisicao(item.getStatusAquisicao())
                .justificativaReprovacao(item.getJustificativaReprovacao())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private UsuarioDTO.Response toUsuarioResponse(Usuario usuario) {
        if (usuario == null) return null;
        return UsuarioDTO.Response.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .perfil(usuario.getPerfil())
                .ativo(usuario.getAtivo())
                .createdAt(usuario.getCreatedAt())
                .build();
    }
}
