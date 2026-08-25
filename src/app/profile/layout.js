import Navbar from "@/components/Navbar";
import getCurrentUser from "@/lib/getCurrentUser";

// Shared across all four roles — unlike admin/employee/resident/volunteer
// layouts, this doesn't gate by role. middleware.js already exempts
// /profile from the "redirect to own role home" rule.
export default async function ProfileLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-loop-100">
      <Navbar user={user} title="Account & security" />
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}