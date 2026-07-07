import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { runSuperAgent } from './super_agent/index.js';

const app = express();

const defaultCorsOrigins = ['http://localhost:5173', 'http://localhost:4173'];
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultCorsOrigins;

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

const MAX_MESSAGE_LENGTH = 2000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/chat', chatLimiter, async (req, res) => {
  const { message, thread_id } = req.body as { message?: string; thread_id?: string };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `message excede ${MAX_MESSAGE_LENGTH} caracteres` });
    return;
  }

  if (thread_id && !UUID_REGEX.test(thread_id)) {
    res.status(400).json({ error: 'thread_id debe ser un UUID válido' });
    return;
  }

  try {
    const result = await runSuperAgent(message.trim(), thread_id);
    res.json({
      thread_id:       result.thread_id,
      response:        result.response        ?? 'No pude procesar tu solicitud.',
      intent:          result.intent          ?? 'unknown',
      recommendations: result.recommendations ?? [],
      order_status:    result.order_status,
      tracking_number: result.tracking_number,
    });
  } catch (err) {
    console.error('[Agent error]', err);
    res.status(500).json({ error: 'El agente encontró un error. Intenta de nuevo.' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.AGENT_PORT ?? 3500);
app.listen(PORT, () => {
  console.log(`Agent HTTP server → http://localhost:${PORT}`);
});
