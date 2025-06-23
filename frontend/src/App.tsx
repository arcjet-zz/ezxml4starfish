import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import { useProjectStore } from './store/projectStore';

function App() {
  const { error, setError } = useProjectStore();

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          }
        />
        <Route
          path="/editor"
          element={
            <AppLayout showProjectActions>
              <EditorPage />
            </AppLayout>
          }
        />
      </Routes>

      {/* 错误提示 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
