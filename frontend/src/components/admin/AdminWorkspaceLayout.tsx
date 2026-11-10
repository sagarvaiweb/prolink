"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Flag,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";

const adminSections = [
  {
    href: "/admin/dashboard",
    label: "Overview",
    description: "Platform pulse",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/admin/post-reports",
    label: "Post reports",
    description: "Community safety",
    icon: Flag,
  },
  {
    href: "/admin/jobs",
    label: "Job moderation",
    description: "Review listings",
    icon: BriefcaseBusiness,
  },
  {
    href: "/admin/companies",
    label: "Company review",
    description: "Verify organizations",
    icon: Building2,
  },
];

export default function AdminWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  if (user?.role !== "admin") return <>{children}</>;

  const activeSection = adminSections.find(({ href }) => pathname === href)?.label
    ?? "Admin workspace";
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-900">
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        id="admin-navigation-panel"
        className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col overflow-y-auto border-r border-white/10 bg-[#0d172c] px-5 py-5 text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 lg:translate-x-0 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute -left-20 top-24 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 bottom-28 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl" />

        <div className="relative flex items-center justify-between gap-3 px-1">
          <Link
            href="/admin/dashboard"
            onClick={() => setIsMenuOpen(false)}
            className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-lime-200 to-teal-300 text-[#10213a] shadow-lg shadow-teal-300/10 transition group-hover:rotate-3">
              <ShieldCheck size={23} strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-[17px] font-extrabold tracking-tight">ProLink</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Control room</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setIsMenuOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-8 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-3.5 py-3">
          <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-teal-300/10 text-teal-200">
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full border-2 border-[#15223a] bg-lime-300" />
            <ShieldCheck size={16} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-slate-100">Admin workspace</span>
            <span className="mt-0.5 block truncate text-[10px] text-slate-400">Platform operations</span>
          </span>
          <span className="ml-auto rounded-full border border-lime-200/15 bg-lime-200/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-lime-200">Live</span>
        </div>

        <nav aria-label="Admin navigation" className="relative mt-8">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          <div className="space-y-1.5">
            {adminSections.map(({ href, label, description, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                  className={`group relative flex min-h-[58px] items-center gap-3 rounded-2xl px-3.5 py-2.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 ${
                    isActive
                      ? "bg-white/[0.11] text-white shadow-inner shadow-white/[0.03]"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                  }`}
                >
                  {isActive && <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-lime-300 shadow-[0_0_14px_rgba(190,242,100,0.8)]" />}
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${isActive ? "bg-lime-200 text-[#12213a]" : "bg-white/[0.06] text-slate-400 group-hover:bg-white/10 group-hover:text-teal-200"}`}>
                    <Icon size={18} strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold">{label}</span>
                    <span className={`mt-0.5 block truncate text-[10px] ${isActive ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"}`}>{description}</span>
                  </span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-teal-200" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative mt-auto pt-8">
          <Link
            href="/feed"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-between rounded-xl px-3 py-3 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
          >
            <span>Return to ProLink</span>
            <ArrowUpRight size={15} />
          </Link>
          <div className="mt-3 flex items-center gap-3 border-t border-white/10 px-2 pt-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-teal-200 to-lime-200 text-xs font-extrabold text-[#10213a]">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-white">{displayName || user.username}</span>
              <span className="mt-0.5 block text-[10px] capitalize text-slate-500">{user.role} access</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.7)]" aria-label="Active session" />
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[286px]">
        <header className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:sticky lg:h-[76px] lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open admin navigation"
              aria-controls="admin-navigation-panel"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">ProLink / Operations</p>
              <h2 className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:mt-0.5 sm:text-base">{activeSection}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm sm:gap-2.5 sm:px-3.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
            <span className="text-[10px] font-bold text-slate-600 sm:text-xs">Secure session</span>
          </div>
        </header>
        <div className="pt-[68px] lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
