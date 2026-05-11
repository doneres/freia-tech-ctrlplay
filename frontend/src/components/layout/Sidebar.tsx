import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  Package,
  Code2,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/projetos", icon: FolderKanban, label: "Projetos" },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const canManageUsers = user?.perfil === "ADMINISTRADOR";
  const canManageEstoque = user?.perfil === "ADMINISTRADOR" || user?.perfil === "COORDENACAO" || user?.perfil === "MONITOR";
  const canManageFerramentas = user?.perfil === "ADMINISTRADOR";
  const canViewRelatorios = user?.perfil === "ADMINISTRADOR" || user?.perfil === "COORDENACAO" || user?.perfil === "INSTRUTOR" || user?.perfil === "MONITOR";

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-40 h-20 bg-white rounded-lg flex items-center justify-center">
            <img
              src="https://ctrlplay.com.br/wp-content/uploads/2024/11/logo-colorido.svg"
              alt="CTRL+PLAY"
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {canManageEstoque && (
          <NavLink
            to="/estoque"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            <Package size={18} />
            Estoque
          </NavLink>
        )}

        {canManageFerramentas && (
          <NavLink
            to="/ferramentas"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            <Code2 size={18} />
            Ferramentas
          </NavLink>
        )}

        {canViewRelatorios && (
          <NavLink
            to="/relatorios"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            <FileSpreadsheet size={18} />
            Relatórios
          </NavLink>
        )}

        {canManageUsers && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            <Users size={18} />
            Usuários
          </NavLink>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">
            {user?.nome}
          </p>
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
  );
}
