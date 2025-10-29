import { ChromaClient, Collection } from "chromadb";
import { v4 as uuidv4 } from "uuid";
import { COLLECTION_NAME } from "../constants.js";

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

export class ChromaDBService {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName: string;

  constructor(collectionName: string = COLLECTION_NAME) {
    this.client = new ChromaClient({
      path: "./chroma_data" , // Local directory for data storage
    });
    this.collectionName = collectionName;
  }

  async initialize(): Promise<void> {
    try {
      // Try to get existing collection first
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
        });
        console.log(`✅ Collection exists: ${this.collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { description: "Markdown RAG knowledge base" },
        });
        console.log(`✅ Created collection: ${this.collectionName}`);
      }
    } catch (error) {
      console.error("Error initializing ChromaDB:", error);
      throw error;
    }
  }

  async upsertChunks(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    if (!this.collection) {
      throw new Error("Collection not initialized");
    }

    const ids = chunks.map(() => uuidv4());
    const documents = chunks.map(chunk => chunk.content);
    const metadatas = chunks.map(chunk => ({
      filename: chunk.filename,
      heading: chunk.heading || "",
    }));

    await this.collection.add({
      ids,
      embeddings,
      documents,
      metadatas,
    });

    console.log(`✅ Upserted ${chunks.length} chunks`);
  }

  async search(queryEmbedding: number[], limit: number = 5): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error("Collection not initialized");
    }

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      include: ["documents", "metadatas", "distances"],
    });

    if (!results.documents || !results.metadatas || !results.distances) {
      return [];
    }

    const searchResults: SearchResult[] = [];
    
    for (let i = 0; i < results.documents[0].length; i++) {
      const document = results.documents[0][i];
      const metadata = results.metadatas[0][i] as any;
      const distance = results.distances![0][i];
      
      // Convert distance to similarity score (ChromaDB uses L2 distance by default)
      const score = 1 / (1 + (distance || 0));
      
      searchResults.push({
        content: document || "",
        filename: metadata?.filename || "",
        heading: metadata?.heading || "",
        score,
      });
    }

    return searchResults;
  }

  async deleteByFilename(filename: string): Promise<void> {
    if (!this.collection) {
      throw new Error("Collection not initialized");
    }

    // Get all items with the filename
    const results = await this.collection.get({
      where: { filename },
      include: ["metadatas"],
    });

    if (results.ids && results.ids.length > 0) {
      await this.collection.delete({
        ids: results.ids,
      });
      console.log(`✅ Deleted ${results.ids.length} chunks for: ${filename}`);
    } else {
      console.log(`ℹ️  No chunks found for: ${filename}`);
    }
  }
}