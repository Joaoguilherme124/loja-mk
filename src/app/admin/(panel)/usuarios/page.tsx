"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserData = {
  id: string;
  email: string;
  name: string;
  role: "cliente" | "empreendedor" | "admin";
  active: boolean;
  createdAt: string;
};

export default function UsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "cliente" as "cliente" | "empreendedor" | "admin",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Usuário criado com sucesso!");
      setFormData({ name: "", email: "", password: "", role: "cliente" });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário");
    }
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar");
      setSuccess("Usuário atualizado!");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, active: !currentActive }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar");
      setSuccess(
        !currentActive ? "Usuário ativado!" : "Usuário desativado!"
      );
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Erro ao deletar");
      setSuccess("Usuário deletado!");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar");
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-espresso">Gerenciar Usuários</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? "Cancelar" : "Novo Usuário"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-100 p-4 text-green-700">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateUser} className="space-y-4 rounded-2xl border border-cappuccino/40 bg-white/60 p-8 backdrop-blur">
          <h2 className="font-display text-2xl text-espresso">Criar Novo Usuário</h2>

          <label className="block space-y-2 text-sm font-medium text-espresso">
            Nome
            <input
              type="text"
              className="field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-espresso">
            Email
            <input
              type="email"
              className="field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-espresso">
            Senha
            <input
              type="password"
              className="field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-espresso">
            Tipo de Conta
            <select
              className="field"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <option value="cliente">Cliente</option>
              <option value="empreendedor">Empreendedor</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button type="submit" className="btn-primary w-full">
            Criar Usuário
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-cappuccino/40 bg-white/60 p-8 backdrop-blur">
        <h2 className="font-display text-2xl text-espresso mb-6">
          Usuários ({users.length})
        </h2>

        {users.length === 0 ? (
          <p className="text-espresso/70">Nenhum usuário cadastrado</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-cappuccino/20 bg-foam/20 p-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-espresso">{user.name}</p>
                  <p className="text-sm text-espresso/70">{user.email}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      user.role === "admin"
                        ? "bg-red-200 text-red-700"
                        : user.role === "empreendedor"
                        ? "bg-orange-200 text-orange-700"
                        : "bg-blue-200 text-blue-700"
                    }`}>
                      {user.role === "admin"
                        ? "Admin"
                        : user.role === "empreendedor"
                        ? "Empreendedor"
                        : "Cliente"}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      user.active
                        ? "bg-green-200 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-cappuccino/30"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="empreendedor">Empreendedor</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => handleToggleActive(user.id, user.active)}
                    className={`text-xs px-3 py-1 rounded font-semibold transition ${
                      user.active
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {user.active ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-xs px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-semibold transition"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
