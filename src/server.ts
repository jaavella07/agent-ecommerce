import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runSuperAgent } from './super_agent/index.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message, thread_id } = req.body as { message?: string; thread_id?: string };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
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
