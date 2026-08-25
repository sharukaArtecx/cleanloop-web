import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema(
  {
    zone: { type: String, required: true, trim: true },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    wasteType: {
      type: String,
      enum: ["general", "recycling", "organic"],
      default: "general",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Schedule ||
  mongoose.model("Schedule", ScheduleSchema);
