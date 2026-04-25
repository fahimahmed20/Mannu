"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AdminContext, type AdminUser } from "./admin-context";

const roleBadge: Record<string, string> = {
  superadmin: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  admin: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  editor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

function navItems(role: string) {
  const items = [
    {
      href: "/admin",
      label: "Dashboard",
      exact: true,
      roles: ["superadmin", "admin", "editor"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/admin/species",
      label: "Species",
      roles: ["superadmin", "admin", "editor"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      href: "/admin/categories",
      label: "Categories",
      roles: ["superadmin", "admin", "editor"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      href: "/admin/media",
      label: "Media",
      roles: ["superadmin", "admin", "editor"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/admin/users",
      label: "App Users",
      roles: ["superadmin", "admin"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/team",
      label: "Admin Team",
      roles: ["superadmin"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/settings",
      label: "Settings",
      roles: ["superadmin", "admin"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];
  return items.filter((i) => i.roles.includes(role));
}

function Sidebar({ user, onClose }: { user: AdminUser | null; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navItems(user?.role || "editor");

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-lg">🌿</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-white leading-tight">Manu Admin</div>
          <div className="text-xs text-slate-500 leading-tight">Field Guide CMS</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 pb-2">
          Menu
        </div>
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 bg-emerald-800 rounded-full flex items-center justify-center text-xs font-bold text-emerald-300 flex-shrink-0">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user.username}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${roleBadge[user.role] || roleBadge.editor}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (pathname !== "/admin/login") {
      fetch("/api/admin/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then(setUser);
    }
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <AdminContext.Provider value={user}>
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0 w-56 xl:w-60">
          <Sidebar user={user} />
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-50 w-60 h-full shadow-2xl">
              <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-4 flex-shrink-0 h-14">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1" />
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleBadge[user.role] || ""}`}>
                  {user.role}
                </span>
                <span className="text-slate-700 font-medium">{user.username}</span>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
