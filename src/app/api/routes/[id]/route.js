import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Route from "@/lib/models/Route";
import { requireUser } from "@/lib/requireUser";

const CompleteStopSchema = z.object({
  stopId: z.string().min(1),
});

// PATCH /api/routes/:id — employee marks one stop on their assigned route complete.
export async function PATCH(request, { params }) {
  const session = requireUser(["employee"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const parsed = CompleteStopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();
  const route = await Route.findOne({ _id: params.id, assignedTo: session.sub });
  if (!route) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stop = route.stops.id(parsed.data.stopId);
  if (!stop) {
    return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  }

  stop.completed = true;
  stop.completedAt = new Date();
  await route.save();

  return NextResponse.json({ route });
}
