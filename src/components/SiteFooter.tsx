import Link from "next/link";

type Props = {
  storeName: string;
};

export function SiteFooter({ storeName }: Props) {
  return (
    <footer className="border-t border-cappuccino/50 bg-espresso text-foam">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="font-display text-2xl tracking-wide">{storeName}</p>
          <p className="mt-2 max-w-md text-sm text-foam/70">
            Catálogo online com pedidos diretos no WhatsApp.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-foam/75">
          <Link href="/catalogo" className="hover:text-foam">
            Catálogo
          </Link>
          <Link href="/admin/login" className="hover:text-foam">
            Painel
          </Link>
        </div>
      </div>
    </footer>
  );
}
