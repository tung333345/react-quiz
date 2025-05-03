// c:\Users\Admin\quiz-web\src\components\AdminDashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { AuthContext } from './content/AuthContent';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root');

function AdminDashboard() {
  // ... (các state và hàm khác giữ nguyên) ...
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const quizzesPerPage = 6;
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/quizzes`);
      if (!res.ok) throw new Error('Lỗi khi lấy danh sách quiz');
      const data = await res.json();
      setQuizzes(data);
      // Di chuyển setLoading(false) vào finally để đảm bảo luôn được gọi
    } catch (err) {
      setError('Lỗi khi tải quiz: ' + err.message);
      toast.error('Lỗi khi tải quiz!', { autoClose: 3000 });
    } finally {
       setLoading(false); // Đảm bảo setLoading được gọi
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/quizzes/${quizToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Lỗi khi xóa quiz');
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizToDelete.id));
      toast.success('Xóa quiz thành công!', { autoClose: 2000 });
    } catch (err) {
      toast.error('Lỗi khi xóa quiz: ' + err.message, { autoClose: 3000 });
    } finally {
      setDeleteModalOpen(false);
      setQuizToDelete(null);
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastQuiz = currentPage * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = filteredQuizzes.slice(indexOfFirstQuiz, indexOfLastQuiz);
  const totalPages = Math.ceil(filteredQuizzes.length / quizzesPerPage);

  const openDeleteModal = (quiz) => {
    setQuizToDelete(quiz);
    setDeleteModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!', { autoClose: 2000 });
    navigate('/admin/login');
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };


  if (loading) return <div className="text-center py-12">Đang tải...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* ... (Phần header và search giữ nguyên) ... */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Quản lý Quiz</h1>
          <div className="flex space-x-4">
            <Link to="/admin/quiz-form">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Thêm Quiz Mới
              </button>
            </Link>
            {/* Thêm nút Xem Thống Kê */}
            <Link to="/admin/stats">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Xem Thống Kê
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm quiz theo tiêu đề..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentQuizzes.length === 0 ? (
            <p className="text-gray-600 text-center col-span-3">
              {search ? 'Không tìm thấy quiz phù hợp.' : 'Chưa có quiz nào. Hãy tạo quiz mới!'}
            </p>
          ) : (
            currentQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  {quiz.image && (
                    <img
                      src={quiz.image}
                      alt={quiz.title}
                      className="w-full h-40 object-cover rounded-t-lg mb-4"
                    />
                  )}
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">{quiz.title}</h2>
                  <p className="text-gray-600 mb-4 text-sm">{quiz.description}</p>
                  <p className="text-gray-500 mb-2 text-sm">
                    Mã Quiz: <span className="font-semibold text-gray-700">{quiz.code}</span>
                  </p>
                  <p className="text-gray-500 mb-2 text-sm">
                    Số câu hỏi: {quiz.questions?.length || 0}
                  </p>
                  <p className="text-gray-500 mb-4 text-sm">
                    Cho phép làm lại: {quiz.allowRetake ? 'Có' : 'Không'}
                  </p>
                </div>
                <div className="flex space-x-2 mt-auto">
                  <Link to={`/admin/quiz-form/${quiz.id}`}>
                    <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm">
                      Sửa
                    </button>
                  </Link>
                  {/* Di chuyển comment ra ngoài hoặc xóa đi */}
                  <button
                    onClick={() => openDeleteModal(quiz)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                  >
                    Xóa
                  </button>
                  {/* Comment có thể đặt ở đây: Giảm cỡ chữ nút */}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ... (Phần phân trang, Modal và ToastContainer giữ nguyên) ... */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20 focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      >
        <h2 className="text-xl font-bold mb-4">Xác nhận xóa</h2>
        <p className="mb-6">
          Bạn có chắc muốn xóa quiz "<span className="font-semibold">{quizToDelete?.title}</span>"? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleDeleteQuiz}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Xóa
          </button>
        </div>
      </Modal>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default AdminDashboard;
