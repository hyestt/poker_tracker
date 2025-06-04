import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import HomeView from './views/HomeView';
import HandDetailView from './views/HandDetailView';
import HandFormView from './views/HandFormView';

// 主應用組件
const App: React.FC = () => {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingTop: 2,
        paddingBottom: 4
      }}
    >
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/hands/new" element={<HandFormView />} />
        <Route path="/hands/:id" element={<HandDetailView />} />
        <Route path="/hands/:id/edit" element={<HandFormView isEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App; 