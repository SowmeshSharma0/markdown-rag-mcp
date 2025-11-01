import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { QdrantService } from "./services/qdrant.js";
import { EmbeddingService } from "./services/embeddings.js";
import { COLLECTION_NAME, SERVER_NAME, SERVER_VERSION, DEFAULT_QDRANT_URL } from "./constants.js";

export class MarkdownRAGServer {
  private server: McpServer;
  private qdrant: QdrantService;
  private embeddings: EmbeddingService;
  private transports: Record<string, StreamableHTTPServerTransport> = {};

  constructor() {
    this.qdrant = new QdrantService(COLLECTION_NAME);
    this.embeddings = new EmbeddingService();

    this.server = new McpServer(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          logging: {},
          tools: {},
        },
      }
    );

    this.registerTools();
  }

  private registerTools(): void {
    this.server.tool(
      "search_knowledge",
      "Search the markdown knowledge base for relevant information",
      {
        query: z.string().describe("The question or search query"),
        limit: z.number().optional().default(5).describe("Number of results (default: 5)"),
      },
      async ({ query, limit }) => {
        try {
          console.log(`🔍 Searching for: ${query}`);

          const queryEmbedding = await this.embeddings.embedQuery(query);
          const results = await this.qdrant.search(queryEmbedding, limit);

          const formattedResults = results.map((r, idx) => ({
            rank: idx + 1,
            score: r.score.toFixed(4),
            source: `${r.filename}${r.heading ? ` > ${r.heading}` : ""}`,
            content: r.content,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query,
                    results: formattedResults,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: `Error: ${error}` }],
          };
        }
      }
    );
  }

  async startHttpServer(port: number): Promise<void> {
    const app = express();

    console.log("🔮 Initializing embedding model...");
    await this.embeddings.initialize();
    await this.qdrant.initialize();

    app.use("/mcp", express.json());

    app.post("/mcp", async (req: Request, res: Response) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.transports[sessionId]) {
        transport = this.transports[sessionId];
      } else {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId: string) => {
            this.transports[sessionId] = transport;
          },
        });
        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.transports[transport.sessionId];
          }
        };
        await this.server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    });

    const qdrantUrl = process.env.QDRANT_URL || DEFAULT_QDRANT_URL;
    app.listen(port, () => {
      console.log(`🚀 MCP Server running on port ${port}`);
      console.log(`🔌 Endpoint: http://localhost:${port}/mcp`);
      console.log(`📚 Model: nomic-embed-text (768 dimensions)`);
      console.log(`🗄️  Qdrant: ${qdrantUrl}`);
    });
  }
}