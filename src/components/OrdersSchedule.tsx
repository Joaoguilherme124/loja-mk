"use client";

import { useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";

type Props = {
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
  onSlotClick?: (date: string, time: string) => void;
};

const HOUR_START = 8;
const HOUR_END = 20;
const SLOT_MINUTES = 60;
const BLOCK_MINUTES = 45;

const statusStyles: Record<
  OrderStatus,
  { bg: string; border: string; text: string }
> = {
  pendente: {
    bg: "bg-amber-100/95",
    border: "border-amber-400",
    text: "text-amber-950",
  },
  confirmado: {
    bg: "bg-sky-100/95",
    border: "border-sky-400",
    text: "text-sky-950",
  },
  pronto: {
    bg: "bg-emerald-100/95",
    border: "border-emerald-500",
    text: "text-emerald-950",
  },
  entregue: {
    bg: "bg-stone-100/90",
    border: "border-stone-400",
    text: "text-stone-700",
  },
  cancelado: {
    bg: "bg-rose-100/80",
    border: "border-rose-300",
    text: "text-rose-900/70",
  },
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTime(time?: string) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function monthTitle(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const startLabel = formatter.format(weekStart);
  const endLabel = formatter.format(weekEnd);
  if (startLabel === endLabel) {
    return startLabel.charAt(0).toUpperCase() + startLabel.slice(1);
  }
  return `${startLabel} – ${endLabel}`;
}

export function OrdersSchedule({
  orders,
  onSelectOrder,
  onSlotClick,
}: Props) {
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const todayKey = toDateKey(new Date());

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)),
    [weekAnchor]
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: HOUR_END - HOUR_START },
        (_, i) => HOUR_START + i
      ),
    []
  );

  const weekKeys = useMemo(
    () => new Set(weekDays.map((d) => toDateKey(d))),
    [weekDays]
  );

  const weekOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status === "cancelado") return false;
      const dateKey = (order.deliveryDate || "").split("T")[0];
      return Boolean(dateKey && weekKeys.has(dateKey));
    });
  }, [orders, weekKeys]);

  const timedOrders = useMemo(
    () => weekOrders.filter((o) => parseTime(o.deliveryTime) !== null),
    [weekOrders]
  );

  const untimedOrders = useMemo(
    () => weekOrders.filter((o) => parseTime(o.deliveryTime) === null),
    [weekOrders]
  );

  const gridHeight = (HOUR_END - HOUR_START) * SLOT_MINUTES;

  function goToday() {
    setWeekAnchor(startOfWeek(new Date()));
  }

  function shiftWeek(delta: number) {
    setWeekAnchor((current) => addDays(current, delta * 7));
  }

  function blockStyle(order: Order) {
    const minutes = parseTime(order.deliveryTime)!;
    const top = ((minutes - HOUR_START * 60) / gridHeight) * 100;
    const height = (BLOCK_MINUTES / gridHeight) * 100;
    const clampedTop = Math.max(0, Math.min(top, 96));
    const clampedHeight = Math.min(height, 100 - clampedTop);
    return {
      top: `${clampedTop}%`,
      height: `${Math.max(clampedHeight, 4.5)}%`,
    };
  }

  return (
    <div className="space-y-4 rounded-[1.2rem] border border-cappuccino/50 bg-foam/70 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-espresso">
            Agenda de retiradas
          </h2>
          <p className="text-sm text-espresso/65">
            Veja o dia e o horário em que cada cliente vai buscar o pedido.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost !px-3 !py-1.5 !text-sm" onClick={goToday}>
            Hoje
          </button>
          <button
            type="button"
            className="btn-ghost !px-3 !py-1.5 !text-sm"
            onClick={() => shiftWeek(-1)}
            aria-label="Semana anterior"
          >
            ←
          </button>
          <button
            type="button"
            className="btn-ghost !px-3 !py-1.5 !text-sm"
            onClick={() => shiftWeek(1)}
            aria-label="Próxima semana"
          >
            →
          </button>
          <p className="min-w-40 text-sm font-medium text-espresso">
            {monthTitle(weekAnchor)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-espresso/70">
        {(
          ["pendente", "confirmado", "pronto", "entregue"] as OrderStatus[]
        ).map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-sm border ${statusStyles[status].bg} ${statusStyles[status].border}`}
              />
              {status === "pendente"
                ? "Pendente"
                : status === "confirmado"
                  ? "Confirmado"
                  : status === "pronto"
                    ? "Pronto"
                    : "Entregue"}
            </span>
          )
        )}
      </div>

      {untimedOrders.length > 0 ? (
        <div className="rounded-xl border border-dashed border-cappuccino/60 bg-white/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mocha">
            Sem horário definido
          </p>
          <div className="flex flex-wrap gap-2">
            {untimedOrders.map((order) => {
              const style = statusStyles[order.status];
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onSelectOrder?.(order)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs ${style.bg} ${style.border} ${style.text}`}
                >
                  <span className="font-semibold">{order.customerName}</span>
                  <span className="mt-0.5 block opacity-80">
                    {(order.deliveryDate || "").split("T")[0]} ·{" "}
                    {order.items[0]?.productName || "Pedido"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-cappuccino/40 bg-white/50">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-cappuccino/30">
            <div className="bg-foam/40" />
            {weekDays.map((day) => {
              const key = toDateKey(day);
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`border-l border-cappuccino/30 px-2 py-3 text-center ${
                    isToday ? "bg-caramel/15" : "bg-foam/30"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-wide text-mocha">
                    {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </p>
                  <p
                    className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? "bg-espresso text-foam"
                        : "text-espresso"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-mocha"
                  style={{
                    top: ((hour - HOUR_START) / (HOUR_END - HOUR_START)) * 100 + "%",
                  }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const dateKey = toDateKey(day);
              const dayOrders = timedOrders.filter(
                (order) =>
                  (order.deliveryDate || "").split("T")[0] === dateKey
              );
              const isToday = dateKey === todayKey;

              return (
                <div
                  key={dateKey}
                  className={`relative border-l border-cappuccino/30 ${
                    isToday ? "bg-caramel/5" : ""
                  }`}
                  style={{ height: gridHeight }}
                >
                  {hours.map((hour) => (
                    <button
                      key={`${dateKey}-${hour}`}
                      type="button"
                      className="absolute inset-x-0 border-t border-cappuccino/20 transition hover:bg-caramel/10"
                      style={{
                        top:
                          ((hour - HOUR_START) / (HOUR_END - HOUR_START)) *
                            100 +
                          "%",
                        height: `${100 / (HOUR_END - HOUR_START)}%`,
                      }}
                      onClick={() =>
                        onSlotClick?.(
                          dateKey,
                          `${String(hour).padStart(2, "0")}:00`
                        )
                      }
                      aria-label={`Novo pedido em ${dateKey} às ${hour}:00`}
                    />
                  ))}

                  {dayOrders.map((order) => {
                    const style = statusStyles[order.status];
                    const productLabel =
                      order.items.length > 1
                        ? `${order.items[0]?.productName} +${order.items.length - 1}`
                        : order.items[0]?.productName || "Pedido";

                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => onSelectOrder?.(order)}
                        className={`absolute inset-x-1 z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left shadow-sm transition hover:brightness-95 ${style.bg} ${style.border} ${style.text}`}
                        style={blockStyle(order)}
                        title={`${order.customerName} · ${order.deliveryTime}`}
                      >
                        <p className="truncate text-[11px] font-semibold leading-tight">
                          {order.deliveryTime} · {order.customerName}
                        </p>
                        <p className="truncate text-[10px] leading-tight opacity-80">
                          {productLabel}
                        </p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {weekOrders.length === 0 ? (
        <p className="text-center text-sm text-espresso/60">
          Nenhum pedido agendado nesta semana. Clique em um horário para
          cadastrar.
        </p>
      ) : null}
    </div>
  );
}
