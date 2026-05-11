package br.com.ctrlplaygoiania.feiratech.service;

import br.com.ctrlplaygoiania.feiratech.model.ItemEstoque;
import br.com.ctrlplaygoiania.feiratech.model.Material;
import br.com.ctrlplaygoiania.feiratech.model.Projeto;
import br.com.ctrlplaygoiania.feiratech.model.enums.StatusCompra;
import br.com.ctrlplaygoiania.feiratech.repository.ItemEstoqueRepository;
import br.com.ctrlplaygoiania.feiratech.repository.MaterialRepository;
import br.com.ctrlplaygoiania.feiratech.repository.ProjetoRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RelatorioService {

    private final ProjetoRepository projetoRepository;
    private final MaterialRepository materialRepository;
    private final ItemEstoqueRepository itemEstoqueRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ── Estoque ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] relatorioEstoque() {
        List<ItemEstoque> itens = itemEstoqueRepository.findAll()
                .stream().sorted(Comparator.comparing(ItemEstoque::getTipo).thenComparing(ItemEstoque::getNome))
                .toList();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Estoque");
            CellStyle header = headerStyle(wb);

            String[] cols = {"Nome", "Tipo", "Categoria", "Marca", "Modelo",
                    "Qtd Total", "Qtd Disponível", "Ativo"};
            criarCabecalho(sheet, header, cols);

            int row = 1;
            for (ItemEstoque i : itens) {
                Row r = sheet.createRow(row++);
                set(r, 0, i.getNome());
                set(r, 1, i.getTipo().name());
                set(r, 2, i.getCategoria());
                set(r, 3, i.getMarca());
                set(r, 4, i.getModelo());
                setInt(r, 5, i.getQuantidadeTotal());
                setInt(r, 6, i.getQuantidadeDisponivel());
                set(r, 7, Boolean.TRUE.equals(i.getAtivo()) ? "Sim" : "Não");
            }
            autoSize(sheet, cols.length);
            return toBytes(wb);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar relatório de estoque", e);
        }
    }

    // ── Todos os projetos ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] relatorioProjetos() {
        List<Projeto> projetos = projetoRepository.findAll()
                .stream().sorted(Comparator.comparing(Projeto::getCreatedAt).reversed())
                .toList();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Projetos");
            preencherSheetProjetos(wb, sheet, projetos);
            autoSize(sheet, 13);
            return toBytes(wb);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar relatório de projetos", e);
        }
    }

    // ── Projetos por instrutor ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] relatorioProjetosPorInstrutor() {
        List<Projeto> projetos = projetoRepository.findAll()
                .stream().sorted(Comparator
                        .comparing((Projeto p) -> p.getInstrutor().getNome())
                        .thenComparing(Projeto::getCreatedAt).reversed())
                .toList();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            // Uma aba por instrutor
            projetos.stream()
                    .map(p -> p.getInstrutor().getNome())
                    .distinct()
                    .forEach(nome -> {
                        String sheetName = nome.length() > 31 ? nome.substring(0, 31) : nome;
                        Sheet sheet = wb.createSheet(sheetName);
                        List<Projeto> doInstrutor = projetos.stream()
                                .filter(p -> p.getInstrutor().getNome().equals(nome))
                                .toList();
                        preencherSheetProjetos(wb, sheet, doInstrutor);
                        autoSize(sheet, 13);
                    });
            return toBytes(wb);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar relatório por instrutor", e);
        }
    }

    // ── Solicitações de compra (todas) ────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] relatorioSolicitacoesCompra() {
        List<Material> materiais = materialRepository.findAll().stream()
                .filter(m -> m.getStatusCompra() != StatusCompra.DISPONIVEL_ESCOLA)
                .sorted(Comparator.comparing(m -> m.getProjeto().getNomeProjeto()))
                .toList();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Solicitações de Compra");
            preencherSheetSolicitacoes(wb, sheet, materiais);
            autoSize(sheet, 9);
            return toBytes(wb);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar relatório de solicitações", e);
        }
    }

    // ── Meus projetos (instrutor) ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] relatorioMeusProjetos(UUID instrutorId) {
        List<Projeto> projetos = projetoRepository.findByInstrutor_Id(instrutorId)
                .stream().sorted(Comparator.comparing(Projeto::getCreatedAt).reversed())
                .toList();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Meus Projetos");
            preencherSheetProjetos(wb, sheet, projetos);
            autoSize(sheet, 13);
            return toBytes(wb);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar relatório de meus projetos", e);
        }
    }

    // ── Minhas solicitações (instrutor) ───────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] relatorioMinhasSolicitacoes(UUID instrutorId) {
        List<Material> materiais = projetoRepository.findByInstrutor_Id(instrutorId).stream()
                .flatMap(p -> materialRepository.findByProjetoId(p.getId()).stream())
                .filter(m -> m.getStatusCompra() != StatusCompra.DISPONIVEL_ESCOLA)
                .sorted(Comparator.comparing(m -> m.getProjeto().getNomeProjeto()))
                .toList();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Minhas Solicitações");
            preencherSheetSolicitacoes(wb, sheet, materiais);
            autoSize(sheet, 9);
            return toBytes(wb);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar relatório de minhas solicitações", e);
        }
    }

    // ── Helpers internos ──────────────────────────────────────────────────────

    private void preencherSheetProjetos(XSSFWorkbook wb, Sheet sheet, List<Projeto> projetos) {
        CellStyle header = headerStyle(wb);
        String[] cols = {"Nome do Projeto", "Instrutor", "Turma", "Turno", "Nível",
                "Qtd Alunos", "Status", "Semana 1", "Semana 2", "Semana 3",
                "Semana 4", "Tipo", "Criado em"};
        criarCabecalho(sheet, header, cols);

        int row = 1;
        for (Projeto p : projetos) {
            Row r = sheet.createRow(row++);
            set(r, 0, p.getNomeProjeto());
            set(r, 1, p.getInstrutor() != null ? p.getInstrutor().getNome() : "");
            set(r, 2, p.getCodigoTurma());
            set(r, 3, p.getTurno() != null ? p.getTurno().name() : "");
            set(r, 4, p.getNivelTurma() != null ? p.getNivelTurma().name() : "");
            setInt(r, 5, p.getQtdAlunos() != null ? p.getQtdAlunos() : 0);
            set(r, 6, p.getStatusProjeto() != null ? p.getStatusProjeto().name() : "");
            set(r, 7, p.getStatusS1() != null ? p.getStatusS1().name() : "");
            set(r, 8, p.getStatusS2() != null ? p.getStatusS2().name() : "");
            set(r, 9, p.getStatusS3() != null ? p.getStatusS3().name() : "");
            set(r, 10, p.getStatusS4() != null ? p.getStatusS4().name() : "");
            set(r, 11, p.getTipoProjeto() != null ? p.getTipoProjeto().name() : "");
            set(r, 12, p.getCreatedAt() != null ? p.getCreatedAt().format(FMT) : "");
        }
    }

    private void preencherSheetSolicitacoes(XSSFWorkbook wb, Sheet sheet, List<Material> materiais) {
        CellStyle header = headerStyle(wb);
        String[] cols = {"Projeto", "Instrutor", "Item", "Quantidade", "Unidade",
                "Custo Unitário (R$)", "Custo Total (R$)", "Status", "Link Principal"};
        criarCabecalho(sheet, header, cols);

        int row = 1;
        for (Material m : materiais) {
            Row r = sheet.createRow(row++);
            set(r, 0, m.getProjeto().getNomeProjeto());
            set(r, 1, m.getProjeto().getInstrutor() != null ? m.getProjeto().getInstrutor().getNome() : "");
            set(r, 2, m.getItem());
            setInt(r, 3, m.getQuantidade());
            set(r, 4, m.getUnidade());
            setBigDecimal(r, 5, m.getCustoUnitario());
            BigDecimal custo = m.getCustoUnitario() != null
                    ? m.getCustoUnitario().multiply(BigDecimal.valueOf(m.getQuantidade()))
                    : BigDecimal.ZERO;
            setBigDecimal(r, 6, custo);
            set(r, 7, m.getStatusCompra() != null ? m.getStatusCompra().name() : "");
            String link = m.getLinks() != null && !m.getLinks().isEmpty() ? m.getLinks().get(0).getUrl() : "";
            set(r, 8, link);
        }
    }

    private void criarCabecalho(Sheet sheet, CellStyle style, String[] colunas) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < colunas.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(colunas[i]);
            cell.setCellStyle(style);
        }
    }

    private CellStyle headerStyle(XSSFWorkbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        return style;
    }

    private void autoSize(Sheet sheet, int numCols) {
        for (int i = 0; i < numCols; i++) {
            sheet.autoSizeColumn(i);
            int current = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.min(current + 512, 20000));
        }
    }

    private void set(Row row, int col, String value) {
        row.createCell(col).setCellValue(value != null ? value : "");
    }

    private void setInt(Row row, int col, int value) {
        row.createCell(col).setCellValue(value);
    }

    private void setBigDecimal(Row row, int col, BigDecimal value) {
        if (value != null) row.createCell(col).setCellValue(value.doubleValue());
        else row.createCell(col).setCellValue(0.0);
    }

    private byte[] toBytes(XSSFWorkbook wb) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        wb.write(out);
        return out.toByteArray();
    }
}
