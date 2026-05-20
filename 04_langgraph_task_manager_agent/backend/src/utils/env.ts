import dotenv from "dotenv"
dotenv.config();

import { z } from "zod";

const EnvSchema = z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ api key is needed"),
    GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
    PORT: z.string()
})

const parsed = EnvSchema.safeParse(process.env)

if(!parsed.success){
    throw new Error("Error while parsing env")
}

const raw = parsed.data;

export const env = Object.freeze({
    GROQ_API_KEY: raw.GROQ_API_KEY,
    GROQ_MODEL: raw.GROQ_MODEL,
    PORT: raw.PORT
})