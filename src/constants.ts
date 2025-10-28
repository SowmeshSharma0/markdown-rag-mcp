// Qdrant collection configuration
export const COLLECTION_NAME = "markdown_docs";
export const EMBEDDING_DIMENSIONS = 384; // all-MiniLM-L6-v2

// Default values
export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_SEARCH_LIMIT = 5;
export const DEFAULT_EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const DEFAULT_DISTANCE_METRIC = "Cosine";

// Server configuration defaults
export const DEFAULT_QDRANT_URL = "http://localhost:6333";
export const DEFAULT_PORT = 3000;
export const SERVER_NAME = "markdown-rag-server";
export const SERVER_VERSION = "1.0.0";