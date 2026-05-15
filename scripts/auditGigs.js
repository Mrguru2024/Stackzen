// scripts/auditGigs.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find gigs with problematic categories (empty or 'other', case-insensitive)
  const badCategories = await prisma.gig.findMany({
    where: {
      OR: [{ category: '' }, { category: { equals: 'other', mode: 'insensitive' } }],
    },
    take: 10,
  });
  const badSources = await prisma.gig.findMany({
    where: {
      OR: [{ source: '' }, { source: { equals: 'unknown', mode: 'insensitive' } }],
    },
    take: 10,
  });
  const totalGigs = await prisma.gig.count();
  const countBadCategories = await prisma.gig.count({
    where: {
      OR: [{ category: '' }, { category: { equals: 'other', mode: 'insensitive' } }],
    },
  });
  const countBadSources = await prisma.gig.count({
    where: {
      OR: [{ source: '' }, { source: { equals: 'unknown', mode: 'insensitive' } }],
    },
  });
  console.log('--- Gigs Audit Report ---');
  console.log(`Total gigs: ${totalGigs}`);
  console.log(`Gigs with empty or 'Other' category: ${countBadCategories}`);
  if (badCategories.length) {
    console.log(
      'Sample bad categories:',
      badCategories.map(g => ({ id: g.id, category: g.category, title: g.title, source: g.source }))
    );
  }
  console.log(`Gigs with empty or 'Unknown' source: ${countBadSources}`);
  if (badSources.length) {
    console.log(
      'Sample bad sources:',
      badSources.map(g => ({ id: g.id, source: g.source, title: g.title, category: g.category }))
    );
  }
}

async function migrateBadGigs() {
  // Fix bad categories
  const updatedCategories = await prisma.gig.updateMany({
    where: {
      OR: [{ category: '' }, { category: { equals: 'other', mode: 'insensitive' } }],
    },
    data: { category: 'General' },
  });
  // Fix bad sources
  const updatedSources = await prisma.gig.updateMany({
    where: {
      OR: [{ source: '' }, { source: { equals: 'unknown', mode: 'insensitive' } }],
    },
    data: { source: 'Aggregated' },
  });
  console.log(
    `Migrated gigs: ${updatedCategories.count} categories, ${updatedSources.count} sources updated.`
  );
}

async function migrateExpiresAt() {
  const gigs = await prisma.gig.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { lte: new Date() } }],
    },
  });
  let updated = 0;
  for (const gig of gigs) {
    const postedAt = gig.postedAt || new Date();
    const expiresAt = new Date(postedAt.getTime() + 21 * 24 * 60 * 60 * 1000);
    await prisma.gig.update({ where: { id: gig.id }, data: { expiresAt } });
    updated++;
  }
  console.log(`Migrated ${updated} gigs to have valid expiresAt.`);
}

if (require.main === module && process.argv.includes('--migrate')) {
  migrateBadGigs().then(() => prisma.$disconnect());
}

if (require.main === module && process.argv.includes('--migrate-expires')) {
  migrateExpiresAt().then(() => prisma.$disconnect());
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
