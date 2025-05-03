import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from './content/UserContent';
import { ToastContainer, toast } from 'react-toastify';
import bcrypt from 'bcryptjs';
import 'react-toastify/dist/ReactToastify.css';

function UserLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('User login attempt:', { username, password });

    try {
      const res = await fetch('${import.meta.env.VITE_API_URL}/users');
      if (!res.ok) throw new Error('Lỗi khi kiểm tra tài khoản');
      const users = await res.json();
      console.log('Users from API:', users);
      const user = users.find((u) => u.username === username && bcrypt.compareSync(password, u.password));
      if (user) {
        // Truyền cả user.id và user.username vào hàm login
        login(user.id, user.username);
        toast.success('Đăng nhập thành công!', { autoClose: 2000 });
        navigate('/');
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng!');
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng!', { autoClose: 3000 });
      }
    } catch (err) {
      setError('Lỗi khi đăng nhập: ' + err.message);
      toast.error('Lỗi khi đăng nhập!', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Đăng nhập</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        <p className="mt-4 text-center text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Đăng ký
          </Link>
        </p>
      </form>
      <ToastContainer />
    </div>
  );
}

export default UserLogin;