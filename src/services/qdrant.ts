import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";
import { COLLECTION_NAME, EMBEDDING_DIMENSIONS, DEFAULT_QDRANT_URL } from "../constants.js";

export interface Chunk {
  id?: string;
  content: string;
  filename: string;
  heading?: string;
  repoName?: string;
}

export interface SearchResult {
  content: string;
  filename: string;
  heading?: string;
  repoName?: string;
  score: number;
}

export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;

  constructor(collectionName: string = COLLECTION_NAME) {
    const qdrantUrl = process.env.QDRANT_URL || DEFAULT_QDRANT_URL;
    this.client = new QdrantClient({ url: qdrantUrl });
    this.collectionName = collectionName;
  }

  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (exists) {
        console.log(`✅ Collection exists: ${this.collectionName}`);
      } else {
        // Create collection with cosine distance metric
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: EMBEDDING_DIMENSIONS,
            distance: "Cosine",
          },
        });
        console.log(`✅ Created collection: ${this.collectionName}`);
      }
    } catch (error) {
      console.error("Error initializing Qdrant:", error);
      throw error;
    }
  }

  async upsertChunks(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    if (embeddings.length !== chunks.length) {
      throw new Error("Mismatch between chunks and embeddings length");
    }

    const points = chunks.map((chunk, index) => ({
      id: uuidv4(),
      vector: embeddings[index],
      payload: {
        content: chunk.content,
        filename: chunk.filename,
        heading: chunk.heading || "",
        repoName: chunk.repoName || "",
      },
    }));

    await this.client.upsert(this.collectionName, {
      wait: true,
      points,
    });

    console.log(`✅ Upserted ${chunks.length} chunks`);
  }

  async search(queryEmbedding: number[], limit: number = 5): Promise<SearchResult[]> {
    const searchResult = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });

    return searchResult.map((result) => ({
      content: (result.payload?.content as string) || "",
      filename: (result.payload?.filename as string) || "",
      heading: (result.payload?.heading as string) || "",
      repoName: (result.payload?.repoName as string) || "",
      score: result.score,
    }));
  }

  async deleteByFilename(filename: string): Promise<void> {
    // Scroll through all points with matching filename
    const scrollResult = await this.client.scroll(this.collectionName, {
      filter: {
        must: [
          {
            key: "filename",
            match: { value: filename },
          },
        ],
      },
      limit: 1000,
      with_payload: false,
      with_vector: false,
    });

    const ids = scrollResult.points.map((point) => point.id);

    if (ids.length > 0) {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: ids,
      });
      console.log(`✅ Deleted ${ids.length} chunks for: ${filename}`);
    } else {
      console.log(`ℹ️  No chunks found for: ${filename}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }
}