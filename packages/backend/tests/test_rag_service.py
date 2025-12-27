import unittest
from unittest.mock import MagicMock, patch
from app.services.rag_service import RAGService

class TestRAGService(unittest.TestCase):

    @patch('app.services.rag_service.get_embedding_cache')
    @patch('app.services.rag_service.settings')  # Patch module-level settings directly
    @patch('app.services.rag_service.chromadb.PersistentClient')
    @patch('app.services.rag_service.OpenAI')
    def setUp(self, mock_openai_class, mock_chroma, mock_settings, mock_get_cache):
        # Setup mock settings (patching the module-level settings object)
        mock_settings.openai_api_key = "test-openai-key"
        mock_settings.xai_api_key = "test-xai-key"
        mock_settings.xai_base_url = "https://api.x.ai/v1"
        mock_settings.chroma_db_path = "./test_db"
        mock_settings.collection_name = "test_collection"
        mock_settings.embedding_model = "test-embedding-model"
        mock_settings.llm_model = "test-llm-model"
        mock_settings.llm_max_tokens = 1000
        mock_settings.llm_temperature = 0.1
        mock_settings.top_k_chunks = 2
        mock_settings.min_similarity_threshold = 0.3
        mock_settings.max_history_messages = 10
        self.mock_settings = mock_settings

        # Setup mock OpenAI clients (one for embeddings, one for xAI)
        # OpenAI is called twice: once for embeddings, once for xAI
        self.mock_openai_instance = MagicMock()  # For embeddings
        self.mock_xai_instance = MagicMock()     # For xAI LLM
        mock_openai_class.side_effect = [self.mock_openai_instance, self.mock_xai_instance]
        
        # Setup mock ChromaDB
        self.mock_chroma_instance = mock_chroma.return_value
        self.mock_collection = MagicMock()
        self.mock_collection.count.return_value = 100  # Non-empty collection
        self.mock_chroma_instance.get_or_create_collection.return_value = self.mock_collection

        # Setup mock embedding cache (returns None for cache misses)
        self.mock_cache = MagicMock()
        self.mock_cache.get.return_value = None
        mock_get_cache.return_value = self.mock_cache

        # Initialize service
        self.rag_service = RAGService()

    def test_build_rag_prompt_citations(self):
        """Test that citations are correctly formatted in the prompt."""
        chunks = [
            {
                "chunk_id": "1",
                "score": 0.9,
                "doc_id": "doc123",
                "page_start": 5,
                "page_end": 5,
                "text": "This is the first piece of evidence.",
                "source_filename": "doc1.pdf"
            },
            {
                "chunk_id": "2",
                "score": 0.8,
                "doc_id": "doc456",
                "page_start": 10,
                "page_end": 11,
                "text": "This is the second piece of evidence.",
                "source_filename": "doc2.pdf"
            }
        ]

        query = "What is the evidence?"
        prompt = self.rag_service.build_rag_prompt(query, chunks)

        # Citations use source_filename, not doc_id
        expected_citation_1 = "[Source 1: doc1.pdf, Page 5]"
        expected_citation_2 = "[Source 2: doc2.pdf, Page 10]"

        self.assertIn(expected_citation_1, prompt)
        self.assertIn(expected_citation_2, prompt)
        self.assertIn("This is the first piece of evidence.", prompt)
        self.assertIn("This is the second piece of evidence.", prompt)

    def test_retrieve_chunks_structure(self):
        """Test that retrieved chunks are formatted correctly from ChromaDB results."""
        # Mock query results from ChromaDB
        mock_results = {
            'ids': [['id1', 'id2']],
            'distances': [[0.1, 0.2]],
            'metadatas': [[
                {'doc_id': 'doc1', 'page_start': 1, 'page_end': 1, 'source_filename': 'f1.pdf'},
                {'doc_id': 'doc2', 'page_start': 2, 'page_end': 2, 'source_filename': 'f2.pdf'}
            ]],
            'documents': [['text1', 'text2']]
        }
        self.mock_collection.query.return_value = mock_results

        query_embedding = [0.1, 0.2, 0.3]
        chunks = self.rag_service.retrieve_chunks(query_embedding)

        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0]['doc_id'], 'doc1')
        self.assertEqual(chunks[0]['score'], 0.9)  # 1 - 0.1
        self.assertEqual(chunks[1]['text'], 'text2')

    def test_full_query_flow(self):
        """Test the full query pipeline including citation return."""
        # Mock embedding
        mock_embedding_response = MagicMock()
        mock_embedding_response.data = [MagicMock(embedding=[0.1, 0.2])]
        self.mock_openai_instance.embeddings.create.return_value = mock_embedding_response

        # Mock retrieval
        self.rag_service.retrieve_chunks = MagicMock(return_value=[
            {
                "chunk_id": "c1",
                "score": 0.95,
                "doc_id": "doc_alpha",
                "page_start": 100,
                "page_end": 100,
                "text": "Secret info.",
                "source_filename": "alpha.pdf"
            }
        ])

        # Mock generation (xAI client uses OpenAI-compatible API)
        mock_chat_completion = MagicMock()
        mock_chat_completion.choices = [MagicMock(message=MagicMock(content="[SOURCES_USED] The answer is based on the documents."))]
        mock_chat_completion.usage.prompt_tokens = 10
        mock_chat_completion.usage.completion_tokens = 5
        mock_chat_completion.usage.total_tokens = 15
        self.mock_xai_instance.chat.completions.create.return_value = mock_chat_completion

        # Execute query
        result = self.rag_service.query("What is the secret?")

        # Verify result structure
        self.assertEqual(result["query"], "What is the secret?")
        self.assertEqual(result["answer"], "The answer is based on the documents.")
        self.assertEqual(len(result["sources"]), 1)
        self.assertEqual(result["sources"][0]["doc_id"], "doc_alpha")
        
        # Verify xAI client (not Groq) was called for LLM generation
        self.mock_xai_instance.chat.completions.create.assert_called_once()
        # Verify embeddings were generated via OpenAI client
        self.mock_openai_instance.embeddings.create.assert_called_once()

if __name__ == '__main__':
    unittest.main()

