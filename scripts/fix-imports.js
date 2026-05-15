const _fs = require('fs');
const _path = require('path');
const _glob = require('glob');

// File extensions to process
const _EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to match import statements
const _IMPORT_PATTERNS = [
  /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

// Function to check if a file exists
function fileExists(_filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Function to find the actual file with extension
function findFileWithExtension(basePath, importPath) {
  // If the import path already has an extension, return it
  if (path.extname(importPath)) {
    return importPath;
  }

  // Try to find the file with different extensions
  for (const ext of EXTENSIONS) {
    const _fullPath = path.join(basePath, importPath + ext);
    if (fileExists(fullPath)) {
      return importPath + ext;
    }
  }

  // If no file found, return the original path
  return importPath;
}

// Function to fix imports in a file
function fixImports(_filePath) {
  const _content = fs.readFileSync(filePath, 'utf8');
  const _dirPath = path.dirname(filePath);
  let modified = false;
  let newContent = content;

  // Process each import pattern
  for (const pattern of IMPORT_PATTERNS) {
    newContent = newContent.replace(pattern, (match, importPath) => {
      // Skip node_modules and absolute paths
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        const _fixedPath = findFileWithExtension(dirPath, importPath);
        if (fixedPath !== importPath) {
          modified = true;
          return match.replace(importPath, fixedPath);
        }
      }
      return match;
    });
  }

  // Write back if modified
  if (modified) {
    console.log(`Fixing imports in ${filePath}`);
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

// Main function
function main() {
  // Find all TypeScript/JavaScript files
  const _files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  console.log(`Found ${files.length} files to process`);

  // Process each file
  files.forEach(file => {
    try {
      fixImports(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  });

  console.log('Finished processing files');
}

// Run the script
main();
