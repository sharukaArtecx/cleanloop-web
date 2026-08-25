import mongoose from "mongoose";

/**
 * Resource
 * ----------------------------------------------------------------------
 * Covers all three equipment categories (bin / truck / ppe) with one
 * schema rather than three, since they share the same lifecycle (status,
 * condition, zone assignment, servicing). Category-specific attributes
 * that don't apply to every type — a truck's plate number, a bin's
 * capacity, a PPE item's size — go in `meta` (a flexible string map)
 * instead of being modeled as separate optional fields on every document.
 *
 * If this ever needs strict per-category validation (e.g. "trucks must
 * have a plate number"), the right move is a Mongoose discriminator per
 * category rather than more optional top-level fields — flag it if you
 * get there and I'll refactor this into that shape.
 */
const ResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["bin", "truck", "ppe", "other"],
      required: [true, "Category is required"],
    },
    // Asset tag / plate number / serial number — whatever uniquely IDs
    // this specific item on a clipboard. Not enforced unique at the DB
    // level since some orgs won't tag every bin.
    identifier: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "retired", "out_of_stock"],
      default: "active",
    },
    condition: {
      type: String,
      enum: ["new", "good", "fair", "poor"],
      default: "good",
    },
    quantity: {
      type: Number,
      default: 1,
      min: [0, "Quantity cannot be negative"],
    },
    // Route/zone this resource is currently assigned to — free text for
    // now so it doesn't hard-depend on a Zone model existing yet.
    zone: {
      type: String,
      trim: true,
      default: "",
    },
    // Optional link to the crew member responsible for it (e.g. a truck's
    // assigned driver).
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Which admin logged this resource — set from the session in the POST
    // route handler, never accepted from the client request body.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastServicedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    // Category-specific extras, e.g.:
    //   bin   -> { capacity: "120L", liner: "yes" }
    //   truck -> { plate: "WP-CAB-4021", fuelType: "diesel" }
    //   ppe   -> { size: "L", expiresAt: "2027-01-01" }
    meta: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

ResourceSchema.index({ category: 1, status: 1 });
ResourceSchema.index({ name: "text", identifier: "text" });

// Prevents Mongoose's "Cannot overwrite model" error during Next.js hot reload.
export default mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);