import { useState, useEffect, useContext } from 'react'; // Thêm useContext
// Sử dụng UserContext để lấy thông tin người dùng thông thường
import { UserContext } from './content/UserContent';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function LeaderBoard() {
// Lấy userId và isLoading từ UserContext
const navigate = useNavigate(); // Khởi tạo hook navigate
const { userId, username, isLoading: isUserContextLoading } = useContext(UserContext); // Lấy thêm username
const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingResults, setLoadingResults] = useState(true); // Đổi tên state loading của component
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false); // State để chuyển đổi chế độ xem

  const fetchResults = async () => {
    try {
      // console.log('Fetching results from API...');
      const response = await fetch('http://localhost:3001/results'); // Fetch results from API
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched results:', data); // Debugging log
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from API');
      }
      // Sắp xếp theo điểm giảm dần cho bảng xếp hạng
      // Việc sắp xếp lịch sử cá nhân sẽ thực hiện riêng biệt bên dưới
      const sortedData = data.sort((a, b) => b.score - a.score);

      setResults(sortedData);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Lỗi khi tải danh sách kết quả');
    } finally {
      setLoadingResults(false); // Cập nhật state loading của component
    }
  };

  useEffect(() => {
    setLoadingResults(true); // Đặt loading là true khi bắt đầu fetch
    fetchResults(); // Initial fetch
    const intervalId = setInterval(fetchResults, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
    // Không cần fetch lại khi showHistory thay đổi vì polling đã xử lý cập nhật
  }, []); // Chỉ chạy 1 lần khi mount

  // Filter results based on search input
  const filteredLeaderboardResults = results.filter((result) =>
    result.username.toLowerCase().includes(search.toLowerCase())
  );

  // Lọc kết quả cho lịch sử cá nhân của người dùng hiện tại
  // !!! QUAN TRỌNG: Đảm bảo 'username' là đúng tên trường trong dữ liệu của bạn (có thể là 'userId') !!!
  const myResults = userId ? results // Lọc dựa trên userId
  .filter((result) => result.userId === userId) // <-- Lọc theo userId
  .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)) // Sắp xếp lịch sử theo ngày mới nhất
    : []; // Nếu không có người dùng, lịch sử rỗng

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 relative"> {/* Thêm relative để định vị nút Quay lại */}
        {/* Nút Quay lại */}
        <button
          onClick={() => navigate(-1)} // Sử dụng navigate(-1) để quay lại trang trước
          className="absolute top-0 left-0 mt-1 ml-1 px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition text-sm"
          aria-label="Quay lại trang trước"
        >
          &larr; Quay lại
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center pt-8">Bảng Xếp Hạng</h1> {/* Thêm pt-8 để tiêu đề không bị che */}
       
        {/* Search bar */}
        <div className="mb-6 flex justify-between items-center gap-4">
          {/* Chỉ hiển thị thanh tìm kiếm khi xem bảng xếp hạng chung */}
          {!showHistory && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              className="flex-grow px-4 py-2 border rounded-lg" // flex-grow để chiếm không gian còn lại
            />
          )}
          {/* Nút chuyển đổi chế độ xem */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 text-white rounded-lg hover:opacity-90 transition ${showHistory ? 'bg-indigo-600' : 'bg-blue-600'}`} // Đổi màu nút tùy chế độ
            style={{ minWidth: '160px' }} // Đảm bảo nút đủ rộng
          >
            {showHistory ? 'Xem BXH Chung' : 'Xem Lịch Sử Của Tôi'}
          </button>
        </div>

        {/* Loading or error messages */}
        {(loadingResults || isUserContextLoading) && <p className="text-center text-gray-600">Đang tải...</p>} {/* Kết hợp cả 2 trạng thái loading */}
        {error && <p className="text-center text-red-600">{error}</p>}

        {!(loadingResults || isUserContextLoading) && !error && ( // Chỉ hiển thị khi cả 2 không loading và không có lỗi
          <>
            {/* Hiển thị bảng lịch sử hoặc bảng xếp hạng dựa vào state showHistory */}
            {showHistory ? (
              // Bảng Lịch sử Cá nhân
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
                  Lịch Sử Làm Bài Của Bạn {username ? `(${username})` : ''} {/* Hiển thị username */}
                </h2>
                {myResults.length === 0 ? (
                  <p className="text-center text-gray-600">
                    {userId ? 'Bạn chưa hoàn thành quiz nào.' : 'Vui lòng đăng nhập để xem lịch sử của bạn.'} {/* Kiểm tra userId để hiển thị thông báo */}
                  </p>
                ) : (
                  <table className="w-full bg-white rounded-lg shadow">
                    <thead>
                      <tr className="bg-gray-200 text-gray-700">
                        <th className="py-2 px-4 text-left">Quiz</th>
                        <th className="py-2 px-4">Điểm</th>
                        <th className="py-2 px-4">Ngày Hoàn Thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myResults.map((result) => (
                        <tr key={result.id} className="border-t hover:bg-gray-50">
                          <td className="py-2 px-4">{result.quizTitle || result.quizId}</td>
                          <td className="py-2 px-4 text-center">{result.score}</td>
                          <td className="py-2 px-4 text-center">
                            {new Date(result.completedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              // Bảng Xếp Hạng Chung
              <table className="w-full bg-white rounded-lg shadow">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="py-2 px-4">Hạng</th>
                    <th className="py-2 px-4 text-left">Người dùng</th>
                    <th className="py-2 px-4 text-left">Quiz</th>
                    <th className="py-2 px-4">Điểm</th>
                    <th className="py-2 px-4">Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboardResults.map((result, index) => (
                    <tr key={result.id} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-4 text-center">{index + 1}</td>
                      <td className="py-2 px-4">{result.username}</td>
                      <td className="py-2 px-4">{result.quizTitle || result.quizId}</td>
                      <td className="py-2 px-4 text-center">{result.score}</td>
                      <td className="py-2 px-4 text-center">
                        {new Date(result.completedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Thông báo nếu không có kết quả */}
                  {filteredLeaderboardResults.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-600">
                        {search ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có ai làm bài.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LeaderBoard;
         
