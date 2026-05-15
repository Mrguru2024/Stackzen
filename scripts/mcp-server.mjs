import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const port = 8999; // Port for the MCP server

app.use(cors());
app.use(bodyParser.json());

// Endpoint for Cursor to discover available tools
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'MCP Linter',
        description: 'Run ESLint on the current file.',
        prompt: 'Run the MCP Linter on this file.',
        handler: {
          type: 'endpoint',
          url: 'http://localhost:8999/lint',
          method: 'POST',
          body: {
            filePath: '{relativeFile}',
          },
        },
      },
      {
        name: 'MCP Tester',
        description: 'Run Jest tests for the current file.',
        prompt: 'Run the MCP Tester on this file.',
        handler: {
          type: 'endpoint',
          url: 'http://localhost:8999/test',
          method: 'POST',
          body: {
            filePath: '{relativeFile}',
          },
        },
      },
      {
        name: 'MCP Formatter',
        description: 'Format code with Prettier.',
        prompt: 'Format this file with Prettier.',
        handler: {
          type: 'endpoint',
          url: 'http://localhost:8999/format',
          method: 'POST',
          body: {
            filePath: '{relativeFile}',
          },
        },
      },
      {
        name: 'MCP Type Check',
        description: 'Run TypeScript type check on the project.',
        prompt: 'Run TypeScript type check.',
        handler: {
          type: 'endpoint',
          url: 'http://localhost:8999/typecheck',
          method: 'POST',
          body: {},
        },
      },
      {
        name: 'MCP Stylelint',
        description: 'Run Stylelint on the current file.',
        prompt: 'Run Stylelint on this file.',
        handler: {
          type: 'endpoint',
          url: 'http://localhost:8999/stylelint',
          method: 'POST',
          body: {
            filePath: '{relativeFile}',
          },
        },
      },
      {
        name: 'MCP Next.js Build',
        description: 'Run Next.js build check for the project.',
        prompt: 'Run Next.js build check.',
        handler: {
          type: 'endpoint',
          url: 'http://localhost:8999/nextbuild',
          method: 'POST',
          body: {},
        },
      },
    ],
  });
});

// Endpoint to run linting on a specific file
app.post('/lint', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).send('File path is required');
  }

  exec(`npx eslint --fix ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Linting error: ${stderr}`);
      return res.status(500).send({
        message: 'Error running linter',
        error: stderr,
        output: stdout,
      });
    }
    res.send({
      message: `Linting complete for ${filePath}`,
      output: stdout,
    });
  });
});

// Endpoint to run tests for a specific file
app.post('/test', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).send('File path is required');
  }

  exec(`npx jest ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Test error: ${stderr}`);
      return res.status(500).send({
        message: 'Error running tests',
        error: stderr,
        output: stdout,
      });
    }
    res.send({
      message: `Tests passed for ${filePath}`,
      output: stdout,
    });
  });
});

// Endpoint to format code with Prettier
app.post('/format', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).send('File path is required');
  }

  exec(`npx prettier --write ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Prettier error: ${stderr}`);
      return res.status(500).send({
        message: 'Error running Prettier',
        error: stderr,
        output: stdout,
      });
    }
    res.send({
      message: `Formatted ${filePath} with Prettier`,
      output: stdout,
    });
  });
});

// Endpoint to run TypeScript type check
app.post('/typecheck', (req, res) => {
  exec('npx tsc --noEmit', (error, stdout, stderr) => {
    if (error) {
      console.error(`TypeScript error: ${stderr}`);
      return res.status(500).send({
        message: 'TypeScript type check failed',
        error: stderr,
        output: stdout,
      });
    }
    res.send({
      message: 'TypeScript type check passed',
      output: stdout,
    });
  });
});

// Endpoint to run Stylelint on a specific file
app.post('/stylelint', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).send('File path is required');
  }

  exec(`npx stylelint ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Stylelint error: ${stderr}`);
      return res.status(500).send({
        message: 'Error running Stylelint',
        error: stderr,
        output: stdout,
      });
    }
    res.send({
      message: `Stylelint passed for ${filePath}`,
      output: stdout,
    });
  });
});

// Endpoint to run Next.js build check
app.post('/nextbuild', (req, res) => {
  exec('npx next build', (error, stdout, stderr) => {
    if (error) {
      console.error(`Next.js build error: ${stderr}`);
      return res.status(500).send({
        message: 'Next.js build failed',
        error: stderr,
        output: stdout,
      });
    }
    res.send({
      message: 'Next.js build succeeded',
      output: stdout,
    });
  });
});

app.listen(port, () => {
  console.log(`MCP Tool Server listening at http://localhost:${port}`);
});
