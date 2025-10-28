import { pipeline, env } from "@xenova/transformers";

// Disable remote models, use only cached
env.allowRemoteModels = true;
env.allowLocalModels = true;

export class EmbeddingService {
  private extractor: any = null;
  private readonly modelName = "Xenova/all-MiniLM-L6-v2";
  private readonly dimensions = 384;

  async initialize(): Promise<void> {
    if (this.extractor) return;

    console.log("🔮 Loading all-MiniLM-L6-v2 embedding model...");
    console.log("   (First run will download ~90MB model)");
    
    this.extractor = await pipeline(
      "feature-extraction",
      this.modelName
    );
    
    console.log("✅ Embedding model loaded");
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.extractor) {
      await this.initialize();
    }

    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const output = await this.extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      
      // Convert tensor to array
      const embedding = Array.from(output.data as Float32Array) as number[];
      embeddings.push(embedding);
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