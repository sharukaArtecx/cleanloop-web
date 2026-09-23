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

// GET /api/complaints — supports query params (?status=...&type=...&zone=...&assignedTo=...).
// Admin sees everything (filtered); employee sees reportedBy self OR assignedTo self; resident sees reportedBy self.
export async function GET(request) {
  const session = requireUser(["resident", "employee", "admin"]);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");
    const zoneParam = searchParams.get("zone");
    const assignedToParam = searchParams.get("assignedTo");

    await dbConnect();

    const filter = {};
    if (statusParam) filter.status = statusParam;
    if (typeParam) filter.type = typeParam;
    if (zoneParam) filter.zone = { $regex: zoneParam, $options: "i" };
    if (assignedToParam) filter.assignedTo = assignedToParam;

    if (session.role === "resident") {
      filter.reportedBy = session.sub;
    } else if (session.role === "employee") {
      // Employees see complaints they filed OR complaints assigned to them
      filter.$or = [{ reportedBy: session.sub }, { assignedTo: session.sub }];
    }

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role")
      .lean();

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error("GET /api/complaints error:", error);
    return NextResponse.json(
      { error: "Could not fetch complaints" },
      { status: 500 }
    );
  }
}

// POST /api/complaints — residents report missed collections/dumping;
// employees flag hazards found on their route.
export async function POST(request) {
  const session = requireUser(["resident", "employee"]);
  if (session instanceof NextResponse) return session;

  try {
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

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role")
      .lean();

    return NextResponse.json({ complaint: populatedComplaint }, { status: 201 });
  } catch (error) {
    console.error("POST /api/complaints error:", error);
    return NextResponse.json(
      { error: "Could not create complaint" },
      { status: 500 }
    );
  }
}
