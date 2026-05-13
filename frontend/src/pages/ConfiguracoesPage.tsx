import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { buscarMeuPerfil, atualizarMeuPerfil, alterarMinhaSenha } from "../api/me";

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function ConfiguracoesPage() {
  const { user, signOut, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dados pessoais
  const [nome, setNome] = useState(user?.nome ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");
  const [fotoPerfil, setFotoPerfil] = useState(user?.fotoPerfil ?? "");
  const [fotoPreview, setFotoPreview] = useState(user?.fotoPerfil ?? "");
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);
  const [senhaMsg, setSenhaMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    buscarMeuPerfil().then(u => {
      setNome(u.nome);
      setEmail(u.email);
      setTelefone(u.telefone ?? "");
      setFotoPerfil(u.fotoPerfil ?? "");
      setFotoPreview(u.fotoPerfil ?? "");
    }).catch(() => {});
  }, []);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPerfilMsg({ type: 'err', text: 'Imagem deve ter no máximo 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setFotoPreview(base64);
      setFotoPerfil(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setPerfilMsg(null);
    setSavingPerfil(true);
    try {
      const atualizado = await atualizarMeuPerfil({
        nome,
        email,
        telefone: telefone || undefined,
        fotoPerfil: fotoPerfil || undefined,
      });
      updateUser({ nome: atualizado.nome, email: atualizado.email, telefone: atualizado.telefone, fotoPerfil: atualizado.fotoPerfil });
      setPerfilMsg({ type: 'ok', text: 'Dados atualizados com sucesso.' });
      if (email !== user?.email) {
        setTimeout(() => signOut(), 2000);
        setPerfilMsg({ type: 'ok', text: 'Email alterado. Você será desconectado para fazer login novamente.' });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPerfilMsg({ type: 'err', text: msg ?? 'Erro ao salvar dados.' });
    } finally {
      setSavingPerfil(false);
    }
  }

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setSenhaMsg(null);
    if (novaSenha !== confirmarSenha) {
      setSenhaMsg({ type: 'err', text: 'As senhas não coincidem.' });
      return;
    }
    if (novaSenha.length < 6) {
      setSenhaMsg({ type: 'err', text: 'Nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    setSavingSenha(true);
    try {
      await alterarMinhaSenha({ senhaAtual, novaSenha });
      setSenhaMsg({ type: 'ok', text: 'Senha alterada com sucesso.' });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSenhaMsg({ type: 'err', text: msg ?? 'Erro ao alterar senha.' });
    } finally {
      setSavingSenha(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* Dados Pessoais */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Dados Pessoais</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative group">
            {fotoPreview ? (
              <img
                src={fotoPreview}
                alt="Foto de perfil"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-200">
                {nome ? getInitials(nome) : "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Alterar foto"
            >
              <Camera size={20} className="text-white" />
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Alterar foto
            </button>
            <p className="text-xs text-gray-500 mt-0.5">JPG, PNG ou GIF. Máximo 2MB.</p>
            {fotoPreview && (
              <button
                type="button"
                onClick={() => { setFotoPreview(""); setFotoPerfil(""); }}
                className="text-xs text-red-500 hover:text-red-600 mt-1 block"
              >
                Remover foto
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoChange}
          />
        </div>

        <form onSubmit={handleSalvarPerfil} className="space-y-4">
          {perfilMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 ${
              perfilMsg.type === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {perfilMsg.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {email !== user?.email && (
              <p className="text-xs text-amber-600 mt-1">Ao alterar o email, você precisará fazer login novamente.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(62) 99999-9999"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPerfil}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {savingPerfil ? (
                <><Loader2 size={15} className="animate-spin" /> Salvando...</>
              ) : (
                <><Check size={15} /> Salvar alterações</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Segurança */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Segurança</h2>

        <form onSubmit={handleAlterarSenha} className="space-y-4">
          {senhaMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 ${
              senhaMsg.type === 'ok'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {senhaMsg.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <div className="relative">
              <input
                type={showSenhaAtual ? "text" : "password"}
                required
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowSenhaAtual(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSenhaAtual ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <div className="relative">
              <input
                type={showNovaSenha ? "text" : "password"}
                required
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              required
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                confirmarSenha && novaSenha !== confirmarSenha
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {confirmarSenha && novaSenha !== confirmarSenha && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSenha}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {savingSenha ? (
                <><Loader2 size={15} className="animate-spin" /> Alterando...</>
              ) : (
                "Alterar senha"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
