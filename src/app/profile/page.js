import { redirect } from "next/navigation";
import getCurrentUser from "@/lib/getCurrentUser";
import ProfileManager from "@/components/ProfileManager";

export const metadata = {
  title: "Account & security — CleanLoop",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  // Belt-and-suspenders: middleware.js already redirects unauthenticated
  // requests to /login, but a server component shouldn't rely on that
  // alone (e.g. if the matcher config ever changes).
  if (!user) {
    redirect("/login?next=/profile");
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-loop-950">
        Account &amp; security
      </h1>
      <p className="mt-1 text-sm text-loop-500">
        Update your name, email, and password.
      </p>

      <ProfileManager initialUser={user} />
    </div>
  );
}