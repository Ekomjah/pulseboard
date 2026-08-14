require("dotenv").config();
const mongoose = require("mongoose");
const { subDays } = require("date-fns");
const { connectDB } = require("./config/db");
const User = require("./models/User");
const Update = require("./models/Update");

const SEED_USERS = [
  {
    email: "amina@pulseboard.dev",
    displayName: "Amina Yusuf",
    password: "password123",
    role: "MEMBER",
  },
  {
    email: "diego@pulseboard.dev",
    displayName: "Diego Fernandez",
    password: "password123",
    role: "LEAD",
  },
  {
    email: "priya@pulseboard.dev",
    displayName: "Priya Nair",
    password: "password123",
    role: "MEMBER",
  },
  {
    email: "sam@pulseboard.dev",
    displayName: "Sam Okoro",
    password: "password123",
    role: "MEMBER",
  },
];

const SEED_UPDATES = [
  {
    authorEmail: "amina@pulseboard.dev",
    text: "Finished the auth middleware and wired up JWT verification.",
    status: "done",
  },
  {
    authorEmail: "diego@pulseboard.dev",
    text: "Still fighting with the CI pipeline, Docker cache keeps invalidating.",
    status: "blocked",
  },
  {
    authorEmail: "priya@pulseboard.dev",
    text: "Feed UI is coming together, just need to hook up reactions.",
    status: "on-track",
  },
  {
    authorEmail: "sam@pulseboard.dev",
    text: "Waiting on design review before I can finish the update form styling.",
    status: "blocked",
  },
  {
    authorEmail: "amina@pulseboard.dev",
    text: "Wrote seed data and a handful of Supertest cases for the updates route.",
    status: "done",
  },
  {
    authorEmail: "diego@pulseboard.dev",
    text: "Docker compose is finally green locally, opening a PR today.",
    status: "on-track",
  },
];

// Extra updates purely to build visible streak patterns for manual/live testing.
// daysAgo controls the backdated createdAt for each — see comments per user below.
const STREAK_SEED_UPDATES = [
  // Amina: active 4-day streak (today, -1, -2, -3)
  {
    authorEmail: "amina@pulseboard.dev",
    text: "Streak seed: day -1",
    status: "on-track",
    daysAgo: 1,
  },
  {
    authorEmail: "amina@pulseboard.dev",
    text: "Streak seed: day -2",
    status: "on-track",
    daysAgo: 2,
  },
  {
    authorEmail: "amina@pulseboard.dev",
    text: "Streak seed: day -3",
    status: "on-track",
    daysAgo: 3,
  },

  // Diego: broken streak — posts at -1,-2 (current streak 2), gap, then older posts at -5,-6
  {
    authorEmail: "diego@pulseboard.dev",
    text: "Streak seed: day -1",
    status: "on-track",
    daysAgo: 1,
  },
  {
    authorEmail: "diego@pulseboard.dev",
    text: "Streak seed: day -5",
    status: "on-track",
    daysAgo: 5,
  },
  {
    authorEmail: "diego@pulseboard.dev",
    text: "Streak seed: day -6",
    status: "on-track",
    daysAgo: 6,
  },

  // Sam: last post 4 days ago, nothing since — streak should read 0 (broken, not active)
  {
    authorEmail: "sam@pulseboard.dev",
    text: "Streak seed: day -4",
    status: "blocked",
    daysAgo: 4,
  },

  // Priya: intentionally left with only her original SEED_UPDATES entry (today) — active streak of 1
];

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB, seeding...");

  await Update.deleteMany({});
  await User.deleteMany({});

  const usersByEmail = {};
  for (const u of SEED_USERS) {
    const passwordHash = await User.hashPassword(u.password);
    const user = await User.create({
      email: u.email,
      displayName: u.displayName,
      passwordHash,
      role: u.role,
    });
    usersByEmail[u.email] = user;
    console.log(`Created user ${u.email} (password: ${u.password})`);
  }

  for (const u of SEED_UPDATES) {
    const author = usersByEmail[u.authorEmail];
    await Update.create({
      author: author._id,
      text: u.text,
      status: u.status,
    });
  }
  console.log(`Created ${SEED_UPDATES.length} updates`);

  // Backdated updates to build real streak/gap patterns for live UI verification.
  for (const u of STREAK_SEED_UPDATES) {
    const author = usersByEmail[u.authorEmail];
    const update = await Update.create({
      author: author._id,
      text: u.text,
      status: u.status,
    });
    update.createdAt = subDays(new Date(), u.daysAgo);
    await update.save({ timestamps: false }); // don't let the pre-save hook re-stamp createdAt
  }
  console.log(
    `Created ${STREAK_SEED_UPDATES.length} backdated streak-seed updates`
  );

  // Sprinkle a couple of reactions on the first update for demo purposes.
  const firstUpdate = await Update.findOne().sort({ createdAt: 1 });
  if (firstUpdate) {
    const reactors = Object.values(usersByEmail).slice(1, 3);
    firstUpdate.reactions.push(
      ...reactors.map((r) => ({ emoji: "🎉", user: r._id }))
    );
    await firstUpdate.save();
  }

  console.log("Seeding complete.");
  console.log("Expected streaks — Amina: 4, Diego: 2, Sam: 0, Priya: 1");
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
