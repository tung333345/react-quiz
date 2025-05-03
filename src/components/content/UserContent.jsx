import { createContext, useState, useEffect, useMemo, useCallback } from 'react'; // Thêm useMemo, useCallback

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null); // Thêm state cho username
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra trạng thái đăng nhập từ localStorage khi component mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('userLoggedIn');
    const storedUserId = localStorage.getItem('userId');
    console.log('User auth check:', { loggedIn, storedUserId });
    const storedUsername = localStorage.getItem('username'); // Đọc username từ localStorage
    if (loggedIn === 'true' && storedUserId && storedUsername) { // Kiểm tra cả username
      setIsUserLoggedIn(true);
      setUserId(storedUserId);
      setUsername(storedUsername); // Set username state
    }
    setIsLoading(false);
  }, []);

  // Hàm đăng nhập người dùng
  // Cập nhật hàm login để nhận cả id và name
  const login = useCallback((id, name) => {
    setIsUserLoggedIn(true);
    setUserId(id);
    setUsername(name); // Set username state
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('userId', id);
    localStorage.setItem('username', name); // Lưu username vào localStorage
    console.log('User logged in:', { userId: id });
  }, []); // Dependencies rỗng vì không phụ thuộc state/props bên ngoài

  // Hàm đăng xuất người dùng
  const logout = useCallback(() => {
    setIsUserLoggedIn(false);
    setUserId(null);
    setUsername(null); // Reset username state
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('username'); // Xóa username khỏi localStorage
    console.log('User logged out');
  }, []); // Dependencies rỗng
  // Tạo giá trị context ổn định bằng useMemo
  // *** Phải gọi useMemo TRƯỚC khi return có điều kiện ***
  // Thêm isLoading vào context value
  const contextValue = useMemo(() => ({
    isUserLoggedIn, userId, username, login, logout, isLoading // <-- Thêm username
  }), [isUserLoggedIn, userId, username, login, logout, isLoading]); // <-- Thêm username vào dependencies
 

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
