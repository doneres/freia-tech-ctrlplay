import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, X, Loader2, Code2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  listarFerramentas, criarFerramenta, atualizarFerramenta,
  desativarFerramenta, reativarFerramenta,
  type FerramentaSoftwareRequest,
} from '../api/ferramentas';
import type { FerramentaSoftware } from '../types';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIAS_SUGERIDAS = ['Jogos', 'Desenvolvimento', 'Eletrônica', 'Robótica', 'Design', 'Outros'];

export default function FerramentasPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.perfil === 'ADMINISTRADOR';

  const [search, setSearch] = useState('');
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; ferramenta?: FerramentaSoftware }>({ open: false });

  const { data: ferramentas = [], isLoading } = useQuery({
    queryKey: ['ferramentas', mostrarInativas],
    queryFn: () => listarFerramentas(!mostrarInativas),
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['ferramentas'] });

  const mutCriar = useMutation({ mutationFn: criarFerramenta, onSuccess: () => { invalidar(); setModal({ open: false }); } });
  const mutAtualizar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FerramentaSoftwareRequest }) => atualizarFerramenta(id, data),
    onSuccess: () => { invalidar(); setModal({ open: false }); },
  });
  const mutDesativar = useMutation({ mutationFn: desativarFerramenta, onSuccess: invalidar });
  const mutReativar = useMutation({ mutationFn: reativarFerramenta, onSuccess: invalidar });

  const filtradas = ferramentas.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    (f.categoria ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const porCategoria = filtradas.reduce<Record<string, FerramentaSoftware[]>>((acc, f) => {
    const cat = f.categoria ?? 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Ferramentas de software</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Catálogo de ferramentas homologadas para uso nos projetos
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            <Plus size={15} /> <span className="hidden sm:inline">Nova ferramenta</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <Search size={14} className="text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ferramenta ou categoria..."
            className="flex-1 text-sm outline-none"
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setMostrarInativas(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              mostrarInativas
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {mostrarInativas ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            Inativas
          </button>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <Code2 size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nenhuma ferramenta encontrada.</p>
          {isAdmin && (
            <button
              onClick={() => setModal({ open: true })}
              className="mt-3 text-sm text-brand-600 hover:underline"
            >
              Cadastrar primeira ferramenta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(porCategoria).sort(([a], [b]) => a.localeCompare(b)).map(([cat, itens]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {itens.map(f => (
                  <div
                    key={f.id}
                    className={`bg-white rounded-xl border p-4 flex gap-3 items-start ${
                      f.ativo ? 'border-gray-200' : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      {f.imagemUrl
                        ? <img src={f.imagemUrl} alt={f.nome} className="w-full h-full object-contain rounded-lg" />
                        : <Code2 size={18} className="text-brand-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{f.nome}</p>
                      {f.descricao && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{f.descricao}</p>
                      )}
                      {!f.ativo && (
                        <span className="mt-1 inline-block text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          Inativa
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => setModal({ open: true, ferramenta: f })}
                          className="p-1 text-gray-400 hover:text-brand-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => f.ativo ? mutDesativar.mutate(f.id) : mutReativar.mutate(f.id)}
                          className={`p-1 transition-colors ${f.ativo ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-600'}`}
                          title={f.ativo ? 'Desativar' : 'Reativar'}
                        >
                          {f.ativo ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal.open && (
        <FerramentaModal
          ferramenta={modal.ferramenta}
          onClose={() => setModal({ open: false })}
          onSave={(data) => {
            if (modal.ferramenta) {
              mutAtualizar.mutate({ id: modal.ferramenta.id, data });
            } else {
              mutCriar.mutate(data);
            }
          }}
          isPending={mutCriar.isPending || mutAtualizar.isPending}
          error={mutCriar.error || mutAtualizar.error}
        />
      )}
    </div>
  );
}

function FerramentaModal({
  ferramenta, onClose, onSave, isPending, error,
}: {
  ferramenta?: FerramentaSoftware;
  onClose: () => void;
  onSave: (data: FerramentaSoftwareRequest) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [form, setForm] = useState<FerramentaSoftwareRequest>({
    nome: ferramenta?.nome ?? '',
    categoria: ferramenta?.categoria ?? '',
    descricao: ferramenta?.descricao ?? '',
    imagemUrl: ferramenta?.imagemUrl ?? '',
  });

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  const lbl = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {ferramenta ? 'Editar ferramenta' : 'Nova ferramenta'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={lbl}>Nome *</label>
            <input
              autoFocus
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className={inp}
              placeholder="Ex: Scratch, Unity, MakeCode Arcade"
            />
          </div>

          <div>
            <label className={lbl}>Categoria</label>
            <input
              list="categorias-list"
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              className={inp}
              placeholder="Ex: Jogos, Desenvolvimento..."
            />
            <datalist id="categorias-list">
              {CATEGORIAS_SUGERIDAS.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className={lbl}>Descrição</label>
            <textarea
              rows={2}
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className={`${inp} resize-none`}
              placeholder="Breve descrição da ferramenta"
            />
          </div>

          <div>
            <label className={lbl}>URL da imagem / ícone</label>
            <input
              value={form.imagemUrl}
              onChange={e => setForm(f => ({ ...f, imagemUrl: e.target.value }))}
              className={inp}
              placeholder="https://..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {(error as any)?.response?.data?.message ?? 'Erro ao salvar ferramenta.'}
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.nome.trim() || isPending}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
