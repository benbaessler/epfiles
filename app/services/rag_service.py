from typing import List, Dict
from openai import OpenAI
from groq import Groq
import chromadb
from app.core.config import get_settings

settings = get_settings()

class RAGService:
    """Handles RAG operations: embedding queries, retrieving chunks, generating responses."""

    def __init__(self):
        # OpenAI for embeddings and optionally LLM
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        # Groq for LLM inference (optional)
        if settings.llm_provider == "groq" and settings.groq_api_key:
            self.groq_client = Groq(api_key=settings.groq_api_key)
        else:
            self.groq_client = None
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
            citation = f"[Source {i}: {chunk['source_filename']}, Page {chunk['page_start']}]"
            context_parts.append(f"{citation}\n{chunk['text']}\n")

        context = "\n---\n\n".join(context_parts)

        # Build full prompt
        prompt = f"""You are an AI assistant helping users understand the Jeffrey Epstein document corpus.

## RESPONSE GUIDELINES:

1. **Document-Based Questions**: If the user's question can be answered using information from the provided context, answer based ONLY on that context. Be accurate, objective, and complete.

2. **Non-Document Questions**: If the user asks a general question, logical reasoning question, or anything that does NOT require information from the documents, answer it directly using your general knowledge. Do NOT mention or reference the documents at all in this case.

3. **No Relevant Information**: If the question seems document-related but the context doesn't contain relevant information, respond with: "[NO_SOURCES_USED] I couldn't find anything about that in the documents."

4. **Source Indicator**: When your answer DOES use information from the provided context, start your response with "[SOURCES_USED]". When your answer does NOT use the document context, start with "[NO_SOURCES_USED]".

5. **Natural Language**: After the source indicator tag, provide clean, conversational answers WITHOUT inline citations, source numbers, or references. Answer naturally as if explaining to someone.

## CONTEXT FROM EPSTEIN FILES:

{context}

## USER QUERY:

{query}

## YOUR RESPONSE:"""

        return prompt

    def generate_response(self, prompt: str, conversation_history: List[Dict[str, str]] = None) -> Dict[str, str]:
        """Generate response using configured LLM provider with conversation history."""
        if conversation_history is None:
            conversation_history = []
        
        # Build messages array with history
        messages = [
            {"role": "system", "content": "You are a helpful assistant with access to the Epstein document files. Answer document-related questions using the provided context, and answer general questions using your knowledge. Only reference documents when you actually use them."}
        ]
        
        # Add conversation history (limit to prevent token overflow)
        max_history = settings.max_history_messages
        for msg in conversation_history[-max_history:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current prompt as the latest user message
        messages.append({"role": "user", "content": prompt})
        
        # Use configured provider
        if settings.llm_provider == "openai":
            response = self.openai_client.chat.completions.create(
                model=settings.llm_model,
                messages=messages,
                temperature=0.1,
                max_tokens=1000
            )
        else:
            response = self.groq_client.chat.completions.create(
                model=settings.llm_model,
                messages=messages,
                temperature=0.1,
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

        # Step 5: Parse response for source usage indicator and clean answer
        answer = response_data["answer"]
        sources_used = False
        
        if answer.startswith("[SOURCES_USED]"):
            sources_used = True
            answer = answer.replace("[SOURCES_USED]", "", 1).strip()
        elif answer.startswith("[NO_SOURCES_USED]"):
            sources_used = False
            answer = answer.replace("[NO_SOURCES_USED]", "", 1).strip()

        # Step 6: Return full result (only include sources if they were used)
        return {
            "query": user_query,
            "answer": answer,
            "sources": chunks if sources_used else [],
            "model": response_data["model"],
            "usage": response_data["usage"]
        }
