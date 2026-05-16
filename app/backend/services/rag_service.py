from typing import Any, Dict, List, Optional
import os

import chromadb
from chromadb.config import Settings

from app.core.config import settings


class RAGService:
    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self._initialized = False

    def initialize(self):
        """Initialize ChromaDB client - lazy loading"""
        if self._initialized:
            return True

        try:
            persist_dir = settings.chroma_persist_dir
            os.makedirs(persist_dir, exist_ok=True)

            self.chroma_client = chromadb.Client(Settings(
                persist_directory=persist_dir,
                anonymized_telemetry=False
            ))
            self._initialized = True
            return True
        except Exception as e:
            print(f"Warning: Could not initialize ChromaDB: {e}")
            self._initialized = False
            return False

    def search(self, query: str, knowledge_base_id: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """Search a knowledge base for relevant documents."""
        if not self._initialized:
            if not self.initialize():
                return []

        try:
            collection_name = f"kb_{knowledge_base_id}"
            try:
                self.collection = self.chroma_client.get_collection(name=collection_name)
            except Exception:
                return []

            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )

            documents = results.get("documents", [[]])[0] if results else []
            metadatas = results.get("metadatas", [[]])[0] if results else []
            distances = results.get("distances", [[]])[0] if results else []
            ids = results.get("ids", [[]])[0] if results else []

            search_results = []
            for index, content in enumerate(documents):
                metadata = metadatas[index] if index < len(metadatas) and metadatas[index] else {}
                search_results.append({
                    "id": ids[index] if index < len(ids) else "",
                    "content": content,
                    "metadata": metadata,
                    "distance": distances[index] if index < len(distances) else 0,
                    "knowledge_base_id": knowledge_base_id,
                    "knowledge_base": metadata.get("knowledge_base_name") or metadata.get("filename") or "知识库",
                })

            return search_results
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def add_document(self, knowledge_base_id: str, document_id: str, content: str, metadata: Optional[dict] = None):
        """Add a document to the knowledge base"""
        if not self._initialized:
            if not self.initialize():
                return False

        try:
            collection_name = f"kb_{knowledge_base_id}"
            try:
                self.collection = self.chroma_client.get_collection(name=collection_name)
            except Exception:
                self.collection = self.chroma_client.create_collection(name=collection_name)

            self.collection.add(
                documents=[content],
                ids=[document_id],
                metadatas=[metadata or {}]
            )
            return True
        except Exception as e:
            print(f"Add document error: {e}")
            return False

    def delete_document(self, knowledge_base_id: str, document_id: str):
        """Delete a document from the knowledge base"""
        if not self._initialized:
            return False

        try:
            collection_name = f"kb_{knowledge_base_id}"
            try:
                self.collection = self.chroma_client.get_collection(name=collection_name)
                self.collection.delete(ids=[document_id])
            except Exception:
                pass
            return True
        except Exception as e:
            print(f"Delete document error: {e}")
            return False

    def delete_knowledge_base(self, knowledge_base_id: str):
        """Delete entire knowledge base collection"""
        if not self._initialized:
            if not self.initialize():
                return False

        try:
            collection_name = f"kb_{knowledge_base_id}"
            try:
                self.chroma_client.delete_collection(name=collection_name)
            except Exception:
                pass
            return True
        except Exception as e:
            print(f"Delete knowledge base error: {e}")
            return False


rag_service = RAGService()
