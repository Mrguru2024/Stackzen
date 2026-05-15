import { prisma } from '../lib/prisma';

const CATEGORY_MAP: Record<string, string> = {
  'Software Development': 'Web Dev / Tech',
  'DevOps / Sysadmin': 'Web Dev / Tech',
  Data: 'Web Dev / Tech',
  'Data Analysis': 'Web Dev / Tech',
  Product: 'Web Dev / Tech',
  'Project Management': 'Web Dev / Tech',
  Marketing: 'Marketing',
  Writing: 'Copywriting',
  Design: 'UX/UI & Design',
  Sales: 'Sales / Business',
  'Sales / Business': 'Sales / Business',
  'Customer Service': 'Customer Service',
  'Finance / Legal': 'Finance / Legal',
  'All others': 'Other',
};

const ALLOWED_CATEGORIES = [
  'Web Dev / Tech',
  'Marketing',
  'Copywriting',
  'UX/UI & Design',
  'Sales / Business',
  'Customer Service',
  'Finance / Legal',
  'Other',
];

async function main() {
  const gigs = await prisma.gig.findMany();
  let updated = 0;
  let deleted = 0;

  for (const gig of gigs) {
    const mapped = CATEGORY_MAP[gig.category] || gig.category;
    if (!ALLOWED_CATEGORIES.includes(mapped)) {
      await prisma.gig.delete({ where: { id: gig.id } });
      deleted++;
    } else if (gig.category !== mapped) {
      await prisma.gig.update({ where: { id: gig.id }, data: { category: mapped } });
      updated++;
    }
  }

  console.log(`Cleanup complete. Updated: ${updated}, Deleted: ${deleted}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
