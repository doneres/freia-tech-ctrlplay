import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Plus, ChevronDown, ChevronUp, Pin, Trash2, Send, X, Loader2, Search,
} from 'lucide-react';
import {
  listarPosts, buscarPost, criarPost, responderPost, deletarPost, fixarPost,
  type PostRequest, type RespostaRequest,
} from '../api/forum';
import type { PostForum, CategoriaForum } from '../types';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIA_LABEL: Record<CategoriaForum, string> = {
  PUBLICACAO_WEB: 'Publicação na Web',
  PLATAFORMAS: 'Plataformas',
  DICAS_GERAIS: 'Dicas Gerais',
  DUVIDAS: 'Dúvidas',
};

const CATEGORIA_COLOR: Record<CategoriaForum, string> = {
  PUBLICACAO_WEB: 'bg-blue-100 text-blue-700',
  PLATAFORMAS: 'bg-purple-100 text-purple-700',
  DICAS_GERAIS: 'bg-green-100 text-green-700',
  DUVIDAS: 'bg-orange-100 text-orange-700',
};

const ALL_CATEGORIAS: CategoriaForum[] = ['PUBLICACAO_WEB', 'PLATAFORMAS', 'DICAS_GERAIS', 'DUVIDAS'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ForumPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaForum | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const isAdmin = user?.perfil === 'ADMINISTRADOR';

  const { data: posts = [], isLoading } = useQuery<PostForum[]>({
    queryKey: ['forum'],
    queryFn: listarPosts,
  });

  const mutCriar = useMutation({
    mutationFn: (data: PostRequest) => criarPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
      setShowCreateModal(false);
    },
  });

  const mutResponder = useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: RespostaRequest }) => responderPost(postId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables.postId] });
      setReplyInputs(prev => ({ ...prev, [variables.postId]: '' }));
    },
  });

  const mutDeletar = useMutation({
    mutationFn: (id: string) => deletarPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
      setExpandedPostId(null);
    },
  });

  const mutFixar = useMutation({
    mutationFn: (id: string) => fixarPost(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
      queryClient.setQueryData(['forum-post', updated.id.toString()], updated);
    },
  });

  const filteredPosts = posts.filter(p => {
    if (categoriaFilter && p.categoria !== categoriaFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.titulo.toLowerCase().includes(q) || p.conteudo?.toLowerCase().includes(q);
    }
    return true;
  });

  const pinnedPosts = filteredPosts.filter(p => p.fixado);
  const regularPosts = filteredPosts.filter(p => !p.fixado);

  function toggleExpand(id: string) {
    setExpandedPostId(prev => (prev === id ? null : id));
  }

  function handleReply(postId: string) {
    const conteudo = replyInputs[postId]?.trim();
    if (!conteudo) return;
    mutResponder.mutate({ postId, data: { conteudo } });
  }

  const replyingPostId = mutResponder.isPending ? mutResponder.variables?.postId : null;

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={24} className="text-brand-600" />
            Fórum
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Compartilhe dicas e tire dúvidas sobre publicação de projetos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo post
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-white">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar posts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategoriaFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            categoriaFilter === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {ALL_CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaFilter(prev => (prev === cat ? null : cat))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoriaFilter === cat
                ? CATEGORIA_COLOR[cat] + ' ring-2 ring-offset-1 ring-current'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {CATEGORIA_LABEL[cat]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhum post encontrado.</p>
          <p className="text-gray-400 text-xs mt-1">Seja o primeiro a compartilhar uma dica!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned posts */}
          {pinnedPosts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Pin size={12} /> Fixados
              </p>
              <div className="space-y-3">
                {pinnedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    expanded={expandedPostId === post.id}
                    onToggle={() => toggleExpand(post.id)}
                    onDelete={() => mutDeletar.mutate(post.id)}
                    onFixar={() => mutFixar.mutate(post.id)}
                    onReply={() => handleReply(post.id)}
                    replyValue={replyInputs[post.id] ?? ''}
                    onReplyChange={(v) => setReplyInputs(prev => ({ ...prev, [post.id]: v }))}
                    isAdmin={isAdmin}
                    currentUserId={user?.id}
                    isReplying={replyingPostId === post.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular posts */}
          {regularPosts.length > 0 && (
            <div>
              {pinnedPosts.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Posts recentes</p>
              )}
              <div className="space-y-3">
                {regularPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    expanded={expandedPostId === post.id}
                    onToggle={() => toggleExpand(post.id)}
                    onDelete={() => mutDeletar.mutate(post.id)}
                    onFixar={() => mutFixar.mutate(post.id)}
                    onReply={() => handleReply(post.id)}
                    replyValue={replyInputs[post.id] ?? ''}
                    onReplyChange={(v) => setReplyInputs(prev => ({ ...prev, [post.id]: v }))}
                    isAdmin={isAdmin}
                    currentUserId={user?.id}
                    isReplying={replyingPostId === post.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create post modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onConfirm={(data) => mutCriar.mutate(data)}
          isPending={mutCriar.isPending}
          error={mutCriar.error}
        />
      )}
    </div>
  );
}

// ── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  expanded,
  onToggle,
  onDelete,
  onFixar,
  onReply,
  replyValue,
  onReplyChange,
  isAdmin,
  currentUserId,
  isReplying,
}: {
  post: PostForum;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onFixar: () => void;
  onReply: () => void;
  replyValue: string;
  onReplyChange: (v: string) => void;
  isAdmin: boolean;
  currentUserId?: string;
  isReplying: boolean;
}) {
  const isAutor = post.autor.id === currentUserId;
  const canDelete = isAdmin || isAutor;

  // Fetch full post with replies when expanded
  const { data: fullPost } = useQuery<PostForum>({
    queryKey: ['forum-post', post.id],
    queryFn: () => buscarPost(post.id),
    enabled: expanded,
  });

  const displayPost = fullPost ?? post;

  return (
    <div className={`bg-white rounded-xl border transition-all ${
      post.fixado ? 'border-amber-200 shadow-sm' : 'border-gray-200'
    }`}>
      {/* Post header - always visible, clickable to expand */}
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {post.fixado && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <Pin size={10} /> Fixado
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORIA_COLOR[post.categoria]}`}>
              {CATEGORIA_LABEL[post.categoria]}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{post.titulo}</p>
          <p className="text-xs text-gray-400 mt-1">
            {post.autor.nome} · {formatDate(post.createdAt)}
            {post.totalRespostas > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-gray-500">
                <MessageSquare size={11} />
                {post.totalRespostas} {post.totalRespostas === 1 ? 'resposta' : 'respostas'}
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0 text-gray-400 mt-0.5">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {/* Post content */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{displayPost.conteudo}</p>
          </div>

          {/* Admin / autor actions */}
          <div className="flex items-center gap-2 mb-4">
            {isAdmin && (
              <button
                onClick={onFixar}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                  post.fixado
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Pin size={12} />
                {post.fixado ? 'Desafixar' : 'Fixar'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => { if (confirm('Excluir este post e todas as respostas?')) onDelete(); }}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={12} />
                Excluir post
              </button>
            )}
          </div>

          {/* Replies */}
          {!fullPost ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {displayPost.respostas && displayPost.respostas.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {displayPost.respostas.length} {displayPost.respostas.length === 1 ? 'Resposta' : 'Respostas'}
                  </p>
                  {displayPost.respostas.map(r => (
                    <div key={r.id} className="bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        {r.autor.nome} · <span className="text-gray-400 font-normal">{formatDate(r.createdAt)}</span>
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.conteudo}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply form */}
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Escreva uma resposta..."
                  value={replyValue}
                  onChange={(e) => onReplyChange(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <button
                  onClick={onReply}
                  disabled={!replyValue.trim() || isReplying}
                  className="self-end flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  {isReplying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Responder
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── CreatePostModal ──────────────────────────────────────────────────────────

function CreatePostModal({
  onClose,
  onConfirm,
  isPending,
  error,
}: {
  onClose: () => void;
  onConfirm: (data: PostRequest) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [form, setForm] = useState<PostRequest>({
    titulo: '',
    conteudo: '',
    categoria: 'DICAS_GERAIS',
  });

  function handleSubmit() {
    if (!form.titulo.trim() || !form.conteudo.trim()) return;
    onConfirm(form);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">Novo post no fórum</h3>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoria}
              onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value as CategoriaForum }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {ALL_CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{CATEGORIA_LABEL[cat]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              value={form.titulo}
              onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Como publicar no GitHub Pages em 5 passos"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Conteúdo <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={form.conteudo}
              onChange={(e) => setForm(f => ({ ...f, conteudo: e.target.value }))}
              placeholder="Compartilhe sua dica, tutorial ou dúvida..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {(error as any)?.response?.data?.message ?? 'Erro ao criar post.'}
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.titulo.trim() || !form.conteudo.trim() || isPending}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
