const { execSync } = require('child_process');
const _fs = require('fs');
const _path = require('path');

function runScript(cmd: string, label: string) {
  try {
    console.log(`\n=== Running: ${label} ===`);
    execSync(cmd, { stdio: 'inherit' });
    console.log(`=== Finished: ${label} ===\n`);
  } catch (err) {
    console.error(`Error running ${label}:`, err);
    // Do not exit, continue to next step
  }
}

// 1. Run Figma MCP sync
runScript('npx ts-node scripts/sync-figma-components.ts', 'Figma MCP Sync');

// 2. Update code connect map (placeholder automation)
const _codeConnectMapPath = path.join(__dirname, '../figma/code-connect-map.json');
try {
  // In a real automation, you would parse the Figma components and update this map.
  // For now, just log and ensure the file exists.
  if (!fs.existsSync(codeConnectMapPath)) {
    fs.writeFileSync(codeConnectMapPath, JSON.stringify({}, null, 2));
    console.log('Created figma/code-connect-map.json');
  } else {
    console.log('figma/code-connect-map.json exists. (Ready for automation)');
  }
  // TODO: Automate updating the code connect map from Figma data
} catch (err) {
  console.error('Error updating code connect map:', err);
}

// 3. Lint
runScript('npx eslint .', 'ESLint');

// 4. Test
runScript('npx jest', 'Jest Tests');

// 5. Format
runScript('npx prettier --check .', 'Prettier');

// 6. Type-check
runScript('npx tsc --noEmit', 'TypeScript Type Check');

// 7. Build
runScript('npx next build', 'Next.js Build');

// 4. (Optional) Add more MCP tool runs or automations here
// Example: Storybook build, custom MCP checks, etc.

console.log('All MCP tools completed!');
