import { useState, useContext, useEffect } from 'react'; // Thêm useEffect
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from './content/UserContent';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function QuizCodeInput() {
  const { quizId } = useParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizTitle, setQuizTitle] = useState(''); // State để lưu tiêu đề quiz
  const navigate = useNavigate();
  const { isUserLoggedIn } = useContext(UserContext);

  // Fetch tiêu đề quiz để hiển thị
  useEffect(() => {
    fetch(`http://localhost:3001/quizzes/${quizId}`)
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải thông tin quiz');
        return res.json();
      })
      .then(data => setQuizTitle(data.title))
      .catch(err => {
        console.error("Lỗi tải tiêu đề quiz:", err);
        setError('Không tìm thấy bài quiz này.');
        // Có thể navigate về trang chủ nếu quizId không hợp lệ
        // navigate('/');
      });
  }, [quizId]); // Chỉ chạy khi quizId thay đổi

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Yêu cầu đăng nhập (giữ nguyên)
    if (!isUserLoggedIn) {
      toast.error('Vui lòng đăng nhập để làm bài!', { autoClose: 3000 });
      // Lưu lại trang hiện tại để quay lại sau khi đăng nhập
      navigate('/login', { state: { from: `/quiz-code/${quizId}` } });
      setLoading(false);
      return;
    }

    try {
      // Fetch lại quiz để kiểm tra code (đảm bảo dữ liệu mới nhất)
      const res = await fetch(`http://localhost:3001/quizzes/${quizId}`);
      if (!res.ok) throw new Error('Không tìm thấy bài quiz');
      const quiz = await res.json();
      console.log('Quiz data for code check:', quiz);

      if (quiz.code === code.trim().toUpperCase()) { // Thêm trim() và toUpperCase() để linh hoạt hơn
        toast.success('Mã quiz đúng! Bắt đầu làm bài.', { autoClose: 1500 });
        // Sửa lại đích đến navigate
        navigate(`/quiz/${quizId}`); // <--- Sửa thành /quiz/:quizId
      } else {
        setError('Mã quiz không đúng!');
        toast.error('Mã quiz không đúng!', { autoClose: 3000 });
      }
    } catch (err) {
      setError('Lỗi khi kiểm tra mã: ' + err.message);
      toast.error('Lỗi khi kiểm tra mã!', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        {/* Hiển thị tiêu đề quiz nếu có */}
        {quizTitle ? (
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            {quizTitle}
          </h2>
        ) : (
           <div className="h-8 mb-2 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div> // Placeholder loading
        )}
        <p className="text-lg text-gray-600 mb-6 text-center">Nhập mã để bắt đầu</p>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <div className="mb-4">
          <label htmlFor="quizCode" className="block text-gray-700 mb-2 sr-only">Mã Quiz</label> {/* Có thể ẩn label nếu tiêu đề đã rõ */}
          <input
            id="quizCode"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg text-center text-lg tracking-widest" // Tăng kích thước, căn giữa
            placeholder="ABC123"
            required
            disabled={loading}
            autoCapitalize="characters" // Tự viết hoa trên mobile
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 text-lg" // Tăng kích thước nút
        >
          {loading ? 'Đang kiểm tra...' : 'Xác nhận'}
        </button>
         <button
            type="button"
            onClick={() => navigate('/')} // Nút quay lại trang chủ
            className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            disabled={loading}
          >
            Quay lại
          </button>
      </form>
      <ToastContainer position="bottom-right"/>
    </div>
  );
}

export default QuizCodeInput;
