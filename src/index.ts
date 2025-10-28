#!/usr/bin/env node

import { config } from "dotenv";
import { MarkdownRAGServer } from "./server.js";

config();

async function start() {
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
  const port = parseInt(process.env.PORT || "3000");

  const server = new MarkdownRAGServer(qdrantUrl);
  await server.startHttpServer(port);
}

start().catch(console.error);