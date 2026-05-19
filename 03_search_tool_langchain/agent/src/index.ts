import "dotenv/config";
import cors from "cors";
import express from "express";
import { searchRouter } from "./routes/search_lcel.js";
import { kbRouter } from "./routes/light_rag_kb.js";

const app = express();

app.use(express.json());

app.use(
	cors({
		origin: process.env.ALLOWED_ORIGIN ?? "*",
	}),
);

app.use("/search", searchRouter);
app.use("/kb", kbRouter)

const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
