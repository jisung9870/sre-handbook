/**
 * generate-search-index.ts
 * src/data/documents-meta.json → src/data/search-index.json 생성
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface SectionMeta {
  id: string;
  title: string;
  level: number;
  tabId: string;
  content: string;
}

interface TabMeta {
  id: string;
  label: string;
  accentColor: string;
  sections: SectionMeta[];
}

interface DocumentMeta {
  id: string;
  title: string;
  filename: string;
  category: string;
  order: number;
  tabs: TabMeta[];
  sections: SectionMeta[];
  description?: string;
}

interface SearchResult {
  documentId: string;
  documentTitle: string;
  tabId: string;
  tabLabel: string;
  sectionId: string;
  sectionTitle: string;
  content: string;
  categoryId: string;
}

const metaPath = resolve(process.cwd(), 'public/data/documents-meta.json');
const outputPath = resolve(process.cwd(), 'public/data/search-index.json');

const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as {
  documents: DocumentMeta[];
};

const index: SearchResult[] = [];

for (const doc of meta.documents) {
  for (const tab of doc.tabs) {
    for (const section of tab.sections) {
      index.push({
        documentId: doc.id,
        documentTitle: doc.title,
        tabId: tab.id,
        tabLabel: tab.label,
        sectionId: section.id,
        sectionTitle: section.title,
        content: section.content,
        categoryId: doc.category,
      });
    }
  }
}

writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');
console.log(`\n🔍 Search index: ${index.length} entries → public/data/search-index.json\n`);
