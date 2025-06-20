// scripts/seedAdmins.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function seedSuperAdmins() {
  try {
    // 1) connect
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 2) define your two super-admins
    const admins = [
      { name: 'Super Admin One', email: 'laladwesh@gmail.com', password: 'SuperPass123!' },
      { name: 'Super Admin Two', email: 'guptaavinash302@gmail.com', password: 'OtherPass123!' }
    ];

    for (const a of admins) {
      const exists = await User.findOne({ email: a.email });
      if (exists) {
        console.log(`↻ ${a.email} already exists, skipping.`);
        continue;
      }
      const hash = await bcrypt.hash(a.password, 12);
      await User.create({
        name:     a.name,
        email:    a.email,
        password: hash,
        role:     'super_admin'
      });
      console.log(`✔ Created super-admin: ${a.email}`);
    }

    console.log('🎉 Super-admin seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedSuperAdmins();
