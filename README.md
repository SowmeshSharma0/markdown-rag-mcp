# Markdown RAG MCP Server

A Model Context Protocol (MCP) server that provides RAG (Retrieval-Augmented Generation) capabilities for markdown documents. This server uses Qdrant for vector storage, Ollama for embeddings, and integrates seamlessly with Cursor IDE.

> 📚 **Additional MCP Resources:**
> - **[Atlassian Rovo MCP Server Setup Guide](./atlassian_rovo_mcp.md)** - Learn how to connect to Atlassian (Jira, Confluence) through MCP
> 
> 🎥 **Find the demos here:**
> - **[Brown Bag Session 1 - Onboarding RAG Demos](https://sx-my.sharepoint.com/:f:/r/personal/sowmesh_sharma-hm_sixt_com/Documents/BrownBagSesh1_OnboardingRAGDemos?csf=1&web=1&e=h10CpE)**

## Features

- 📄 Ingest and index markdown documents
- 🔍 Semantic search using vector embeddings
- 🤖 Ollama-powered embeddings (nomic-embed-text)
- 💾 Qdrant vector database for efficient retrieval
- 🔌 MCP protocol integration with Cursor IDE
- 🐳 Docker-based setup for easy deployment

---

## Prerequisites (Fresh Laptop Setup)

### 1. Install Homebrew (macOS Package Manager)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the on-screen instructions to add Homebrew to your PATH.

### 2. Install pnpm and node as given in the repo: https://github.com/Sixt/com.sixt.web.public/edit/master/README.md

### 3. Install Rancher Desktop
1. Download Rancher Desktop for Mac from (intel or silicon - M series chips): https://rancherdesktop.io/
2. Install the application
3. Open Rancher Desktop
4. In Rancher Desktop Preferences:
   - Select **Container Runtime: dockerd (moby)** (for Docker API compatibility)
   - Apply the settings and wait for Rancher to restart
5. Verify Docker is running:
```bash
docker --version
docker-compose --version
```

### 5. Install Git (if not already installed)
```bash
brew install git
```

### 6. Install Cursor IDE
1. Download Cursor from: https://cursor.com/download
2. Install the application
3. Open Cursor

---

## Project Setup

### 1. Clone or Download the Project
```bash
cd ~/Desktop/Workspace
# If using git:
git clone <your-repo-url> markdown-rag-mcp
cd markdown-rag-mcp

# Or if you already have the folder, just navigate to it:
cd markdown-rag-mcp
```

### 2. Install Project Dependencies
```bash
pnpm install
```

This will install all required packages including:
- `@modelcontextprotocol/sdk` - MCP SDK
- `@qdrant/js-client-rest` - Qdrant client
- `ollama` - Ollama client
- `express` - HTTP server
- And other dependencies

### 3. Start Docker Services
```bash
pnpm run docker:up
```

or
```bash
pnpm run docker:reset
```


This command will:
- Start Qdrant vector database (on ports 6333, 6334)
- Start Ollama embedding service (on port 11434)

**⏳ Wait 1-2 minutes** for services to initialize.

### 4. Setup Ollama Model
After Docker services are running, pull and setup the embedding model:
```bash
pnpm run docker:setup-model
```

This will download the `nomic-embed-text` model (2GB). This step is required after:
- First time setup
- Running `pnpm run docker:reset`
- Running `pnpm run docker:up` on a fresh environment

**💡 ProTip:** Disable Cato VPN or any corporate VPN before running this command. Dont worry abt the error at the end.

### 5. Verify Docker Services are Running
```bash
# Check Qdrant is running
pnpm run docker:check-qdrant

# Check Ollama is running
pnpm run docker:check-ollama

# View logs if needed
pnpm run docker:logs
```

### 6. Build the TypeScript Project
```bash
pnpm run build
```

This compiles the TypeScript code to JavaScript in the `dist/` folder.

### 7. Ingest Sample Documents - on which you want to ask questions
If you have markdown files to ingest:
```bash
pnpm run ingest add <pathName> <repoName>
```

Example:
```bash
# Ingest a single markdown file
pnpm run ingest add ./sampleInputs/web_README.md com.sixt.web.public

# Or with a relative path
pnpm run ingest add path/to/your/document.md com.sixt.web.public
```

To delete a document:
```bash
pnpm run ingest delete <filename>
```

---

## Connect MCP Server to Cursor

### 1. Locate Cursor's MCP Configuration File

Use Cursor's settings:
1. Open Cursor
2. Press `Cmd + Shift + P` (Command Palette)
3. Type "Preferences: Open User Settings (JSON)"
4. Look for MCP configuration section

### 2. Add MCP Server Configuration

Add this configuration to your `mcp.json` file (create it if it doesn't exist):

```json
{
  "mcpServers": {
    "markdown-rag": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```


**Note:** This configuration assumes:
- The MCP server is running on port 3000 (default)
- Docker services (Qdrant and Ollama) are already running


### 3. Start the MCP Server

Before connecting Cursor, make sure to start the MCP server:
```bash
# Make sure Docker services are running first
pnpm run docker:up
pnpm run docker:setup-model

# Build and start the MCP server
pnpm run build
pnpm start
```

The server will run at `http://localhost:3000/mcp` and must be kept running while using Cursor.


### 4. Verify MCP Connection

In Cursor, you should now have access to the MCP tools. You can verify by:
1. Opening the Cursor chat/AI panel
2. The markdown-rag server should appear in the available MCP servers list
3. You should have access to tools like:
   - `ingest_markdown`: Ingest markdown documents
   - `search`: Search through ingested documents
   - `list_documents`: List all ingested documents
   - `delete_document`: Delete specific documents

---

## ⚠️ Important Tips

1. **Port Configuration**: Only change default ports (3000, 6333, 11434) if necessary. If you do, update both `docker-compose.yml` and `mcp.json`.

2. **Disable VPN**: Turn off Cato VPN or corporate VPN when downloading models or starting Docker services for the first time.

3. **Verify Containers First**: Always check containers are running before using MCP: `docker ps`

4. **Use Absolute Paths**: In `mcp.json`, use full paths like `/Users/you/path/to/dist/index.js`, not relative paths.

5. **Rebuild After Changes**: Run `pnpm run build` after code changes. If you modify `docker-compose.yml`, restart containers with `pnpm run docker:restart`. Then restart Cursor completely (Cmd+Q).

6. **Be Patient on First Setup**: Initial setup takes 3-5 minutes to download images and models. Don't interrupt.

7. **Manually remove containers in case of issues**: If `pnpm docker:down` / `pnpm docker:reset` doesnt work as intended goto rancher, stop and delete the containers manually.

---

## Using the MCP Server

### Ingest Markdown Documents
You can ingest markdown files through Cursor's AI chat using the MCP tools, or via command line:
```bash
pnpm run ingest
```

The server will:
1. Parse markdown files
2. Split them into semantic chunks
3. Generate embeddings using Ollama
4. Store them in Qdrant vector database

### Search Documents
Use Cursor's AI chat to search through your documents. The MCP server will:
1. Convert your query to embeddings using Ollama
2. Search the Qdrant vector database
3. Return relevant document chunks with metadata

### Example Usage in Cursor
```
You: "Search for documentation about API authentication"
```
The MCP server will retrieve relevant chunks from your ingested markdown documents.

---

## Available Commands

### Docker Management
```bash
# Start services
pnpm run docker:up

# Stop services
pnpm run docker:down

# View all logs
pnpm run docker:logs

# View Qdrant logs only
pnpm run docker:logs:qdrant

# View Ollama logs only
pnpm run docker:logs:ollama

# Restart services
pnpm run docker:restart

# Check Ollama models
pnpm run docker:list-models

# Setup Ollama model manually
pnpm run docker:setup-model

# Complete reset (removes all data)
pnpm run docker:clean

# Clean and restart
pnpm run docker:reset
```

### Development
```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Start MCP server
pnpm start

# Build and start
pnpm run dev

# Ingest documents
pnpm run ingest

# Run tests
pnpm test
```

---

## Project Structure

```
markdown-rag-mcp/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── server.ts          # MCP server implementation
│   ├── ingest.ts          # Document ingestion logic
│   ├── constants.ts       # Configuration constants
│   └── services/
│       ├── embeddings.ts  # Ollama embedding service
│       └── qdrant.ts      # Qdrant vector store service
├── dist/                  # Compiled JavaScript output
├── sampleInputs/          # Sample markdown files
├── qdrant_data/           # Qdrant database storage
├── ollama_data/           # Ollama models storage
├── docker-compose.yml     # Docker services configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Node.js dependencies
└── README.md             # This file
```

---

## Configuration

### Environment Variables

The following environment variables can be configured:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | MCP server port |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant database URL |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama service URL |

### Constants (src/constants.ts)

- `COLLECTION_NAME`: Qdrant collection name (`markdown_docs`)
- `EMBEDDING_DIMENSIONS`: Vector dimensions (`768` for nomic-embed-text)
- `DEFAULT_CHUNK_SIZE`: Document chunk size (`1000` characters)
- `DEFAULT_SEARCH_LIMIT`: Number of search results (`5`)
- `DEFAULT_EMBEDDING_MODEL`: Ollama model (`nomic-embed-text`)

---

## Troubleshooting

### Docker containers won't start
```bash
# Check Docker Desktop is running
docker ps

# Check logs for errors
pnpm run docker:logs

# Try resetting
pnpm run docker:down
pnpm run docker:up
```

### Ollama model not available
```bash
# Manually pull the model
pnpm run docker:setup-model

# Check if model is loaded
pnpm run docker:list-models

# Check Ollama logs
pnpm run docker:logs:ollama
```

### MCP server not connecting in Cursor
1. Verify the server builds successfully: `pnpm run build`
2. Check the path in `mcp.json` is correct (use absolute path)
3. Ensure Docker services are running: `pnpm run docker:up`
4. Check server logs for errors
5. Restart Cursor completely (`Cmd + Q`, then reopen)

## System Requirements

- **OS:** macOS (Linux/Windows with minor adjustments)
- **RAM:** 8GB minimum (16GB recommended for better performance)
- **Disk Space:** 5GB for Docker images and models
- **Node.js:** v18 or higher
- **Docker:** Latest version
- **Internet:** Required for initial model download

---

## Architecture

### Components

1. **MCP Server** (`src/server.ts`)
   - Implements Model Context Protocol
   - Exposes tools for document management and search
   - Runs as HTTP server for Cursor integration

2. **Embedding Service** (`src/services/embeddings.ts`)
   - Interfaces with Ollama
   - Generates 768-dimensional embeddings using nomic-embed-text

3. **Vector Store** (`src/services/qdrant.ts`)
   - Manages Qdrant vector database
   - Handles document storage and retrieval
   - Performs semantic similarity search

4. **Ingestion Pipeline** (`src/ingest.ts`)
   - Parses markdown documents
   - Chunks text for optimal retrieval
   - Generates and stores embeddings

### Data Flow

```
Markdown Files
    ↓
Ingestion Pipeline
    ↓
Text Chunking
    ↓
Ollama Embeddings (nomic-embed-text)
    ↓
Qdrant Vector Store
    ↓
MCP Server ←→ Cursor IDE
    ↓
Semantic Search Results
```

---

## MCP Tools

The server exposes the following MCP tools:

### `ingest_markdown`
Ingest markdown documents into the vector database.

**Parameters:**
- `content` (string): Markdown content to ingest
- `metadata` (object): Optional metadata (title, source, etc.)

### `search`
Search through ingested documents using semantic similarity.

**Parameters:**
- `query` (string): Search query
- `limit` (number, optional): Number of results (default: 5)

**Returns:** Array of relevant document chunks with scores and metadata

### `list_documents`
List all ingested documents.

**Returns:** Array of document IDs and metadata

### `delete_document`
Delete a specific document from the vector database.

**Parameters:**
- `documentId` (string): ID of the document to delete

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

ISC License

---

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

---

## Next Steps

1. ✅ Complete the setup steps above
2. 📄 Add your markdown documents to a folder
3. 🔧 Use the MCP `ingest_markdown` tool through Cursor to index your documents
4. 💬 Ask questions about your documents through Cursor's AI chat
5. 🚀 The RAG system will retrieve relevant context from your documents

---

**Happy coding! 🎉**

