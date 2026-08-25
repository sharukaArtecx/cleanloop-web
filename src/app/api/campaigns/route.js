import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Campaign from "@/lib/models/Campaign";
import { requireUser } from "@/lib/requireUser";

const CreateCampaignSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional().default(""),
  zone: z.string().trim().max(80).optional().nullable(),
  date: z.coerce.date(),
});

// GET /api/campaigns — visible to any authenticated user (residents can browse too).
export async function GET() {
  const session = requireUser(["resident", "admin", "employee", "volunteer"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();
  const campaigns = await Campaign.find({}).sort({ date: 1 }).lean();
  return NextResponse.json({ campaigns });
}

// POST /api/campaigns — volunteers publish a cleanup/recycling drive.
export async function POST(request) {
  const session = requireUser(["volunteer"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const parsed = CreateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await dbConnect();
  const campaign = await Campaign.create({
    ...parsed.data,
    organizer: session.sub,
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
