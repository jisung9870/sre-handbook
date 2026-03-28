// 동적 카테고리 지원 (docs-config.yaml에서 정의)
export type CategoryId = string;

export interface SectionMeta {
  id: string;
  title: string;
  level: number;
  tabId: string;
  content: string;
}

export interface TabMeta {
  id: string;
  label: string;
  accentColor: string;
  sections: SectionMeta[];
}

export interface DocumentMeta {
  id: string;
  title: string;
  filename: string;
  category: CategoryId;
  order: number;
  tabs: TabMeta[];
  sections: SectionMeta[];
  description?: string;
  estimatedReadTime?: number;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
  documents: string[];
}

export interface DocumentsMetaJson {
  documents: DocumentMeta[];
  categories: Category[];
  buildTimestamp: string;
}
