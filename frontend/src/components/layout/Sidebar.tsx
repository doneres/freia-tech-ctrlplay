import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  Package,
  Code2,
  FileSpreadsheet,
  X,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const canManageUsers = user?.perfil === "ADMINISTRADOR";
  const canManageEstoque =
    user?.perfil === "ADMINISTRADOR" ||
    user?.perfil === "COORDENACAO" ||
    user?.perfil === "MONITOR";
  const canManageFerramentas = user?.perfil === "ADMINISTRADOR";
  const canViewRelatorios =
    user?.perfil === "ADMINISTRADOR" ||
    user?.perfil === "COORDENACAO" ||
    user?.perfil === "INSTRUTOR" ||
    user?.perfil === "MONITOR";

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  function deskLinkClass(isActive: boolean) {
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors justify-center lg:justify-start ${
      isActive
        ? "bg-brand-600 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;
  }

  function mobLinkClass(isActive: boolean) {
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-600 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;
  }

  return (
    <>
      {/* Desktop / Tablet sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-64 bg-gray-900 shrink-0">
        <div className="border-b border-gray-800 flex items-center justify-center lg:justify-start px-0 lg:px-6 py-4 lg:py-5">
          <div className="flex lg:hidden w-10 h-10 bg-white rounded-lg items-center justify-center shrink-0">
            <span className="text-gray-900 font-bold text-xs">FT</span>
          </div>
          <div className="hidden lg:flex w-40 h-20 bg-white rounded-lg items-center justify-center">
            <img
              src="https://ctrlplay.com.br/wp-content/uploads/2024/11/logo-colorido.svg"
              alt="CTRL+PLAY"
            />
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink to="/" end className={({ isActive }) => deskLinkClass(isActive)}>
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="hidden lg:block">Dashboard</span>
          </NavLink>
          <NavLink to="/projetos" className={({ isActive }) => deskLinkClass(isActive)}>
            <FolderKanban size={18} className="shrink-0" />
            <span className="hidden lg:block">Projetos</span>
          </NavLink>
          <NavLink to="/agenda" className={({ isActive }) => deskLinkClass(isActive)}>
            <CalendarDays size={18} className="shrink-0" />
            <span className="hidden lg:block">Agenda</span>
          </NavLink>
          {canManageEstoque && (
            <NavLink to="/estoque" className={({ isActive }) => deskLinkClass(isActive)}>
              <Package size={18} className="shrink-0" />
              <span className="hidden lg:block">Estoque</span>
            </NavLink>
          )}
          {canManageFerramentas && (
            <NavLink to="/ferramentas" className={({ isActive }) => deskLinkClass(isActive)}>
              <Code2 size={18} className="shrink-0" />
              <span className="hidden lg:block">Ferramentas</span>
            </NavLink>
          )}
          {canViewRelatorios && (
            <NavLink to="/relatorios" className={({ isActive }) => deskLinkClass(isActive)}>
              <FileSpreadsheet size={18} className="shrink-0" />
              <span className="hidden lg:block">Relatórios</span>
            </NavLink>
          )}
          {canManageUsers && (
            <NavLink to="/usuarios" className={({ isActive }) => deskLinkClass(isActive)}>
              <Users size={18} className="shrink-0" />
              <span className="hidden lg:block">Usuários</span>
            </NavLink>
          )}
        </nav>

        <div className="px-2 py-4 border-t border-gray-800">
          <div className="hidden lg:block px-3 py-2 mb-1">
            <p className="text-white text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            <span className="mt-1 inline-block text-xs bg-brand-900 text-brand-200 px-2 py-0.5 rounded-full">
              {user?.perfil}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors justify-center lg:justify-start"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="hidden lg:block">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <span className="text-white font-bold text-sm">FeiraTech</span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink to="/" end onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/projetos" onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
            <FolderKanban size={18} />
            Projetos
          </NavLink>
          <NavLink to="/agenda" onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
            <CalendarDays size={18} />
            Agenda
          </NavLink>
          {canManageEstoque && (
            <NavLink to="/estoque" onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
              <Package size={18} />
              Estoque
            </NavLink>
          )}
          {canManageFerramentas && (
            <NavLink to="/ferramentas" onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
              <Code2 size={18} />
              Ferramentas
            </NavLink>
          )}
          {canViewRelatorios && (
            <NavLink to="/relatorios" onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
              <FileSpreadsheet size={18} />
              Relatórios
            </NavLink>
          )}
          {canManageUsers && (
            <NavLink to="/usuarios" onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
              <Users size={18} />
              Usuários
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800 shrink-0">
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            <span className="mt-1 inline-block text-xs bg-brand-900 text-brand-200 px-2 py-0.5 rounded-full">
              {user?.perfil}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
