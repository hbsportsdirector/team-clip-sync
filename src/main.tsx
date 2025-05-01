// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

// Create and configure Emotion cache for Mantine
const mantineCache = createCache({ key: 'mantine', prepend: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider value={mantineCache}>
      <MantineProvider
        emotionCache={mantineCache}
        withNormalizeCSS
        withGlobalStyles
        theme={{ colorScheme: 'light', primaryColor: 'blue' }}
      >
        <Notifications position="top-right" />
        <ModalsProvider>
          <App />
        </ModalsProvider>
      </MantineProvider>
    </CacheProvider>
  </React.StrictMode>
);
