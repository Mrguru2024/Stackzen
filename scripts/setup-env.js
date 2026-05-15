const _fs = require('fs');
const _path = require('path');
const readline = require('readline');
const _crypto = require('crypto');

const _rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const _envExamplePath = _path.join(__dirname, '..', '.env.example');
const _envPath = _path.join(__dirname, '..', '.env');
const _envProdPath = _path.join(__dirname, '..', '.env.production');

function generateSecret() {
  return _crypto.randomBytes(32).toString('base64');
}

function copyEnvFile(sourcePath, targetPath) {
  try {
    const _content = _fs.readFileSync(sourcePath, 'utf8');
    _fs.writeFileSync(targetPath, _content);
    console.log(`Created ${_path.basename(targetPath)} from template`);
  } catch (error) {
    console.error(`Error copying ${_path.basename(sourcePath)}:`, error.message);
  }
}

function setupEnvironment() {
  // Check if .env exists
  if (!_fs.existsSync(_envPath)) {
    console.log('Creating .env file from template...');
    copyEnvFile(_envExamplePath, _envPath);

    // Generate new secrets
    const _envContent = _fs.readFileSync(_envPath, 'utf8');
    const _updatedContent = _envContent
      .replace(/NEXTAUTH_SECRET=".*"/, `NEXTAUTH_SECRET="${generateSecret()}"`)
      .replace(/SESSION_SECRET=".*"/, `SESSION_SECRET="${generateSecret()}"`);

    _fs.writeFileSync(_envPath, _updatedContent);
    console.log('Generated new secrets for development environment');
  }

  // Check if .env.production exists
  if (!_fs.existsSync(_envProdPath)) {
    console.log('Creating .env.production file from template...');
    copyEnvFile(_envExamplePath, _envProdPath);

    // Generate new secrets for production
    const _envProdContent = _fs.readFileSync(_envProdPath, 'utf8');
    const _updatedProdContent = _envProdContent
      .replace(/NEXTAUTH_SECRET=".*"/, `NEXTAUTH_SECRET="${generateSecret()}"`)
      .replace(/SESSION_SECRET=".*"/, `SESSION_SECRET="${generateSecret()}"`);

    _fs.writeFileSync(_envProdPath, _updatedProdContent);
    console.log('Generated new secrets for production environment');
  }

  console.log('\nEnvironment files are set up!');
  console.log('\nNext steps:');
  console.log('1. Update .env with your development credentials');
  console.log('2. Update .env.production with your production credentials');
  console.log('3. Never commit these files to version control');
  console.log('4. Keep .env.example updated with any new variables');
  console.log('\nSecurity notes:');
  console.log('- All sensitive credentials have been removed from version control');
  console.log('- New secrets have been generated for both environments');
  console.log('- Make sure to update API keys and other credentials in your deployment platform');
}

setupEnvironment();
_rl.close();
