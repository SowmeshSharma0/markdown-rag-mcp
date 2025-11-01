// Qdrant collection configuration
export const COLLECTION_NAME = "markdown_docs";
export const EMBEDDING_DIMENSIONS = 768; // nomic-embed-text dimensions

// Default values
export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_SEARCH_LIMIT = 5;
export const DEFAULT_EMBEDDING_MODEL = "nomic-embed-text"; // Ollama model

// Server configuration defaults
export const DEFAULT_QDRANT_URL = "http://localhost:6333";
export const DEFAULT_PORT = 3000;
export const SERVER_NAME = "markdown-rag-server";
export const SERVER_VERSION = "1.0.0";
export const DEFAULT_OLLAMA_URL = "http://localhost:11434"; // Add Ollama URL