import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './styles/index.css';
import { ORG_NAME } from './config/branding';

// Applied here rather than substituted into index.html, so the title is right
// whether or not the build had the branding env vars set.
document.title = ORG_NAME;
document.querySelector('meta[name="description"]')
  ?.setAttribute('content', `${ORG_NAME} — rehearsals, attendance and concerts`);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
