require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const _path = require('path');
const _fs = require('fs');

const _execAsync = promisify(exec);

async function backupDatabase() {
  const _timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const _backupDir = path.join(process.cwd(), 'backups');
  const _backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get database URL from environment
    const _databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    // Parse database URL
    const _url = new URL(databaseUrl);
    const _dbName = url.pathname.slice(1);
    const _dbUser = url.username;
    const _dbPassword = url.password;
    const _dbHost = url.hostname;
    const _dbPort = url.port || '5432';

    // Create backup command
    const _backupCommand = `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${backupFile}`;

    // Execute backup
    await execAsync(backupCommand);

    // Log successful backup
    console.log('Database backup completed', {
      file: backupFile,
      timestamp,
    });

    // Clean up old backups (keep last 7 days)
    const _files = fs.readdirSync(backupDir);
    const _oldFiles = files
      .filter((file: string) => file.startsWith('backup-'))
      .map((file: string) => ({
        name: file,
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
      }))
      .sort((a: { time: number }, b: { time: number }) => b.time - a.time)
      .slice(7);

    for (const file of oldFiles) {
      fs.unlinkSync(path.join(backupDir, file.name));
      console.log('Deleted old backup', { file: file.name });
    }

    return backupFile;
  } catch (error) {
    console.error('Database backup error:', error);
    throw error;
  }
}

// Run backup if script is executed directly
if (require.main === module) {
  backupDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { backupDatabase };
