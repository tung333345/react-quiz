// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
// Giả sử bạn đã tạo UserProvider trong UserContent.jsx
import { UserProvider } from './components/content/UserContent.jsx';
// AuthProvider vẫn có thể cần thiết nếu bạn dùng cả hai trong App.jsx
// import { AuthProvider } from './components/content/AuthContent';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Bọc App bằng UserProvider */}
      <UserProvider>
        {/* Bạn có thể cần cả AuthProvider ở đây hoặc trong App.jsx tùy cấu trúc */}
        {/* <AuthProvider> */}
          <App />
        {/* </AuthProvider> */}
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);
