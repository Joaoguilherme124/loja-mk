"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus, Product } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";
import { OrdersSchedule } from "@/components/OrdersSchedule";

const statusOptions: { value: OrderStatus; label: string; color: string }[] =
  [
    { value: "pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    { value: "confirmado", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
    { value: "pronto", label: "Pronto", color: "bg-green-100 text-green-800" },
    { value: "entregue", label: "Entregue", color: "bg-emerald-100 text-emerald-900" },
    { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
  ];

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  pendente: "confirmado",
  confirmado: "pronto",
  pronto: "entregue",
};

const nextStatusLabel: Partial<Record<OrderStatus, string>> = {
  pendente: "Confirmar pedido",
  confirmado: "Marcar como pronto",
  pronto: "Marcar como entregue",
};

type DraftItem = {
  productId: string;
  quantity: number;
};

const emptyCreateForm = {
  customerName: "",
  customerPhone: "",
  deliveryDate: "",
  deliveryTime: "",
  notes: "",
  status: "confirmado" as OrderStatus,
  items: [{ productId: "", quantity: 1 }] as DraftItem[],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "todas">(
    "todas"
  );
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState<"agenda" | "lista">("agenda");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products]
  );

  const createTotal = useMemo(() => {
    return createForm.items.reduce((sum, item) => {
      const product = activeProducts.find((p) => p.id === item.productId);
      if (!product) return sum;
      return sum + product.price * item.quantity;
    }, 0);
  }, [createForm.items, activeProducts]);

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        setOrders([]);
        filterOrders([], filterStatus);
        setMessage(data?.error || "Erro ao carregar pedidos");
        return;
      }
      setOrders(data);
      filterOrders(data, filterStatus);
    } catch {
      setOrders([]);
      filterOrders([], filterStatus);
      setMessage("Erro ao carregar pedidos");
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch {
      setProducts([]);
    }
  }

  function filterOrders(items: Order[], status: OrderStatus | "todas") {
    if (status === "todas") {
      setFilteredOrders(items);
    } else {
      setFilteredOrders(items.filter((o) => o.status === status));
    }
  }

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  function handleFilterChange(status: OrderStatus | "todas") {
    setFilterStatus(status);
    filterOrders(orders, status);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function addItem() {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1 }],
    }));
  }

  function removeItem(index: number) {
    setCreateForm((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? prev.items
          : prev.items.filter((_, i) => i !== index),
    }));
  }

  function resetCreateForm() {
    setCreateForm({
      ...emptyCreateForm,
      items: [{ productId: "", quantity: 1 }],
    });
    setShowForm(false);
  }

  async function createOrder(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage("");

    try {
      const items = createForm.items.filter((item) => item.productId);
      if (!createForm.customerName.trim() || !createForm.customerPhone.trim()) {
        throw new Error("Informe nome e telefone do cliente");
      }
      if (items.length === 0) {
        throw new Error("Escolha pelo menos um produto");
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: createForm.customerName,
          customerPhone: createForm.customerPhone,
          deliveryDate: createForm.deliveryDate,
          deliveryTime: createForm.deliveryTime,
          notes: createForm.notes,
          status: createForm.status,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar pedido");

      setMessage("Pedido cadastrado com sucesso");
      resetCreateForm();
      setViewMode("agenda");
      await loadOrders();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao criar pedido"
      );
    } finally {
      setCreating(false);
    }
  }

  function startEdit(order: Order) {
    setEditingId(order.id);
    setEditForm(order);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/orders/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editForm.status,
          notes: editForm.notes,
          deliveryDate: editForm.deliveryDate,
          deliveryTime: editForm.deliveryTime,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar");
      setMessage("Pedido atualizado com sucesso");
      setEditingId(null);
      await loadOrders();
    } catch {
      setMessage("Erro ao atualizar pedido");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(order: Order, status: OrderStatus) {
    setAdvancingId(order.id);
    setMessage("");

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes: order.notes,
          deliveryDate: order.deliveryDate,
          deliveryTime: order.deliveryTime || "",
        }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");

      const label =
        statusOptions.find((option) => option.value === status)?.label ||
        status;
      setMessage(`Status atualizado para ${label} com sucesso`);
      await loadOrders();
    } catch {
      setMessage("Erro ao atualizar status");
    } finally {
      setAdvancingId(null);
    }
  }

  async function advanceStatus(order: Order) {
    const next = nextStatusMap[order.status];
    if (!next) return;
    await updateOrderStatus(order, next);
  }

  async function confirmDeleteOrder() {
    if (!orderToDelete) return;

    setDeleting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao deletar");
      setMessage("Pedido removido com sucesso");
      setOrderToDelete(null);
      await loadOrders();
    } catch {
      setMessage("Erro ao remover pedido");
    } finally {
      setDeleting(false);
    }
  }

  function formatDelivery(date: string) {
    if (!date) return "—";
    const parsed = new Date(date.includes("T") ? date : `${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("pt-BR");
  }

  function formatPickup(order: Order) {
    const date = formatDelivery(order.deliveryDate);
    const time = order.deliveryTime?.trim();
    return time ? `${date} às ${time}` : date;
  }

  function orderSortKey(order: Order) {
    const date = (order.deliveryDate || "").split("T")[0] || "9999-99-99";
    const time = order.deliveryTime?.trim() || "99:99";
    return `${date}T${time}`;
  }

  const agendaGroups = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) =>
      orderSortKey(a).localeCompare(orderSortKey(b))
    );

    const groups: { dateKey: string; label: string; orders: Order[] }[] = [];
    for (const order of sorted) {
      const dateKey = (order.deliveryDate || "").split("T")[0] || "sem-data";
      const label =
        dateKey === "sem-data" ? "Sem data definida" : formatDelivery(dateKey);
      const last = groups[groups.length - 1];
      if (!last || last.dateKey !== dateKey) {
        groups.push({ dateKey, label, orders: [order] });
      } else {
        last.orders.push(order);
      }
    }
    return groups;
  }, [filteredOrders]);

  function openCreateForSlot(date: string, time: string) {
    setCreateForm({
      ...emptyCreateForm,
      deliveryDate: date,
      deliveryTime: time,
      items: [{ productId: "", quantity: 1 }],
    });
    setShowForm(true);
    setViewMode("lista");
    window.setTimeout(() => {
      document
        .getElementById("novo-pedido-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function focusOrder(order: Order) {
    setSelectedOrderId(order.id);
    setViewMode("lista");
    setFilterStatus("todas");
    filterOrders(orders, "todas");
    window.setTimeout(() => {
      document
        .getElementById(`order-${order.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-espresso">Pedidos</h1>
          <p className="mt-2 text-espresso/70">
            Cadastre pedidos do WhatsApp e acompanhe a agenda de retirada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border border-cappuccino/50 bg-foam/75 p-1">
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                viewMode === "agenda"
                  ? "bg-espresso text-foam"
                  : "text-espresso hover:bg-white/60"
              }`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setViewMode("lista")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                viewMode === "lista"
                  ? "bg-espresso text-foam"
                  : "text-espresso hover:bg-white/60"
              }`}
            >
              Lista
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              if (!showForm) setViewMode("lista");
            }}
            className="btn-primary !text-sm"
          >
            {showForm ? "Fechar formulário" : "Novo pedido"}
          </button>
        </div>
      </div>

      {viewMode === "agenda" ? (
        <OrdersSchedule
          orders={
            filterStatus === "todas"
              ? orders
              : orders.filter((o) => o.status === filterStatus)
          }
          onSelectOrder={focusOrder}
          onSlotClick={openCreateForSlot}
        />
      ) : null}

      {message && viewMode === "agenda" ? (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.toLowerCase().includes("sucesso")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      ) : null}

      {showForm ? (
        <form
          id="novo-pedido-form"
          onSubmit={createOrder}
          className="space-y-4 rounded-[1.2rem] border border-cappuccino/50 bg-foam/70 p-5"
        >
          <div>
            <h2 className="font-display text-2xl text-espresso">
              Novo pedido (WhatsApp)
            </h2>
            <p className="mt-1 text-sm text-espresso/65">
              Preencha com os dados que o cliente enviou no chat.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-xs font-medium text-espresso">
              Nome do cliente *
              <input
                className="field !text-sm"
                value={createForm.customerName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, customerName: e.target.value })
                }
                placeholder="Ex.: Maria Silva"
                required
              />
            </label>
            <label className="block space-y-1 text-xs font-medium text-espresso">
              Telefone / WhatsApp *
              <input
                className="field !text-sm"
                value={createForm.customerPhone}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    customerPhone: e.target.value,
                  })
                }
                placeholder="Ex.: 11999999999"
                required
              />
            </label>
            <label className="block space-y-1 text-xs font-medium text-espresso">
              Data de retirada
              <input
                type="date"
                className="field !text-sm"
                value={createForm.deliveryDate}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    deliveryDate: e.target.value,
                  })
                }
              />
            </label>
            <label className="block space-y-1 text-xs font-medium text-espresso">
              Horário de retirada
              <input
                type="time"
                className="field !text-sm"
                value={createForm.deliveryTime}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    deliveryTime: e.target.value,
                  })
                }
              />
            </label>
            <label className="block space-y-1 text-xs font-medium text-espresso">
              Status inicial
              <select
                className="field !text-sm"
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    status: e.target.value as OrderStatus,
                  })
                }
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-espresso">Itens *</p>
              <button
                type="button"
                onClick={addItem}
                className="btn-ghost !px-3 !py-1.5 !text-xs"
              >
                + Adicionar item
              </button>
            </div>

            {createForm.items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-cappuccino/40 bg-white/40 p-3 md:grid-cols-[1fr_120px_auto]"
              >
                <label className="block space-y-1 text-xs font-medium text-espresso">
                  Produto
                  <select
                    className="field !text-sm"
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(index, { productId: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecione...</option>
                    {activeProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatPrice(product.price)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-xs font-medium text-espresso">
                  Qtd.
                  <input
                    type="number"
                    min={1}
                    className="field !text-sm"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn-ghost !px-3 !py-2 !text-xs !text-red-800"
                    disabled={createForm.items.length === 1}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}

            <p className="text-sm text-espresso/80">
              Total estimado:{" "}
              <strong className="text-caramel">{formatPrice(createTotal)}</strong>
            </p>
          </div>

          <label className="block space-y-1 text-xs font-medium text-espresso">
            Observações (do WhatsApp)
            <textarea
              className="field !text-sm min-h-20"
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm({ ...createForm, notes: e.target.value })
              }
              placeholder="Ex.: sem açúcar, entrega à tarde, bolo para 10 pessoas..."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn-primary !text-sm"
              disabled={creating}
            >
              {creating ? "Salvando..." : "Salvar pedido"}
            </button>
            <button
              type="button"
              onClick={resetCreateForm}
              className="btn-ghost !text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {viewMode === "lista" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange("todas")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filterStatus === "todas"
                  ? "bg-espresso text-foam"
                  : "bg-foam/75 border border-cappuccino/50 text-espresso hover:bg-foam"
              }`}
            >
              Todos ({orders.length})
            </button>
            {statusOptions.map((option) => {
              const count = orders.filter(
                (o) => o.status === option.value
              ).length;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterStatus === option.value
                      ? `${option.color} ring-2 ring-offset-2 ring-espresso`
                      : "bg-foam/75 border border-cappuccino/50 text-espresso hover:bg-foam"
                  }`}
                >
                  {option.label} ({count})
                </button>
              );
            })}
          </div>

          {message ? (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.toLowerCase().includes("sucesso")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          ) : null}

          <div className="space-y-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-espresso/60">
                Nenhum pedido encontrado. Use &quot;Novo pedido&quot; para
                cadastrar um pedido do WhatsApp.
              </div>
            ) : (
              agendaGroups.map((group) => (
                <section key={group.dateKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl text-espresso">
                      {group.label}
                    </h2>
                    <span className="text-xs text-espresso/55">
                      {group.orders.length}{" "}
                      {group.orders.length === 1 ? "pedido" : "pedidos"}
                    </span>
                  </div>

                  {group.orders.map((order) => (
                    <div
                      key={order.id}
                      id={`order-${order.id}`}
                      className={`rounded-[1.2rem] border bg-foam/70 p-4 ${
                        selectedOrderId === order.id
                          ? "border-espresso ring-2 ring-espresso/30"
                          : "border-cappuccino/50"
                      }`}
                    >
                      {editingId === order.id ? (
                        <form onSubmit={saveEdit} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="text-xs font-medium text-espresso block mb-1">
                                Status
                              </label>
                              <select
                                value={editForm.status || "pendente"}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    status: e.target.value as OrderStatus,
                                  })
                                }
                                className="field !text-sm"
                              >
                                {statusOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-espresso block mb-1">
                                Data de retirada
                              </label>
                              <input
                                type="date"
                                value={
                                  editForm.deliveryDate?.split("T")[0] || ""
                                }
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    deliveryDate: e.target.value,
                                  })
                                }
                                className="field !text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-espresso block mb-1">
                                Horário de retirada
                              </label>
                              <input
                                type="time"
                                value={editForm.deliveryTime || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    deliveryTime: e.target.value,
                                  })
                                }
                                className="field !text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-espresso block mb-1">
                              Notas
                            </label>
                            <textarea
                              value={editForm.notes || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  notes: e.target.value,
                                })
                              }
                              className="field !text-sm min-h-20"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="btn-primary !text-sm"
                              disabled={loading}
                            >
                              {loading ? "Salvando..." : "Salvar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="btn-ghost !text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-caramel/15 px-4 py-3">
                            <div>
                              <p className="text-xs text-mocha">Retirada</p>
                              <p className="font-display text-2xl text-espresso">
                                {order.deliveryTime?.trim()
                                  ? order.deliveryTime
                                  : "Horário a definir"}
                              </p>
                              <p className="text-sm text-espresso/70">
                                {formatPickup(order)}
                              </p>
                            </div>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                statusOptions.find(
                                  (s) => s.value === order.status
                                )?.color
                              }`}
                            >
                              {
                                statusOptions.find(
                                  (s) => s.value === order.status
                                )?.label
                              }
                            </span>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3 items-start mb-4">
                            <div>
                              <p className="text-xs text-mocha mb-1">Cliente</p>
                              <p className="font-semibold text-espresso">
                                {order.customerName}
                              </p>
                              {order.customerEmail ? (
                                <p className="text-xs text-espresso/65">
                                  {order.customerEmail}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <p className="text-xs text-mocha mb-1">Contato</p>
                              <p className="font-semibold text-espresso">
                                {order.customerPhone}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-mocha mb-1">Pedido</p>
                              <p className="font-semibold text-espresso text-xs break-all">
                                {order.id}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/50 rounded-lg p-3 mb-4">
                            <p className="text-sm font-semibold text-espresso mb-2">
                              Itens:
                            </p>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-xs text-espresso/80"
                                >
                                  <span>
                                    {item.quantity}x {item.productName}
                                  </span>
                                  <span className="font-medium">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-cappuccino/30 mt-2 pt-2 flex justify-between text-sm font-semibold text-espresso">
                              <span>Total:</span>
                              <span className="text-caramel text-base">
                                {formatPrice(order.totalPrice)}
                              </span>
                            </div>
                          </div>

                          {order.notes ? (
                            <div className="bg-caramel/10 rounded p-2 mb-4">
                              <p className="text-xs font-medium text-espresso mb-1">
                                Observações:
                              </p>
                              <p className="text-xs text-espresso/80">
                                {order.notes}
                              </p>
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            {nextStatusMap[order.status] ? (
                              <button
                                type="button"
                                onClick={() => advanceStatus(order)}
                                className="btn-primary !px-4 !py-2 !text-sm flex-1"
                                disabled={advancingId === order.id}
                              >
                                {advancingId === order.id
                                  ? "Atualizando..."
                                  : nextStatusLabel[order.status]}
                              </button>
                            ) : null}
                            {order.status !== "cancelado" &&
                            order.status !== "entregue" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderStatus(order, "cancelado")
                                }
                                className="btn-ghost !px-4 !py-2 !text-sm !text-red-800"
                                disabled={advancingId === order.id}
                              >
                                Cancelar
                              </button>
                            ) : null}
                            {order.status === "cancelado" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderStatus(order, "pendente")
                                }
                                className="btn-primary !px-4 !py-2 !text-sm flex-1"
                                disabled={advancingId === order.id}
                              >
                                {advancingId === order.id
                                  ? "Atualizando..."
                                  : "Reabrir pedido"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => startEdit(order)}
                              className="btn-ghost !px-4 !py-2 !text-sm"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(order)}
                              className="btn-ghost !px-4 !py-2 !text-sm !text-red-800"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              ))
            )}
          </div>
        </>
      ) : null}

      {orderToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-order-title"
            className="w-full max-w-md rounded-[1.5rem] border border-cappuccino/50 bg-foam p-6 shadow-[0_24px_60px_rgba(59,42,34,0.25)]"
          >
            <h2
              id="delete-order-title"
              className="font-display text-3xl text-espresso"
            >
              Remover pedido?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-espresso/75">
              Isso vai apagar o pedido de{" "}
              <strong className="text-espresso">
                {orderToDelete.customerName}
              </strong>
              {orderToDelete.deliveryTime || orderToDelete.deliveryDate
                ? ` agendado para ${formatPickup(orderToDelete)}`
                : ""}
              . Essa ação não pode ser desfeita.
            </p>
            {orderToDelete.items.length > 0 ? (
              <p className="mt-3 rounded-xl bg-caramel/10 px-3 py-2 text-xs text-espresso/80">
                {orderToDelete.items
                  .map((item) => `${item.quantity}x ${item.productName}`)
                  .join(" · ")}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmDeleteOrder}
                className="btn-primary !bg-red-800 !text-sm hover:!bg-red-900"
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Sim, remover pedido"}
              </button>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="btn-ghost !text-sm"
                disabled={deleting}
              >
                Manter pedido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
