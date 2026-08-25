import Navbar from "@/components/Navbar";
import getCurrentUser from "@/lib/getCurrentUser";

export default async function ResidentLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-sand">
      <Navbar user={user} title="Resident dashboard" />
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
