"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/promocoes", label: "Promoções" },
  { href: "/admin/novidades", label: "Novidades" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <aside className="h-fit rounded-[1.4rem] border border-cappuccino/50 bg-foam/70 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <Image
          src="/logo-mk-gourmet.png"
          alt="MK Gourmet"
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover ring-1 ring-cappuccino/50"
        />
        <div>
          <p className="font-display text-2xl text-espresso">MK Gourmet</p>
          <p className="text-xs uppercase tracking-[0.16em] text-mocha">
            Painel
          </p>
        </div>
      </div>
      <nav className="mt-6 flex flex-col gap-1">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-caramel/25 text-espresso"
                  : "text-espresso/80 hover:bg-cappuccino/35 hover:text-espresso"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="mt-4 rounded-xl px-3 py-2 text-sm text-mocha hover:bg-cappuccino/25"
        >
          Ver loja
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl px-3 py-2 text-left text-sm text-espresso/60 transition hover:bg-cappuccino/25 hover:text-espresso"
        >
          Sair
        </button>
      </nav>
    </aside>
  );
}
