import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Complaint from "@/lib/models/Complaint";
import { requireUser } from "@/lib/requireUser";

const UpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]),
});

// PATCH /api/complaints/:id — admin-only status updates.
export async function PATCH(request, { params }) {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();
  const update = {
    status: parsed.data.status,
    resolvedAt: parsed.data.status === "resolved" ? new Date() : null,
  };

  const complaint = await Complaint.findByIdAndUpdate(params.id, update, {
    new: true,
  });

  if (!complaint) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ complaint });
}
