const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "Redshaddel Admin" } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Admin seeding skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    return;
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    { name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), password, role: "admin" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin account ready: ${admin.email}`);
};

module.exports = seedAdmin;