import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjetosPage from './pages/ProjetosPage';
import ProjetoDetailPage from './pages/ProjetoDetailPage';
import NovoProjetoPage from './pages/NovoProjetoPage';
import UsuariosPage from './pages/UsuariosPage';
import EstoquePage from './pages/EstoquePage';
import FerramentasPage from './pages/FerramentasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import AgendaPage from './pages/AgendaPage';
import EventoPage from './pages/EventoPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="projetos" element={<ProjetosPage />} />
              <Route path="projetos/novo" element={<NovoProjetoPage />} />
              <Route path="projetos/:id/editar" element={<NovoProjetoPage />} />
              <Route path="projetos/:id" element={<ProjetoDetailPage />} />
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="estoque" element={<EstoquePage />} />
              <Route path="ferramentas" element={<FerramentasPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="evento" element={<EventoPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
