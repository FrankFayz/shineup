import React from 'react';
import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import AuthPage from './pages/AuthPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
       <App />
       {/* <AuthPage /> */}
    </BrowserRouter>
    
  </React.StrictMode>
);


