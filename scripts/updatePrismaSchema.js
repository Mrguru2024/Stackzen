const { execSync } = require('child_process');

try {
  console.log('Running: npx prisma db pull');
  execSync('npx prisma db pull', { stdio: 'inherit' });

  console.log('Running: npx prisma generate');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Prisma schema and client updated successfully!');
} catch (error) {
  console.error('Error updating Prisma schema/client:', error);
  process.exit(1);
}
