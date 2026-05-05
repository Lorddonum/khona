/**
 * Seed categories — lampe, lustre, suspension, applique
 * Run: node scripts/seed-categories.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');

const categories = [
  {
    name: { en: 'Lamp', fr: 'Lampe', ar: 'مصباح' },
    slug: 'lampe',
    description: { en: 'Table and floor lamps', fr: 'Lampes de table et de sol', ar: 'مصابيح طاولة وأرضية' },
  },
  {
    name: { en: 'Chandelier', fr: 'Lustre', ar: 'ثريا' },
    slug: 'lustre',
    description: { en: 'Elegant chandeliers', fr: 'Lustres élégants', ar: 'ثريات أنيقة' },
  },
  {
    name: { en: 'Suspension', fr: 'Suspension', ar: 'معلّق' },
    slug: 'suspension',
    description: { en: 'Pendant and suspension lights', fr: 'Luminaires suspendus', ar: 'إضاءات معلّقة' },
  },
  {
    name: { en: 'Wall Sconce', fr: 'Applique', ar: 'أباجورة حائط' },
    slug: 'applique',
    description: { en: 'Wall-mounted sconces', fr: 'Appliques murales', ar: 'إضاءات جدارية' },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const cat of categories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (existing) {
        console.log(`Category "${cat.slug}" already exists, skipping`);
        continue;
      }
      await new Category(cat).save();
      console.log(`Created category: ${cat.slug}`);
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
