#!/usr/bin/env ts-node

const fs = require('fs');
const path = require('path');

interface ComponentInfo {
  name: string;
  currentPath: string;
  newPath: string;
  hasTests: boolean;
  hasStories: boolean;
}

// List of components to refactor
const componentsToRefactor: ComponentInfo[] = [
  {
    name: 'Loading',
    currentPath: 'components/ui/loading.tsx',
    newPath: 'components/ui/Loading',
    hasTests: false,
    hasStories: false,
  },
  {
    name: 'Navbar',
    currentPath: 'components/ui/navbar.tsx',
    newPath: 'components/ui/Navbar',
    hasTests: false,
    hasStories: false,
  },
  {
    name: 'Combobox',
    currentPath: 'components/ui/combobox.tsx',
    newPath: 'components/ui/Combobox',
    hasTests: false,
    hasStories: false,
  },
  {
    name: 'DatePicker',
    currentPath: 'components/ui/date-picker.tsx',
    newPath: 'components/ui/DatePicker',
    hasTests: false,
    hasStories: false,
  },
  {
    name: 'MultiSelect',
    currentPath: 'components/ui/multi-select.tsx',
    newPath: 'components/ui/MultiSelect',
    hasTests: false,
    hasStories: false,
  },
];

// Template for test file
const testTemplate = (
  componentName: string
) => `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './index';

describe('${componentName} Component', () => {
  it('renders correctly', () => {
    render(<${componentName} />);
    // Add specific assertions based on component structure
  });

  it('handles props correctly', () => {
    // Add prop-specific tests
  });

  it('is accessible', () => {
    render(<${componentName} />);
    // Add accessibility tests
  });
});
`;

// Template for story file
const storyTemplate = (
  componentName: string
) => `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './index';

const meta: Meta<typeof ${componentName}> = {
  title: 'UI/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  // Add variant examples
};
`;

function createDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

function moveFile(oldPath: string, newPath: string): void {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${oldPath} to ${newPath}`);
  }
}

function createFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
  console.log(`Created file: ${filePath}`);
}

function processComponent(component: ComponentInfo): void {
  console.log(`Processing component: ${component.name}`);

  // Create component directory
  createDirectory(component.newPath);

  // Move main component file
  const indexPath = path.join(component.newPath, 'index.tsx');
  moveFile(component.currentPath, indexPath);

  // Create test file if it doesn't exist
  if (!component.hasTests) {
    const testPath = path.join(component.newPath, `${component.name}.test.tsx`);
    createFile(testPath, testTemplate(component.name));
  }

  // Create story file if it doesn't exist
  if (!component.hasStories) {
    const storyPath = path.join(component.newPath, `${component.name}.stories.tsx`);
    createFile(storyPath, storyTemplate(component.name));
  }
}

function main(): void {
  console.log('Starting component refactoring...');

  componentsToRefactor.forEach(processComponent);

  console.log('Component refactoring completed!');
  console.log('\nNext steps:');
  console.log('1. Update import statements throughout the codebase');
  console.log('2. Fix any linting errors');
  console.log('3. Update component implementations as needed');
  console.log('4. Add proper test implementations');
  console.log('5. Add proper story implementations');
}

if (require.main === module) {
  main();
}
