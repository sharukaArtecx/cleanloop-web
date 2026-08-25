import mongoose from "mongoose";

const StopSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

const RouteSchema = new mongoose.Schema(
  {
    zone: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stops: { type: [StopSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Route || mongoose.model("Route", RouteSchema);
