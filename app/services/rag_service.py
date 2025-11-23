from typing import List, Dict
from openai import OpenAI
from groq import Groq
import chromadb
from app.core.config import get_settings

settings = get_settings()

class RAGService:
    """Handles RAG operations: embedding queries, retrieving chunks, generating responses."""

    def __init__(self):
        # OpenAI for embeddings only
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        # Groq for LLM inference (fast & free!)
        self.groq_client = Groq(api_key=settings.groq_api_key)
        # ChromaDB for vector storage
        self.chroma_client = chromadb.PersistentClient(path=settings.chroma_db_path)
        # Use get_or_create_collection to avoid crashing if DB is missing/empty
        self.collection = self.chroma_client.get_or_create_collection(name=settings.collection_name)
        
        if self.collection.count() == 0:
            print(f"WARNING: Collection '{settings.collection_name}' is empty. RAG will not work until data is ingested.")

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding for user query."""
        response = self.openai_client.embeddings.create(
            model=settings.embedding_model,
            input=query
        )
        return response.data[0].embedding

    def retrieve_chunks(self, query_embedding: List[float], top_k: int = None) -> List[Dict]:
        """Retrieve top-k most relevant chunks from ChromaDB."""
        if top_k is None:
            top_k = settings.top_k_chunks

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )

        chunks = []
        for i in range(len(results['ids'][0])):
            chunks.append({
                "chunk_id": results['ids'][0][i],
                "score": 1 - results['distances'][0][i],  # Convert distance to similarity
                "doc_id": results['metadatas'][0][i]['doc_id'],
                "page_start": results['metadatas'][0][i]['page_start'],
                "page_end": results['metadatas'][0][i]['page_end'],
                "text": results['documents'][0][i],
                "source_filename": results['metadatas'][0][i]['source_filename']
            })

        return chunks

    def build_rag_prompt(self, query: str, chunks: List[Dict]) -> str:
        """Build the full RAG prompt with context and instructions."""

        # Build context from retrieved chunks
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            citation = f"[Source {i}: {chunk['doc_id']}, Page {chunk['page_start']}]"
            context_parts.append(f"{citation}\n{chunk['text']}\n")

        context = "\n---\n\n".join(context_parts)

        # Build full prompt
        prompt = f"""You are an AI assistant helping users understand the Jeffrey Epstein document corpus. Your responses must be:
1. **Accurate**: Based ONLY on the provided context
2. **Cited**: Include specific source citations for every claim
3. **Objective**: Present facts without speculation
4. **Complete**: Reference multiple sources when relevant

If the context doesn't contain information to answer the question, explicitly state: "The provided documents do not contain information about this topic."

## CONTEXT FROM EPSTEIN FILES:

{context}

## USER QUERY:

{query}

## YOUR RESPONSE (with citations):"""

        return prompt

    def generate_response(self, prompt: str, conversation_history: List[Dict[str, str]] = None) -> Dict[str, str]:
        """Generate response using Groq LLM with conversation history."""
        if conversation_history is None:
            conversation_history = []
        
        # Build messages array with history
        messages = [
            {"role": "system", "content": "You are a factual document assistant specializing in the Epstein files. Always cite sources."}
        ]
        
        # Add conversation history (limit to prevent token overflow)
        max_history = settings.max_history_messages
        for msg in conversation_history[-max_history:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current prompt as the latest user message
        messages.append({"role": "user", "content": prompt})
        
        response = self.groq_client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=0.1,  # Low temperature for factual responses
            max_tokens=1000
        )

        return {
            "answer": response.choices[0].message.content,
            "model": settings.llm_model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }

    def query(self, user_query: str, conversation_history: List[Dict[str, str]] = None) -> Dict:
        """Main RAG pipeline: embed, retrieve, generate with conversation history."""
        if conversation_history is None:
            conversation_history = []

        # Step 1: Embed query
        query_embedding = self.embed_query(user_query)

        # Step 2: Retrieve relevant chunks
        chunks = self.retrieve_chunks(query_embedding)

        # Step 3: Build prompt
        prompt = self.build_rag_prompt(user_query, chunks)

        # Step 4: Generate response with conversation history
        response_data = self.generate_response(prompt, conversation_history)

        # Step 5: Return full result
        return {
            "query": user_query,
            "answer": response_data["answer"],
            "sources": chunks,
            "model": response_data["model"],
            "usage": response_data["usage"]
        }
