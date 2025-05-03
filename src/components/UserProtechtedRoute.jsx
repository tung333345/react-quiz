// src/components/UserProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from './content/UserContent'; // Đảm bảo đường dẫn đúng

function UserProtectedRoute({ children }) {
  const { isUserLoggedIn, isLoading } = useContext(UserContext);
  const location = useLocation();

  if (isLoading) {
    // Hiển thị loading trong khi kiểm tra trạng thái đăng nhập
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Đang kiểm tra đăng nhập người dùng...</p>
      </div>
    );
  }

  if (!isUserLoggedIn) {
    // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập người dùng
    // Lưu lại trang muốn truy cập để quay lại sau khi đăng nhập thành công
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, hiển thị component con
  return children;
}

export default UserProtectedRoute;
