// import 'dotenv/config'
// import express from 'express'
// import cors from 'cors'
// import { runSuperAgent } from './super_agent/index.js'

// const app = express()

// app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
// app.use(express.json())

// app.post('/chat', async (req, res) => {
//   const { message } = req.body as { message?: string }

//   if (!message?.trim()) {
//     res.status(400).json({ error: 'message is required' })
//     return
//   }

//   try {
//     const result = await runSuperAgent(message.trim())
//     res.json({
//       response: result.response ?? 'I could not process your request.',
//       intent:   result.intent  ?? 'unknown',
//     })
//   } catch (err) {
//     console.error('[Agent error]', err)
//     res.status(500).json({ error: 'The agent encountered an error. Please try again.' })
//   }
// })

// app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// const PORT = Number(process.env.AGENT_PORT ?? 3500)
// app.listen(PORT, () => {
//   console.log(`🤖 Agent HTTP server → http://localhost:${PORT}`)
// })
