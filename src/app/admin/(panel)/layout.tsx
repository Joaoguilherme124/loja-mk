import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-5 py-8 md:grid-cols-[220px_1fr] md:px-8">
        <AdminSidebar />
        <div>{children}</div>
      </div>
    </div>
  );
}
