"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { hasVariants } from "@/lib/product-variants";
import { formatPrice } from "@/lib/whatsapp";

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export default function OrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    deliveryDate: "",
    deliveryTime: "",
    notes: "",
  });

  useEffect(() => {
    async function loadData() {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (!sessionData.session) {
        router.push("/login");
        return;
      }

      setUser(sessionData.session);

      const productsRes = await fetch("/api/products");
      const productsData = await productsRes.json();
      setProducts(productsData.filter((p: Product) => p.active));
    }

    loadData();
  }, [router]);

  function addToCart(product: Product) {
    if (hasVariants(product)) {
      router.push(`/produto/${product.id}`);
      return;
    }
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      existing.quantity++;
      setCart([...cart]);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ]);
    }
    setMessage(`${product.name} adicionado ao carrinho!`);
    setTimeout(() => setMessage(""), 2000);
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = cart.find((item) => item.productId === productId);
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId);
      } else {
        item.quantity = quantity;
        setCart([...cart]);
      }
    }
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function submitOrder(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setMessage("Adicione produtos ao carrinho");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: formData.phone,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          deliveryDate: formData.deliveryDate,
          deliveryTime: formData.deliveryTime,
          notes: formData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar pedido");

      setMessage("Pedido criado com sucesso! Aguarde confirmação do admin.");
      setCart([]);
      setFormData({ phone: "", deliveryDate: "", deliveryTime: "", notes: "" });
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <div className="p-4">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-foam to-cappuccino/20 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <Link href="/" className="text-sm text-mocha hover:text-espresso">
            ← Voltar à loja
          </Link>
          <h1 className="mt-2 font-display text-4xl text-espresso">
            Fazer Pedido
          </h1>
          <p className="mt-2 text-espresso/70">
            Selecione os produtos que deseja encomendar
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Produtos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-[1.4rem] border border-cappuccino/50 bg-foam/75 p-6">
              <h2 className="font-display text-2xl text-espresso mb-4">
                Catálogo
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-cappuccino/30 bg-white p-3 overflow-hidden"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-2"
                    />
                    <h3 className="font-semibold text-espresso text-sm">
                      {product.name}
                    </h3>
                    <p className="text-xs text-espresso/65 line-clamp-2 mb-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg text-caramel">
                        {hasVariants(product)
                          ? `A partir de ${formatPrice(product.price)}`
                          : formatPrice(product.price)}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="btn-primary !px-3 !py-1.5 text-sm"
                      >
                        {hasVariants(product) ? "Escolher" : "Adicionar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carrinho e Formulário */}
          <div className="lg:col-span-1">
            <form
              onSubmit={submitOrder}
              className="space-y-4 rounded-[1.4rem] border border-cappuccino/50 bg-foam/75 p-5 sticky top-4"
            >
              <h2 className="font-display text-2xl text-espresso">
                Seu Pedido
              </h2>

              {/* Carrinho */}
              <div className="space-y-3 max-h-48 overflow-y-auto border-t border-cappuccino/30 pt-3">
                {cart.length === 0 ? (
                  <p className="text-sm text-espresso/60 text-center py-4">
                    Carrinho vazio
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-espresso text-xs">
                          {item.productName}
                        </p>
                        <p className="text-mocha text-xs">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.productId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-10 px-1 py-0.5 rounded border border-cappuccino/50 text-center text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              {cart.length > 0 && (
                <div className="border-t border-cappuccino/30 pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-espresso">Total:</span>
                    <span className="font-display text-xl text-caramel">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  {/* Formulário */}
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-espresso">
                      Telefone *
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="11 999999999"
                        className="field !mt-1 !text-xs"
                      />
                    </label>

                    <label className="block text-xs font-medium text-espresso">
                      Data de Entrega *
                      <input
                        type="date"
                        required
                        value={formData.deliveryDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryDate: e.target.value,
                          })
                        }
                        className="field !mt-1 !text-xs"
                      />
                    </label>

                    <label className="block text-xs font-medium text-espresso">
                      Horário de retirada
                      <input
                        type="time"
                        value={formData.deliveryTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryTime: e.target.value,
                          })
                        }
                        className="field !mt-1 !text-xs"
                      />
                    </label>

                    <label className="block text-xs font-medium text-espresso">
                      Observações
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Ex: sem açúcar, sem glúten..."
                        className="field !mt-1 !text-xs min-h-16"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={loading || cart.length === 0}
                      className="btn-primary w-full !text-sm"
                    >
                      {loading ? "Criando..." : "Confirmar Pedido"}
                    </button>
                  </div>
                </div>
              )}

              {message && (
                <p
                  className={`text-sm text-center p-2 rounded ${
                    message.includes("sucesso")
                      ? "bg-green-100 text-green-800"
                      : message.includes("Pedido criado")
                      ? "bg-green-100 text-green-800"
                      : "bg-mocha/20 text-mocha"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
