import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function RoleNotice({ roleName }: { roleName: string }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6">
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert size={23} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This page is available to {roleName} accounts.
        </p>
        <Link
          href="/feed"
          className="mt-5 inline-flex rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900"
        >
          Return to feed
        </Link>
      </section>
    </main>
  );
}
