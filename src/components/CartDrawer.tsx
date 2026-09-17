"use client";

import { SafeImage } from "@/components/SafeImage";
import { useCart } from "@/components/CartProvider";
import { buildCartWhatsAppLink, formatPrice } from "@/lib/whatsapp";

type Props = {
  whatsapp: string;
};

export function CartDrawer({ whatsapp }: Props) {
  const {
    items,
    promo,
    subtotal,
    discount,
    total,
    isOpen,
    closeCart,
    removeItem,
    setQuantity,
    clearCart,
  } = useCart();

  if (!isOpen) return null;

  const orderLink =
    items.length > 0
      ? buildCartWhatsAppLink(
          whatsapp,
          items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          undefined,
          promo && discount > 0
            ? {
                title: promo.title,
                discountLabel: promo.discountLabel,
                discountAmount: discount,
                subtotal,
                total,
              }
            : undefined
        )
      : "#";

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-espresso/45 backdrop-blur-[2px]"
        aria-label="Fechar pedido"
        onClick={closeCart}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-cappuccino/40 bg-foam shadow-[0_24px_60px_rgba(59,42,34,0.28)]">
        <div className="flex items-start justify-between gap-3 border-b border-cappuccino/40 px-5 py-5">
          <div>
            <h2 className="font-display text-3xl text-espresso">Seu pedido</h2>
            <p className="mt-1 text-sm text-espresso/65">
              Monte a lista e envie tudo de uma vez no WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full px-3 py-1 text-sm text-espresso/70 hover:bg-cappuccino/20"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-cappuccino/50 bg-white/40 p-5 text-sm text-espresso/70">
              Seu pedido ainda está vazio. Adicione produtos do catálogo.
            </p>
          ) : (
            <>
              {promo && discount > 0 ? (
                <div className="rounded-2xl border border-caramel/40 bg-caramel/15 px-4 py-3 text-sm text-espresso">
                  <p className="font-semibold">{promo.title}</p>
                  <p className="mt-1 text-espresso/75">
                    Desconto {promo.discountLabel} aplicado no combo (1 unidade
                    de cada item da promoção).
                  </p>
                </div>
              ) : null}

              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded-2xl border border-cappuccino/40 bg-white/50 p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cappuccino/30">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-espresso">
                      {item.name}
                    </p>
                    <p className="text-sm text-mocha">
                      {formatPrice(item.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-full border border-cappuccino bg-white/80"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                        aria-label="Diminuir"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-full border border-cappuccino bg-white/80"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-xs font-semibold text-red-800"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="space-y-3 border-t border-cappuccino/40 px-5 py-5">
          {discount > 0 ? (
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between text-espresso/70">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-800">
                <span>Desconto {promo?.discountLabel}</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-sm">
            <span className="text-espresso/70">Total estimado</span>
            <span className="font-display text-2xl text-espresso">
              {formatPrice(total)}
            </span>
          </div>
          {items.length > 0 ? (
            <>
              <a
                href={orderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full"
                onClick={closeCart}
              >
                Pedir no WhatsApp
              </a>
              <button
                type="button"
                className="btn-ghost w-full !text-sm"
                onClick={clearCart}
              >
                Limpar pedido
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={closeCart}
            >
              Continuar no catálogo
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
