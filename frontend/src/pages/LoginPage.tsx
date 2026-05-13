import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { login, solicitarReset, confirmarReset } from "../api/auth";

type View = 'login' | 'reset-step1' | 'reset-step2';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('login');

  // Login
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Reset step 1
  const [resetEmail, setResetEmail] = useState("");
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Msg, setStep1Msg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Reset step 2
  const [resetCodigo, setResetCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Msg, setStep2Msg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const user = await login({ email, senha });
      signIn(user);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoginError(msg ?? "Email ou senha inválidos.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setStep1Msg(null);
    setStep1Loading(true);
    try {
      await solicitarReset(resetEmail);
      setStep1Msg({ type: 'ok', text: 'Se o email estiver cadastrado, você receberá um código em breve.' });
      setTimeout(() => {
        setStep1Msg(null);
        setView('reset-step2');
      }, 2000);
    } catch {
      setStep1Msg({ type: 'err', text: 'Erro ao enviar código. Tente novamente.' });
    } finally {
      setStep1Loading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setStep2Msg(null);
    if (novaSenha !== confirmarSenha) {
      setStep2Msg({ type: 'err', text: 'As senhas não coincidem.' });
      return;
    }
    if (novaSenha.length < 6) {
      setStep2Msg({ type: 'err', text: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    setStep2Loading(true);
    try {
      await confirmarReset(resetEmail, resetCodigo, novaSenha);
      setStep2Msg({ type: 'ok', text: 'Senha redefinida com sucesso! Você já pode fazer login.' });
      setTimeout(() => {
        setView('login');
        setResetEmail("");
        setResetCodigo("");
        setNovaSenha("");
        setConfirmarSenha("");
        setStep2Msg(null);
      }, 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setStep2Msg({ type: 'err', text: msg ?? 'Código inválido ou expirado.' });
    } finally {
      setStep2Loading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-50 h-50 p-5 bg-white rounded-2xl mb-4 shadow-lg">
            <img
              src="https://ctrlplay.com.br/wp-content/uploads/2024/11/logo-colorido.svg"
              alt="CTRL+PLAY"
            />
          </div>
          <h3 className="text-gray-400 mt-1">Sistema de Gestão — Feira Tech</h3>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* ── LOGIN ── */}
          {view === 'login' && (
            <>
              <h2 className="text-gray-900 text-xl font-semibold mb-6">Entrar na conta</h2>

              {loginError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Entrando...</>
                  ) : "Entrar"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setView('reset-step1'); setStep1Msg(null); }}
                className="w-full mt-4 text-sm text-brand-600 hover:text-brand-700 text-center"
              >
                Esqueci minha senha
              </button>
            </>
          )}

          {/* ── RESET STEP 1: digitar email ── */}
          {view === 'reset-step1' && (
            <>
              <button
                type="button"
                onClick={() => setView('login')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
              >
                <ArrowLeft size={15} />
                Voltar ao login
              </button>

              <h2 className="text-gray-900 text-xl font-semibold mb-2">Redefinir senha</h2>
              <p className="text-gray-500 text-sm mb-6">
                Digite seu email e enviaremos um código de 6 dígitos para redefinir sua senha.
              </p>

              {step1Msg && (
                <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${
                  step1Msg.type === 'ok'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {step1Msg.text}
                </div>
              )}

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email cadastrado</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={step1Loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {step1Loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                  ) : "Enviar código"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setView('reset-step2'); setStep2Msg(null); }}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                Já tenho o código →
              </button>
            </>
          )}

          {/* ── RESET STEP 2: código + nova senha ── */}
          {view === 'reset-step2' && (
            <>
              <button
                type="button"
                onClick={() => setView('reset-step1')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
              >
                <ArrowLeft size={15} />
                Voltar
              </button>

              <h2 className="text-gray-900 text-xl font-semibold mb-2">Digite o código</h2>
              <p className="text-gray-500 text-sm mb-6">
                Insira o código de 6 dígitos enviado para <strong>{resetEmail || "seu email"}</strong> e defina uma nova senha.
              </p>

              {step2Msg && (
                <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${
                  step2Msg.type === 'ok'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {step2Msg.text}
                </div>
              )}

              <form onSubmit={handleStep2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código recebido</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCodigo}
                    onChange={e => setResetCodigo(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.4em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
                  <input
                    type="password"
                    required
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
                  <input
                    type="password"
                    required
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                      confirmarSenha && novaSenha !== confirmarSenha ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={step2Loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {step2Loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Redefinindo...</>
                  ) : "Redefinir senha"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          <a href="https://doneres.dev">Desenvolvido por doneres</a> ©{" "}
          {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
