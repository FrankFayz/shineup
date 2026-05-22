// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/mainPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ShineVault from './components/ShineVault.jsx';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/vault" element={<ShineVault />} />
    </Routes>
  );
}