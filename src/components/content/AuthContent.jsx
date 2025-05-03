import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedAdminId = localStorage.getItem('adminId');
    console.log('Auth check:', { authStatus, storedAdminId });
    if (authStatus === 'true' && storedAdminId) {
      setIsAuthenticated(true);
      setAdminId(storedAdminId);
    }
    setIsLoading(false);
  }, []);

  const login = (id) => {
    setIsAuthenticated(true);
    setAdminId(id);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('adminId', id);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminId(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminId');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}