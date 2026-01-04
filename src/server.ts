import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { QdrantService } from "./services/qdrant.js";
import { EmbeddingService } from "./services/embeddings.js";
import { COLLECTION_NAME, SERVER_NAME, SERVER_VERSION, DEFAULT_QDRANT_URL } from "./constants.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { chunkMarkdown } from "./ingest_markdown.js";

export const Logger = {
  log: (...args: any[]) => {},
  error: (...args: any[]) => {},
};

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
        repository: z.string().optional().describe("The repository to search in"),
      },
      async ({ query, limit, repository }) => {
        try {
          console.log(`🔍 Searching for: ${query}`);

          const queryEmbedding = await this.embeddings.embedQuery(query);
          const results = await this.qdrant.search(queryEmbedding, limit, repository);

          const formattedResults = results.map((r, idx) => ({
            rank: idx + 1,
            score: r.score.toFixed(4),
            repository: r.repoName,
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

    this.server.tool(
      "find_similar_content",
      "Check for existing similar content before adding/updating knowledge",
      {
        content: z.string().describe("The content to check for similarity"),
        repoName: z.string().optional(),
        limit: z.number().optional().default(5)
      },
      async ({ content, repoName, limit }) => {
        const embedding = await this.embeddings.embedQuery(content);
        const results = await this.qdrant.search(embedding, limit, repoName);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              similarContentFound: results.length,
              results: results.map(r => ({
                score: r.score.toFixed(4),
                file: r.filename,
                repo: r.repoName,
                heading: r.heading,
                contentPreview: r.content.substring(0, 200) + "..."
              }))
            }, null, 2)
          }]
        };
      }
    );

    this.server.tool(
      "update_knowledge",
      "Add new content or replace existing content in the knowledge base. ALWAYS use find_similar_content FIRST to check for duplicates before calling this.",
      {
        content: z.string().describe("The markdown content to add/update"),
        filename: z.string().describe("Filename (e.g., 'api-guide.md')"),
        repoName: z.string().describe("Repository name"),
        replaceFile: z.boolean().optional().default(false)
          .describe("If true, deletes existing file before adding new content")
      },
      async ({ content, filename, repoName, replaceFile }) => {
        // Simple: if replaceFile=true, delete old chunks first
        if (replaceFile) {
          await this.qdrant.deleteByFilename(filename);
        }
        
        // Chunk, embed, and store
        const chunks = await chunkMarkdown(content, filename, repoName);
        const embeddings = await this.embeddings.embed(chunks.map(c => c.content));
        await this.qdrant.upsertChunks(chunks, embeddings);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "success",
              action: replaceFile ? "replaced" : "added",
              chunks: chunks.length,
              file: `${repoName}/${filename}`
            }, null, 2)
          }]
        };
      }
    );
  }

  async connect(transport: Transport): Promise<void> {
    // Logger.log("Connecting to transport...");
    await this.server.connect(transport);

    Logger.log = (...args: any[]) => {
      this.server.server.sendLoggingMessage({
        level: "info",
        data: args,
      });
    };
    Logger.error = (...args: any[]) => {
      this.server.server.sendLoggingMessage({
        level: "error",
        data: args,
      });
    };

    Logger.log("Server connected and ready to process requests");
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

    // Handle GET requests for SSE streams
    const handleSessionRequest = async (req: Request, res: Response) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (!sessionId || !this.transports[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }
      console.log(`Received session request for session ${sessionId}`);
      try {
        const transport = this.transports[sessionId];
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error("Error handling session request:", error);
        if (!res.headersSent) {
          res.status(500).send("Error processing session request");
        }
      }
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get("/mcp", handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete("/mcp", handleSessionRequest);

    const qdrantUrl = process.env.QDRANT_URL || DEFAULT_QDRANT_URL;
    app.listen(port, () => {
      console.log(`🚀 MCP Server running on port ${port}`);
      console.log(`🔌 Endpoint: http://localhost:${port}/mcp`);
      console.log(`📚 Model: nomic-embed-text (768 dimensions)`);
      console.log(`🗄️  Qdrant: ${qdrantUrl}`);
    });
  }
}