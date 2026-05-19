import React from 'react';
import { createRoot } from 'react-dom/client';
import HomePage from './HomePage';
import AdminPage from './AdminPage';
import ImageGenPage from './ImageGenPage';
import VideoGenPage from './VideoGenPage';

const path = window.location.pathname;
const root = document.getElementById('root');
if (root) {
  if (path.startsWith('/admin')) {
    createRoot(root).render(<AdminPage />);
  } else if (path.startsWith('/image')) {
    createRoot(root).render(<ImageGenPage />);
  } else if (path.startsWith('/video')) {
    createRoot(root).render(<VideoGenPage />);
  } else {
    createRoot(root).render(<HomePage />);
  }
}
