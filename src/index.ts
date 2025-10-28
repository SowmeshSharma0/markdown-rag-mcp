#!/usr/bin/env node

import { config } from "dotenv";
import { MarkdownRAGServer } from "./server.js";
import { DEFAULT_QDRANT_URL, DEFAULT_PORT } from "./constants.js";

config();

async function start() {
  const qdrantUrl = process.env.QDRANT_URL || DEFAULT_QDRANT_URL;
  const port = parseInt(process.env.PORT || DEFAULT_PORT.toString());

  const server = new MarkdownRAGServer(qdrantUrl);
  await server.startHttpServer(port);
}

start().catch(console.error);