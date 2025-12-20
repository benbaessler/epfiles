import unittest
from unittest.mock import MagicMock, patch
from app.services.rag_service import RAGService

class TestRAGService(unittest.TestCase):

    @patch('app.services.rag_service.get_settings')
    @patch('app.services.rag_service.chromadb.PersistentClient')
    @patch('app.services.rag_service.Groq')
    @patch('app.services.rag_service.OpenAI')
    def setUp(self, mock_openai, mock_groq, mock_chroma, mock_settings):
        # Setup mock settings
        self.mock_settings = MagicMock()
        self.mock_settings.openai_api_key = "test-openai-key"
        self.mock_settings.groq_api_key = "test-groq-key"
        self.mock_settings.chroma_db_path = "./test_db"
        self.mock_settings.collection_name = "test_collection"
        self.mock_settings.embedding_model = "test-embedding-model"
        self.mock_settings.llm_model = "test-llm-model"
        self.mock_settings.top_k_chunks = 2
        mock_settings.return_value = self.mock_settings

        # Setup mock clients
        self.mock_openai_instance = mock_openai.return_value
        self.mock_groq_instance = mock_groq.return_value
        self.mock_chroma_instance = mock_chroma.return_value
        self.mock_collection = MagicMock()
        self.mock_chroma_instance.get_collection.return_value = self.mock_collection

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

        # check if citations are present in the expected format
        expected_citation_1 = "[Source 1: doc123, Page 5]"
        expected_citation_2 = "[Source 2: doc456, Page 10]"

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

        # Mock generation
        mock_chat_completion = MagicMock()
        mock_chat_completion.choices = [MagicMock(message=MagicMock(content="The answer is based on [Source 1]."))]
        mock_chat_completion.usage.prompt_tokens = 10
        mock_chat_completion.usage.completion_tokens = 5
        mock_chat_completion.usage.total_tokens = 15
        self.mock_groq_instance.chat.completions.create.return_value = mock_chat_completion

        # Execute query
        result = self.rag_service.query("What is the secret?")

        # Verify result structure
        self.assertEqual(result["query"], "What is the secret?")
        self.assertEqual(result["answer"], "The answer is based on [Source 1].")
        self.assertEqual(len(result["sources"]), 1)
        self.assertEqual(result["sources"][0]["doc_id"], "doc_alpha")
        
        # Verify prompt construction called with correct chunks
        # (We can't easily check the prompt text here since it's inside the method, 
        # but we verified build_rag_prompt separately above)

if __name__ == '__main__':
    unittest.main()

