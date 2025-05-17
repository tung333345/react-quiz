// c:\Users\Admin\quiz-web\src\App.jsx
import React from "react"; // Import React ở đây
import { Routes, Route } from "react-router-dom";
import MainHomepage from "./components/MainHomepage";
import Quiz from "./components/Quiz";
import Result from "./components/Result"; // Component Result
import QuizForm from "./components/QuizForm";
import AdminLogin from "./components/AdminLogin";
import AdminRegister from "./components/AdminRegister";
import AdminDashboard from "./components/AdminDashboard";
import UserProtectedRoute from "./components/UserProtechtedRoute";
import { AuthProvider } from "./components/content/AuthContent";
import UserLogin from "./components/UserLogin";
import UserRegister from "./components/UserRegister";
import UserProfile from "./components/UserProfile";
import { UserProvider } from "./components/content/UserContent";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/ProtectedRoute";
import QuizCodeInput from "./components/QuizCodeInput";
import AdminStats from './components/AdminStats';

import LeaderBoard from "./components/LeaderBoard";

function App() {
  // Thêm log để kiểm tra xem App có bị render lại không cần thiết không
  console.log(">>> [App] Component rendering...");
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000');

  return (
    // UserProvider và AuthProvider có thể gây render lại nếu state thay đổi
    <UserProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            {/* Route người dùng */}
            <Route path="/" element={<MainHomepage />} />
            <Route path="/quiz-code/:quizId" element={<QuizCodeInput />} />
            <Route path="/quiz/:quizId" element={<Quiz />} />

            {/* ----- KIỂM TRA KỸ ROUTE NÀY ----- */}
            <Route path="/result" element={<Result />} />
            {/* Đảm bảo:
                1. Route này không nằm trong một khối if/else có điều kiện thay đổi.
                2. Không có prop `key` nào được gán cho Route này hoặc các thẻ bao quanh nó mà giá trị key có thể thay đổi.
            */}
            {/* ----- KẾT THÚC KIỂM TRA ----- */}

            <Route path="/login" element={<UserLogin />} />
            <Route path="/register" element={<UserRegister />} />
            <Route path="/leaderboard" element={<LeaderBoard />} />
            <Route
              path="/profile"
              element={
                <UserProtectedRoute>
                  <UserProfile />
                </UserProtectedRoute>
              }
            />

            {/* Route admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quiz-form"
              element={
                <ProtectedRoute>
                  <QuizForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quiz-form/:id"
              element={
                <ProtectedRoute>
                  <QuizForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stats"
              element={
                <ProtectedRoute>
                  <AdminStats />
                </ProtectedRoute>
              }
            />

            {/* Route 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                  <p className="text-red-600">404 - Trang không tìm thấy!</p>
                </div>
              }
            />
          </Routes>
        </div>
        {/* ToastContainer nên đặt ở ngoài Routes */}
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </UserProvider>
  );
}

export default App;

