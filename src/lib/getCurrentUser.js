import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { getSessionFromCookies } from "@/lib/auth";

export default async function getCurrentUser() {
  const session = getSessionFromCookies();
  if (!session) return null;

  await dbConnect();
  const user = await User.findById(session.sub);
  return user ? user.toSafeJSON() : null;
}
