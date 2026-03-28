import { useState, useEffect } from 'react';

import type { DocumentMeta, Category } from '@/types/document';

interface UseDocumentMetaResult {
  documents: DocumentMeta[];
  categories: Category[];
  loading: boolean;
  getDocument: (id: string) => DocumentMeta | undefined;
}

let cachedDocuments: DocumentMeta[] | null = null;
let cachedCategories: Category[] | null = null;

export function useDocumentMeta(): UseDocumentMetaResult {
  const [documents, setDocuments] = useState<DocumentMeta[]>(cachedDocuments ?? []);
  const [categories, setCategories] = useState<Category[]>(cachedCategories ?? []);
  const [loading, setLoading] = useState(cachedDocuments === null);

  useEffect(() => {
    if (cachedDocuments !== null) return;

    fetch('/data/documents-meta.json', { cache: 'default' })
      .then((res) => res.json())
      .then((data: { documents: DocumentMeta[]; categories: Category[] }) => {
        cachedDocuments = data.documents;
        cachedCategories = data.categories;
        setDocuments(data.documents);
        setCategories(data.categories);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function getDocument(id: string) {
    return documents.find((d) => d.id === id);
  }

  return { documents, categories, loading, getDocument };
}
