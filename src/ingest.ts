#!/usr/bin/env node

import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { QdrantService } from "./services/qdrant.js";
import { EmbeddingService } from "./services/embeddings.js";
import { COLLECTION_NAME } from "./constants.js";
import { chunkMarkdown } from "./ingest_markdown.js";

config();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];

  if (!command) {
    console.log(`
Usage:
  pnpm ingest add <file.md>      # Add markdown file to knowledge base
  pnpm ingest delete <filename>  # Delete file from knowledge base
    `);
    process.exit(1);
  }

  const qdrant = new QdrantService(COLLECTION_NAME);
  const embeddings = new EmbeddingService();

  await embeddings.initialize();
  await qdrant.initialize();

  if (command === "add" && filePath) {
    const absolutePath = resolve(process.cwd(), filePath);
    const content = readFileSync(absolutePath, "utf-8");
    const filename = filePath.split("/").pop() || filePath;

    console.log(`📄 Processing: ${filename}`);
    
    const chunks = await chunkMarkdown(content, filename);
    console.log(`📦 Created ${chunks.length} chunks`);

    console.log(`🔮 Generating embeddings...`);
    const embeddingVectors = await embeddings.embed(
      chunks.map((c) => c.content)
    );

    console.log(`💾 Storing in Qdrant...`);
    await qdrant.upsertChunks(chunks, embeddingVectors);

    console.log(`✅ Successfully ingested ${filename}`);
  } else if (command === "delete" && filePath) {
    await qdrant.deleteByFilename(filePath);
  } else {
    console.error("❌ Invalid command");
    process.exit(1);
  }
}

main().catch(console.error);