import Navbar from "@/components/Navbar";
import getCurrentUser from "@/lib/getCurrentUser";

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-sand">
      <Navbar user={user} title="Operations dashboard" />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
