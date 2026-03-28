import { createHashRouter, RouterProvider } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { DocumentPage } from '@/pages/DocumentPage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { MemosPage } from '@/pages/MemosPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AppProvider } from '@/contexts/AppContext';

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'doc/:documentId', element: <DocumentPage /> },
      { path: 'bookmarks', element: <BookmarksPage /> },
      { path: 'memos', element: <MemosPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
