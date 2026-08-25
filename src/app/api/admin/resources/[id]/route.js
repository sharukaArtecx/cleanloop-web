import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Resource from "@/lib/models/Resource";
import { requireUser } from "@/lib/requireUser";

/**
 * PATCH /api/admin/resources/:id
 * Body: any subset of the Resource fields to update.
 */
export async function PATCH(request, { params }) {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const resource = await Resource.findByIdAndUpdate(params.id, body, {
      new: true, // return the updated doc, not the pre-update one
      runValidators: true, // re-run schema validation (enums, min, etc.) on update
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (err) {
    if (err.name === "ValidationError") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.name === "CastError") {
      return NextResponse.json({ error: "Invalid resource id" }, { status: 400 });
    }
    console.error("PATCH /api/admin/resources/:id error:", err);
    return NextResponse.json({ error: "Could not update resource" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/resources/:id
 */
export async function DELETE(request, { params }) {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;

  await dbConnect();

  try {
    const resource = await Resource.findByIdAndDelete(params.id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.name === "CastError") {
      return NextResponse.json({ error: "Invalid resource id" }, { status: 400 });
    }
    console.error("DELETE /api/admin/resources/:id error:", err);
    return NextResponse.json({ error: "Could not delete resource" }, { status: 500 });
  }
}