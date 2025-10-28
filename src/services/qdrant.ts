import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";

export interface Chunk {
  id?: string;
  content: string;
  filename: string;
  heading?: string;
}

export interface SearchResult {
  content: string;
  filename: string;
  heading?: string;
  score: number;
}

export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;
  private dimensions: number;

  constructor(url: string, collectionName: string = "markdown_docs", dimensions: number = 384) {
    this.client = new QdrantClient({ url });
    this.collectionName = collectionName;
    this.dimensions = dimensions;
  }

  async initialize(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.dimensions, // 384 for all-MiniLM-L6-v2
            distance: "Cosine",
          },
        });
        console.log(`✅ Created collection: ${this.collectionName} (${this.dimensions}D)`);
      } else {
        console.log(`✅ Collection exists: ${this.collectionName}`);
      }
    } catch (error) {
      console.error("Error initializing Qdrant:", error);
      throw error;
    }
  }

  async upsertChunks(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    const points = chunks.map((chunk, idx) => ({
      id: uuidv4(),
      vector: embeddings[idx],
      payload: {
        content: chunk.content,
        filename: chunk.filename,
        heading: chunk.heading || "",
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

    return searchResult.map((hit) => ({
      content: hit.payload?.content as string,
      filename: hit.payload?.filename as string,
      heading: hit.payload?.heading as string,
      score: hit.score,
    }));
  }

  async deleteByFilename(filename: string): Promise<void> {
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: {
        must: [
          {
            key: "filename",
            match: { value: filename },
          },
        ],
      },
    });
    console.log(`✅ Deleted chunks for: ${filename}`);
  }
}