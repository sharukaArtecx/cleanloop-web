import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Schedule from "@/lib/models/Schedule";
import User from "@/lib/models/User";
import { requireUser } from "@/lib/requireUser";

const CreateScheduleSchema = z.object({
  zone: z.string().trim().min(1).max(80),
  dayOfWeek: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  wasteType: z.enum(["general", "recycling", "organic"]).default("general"),
});

// GET /api/schedules — resident sees only their zone; admin sees all.
export async function GET() {
  const session = requireUser(["resident", "admin"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();

  let query = {};
  if (session.role === "resident") {
    const user = await User.findById(session.sub);
    query = { zone: user?.zone || "__none__" };
  }

  const schedules = await Schedule.find(query).sort({ dayOfWeek: 1 }).lean();
  return NextResponse.json({ schedules });
}

// POST /api/schedules — admin publishes a collection schedule for a zone.
export async function POST(request) {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const parsed = CreateScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();
  const schedule = await Schedule.create({
    ...parsed.data,
    createdBy: session.sub,
  });

  return NextResponse.json({ schedule }, { status: 201 });
}
