import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminRegister() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Register attempt:', { username, password, confirmPassword });

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      toast.error('Mật khẩu xác nhận không khớp!', { autoClose: 3000 });
      setLoading(false);
      return;
    }

    if (username.length < 4 || password.length < 6) {
      setError('Tên đăng nhập phải ≥ 4 ký tự, mật khẩu ≥ 6 ký tự!');
      toast.error('Tên đăng nhập hoặc mật khẩu quá ngắn!', { autoClose: 3000 });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admins`);
      if (!res.ok) throw new Error('Lỗi khi kiểm tra tài khoản');
      const admins = await res.json();
      console.log('Admins from API:', admins);

      if (admins.some((a) => a.username === username)) {
        setError('Tên đăng nhập đã tồn tại!');
        toast.error('Tên đăng nhập đã tồn tại!', { autoClose: 3000 });
        setLoading(false);
        return;
      }

      const newAdmin = {
        id: Date.now().toString(),
        username,
        password,
      };

      const createRes = await fetch(`${import.meta.env.VITE_API_URL}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });

      if (!createRes.ok) throw new Error('Lỗi khi tạo tài khoản');
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.', { autoClose: 2000 });
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setError('Lỗi khi đăng ký: ' + err.message);
      toast.error('Lỗi khi đăng ký!', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Đăng ký Admin</h2>
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
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Xác nhận mật khẩu</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
        <p className="mt-4 text-center text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/admin/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
      <ToastContainer />
    </div>
  );
}

export default AdminRegister;