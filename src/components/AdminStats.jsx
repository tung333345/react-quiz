import { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import { Bar } from 'react-chartjs-2';
import 'react-toastify/dist/ReactToastify.css';

function AdminStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]); // State cho dữ liệu thống kê đã tính toán
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState([]); // State để lưu tất cả kết quả fetch được
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const quizzesRes = await fetch(`${import.meta.env.VITE_API_URL}/quizzes`);
        if (!quizzesRes.ok) throw new Error('Lỗi khi lấy danh sách quiz');
        const quizzes = await quizzesRes.json();

        const resultsRes = await fetch(`${import.meta.env.VITE_API_URL}/results`);
        if (!resultsRes.ok) throw new Error('Lỗi khi lấy kết quả');
        const results = await resultsRes.json();
        // Đảm bảo results là một mảng trước khi cập nhật state
        if (!Array.isArray(results)) {
          throw new Error('Dữ liệu kết quả trả về không hợp lệ (không phải mảng)');
        }
        setAllResults(results); // Lưu tất cả kết quả vào state (chỉ khi nó là mảng)

        const statsData = quizzes.map((quiz) => {
          const quizResults = results.filter((r) => r.quizId === quiz.id);
          const participants = quizResults.length;
          const avgScore =
            participants > 0
              ? (quizResults.reduce((sum, r) => sum + r.score, 0) / participants).toFixed(2)
              : 0;
          return {
            quizId: quiz.id,
            title: quiz.title,
            participants,
            avgScore,
            completionRate: participants > 0 ? 100 : 0, // Giả sử 100% nếu có kết quả
          };
        });

        setStats(statsData);
        setLoading(false);
      } catch (err) {
        toast.error('Lỗi khi tải thống kê: ' + err.message, { autoClose: 3000 });
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Sử dụng useMemo để tối ưu việc lọc, chỉ tính toán lại khi dependencies thay đổi
  const filteredStats = useMemo(() => {
    return stats
      .filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
      )
      .filter((s) => {
        // Nếu không lọc thời gian, trả về true
        if (timeFilter === 'all') return true;

        // Lọc từ state allResults đã fetch sẵn
        const quizSpecificResults = allResults.filter(r => r.quizId === s.quizId);

        // Nếu quiz này không có kết quả nào, nó không khớp bộ lọc thời gian
        if (quizSpecificResults.length === 0) return false;

        // Tính toán mốc thời gian
        const now = new Date();
        // Tạo bản sao của 'now' trước khi thay đổi để tránh ảnh hưởng lẫn nhau
        const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
        const oneMonthAgo = new Date(new Date().setMonth(now.getMonth() - 1));

        // Kiểm tra xem có kết quả nào của quiz này nằm trong khoảng thời gian lọc không
        return quizSpecificResults.some((r) => {
          const completedAt = new Date(r.completedAt);
          if (timeFilter === 'week') return completedAt >= sevenDaysAgo; // So sánh với mốc thời gian
          if (timeFilter === 'month') return completedAt >= oneMonthAgo; // So sánh với mốc thời gian
          return false; // Trường hợp khác (không nên xảy ra)
        });
      });
  }, [stats, allResults, search, timeFilter]); // Dependencies của useMemo
    // Chuẩn bị dữ liệu cho biểu đồ số người tham gia
    const participantsChartData = useMemo(() => ({
        labels: filteredStats.map(s => s.title.length > 20 ? s.title.substring(0, 17) + '...' : s.title), // Rút gọn tên quiz dài
        datasets: [
          {
            label: 'Số người tham gia',
            data: filteredStats.map(s => s.participants),
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Màu xanh dương
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      }), [filteredStats]);
    
      // Chuẩn bị dữ liệu cho biểu đồ điểm trung bình
      const avgScoreChartData = useMemo(() => ({
        labels: filteredStats.map(s => s.title.length > 20 ? s.title.substring(0, 17) + '...' : s.title), // Rút gọn tên quiz dài
        datasets: [
          {
            label: 'Điểm trung bình (%)',
            data: filteredStats.map(s => parseFloat(s.avgScore)), // Chuyển sang số
            backgroundColor: 'rgba(75, 192, 192, 0.6)', // Màu xanh lá
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      }), [filteredStats]);
    
      const chartOptions = {
        responsive: true,
        plugins: { legend: { position: 'top' } },
      };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-12">Thống kê Quiz</h1>

        <div className="flex justify-between mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm quiz theo tiêu đề..."
            className="w-1/2 px-4 py-2 border rounded-lg"
          />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="week">Tuần trước</option>
            <option value="month">Tháng trước</option>
          </select>
        </div>

        {/* Hiển thị trạng thái tải hoặc nội dung chính */}
        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : (
          <>
          {/* Khu vực hiển thị biểu đồ */}
          {filteredStats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-xl font-semibold text-center mb-4">Số người tham gia theo Quiz</h2>
                <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: { display: false }}}} data={participantsChartData} />
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-xl font-semibold text-center mb-4">Điểm trung bình theo Quiz (%)</h2>
                <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: { display: false }}, scales: { y: { beginAtZero: true, max: 100 } }}} data={avgScoreChartData} />
              </div>
            </div>
          )}
          {/* Thông báo khi không có dữ liệu sau khi lọc */}
          {filteredStats.length === 0 && (
            <p className="text-gray-600 text-center">
              {search ? 'Không tìm thấy quiz phù hợp.' : 'Chưa có dữ liệu thống kê.'}
            </p>
          )}
          </>
        )}

        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Quay lại Dashboard
        </button>
      </div>
    </div>
  );
}

export default AdminStats;