import { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from './content/UserContent';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MainHomepage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isUserLoggedIn, userId, logout } = useContext(UserContext);
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigate = useNavigate();

  // Fetch quizzes
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/quizzes`);
      if (!res.ok) throw new Error('Lỗi khi lấy danh sách quiz');
      const data = await res.json();
      console.log('Quizzes:', data);
      setQuizzes(data);
    } catch (err) {
      setError(err.message);
      toast.error('Lỗi khi tải quiz!', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data
  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isUserLoggedIn && userId) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/${userId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Không tìm thấy thông tin người dùng');
          }
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setUsername(data.username);
            setAvatarUrl(data.avatar || '');
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error('Lỗi khi lấy thông tin người dùng:', err);
            toast.error('Lỗi khi lấy thông tin người dùng.', { autoClose: 3000 });
            setUsername('');
            setAvatarUrl('');
          }
        });
    } else {
      if (isMounted) {
        setUsername('');
        setAvatarUrl('');
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isUserLoggedIn, userId]);

  const handleLogout = () => {
    logout();
    setUsername('');
    setAvatarUrl('');
    toast.success('Đăng xuất thành công!', { autoClose: 2000 });
  };

  // Hiển thị thông báo khi đổi mật khẩu thành công
  useEffect(() => {
    if (location.state?.successMessage) {
      alert(location.state.successMessage);
  
      // Xóa state để không hiện lại nếu user quay lại trang này
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (loading && quizzes.length === 0) return <div className="text-center py-12">Đang tải...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Phần Header với lời chào và nút Đăng nhập/Hồ sơ/Đăng xuất */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">
            Chào mừng đến với QuizWeb{isUserLoggedIn && username ? `, ${username}` : ''}!
          </h1>
          <div className="flex items-center space-x-4">
            {isUserLoggedIn ? (
              <>
                {/* Hiển thị Avatar */}
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover border border-gray-500"
                  />
                )}
                {/* Link đến trang Profile */}
                <Link to="/profile">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    Hồ sơ
                  </button>
                </Link>
                <Link to="/leaderboard">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Bảng xếp hạng
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/leaderboard">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Bảng xếp hạng
                  </button>
                </Link>
                <Link to="/login">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Đăng nhập
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Phần hiển thị danh sách quiz */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && quizzes.length === 0 && (
             <p className="text-gray-600 text-center col-span-3">Đang tải danh sách quiz...</p>
          )}
          {!loading && quizzes.length === 0 && (
            <p className="text-gray-600 text-center col-span-3">
              Chưa có quiz nào. Hãy quay lại sau!
            </p>
          )}
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
            >
              {quiz.image && (
                <img
                  src={quiz.image}
                  alt={quiz.title}
                  className="w-full h-40 object-cover rounded-t-lg mb-4"
                />
              )}
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {quiz.title}
              </h2>
              <p className="text-gray-600 mb-4">{quiz.description}</p>
              {/* Thay đổi Link ở đây */}
              <Link to={`/quiz-code/${quiz.id}`}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Làm bài
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}

export default MainHomepage;
