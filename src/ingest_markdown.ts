import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chunk } from "./services/qdrant";

// Simple markdown-aware chunking using LangChain
export async function chunkMarkdown(content: string, filename: string, chunkSize: number = 1000) {
  // LangChain has built-in markdown support that respects headers, code blocks, etc.
  const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize: chunkSize,
    chunkOverlap: 200, // Adds 200 char overlap so chunks have context
  });

  const chunks: Chunk[] = [];
  const docs = await splitter.createDocuments([content]);
  
  // Track the last heading we saw
  let currentHeading = "";
  
  for (const doc of docs) {
    const chunkText = doc.pageContent;
    
    // Check if this chunk has a heading
    const headingMatch = chunkText.match(/^#{1,6}\s+(.+?)$/m);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
    }
    
    chunks.push({
      content: chunkText,
      filename,
      heading: currentHeading,
    });
  }

  return chunks;
}