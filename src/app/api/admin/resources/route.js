import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Resource from "@/lib/models/Resource";
import { requireUser } from "@/lib/requireUser";

/**
 * GET /api/admin/resources
 * Optional query params: ?category=truck&status=active&q=search+text
 */
export async function GET(request) {
  // requireUser is synchronous — no `await` here, unlike the earlier
  // guessed guard. If the check fails it returns a NextResponse directly,
  // which we just return as-is; if it passes it returns the decoded
  // session ({ sub, role }).
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { identifier: { $regex: q, $options: "i" } },
    ];
  }

  try {
    const resources = await Resource.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ resources });
  } catch (err) {
    console.error("GET /api/admin/resources error:", err);
    return NextResponse.json({ error: "Could not load resources" }, { status: 500 });
  }
}

/**
 * POST /api/admin/resources
 * Body: { name, category, identifier?, status?, condition?, quantity?,
 *         zone?, lastServicedAt?, notes?, meta? }
 */
export async function POST(request) {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.category) {
    return NextResponse.json(
      { error: "name and category are required" },
      { status: 400 }
    );
  }

  try {
    const resource = await Resource.create({
      name: body.name,
      category: body.category,
      identifier: body.identifier || "",
      status: body.status || "active",
      condition: body.condition || "good",
      quantity: body.quantity ?? 1,
      zone: body.zone || "",
      lastServicedAt: body.lastServicedAt || null,
      notes: body.notes || "",
      meta: body.meta || {},
      // session.sub is the user id encoded in the JWT (see src/lib/auth.js).
      createdBy: session.sub,
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (err) {
    if (err.name === "ValidationError") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("POST /api/admin/resources error:", err);
    return NextResponse.json({ error: "Could not create resource" }, { status: 500 });
  }
}