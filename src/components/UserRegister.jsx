import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bcrypt from 'bcryptjs'; // <-- Thêm dòng import này

function UserRegister() {
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

    console.log('User register attempt:', { username }); // Không log password ra console

    // --- Các bước kiểm tra mật khẩu và username ---
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
      // --- Kiểm tra username tồn tại ---
      const res = await fetch('${import.meta.env.VITE_API_URL}/users');
      if (!res.ok) throw new Error('Lỗi khi kiểm tra tài khoản');
      const users = await res.json();
      console.log('Users from API:', users.map(u => u.username)); // Chỉ log username

      if (users.some((u) => u.username === username)) {
        setError('Tên đăng nhập đã tồn tại!');
        toast.error('Tên đăng nhập đã tồn tại!', { autoClose: 3000 });
        setLoading(false);
        return;
      }

      // --- Mã hóa mật khẩu ---
      const salt = bcrypt.genSaltSync(10); // Tạo salt
      const hashedPassword = bcrypt.hashSync(password, salt); // Mã hóa mật khẩu

      // --- Tạo đối tượng người dùng mới với mật khẩu đã mã hóa ---
      const newUser = {
        id: Date.now().toString(), // Cân nhắc dùng UUID thay vì Date.now() để đảm bảo tính duy nhất
        username,
        password: hashedPassword, // <-- Sử dụng mật khẩu đã mã hóa
      };

      // --- Gửi yêu cầu tạo tài khoản ---
      const createRes = await fetch('${import.meta.env.VITE_API_URL}/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!createRes.ok) throw new Error('Lỗi khi tạo tài khoản');

      toast.success('Đăng ký thành công! Vui lòng đăng nhập.', { autoClose: 2000 });
      setTimeout(() => navigate('/login'), 2000); // Chuyển hướng đến trang đăng nhập người dùng

    } catch (err) {
      setError('Lỗi khi đăng ký: ' + err.message);
      toast.error('Lỗi khi đăng ký!', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // ... Phần JSX giữ nguyên ...

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Đăng ký</h2>
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
          {/* Đảm bảo link này trỏ đúng đến trang đăng nhập người dùng */}
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
      <ToastContainer />
    </div>
  );
}

export default UserRegister;
