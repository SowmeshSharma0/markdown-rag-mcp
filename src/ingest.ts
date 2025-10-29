#!/usr/bin/env node

import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { Chunk, ChromaDBService } from "./services/chromadb.js";
import { EmbeddingService } from "./services/embeddings.js";
import { COLLECTION_NAME } from "./constants.js";

config();

// Simple chunking by heading or size
function chunkMarkdown(content: string, filename: string, chunkSize: number = 1000) {
  const chunks: Chunk[] = [];
  const lines = content.split("\n");
  
  let currentChunk = "";
  let currentHeading = "";

  for (const line of lines) {
    // Track headings
    if (line.match(/^#{1,6}\s/)) {
      // Save previous chunk if exists
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          filename,
          heading: currentHeading,
        });
        currentChunk = "";
      }
      currentHeading = line.replace(/^#{1,6}\s/, "").trim();
    }

    currentChunk += line + "\n";

    // Split if chunk too large
    if (currentChunk.length >= chunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        filename,
        heading: currentHeading,
      });
      currentChunk = "";
    }
  }

  // Add remaining
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      filename,
      heading: currentHeading,
    });
  }

  return chunks;
}

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

  const chromadb = new ChromaDBService(COLLECTION_NAME);
  const embeddings = new EmbeddingService();

  await embeddings.initialize();
  await chromadb.initialize();

  if (command === "add" && filePath) {
    const absolutePath = resolve(process.cwd(), filePath);
    const content = readFileSync(absolutePath, "utf-8");
    const filename = filePath.split("/").pop() || filePath;

    console.log(`📄 Processing: ${filename}`);
    
    const chunks = chunkMarkdown(content, filename);
    console.log(`📦 Created ${chunks.length} chunks`);

    console.log(`🔮 Generating embeddings...`);
    const embeddingVectors = await embeddings.embed(
      chunks.map((c) => c.content)
    );

    console.log(`💾 Storing in ChromaDB...`);
    await chromadb.upsertChunks(chunks, embeddingVectors);

    console.log(`✅ Successfully ingested ${filename}`);
  } else if (command === "delete" && filePath) {
    await chromadb.deleteByFilename(filePath);
  } else {
    console.error("❌ Invalid command");
    process.exit(1);
  }
}

main().catch(console.error);