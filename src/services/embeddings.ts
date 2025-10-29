import { Ollama } from "ollama";
import { DEFAULT_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, DEFAULT_OLLAMA_URL } from "../constants";

export class EmbeddingService {
  private ollama: Ollama;
  private readonly modelName = DEFAULT_EMBEDDING_MODEL;
  private readonly dimensions = EMBEDDING_DIMENSIONS;

  constructor() {
    const ollamaUrl = process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL;
    this.ollama = new Ollama({ host: ollamaUrl });
  }

  async initialize(): Promise<void> {
    console.log(`🔮 Checking ${this.modelName} embedding model...`);
    
    try {
      // Test the model is available
      await this.ollama.embeddings({
        model: this.modelName,
        prompt: "test",
      });
      console.log("✅ Embedding model ready");
    } catch (error) {
      console.error(`❌ Error: Model ${this.modelName} not available in Ollama`);
      console.log(`   Run: ollama pull ${this.modelName}`);
      throw error;
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const response = await this.ollama.embeddings({
        model: this.modelName,
        prompt: text,
      });
      embeddings.push(response.embedding);
    }
    
    return embeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    const [embedding] = await this.embed([query]);
    return embedding;
  }

  getDimensions(): number {
    return this.dimensions;
  }
}