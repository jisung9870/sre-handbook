export interface Bookmark {
  id?: number;
  documentId: string;
  tabId?: string;
  sectionId?: string;
  title: string;
  createdAt: Date;
}
