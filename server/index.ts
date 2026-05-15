// server/index.ts
import express, { Request, Response } from 'express';

const _app = express();
const _port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
});
