/**
 * Seed script — creates the default admin user
 * Run: node scripts/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const user = new User({
      username: 'admin',
      email: 'admin@khona.com',
      password: 'pass321',
      role: 'superadmin',
    });
    await user.save();
    console.log('Admin user created: admin / pass321');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
