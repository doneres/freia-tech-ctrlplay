import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { login } from "../api/auth";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ email, senha });
      signIn(user);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "Email ou senha inválidos.");
    } finally {
      setLoading(false);
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
          <h2 className="text-gray-900 text-xl font-semibold mb-6">
            Entrar na conta
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          <a href="https://doneres.dev">Desenvolvido por doneres</a> ©{" "}
          {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
