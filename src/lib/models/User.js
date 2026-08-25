import mongoose from "mongoose";

const ROLES = ["resident", "admin", "employee", "volunteer"];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "resident" },
    // Resident-only: which ward/zone they belong to, used to scope schedules.
    zone: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    zone: this.zone,
  };
};

export const ROLE_VALUES = ROLES;
export default mongoose.models.User || mongoose.model("User", UserSchema);
