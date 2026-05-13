import { useState, type ComponentType } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, Users, LogOut, Package, Code2,
  FileSpreadsheet, X, CalendarDays, MessageSquare, ShoppingCart,
  Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

type NavItem = { to: string; end?: boolean; icon: ComponentType<{ size?: number; className?: string }>; label: string };

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sidebar-groups');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  }

  function toggleGroup(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem('sidebar-groups', JSON.stringify([...next]));
      return next;
    });
  }

  const canManageUsers = user?.perfil === "ADMINISTRADOR";
  const canManageEstoque =
    user?.perfil === "ADMINISTRADOR" || user?.perfil === "COORDENACAO" || user?.perfil === "MONITOR";
  const canManageFerramentas = user?.perfil === "ADMINISTRADOR";
  const canViewRelatorios =
    user?.perfil === "ADMINISTRADOR" || user?.perfil === "COORDENACAO" ||
    user?.perfil === "INSTRUTOR" || user?.perfil === "MONITOR";
  const canViewSolicitacoes =
    user?.perfil === "ADMINISTRADOR" || user?.perfil === "COORDENACAO";

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  const projetosItems: NavItem[] = [
    { to: "/projetos", icon: FolderKanban, label: "Projetos" },
    { to: "/agenda", icon: CalendarDays, label: "Agenda" },
    { to: "/forum", icon: MessageSquare, label: "Fórum" },
  ];

  const operacionalItems: NavItem[] = [
    ...(canViewSolicitacoes ? [{ to: "/solicitacoes", icon: ShoppingCart, label: "Solicitações" }] : []),
    ...(canManageEstoque ? [{ to: "/estoque", icon: Package, label: "Estoque" }] : []),
  ];

  const administracaoItems: NavItem[] = [
    ...(canManageFerramentas ? [{ to: "/ferramentas", icon: Code2, label: "Ferramentas" }] : []),
    ...(canViewRelatorios ? [{ to: "/relatorios", icon: FileSpreadsheet, label: "Relatórios" }] : []),
    ...(canManageUsers ? [{ to: "/usuarios", icon: Users, label: "Usuários" }] : []),
  ];

  const groups: NavGroup[] = [
    ...(projetosItems.length > 0 ? [{ key: 'projetos', label: 'Projetos', items: projetosItems }] : []),
    ...(operacionalItems.length > 0 ? [{ key: 'operacional', label: 'Operacional', items: operacionalItems }] : []),
    ...(administracaoItems.length > 0 ? [{ key: 'administracao', label: 'Administração', items: administracaoItems }] : []),
  ];

  const allFlatItems: NavItem[] = [
    ...projetosItems,
    ...operacionalItems,
    ...administracaoItems,
  ];

  function deskLinkClass(isActive: boolean) {
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      collapsed ? "justify-center" : "justify-start"
    } ${
      isActive ? "bg-brand-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;
  }

  function mobLinkClass(isActive: boolean) {
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-brand-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-gray-900 shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-800 flex items-center px-2 py-4 shrink-0">
          {collapsed ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0">
                <span className="text-gray-900 font-bold text-xs">FT</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center px-1">
              <div className="w-full h-14 bg-white rounded-lg flex items-center justify-center px-3">
                <img
                  src="https://ctrlplay.com.br/wp-content/uploads/2024/11/logo-colorido.svg"
                  alt="CTRL+PLAY"
                  className="max-h-10 w-auto"
                />
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0 ml-1"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto min-h-0">
          {/* Dashboard standalone */}
          <NavLink
            to="/"
            end
            title={collapsed ? "Dashboard" : undefined}
            className={({ isActive }) => deskLinkClass(isActive)}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">Dashboard</span>}
          </NavLink>

          {collapsed ? (
            /* Collapsed: render all items as flat icons */
            <div className="mt-1 space-y-1">
              {allFlatItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    className={({ isActive }) => deskLinkClass(isActive)}
                  >
                    <Icon size={18} className="shrink-0" />
                  </NavLink>
                );
              })}
            </div>
          ) : (
            /* Expanded: render groups with headers */
            <div className="mt-3 space-y-4">
              {groups.map(group => (
                <div key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                  >
                    <span>{group.label}</span>
                    {openGroups.has(group.key) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {openGroups.has(group.key) && (
                    <div className="mt-1 space-y-0.5">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => deskLinkClass(isActive)}
                          >
                            <Icon size={18} className="shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-2 py-4 border-t border-gray-800 shrink-0 space-y-1">
          <NavLink
            to="/configuracoes"
            title={collapsed ? "Configurações" : undefined}
            className={({ isActive }) => deskLinkClass(isActive)}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">Configurações</span>}
          </NavLink>

          {!collapsed ? (
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                {user?.fotoPerfil ? (
                  <img src={user.fotoPerfil} alt={user.nome} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.nome ? getInitials(user.nome) : "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user?.nome}</p>
                  <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                </div>
              </div>
              <span className="inline-block text-xs bg-brand-900 text-brand-200 px-2 py-0.5 rounded-full">
                {user?.perfil}
              </span>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              {user?.fotoPerfil ? (
                <img src={user.fotoPerfil} alt={user.nome} title={user.nome} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold" title={user?.nome}>
                  {user?.nome ? getInitials(user.nome) : "?"}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSignOut}
            title={collapsed ? "Sair" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${
              collapsed ? "justify-center" : "justify-start"
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sair</span>}
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

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <NavLink to="/" end onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <div className="mt-3 space-y-4">
            {groups.map(group => (
              <div key={group.key}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                >
                  <span>{group.label}</span>
                  {openGroups.has(group.key) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {openGroups.has(group.key) && (
                  <div className="mt-1 space-y-0.5">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={onClose}
                          className={({ isActive }) => mobLinkClass(isActive)}
                        >
                          <Icon size={18} />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-gray-800 shrink-0 space-y-1">
          <NavLink to="/configuracoes" onClick={onClose} className={({ isActive }) => mobLinkClass(isActive)}>
            <Settings size={18} />
            Configurações
          </NavLink>

          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              {user?.fotoPerfil ? (
                <img src={user.fotoPerfil} alt={user.nome} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.nome ? getInitials(user.nome) : "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-gray-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <span className="inline-block text-xs bg-brand-900 text-brand-200 px-2 py-0.5 rounded-full">
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
