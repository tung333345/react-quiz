import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Import các hook từ React và react-router-dom
// - useState: Quản lý trạng thái (quiz, loading, error)
// - useEffect: Gọi API khi component mount
// - useParams: Lấy quizId từ URL
// - Link: Tạo liên kết để điều hướng

function Home() {
  const { quizId } = useParams();
  // Lấy quizId từ URL (ví dụ: 5c63 từ /quiz-start/5c63)

  const [quiz, setQuiz] = useState(null);
  // State lưu dữ liệu quiz từ API

  const [loading, setLoading] = useState(true);
  // State kiểm soát trạng thái tải

  const [error, setError] = useState('');
  // State lưu thông báo lỗi

  // Gọi API để lấy dữ liệu quiz
  useEffect(() => {
    setLoading(true);
    // Bật trạng thái loading
    fetch(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`)
      // Gửi yêu cầu GET đến API với quizId
      .then((res) => {
        if (!res.ok) throw new Error('Không tìm thấy bài quiz!');
        // Kiểm tra phản hồi, ném lỗi nếu không OK (404, 500, v.v.)
        return res.json();
        // Chuyển phản hồi thành JSON
      })
      .then((data) => {
        setQuiz(data);
        // Cập nhật state quiz
        setLoading(false);
        // Tắt trạng thái loading
      })
      .catch((err) => {
        setError(err.message);
        // Lưu thông báo lỗi
        setLoading(false);
        // Tắt trạng thái loading
      });
  }, [quizId]);
  // Chạy useEffect khi quizId thay đổi

  // Xử lý khi đang tải
  if (loading) {
    return <div className="text-center py-12 text-gray-600">Đang tải...</div>;
    // Hiển thị thông báo tải
  }

  // Xử lý khi có lỗi
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link to="/">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Quay lại trang chủ
            </button>
          </Link>
        </div>
      </div>
    );
    // Hiển thị lỗi và nút quay lại
  }

  // Xử lý khi không tìm thấy quiz
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-red-600 text-lg mb-4">Không tìm thấy bài quiz!</p>
          <Link to="/">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Quay lại trang chủ
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Giao diện khi tìm thấy quiz
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      {/* Container chính, nền gradient */}
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{quiz.title}</h1>
        <p className="text-lg text-gray-600 mb-6">{quiz.description}</p>
        {/* Hiển thị tiêu đề và mô tả quiz */}
        {quiz.questions.length === 0 ? (
          <p className="text-red-600 mb-6">Quiz này chưa có câu hỏi!</p>
        ) : (
          <Link to={`/quiz/${quizId}`}>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Bắt đầu Quiz
            </button>
          </Link>
        )}
        {/* Kiểm tra nếu quiz trống, hiển thị thông báo, nếu không, hiển thị nút bắt đầu */}
      </div>
    </div>
  );
}

export default Home;