import express from 'express'
import AgentRouter from './routes/graph';
import cors from 'cors'
import { env } from './utils/env';

const app = express()

app.use(express.json());

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'OPTIONS', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false
}))

app.use("/agent", AgentRouter)
app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`)
})