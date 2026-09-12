import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Route from "@/lib/models/Route";
import { requireUser } from "@/lib/requireUser";

const CreateRouteSchema = z.object({
  zone: z.string().trim().min(1).max(80),
  date: z.coerce.date(),
  assignedTo: z.string().min(1),
  stops: z.array(z.string().trim().min(1)).min(1),
});

// GET /api/routes — employee sees only routes assigned to them; admin sees all.
export async function GET() {
  const session = requireUser(["employee", "admin"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();
  const query = session.role === "employee" ? { assignedTo: session.sub } : {};
  const routes = await Route.find(query).sort({ date: -1 }).lean();

  return NextResponse.json({ routes });
}

// POST /api/routes — admin builds a route and assigns it to a crew member.
export async function POST(request) {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const parsed = CreateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await dbConnect();
  const route = await Route.create({
    zone: parsed.data.zone,
    date: parsed.data.date,
    assignedTo: parsed.data.assignedTo,
    stops: parsed.data.stops.map((label) => ({ label })),
  });

  return NextResponse.json({ route }, { status: 201 });
}
