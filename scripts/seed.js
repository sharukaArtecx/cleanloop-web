/**
 * Seeds one demo account per role plus a sample route for the employee demo
 * account, so Sprint Review can log in as any persona immediately.
 *
 * Run with: npm run seed   (reads MONGODB_URI from .env.local)
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const DEMO_PASSWORD = "Password123";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env.local first");

  await mongoose.connect(uri);

  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: String,
      passwordHash: String,
      role: String,
      zone: String,
    },
    { timestamps: true }
  );
  const RouteSchema = new mongoose.Schema(
    {
      zone: String,
      date: Date,
      assignedTo: mongoose.Schema.Types.ObjectId,
      stops: [{ label: String, completed: Boolean }],
    },
    { timestamps: true }
  );

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Route = mongoose.models.Route || mongoose.model("Route", RouteSchema);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demoUsers = [
    { name: "Nadeesha Perera", email: "resident@cleanloop.test", role: "resident", zone: "Ward 4" },
    { name: "Chamathka Samarasinghe", email: "admin@cleanloop.test", role: "admin", zone: null },
    { name: "Daniel Sams", email: "employee@cleanloop.test", role: "employee", zone: null },
    { name: "Community Coordinator", email: "volunteer@cleanloop.test", role: "volunteer", zone: null },
  ];

  const createdUsers = {};
  for (const u of demoUsers) {
    const existing = await User.findOneAndUpdate(
      { email: u.email },
      { ...u, passwordHash },
      { upsert: true, new: true }
    );
    createdUsers[u.role] = existing;
    console.log(`Upserted ${u.role}: ${u.email}`);
  }

  await Route.findOneAndUpdate(
    { zone: "Ward 4", assignedTo: createdUsers.employee._id },
    {
      zone: "Ward 4",
      date: new Date(),
      assignedTo: createdUsers.employee._id,
      stops: [
        { label: "12 Lotus Lane", completed: false },
        { label: "14 Lotus Lane", completed: false },
        { label: "Corner of Palm & 3rd", completed: false },
      ],
    },
    { upsert: true }
  );
  console.log("Upserted sample route for employee");

  console.log(`\nAll demo accounts use the password: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
