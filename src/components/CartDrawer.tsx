"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SafeImage } from "@/components/SafeImage";
import { useCart } from "@/components/CartProvider";
import {
  formatQuantity,
  formatRate,
  isSoldByKg,
  quantityStep,
} from "@/lib/sold-by";
import { buildCartWhatsAppLink, formatPrice } from "@/lib/whatsapp";

type Props = {
  whatsapp: string;
};

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 0=domingo … 6=sábado. Retirada: terça (2) a sábado (6). */
function weekdayFromIso(isoDate: string) {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day).getDay();
}

function isAllowedPickupDate(isoDate: string) {
  const weekday = weekdayFromIso(isoDate);
  return weekday >= 2 && weekday <= 6;
}

const PICKUP_DATE_HINT =
  "Retiradas de terça a sábado (domingo e segunda não disponíveis).";
const PICKUP_DATE_BLOCKED =
  "Escolha um dia de terça a sábado. Domingo e segunda não estão disponíveis.";

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
  const router = useRouter();
  const pathname = usePathname();
  const [pickupDate, setPickupDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const minDate = useMemo(() => todayIsoDate(), []);

  useEffect(() => {
    if (!isOpen) return;
    router.prefetch("/catalogo");
  }, [isOpen, router]);

  function continueToCatalog(event: MouseEvent<HTMLAnchorElement>) {
    closeCart();
    if (pathname === "/catalogo") {
      event.preventDefault();
    }
  }

  if (!isOpen) return null;

  const promoPayload =
    promo && discount > 0
      ? {
          title: promo.title,
          discountLabel: promo.discountLabel,
          discountAmount: discount,
          subtotal,
          total,
        }
      : undefined;

  async function openWhatsApp() {
    if (!pickupDate) {
      setDateError("Escolha o dia de retirada");
      return;
    }
    if (!isAllowedPickupDate(pickupDate)) {
      setDateError(PICKUP_DATE_BLOCKED);
      return;
    }
    const name = customerName.trim();
    const phone = customerPhone.replace(/\D/g, "");
    if (!name) {
      setSubmitError("Informe seu nome.");
      return;
    }
    if (phone.length < 10) {
      setSubmitError("Informe um WhatsApp válido com DDD.");
      return;
    }

    setDateError("");
    setSubmitError("");
    setSending(true);

    const cartItems = items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      soldBy: item.soldBy,
      variantId: item.variantId,
    }));

    try {
      const res = await fetch("/api/orders/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          deliveryDate: pickupDate,
          totalPrice: total,
          items: cartItems,
          notes:
            discount > 0 && promo
              ? `Promo ${promo.title} (${promo.discountLabel})`
              : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível registrar o pedido.");
      }

      const link = buildCartWhatsAppLink(
        whatsapp,
        items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          soldBy: item.soldBy,
        })),
        `Cliente: ${name} · Contato: ${phone}`,
        promoPayload,
        pickupDate
      );
      window.open(link, "_blank", "noopener,noreferrer");
      clearCart();
      setPickupDate("");
      setCustomerName("");
      setCustomerPhone("");
      closeCart();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Erro ao enviar pedido"
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-espresso/45 backdrop-blur-[2px]"
        aria-label="Minimizar carrinho"
        onClick={closeCart}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-cappuccino/40 bg-foam shadow-[0_24px_60px_rgba(59,42,34,0.28)]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-cappuccino/40 px-5 py-5">
          <div>
            <h2 className="font-display text-3xl text-espresso">Seu pedido</h2>
            <p className="mt-1 text-sm text-espresso/65">
              Monte a lista e envie tudo de uma vez no WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="shrink-0 rounded-full border border-red-600 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Minimizar carrinho
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
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

              {items.map((item) => {
                const kind = item.kind === "docinhos" ? "docinhos" : undefined;
                const step = quantityStep(item.soldBy, kind);
                return (
                  <div
                    key={`${item.productId}:${item.variantId || ""}`}
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
                        {formatRate(item.price, item.soldBy, formatPrice)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-cappuccino bg-white/80"
                          onClick={() =>
                            setQuantity(
                              item.productId,
                              item.quantity - step,
                              item.variantId
                            )
                          }
                          aria-label="Diminuir"
                        >
                          −
                        </button>
                        <span className="min-w-10 text-center text-sm font-semibold">
                          {isSoldByKg(item.soldBy) || kind === "docinhos"
                            ? formatQuantity(item.quantity, item.soldBy, kind)
                            : item.quantity}
                        </span>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-cappuccino bg-white/80"
                          onClick={() =>
                            setQuantity(
                              item.productId,
                              item.quantity + step,
                              item.variantId
                            )
                          }
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="ml-auto text-xs font-semibold text-red-800"
                          onClick={() =>
                            removeItem(item.productId, item.variantId)
                          }
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="space-y-3 border-t border-cappuccino/40 pt-4">
                <label className="block space-y-2 text-sm font-medium text-espresso">
                  Seu nome
                  <input
                    className="field max-w-full min-w-0"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setSubmitError("");
                    }}
                    placeholder="Como devemos chamar você"
                    autoComplete="name"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-espresso">
                  Seu WhatsApp
                  <input
                    className="field max-w-full min-w-0"
                    type="tel"
                    inputMode="numeric"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value.replace(/\D/g, ""));
                      setSubmitError("");
                    }}
                    placeholder="DDD + número"
                    autoComplete="tel"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-espresso">
                  Dia de retirada
                  <input
                    type="date"
                    className="field max-w-full min-w-0"
                    min={minDate}
                    value={pickupDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setPickupDate("");
                        setDateError("");
                        return;
                      }
                      if (!isAllowedPickupDate(value)) {
                        setPickupDate("");
                        setDateError(PICKUP_DATE_BLOCKED);
                        return;
                      }
                      setPickupDate(value);
                      setDateError("");
                    }}
                    required
                  />
                  <span className="block text-xs font-normal text-espresso/60">
                    {PICKUP_DATE_HINT} Horário e valor do topo confirmamos no
                    WhatsApp.
                  </span>
                </label>
                {dateError ? (
                  <p className="text-sm text-red-800">{dateError}</p>
                ) : null}
                {submitError ? (
                  <p className="text-sm text-red-800">{submitError}</p>
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t border-cappuccino/40 px-5 py-4">
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
              <button
                type="button"
                className="btn-primary w-full"
                onClick={openWhatsApp}
                disabled={sending}
              >
                {sending ? "Registrando..." : "Pedir no WhatsApp"}
              </button>
              <Link
                href="/catalogo"
                className="btn-ghost w-full !text-sm"
                onClick={continueToCatalog}
              >
                Continuar no catálogo
              </Link>
            </>
          ) : (
            <Link
              href="/catalogo"
              className="btn-primary w-full"
              onClick={continueToCatalog}
            >
              Continuar no catálogo
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
