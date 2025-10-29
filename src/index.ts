#!/usr/bin/env node

import { config } from "dotenv";
import { MarkdownRAGServer } from "./server.js";
import { DEFAULT_PORT } from "./constants.js";

config();

async function start() {
  const port = parseInt(process.env.PORT || DEFAULT_PORT.toString());

  const server = new MarkdownRAGServer();
  await server.startHttpServer(port);
}

start().catch(console.error);