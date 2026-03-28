export interface Memo {
  id?: number;
  documentId: string;
  tabId?: string;
  sectionId?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
