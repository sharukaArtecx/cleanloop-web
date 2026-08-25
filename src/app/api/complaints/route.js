import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Complaint from "@/lib/models/Complaint";
import { requireUser } from "@/lib/requireUser";

const CreateComplaintSchema = z.object({
  type: z.enum(["missed_collection", "illegal_dumping", "hazard", "other"]),
  description: z.string().trim().min(5).max(1000),
  zone: z.string().trim().max(80).optional().nullable(),
});

// GET /api/complaints — admin sees everything; resident/employee see their own reports.
export async function GET() {
  const session = requireUser(["resident", "employee", "admin"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();

  const query = session.role === "admin" ? {} : { reportedBy: session.sub };
  const complaints = await Complaint.find(query)
    .sort({ createdAt: -1 })
    .populate("reportedBy", "name role")
    .lean();

  return NextResponse.json({ complaints });
}

// POST /api/complaints — residents report missed collections/dumping;
// employees flag hazards found on their route. Both land in the same
// collection so they surface together on the admin dashboard (Sprint 2
// cross-module link between US-16 and US-11).
export async function POST(request) {
  const session = requireUser(["resident", "employee"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const parsed = CreateComplaintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await dbConnect();
  const complaint = await Complaint.create({
    ...parsed.data,
    source: session.role === "employee" ? "employee" : "resident",
    reportedBy: session.sub,
  });

  return NextResponse.json({ complaint }, { status: 201 });
}
