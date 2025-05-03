import { useEffect, useRef, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserContext } from './content/UserContent';

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const saveInitiated = useRef(false);
  const { isUserLoggedIn, userId } = useContext(UserContext);

  const {
    score = 0,
    total = 0,
    quizTitle = 'Quiz',
    quizId = null,
    timeUp = false,
    questions = [], // Retrieve the questions with selected answers
  } = location.state || {};

  // Recalculate the score based on the selected answers
  const calculatedScore = questions.reduce((acc, question) => {
    const isMultipleChoice = question.correct.length > 1;
    const isCorrect = isMultipleChoice
      ? arraysEqual(question.selectedOptions || [], question.correct)
      : (question.selectedOptions || [])[0] === (question.correct[0] || null);
    return acc + (isCorrect ? 1 : 0);
  }, 0);

  const percentage = total > 0 ? Math.round((calculatedScore / total) * 100) : 0;

  useEffect(() => {
    if (!saveInitiated.current && quizId && isUserLoggedIn && userId && percentage !== undefined) {
      saveInitiated.current = true;

      const attemptSave = async () => {
        try {
          // Fetch quiz data to get allowRetake
          const quizRes = await fetch(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`);
          if (!quizRes.ok) throw new Error(`Không thể lấy thông tin quiz (status: ${quizRes.status})`);
          const quizData = await quizRes.json();

          // Check if result already exists
          const checkRes = await fetch(`${import.meta.env.VITE_API_URL}/results?userId=${userId}&quizId=${quizId}`);
          if (!checkRes.ok) throw new Error(`Không thể kiểm tra kết quả (status: ${checkRes.status})`);
          const existingResults = await checkRes.json();

          if (existingResults.length > 0) {
            const existingResult = existingResults[0]; // Assume one result per user per quiz

            if (!quizData.allowRetake) {
              console.log('>>> [Result] Retake not allowed. Skipping save.');
              toast.info('Bạn đã làm quiz này rồi. Kết quả không được lưu lại nữa.', { autoClose: 3000 });
              return;
            }

            if (percentage > existingResult.score) {
              // Update result with higher score
              const updatedResult = {
                ...existingResult,
                score: percentage,
                completedAt: new Date().toISOString(),
              };

              const updateRes = await fetch(`${import.meta.env.VITE_API_URL}/results/${existingResult.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedResult),
              });

              if (!updateRes.ok) throw new Error(`Lỗi PUT /results (status: ${updateRes.status})`);
              toast.success('Kết quả đã được cập nhật với điểm cao hơn!', { autoClose: 3000 });
            } else {
              console.log('>>> [Result] New score is not higher. Skipping update.');
              toast.info('Điểm mới không cao hơn điểm trước đó. Kết quả không được cập nhật.', { autoClose: 3000 });
              return;
            }
          } else {
            // Save new result
            const userRes = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`);
            if (!userRes.ok) throw new Error(`Không thể lấy username (status: ${userRes.status})`);
            const userData = await userRes.json();
            const username = userData.username;

            const resultData = {
              userId,
              username,
              quizId,
              score: percentage,
              completedAt: new Date().toISOString(),
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/results`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resultData),
            });

            if (!res.ok) throw new Error(`Lỗi POST /results (status: ${res.status})`);
            toast.success('Kết quả đã được lưu thành công!', { autoClose: 3000 });
          }
        } catch (err) {
          console.error('>>> [Result] Lỗi khi lưu kết quả:', err);
          toast.error(`Lỗi khi lưu kết quả: ${err.message}`, { autoClose: 3000 });
        }
      };

      attemptSave();
    }

    return () => {
      console.log('>>> [Result] Cleanup.');
    };
  }, [quizId, isUserLoggedIn, userId, percentage]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Kết quả Quiz: {quizTitle}</h1>
        {timeUp && (
          <p className="text-red-600 font-semibold mb-4">Đã hết thời gian!</p>
        )}
        <div className="mb-6">
          <p className="text-lg text-gray-700">
            Bạn đã trả lời đúng <span className="font-bold text-green-600">{calculatedScore}</span> trên <span className="font-bold">{total}</span> câu hỏi.
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: calculatedScore >= total / 2 ? '#10B981' : '#EF4444' }}>
            {Math.round((calculatedScore / total) * 100)}%
          </p>
        </div>
        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Về Trang Chủ
          </Link>
          <Link
            to="/leaderboard"
            className="block w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Xem Bảng Xếp Hạng
          </Link>
          {quizId && (
            <button
              onClick={() => navigate(`/quiz/${quizId}`)}
              className="block w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Làm lại Quiz này
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Result;
