import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { requireUser } from "@/lib/requireUser";

// GET /api/admin/employees — admin-only endpoint to list employees for assignment.
export async function GET() {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  try {
    await dbConnect();
    const employees = await User.find({ role: "employee" })
      .select("name email role zone createdAt")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("GET /api/admin/employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
