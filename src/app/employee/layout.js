import Navbar from "@/components/Navbar";
import getCurrentUser from "@/lib/getCurrentUser";

export default async function EmployeeLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-sand">
      <Navbar user={user} title="Field app" />
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
