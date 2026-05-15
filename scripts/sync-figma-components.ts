const _fs = require('fs');
const _path = require('path');
const _dotenv = require('dotenv');
// Prefer .env.local, fallback to .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

const _figmaApi = require('../lib/figma/client');

function normalizeName(_name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findComponentSrc(componentName, aliases = []) {
  // Try to find a matching component folder in /components
  const _componentsDir = path.join(__dirname, '../components');
  const _dirs = fs.readdirSync(componentsDir, { withFileTypes: true });
  const _normalizedTarget = normalizeName(componentName);
  // Try direct and fuzzy match
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const _normalizedDir = normalizeName(dir.name);
    if (
      normalizedDir === normalizedTarget ||
      aliases.some(alias => normalizeName(alias) === normalizedDir) ||
      normalizedDir.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedDir)
    ) {
      return { src: `components/${dir.name}/index.tsx`, folder: dir.name };
    }
  }
  return { src: null, folder: null };
}

function ensureStorybookStory(folder, componentName, nodeId, fileId) {
  const _storyPath = path.join(__dirname, `../components/${folder}/${componentName}.stories.tsx`);
  if (fs.existsSync(storyPath)) return false;
  const _figmaUrl = `https://www.figma.com/file/${fileId}?node-id=${nodeId}`;
  const _story = `// Storybook story for ${componentName}
// Figma: ${figmaUrl}
import React from 'react';
import ${componentName} from './index';

export default {
  title: '${componentName}',
  component: ${componentName},
};

export const _Default = () => <${componentName} />;
`;
  fs.writeFileSync(storyPath, story);
  return true;
}

async function fetchComponents() {
  const _fileId = process.env.FIGMA_FILE_ID;
  if (!fileId) {
    console.error('FIGMA_FILE_ID is not set in environment variables.');
    process.exit(1);
  }
  try {
    const _result = await figmaApi.getFileComponents({ file_key: fileId });
    const _components = result.meta?.components || result.components || [];
    const _codeConnectMap = {};
    const _newStories = [];
    const _unmatched = [];
    for (const comp of components) {
      const _nodeId = comp.node_id || comp.nodeId || comp.id;
      const _name = comp.name;
      // Alias support: check for code: alias in description
      const _aliases = [];
      if (comp.description) {
        const _match = comp.description.match(/code:([\w-]+)/i);
        if (match) aliases.push(match[1]);
      }
      const { src: codeConnectSrc, folder } = findComponentSrc(name, aliases);
      codeConnectMap[nodeId] = {
        codeConnectSrc,
        codeConnectName: name,
      };
      // Storybook integration
      if (codeConnectSrc && folder) {
        if (ensureStorybookStory(folder, name, nodeId, fileId)) {
          newStories.push(`${folder}/${name}.stories.tsx`);
        }
      } else {
        unmatched.push(name);
      }
    }
    const _outPath = path.join(__dirname, '../figma/code-connect-map.json');
    fs.writeFileSync(outPath, JSON.stringify(codeConnectMap, null, 2));
    console.log('Updated code connect map:', codeConnectMap);
    if (newStories.length) {
      console.log('Generated new Storybook stories:', newStories);
    }
    if (unmatched.length) {
      console.warn('Unmatched Figma components:', unmatched);
    }
  } catch (error) {
    console.error('Error fetching Figma components:', error);
  }
}

fetchComponents();
