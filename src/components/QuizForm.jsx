import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hàm tạo mã ngẫu nhiên (giữ nguyên)
const generateRandomCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

function QuizForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Thêm totalTime và    vào state quiz
  const [quiz, setQuiz] = useState({
      title: '',
      description: '',
      image: '',
      code: '',
      totalTime: 10, // <-- Thêm: Tổng thời gian mặc định (phút), ví dụ 10 phút
      allowRetry : false, // Default allowRetry  set to false
      questions: []
  });
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: [],
  });
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`http://localhost:3001/quizzes/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Không tìm thấy quiz');
          return res.json();
        })
        .then((data) => {
          const sanitizedData = {
            ...data,
            // Gán giá trị totalTime từ data, nếu không có thì dùng giá trị mặc định (hoặc 0)
            totalTime: data.totalTime !== undefined ? data.totalTime : 10, // <-- Cập nhật totalTime
            allowRetry : data.allowRetry  !== undefined ? data.allowRetry  : false, // <-- Cập nhật allowRetry 
            questions: (data.questions || []).map(q => ({ // Sửa lỗi: data.questions có thể undefined
              ...q,
              options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
              correct: Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : [])
            }))
          };
          setQuiz(sanitizedData);
          setLoading(false);
        })
        .catch((err) => {
          setError('Lỗi khi lấy dữ liệu quiz: ' + err.message);
          toast.error('Lỗi khi lấy dữ liệu quiz!', { autoClose: 3000 });
          setLoading(false);
        });
    }
  }, [id]);

  // Cập nhật handleChange để xử lý cả totalTime và allowRetry 
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuiz(prevQuiz => ({
        ...prevQuiz,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value) // Chuyển thành số nếu là type number
    }));
  };

  // handleGenerateCode (giữ nguyên)
  const handleGenerateCode = () => {
    const newCode = generateRandomCode();
    setQuiz({ ...quiz, code: newCode });
    toast.info(`Đã tạo mã mới: ${newCode}`, { autoClose: 1500 });
  };

  // --- Các hàm xử lý câu hỏi (handleQuestionFieldChange, handleCorrectAnswerChange, handleAddOrUpdateQuestion, handleEditQuestion, handleDeleteQuestion) giữ nguyên ---
  // Hàm xử lý thay đổi cho câu hỏi và các tùy chọn
  const handleQuestionFieldChange = (e, field, index = null) => {
    const { value } = e.target;
    setNewQuestion(prev => {
        const updatedQuestion = { ...prev };
        if (field === 'question') {
            updatedQuestion.question = value;
        } else if (field === 'options' && index !== null) {
            const newOptions = [...updatedQuestion.options];
            const oldOptionValue = newOptions[index]; // Lấy giá trị cũ
            newOptions[index] = value;
            updatedQuestion.options = newOptions;

            // Nếu giá trị tùy chọn thay đổi, xóa giá trị cũ khỏi mảng correct nếu nó tồn tại
            const correctIndex = updatedQuestion.correct.indexOf(oldOptionValue);
            if (correctIndex > -1) {
                updatedQuestion.correct.splice(correctIndex, 1);
            }
        }
        return updatedQuestion;
    });
  };

  // Hàm xử lý thay đổi cho checkbox đáp án đúng
  const handleCorrectAnswerChange = (e) => {
    const { value, checked } = e.target;
    setNewQuestion(prev => {
        const updatedCorrect = [...prev.correct];
        if (checked) {
            if (!updatedCorrect.includes(value)) {
                updatedCorrect.push(value);
            }
        } else {
            const index = updatedCorrect.indexOf(value);
            if (index > -1) {
                updatedCorrect.splice(index, 1);
            }
        }
        return { ...prev, correct: updatedCorrect };
    });
  };


  const handleAddOrUpdateQuestion = () => {
    const validOptions = newQuestion.options.filter(opt => opt.trim() !== '');

    if (!newQuestion.question.trim() || validOptions.length < 2) {
      setError('Vui lòng nhập câu hỏi và ít nhất 2 tùy chọn hợp lệ!');
      toast.error('Vui lòng nhập câu hỏi và ít nhất 2 tùy chọn!', { autoClose: 3000 });
      return;
    }
    if (newQuestion.correct.length === 0) {
        setError('Vui lòng chọn ít nhất một đáp án đúng!');
        toast.error('Vui lòng chọn ít nhất một đáp án đúng!', { autoClose: 3000 });
        return;
    }
    const allCorrectAnswersAreValid = newQuestion.correct.every(correctAnswer =>
        validOptions.includes(correctAnswer)
    );
    if (!allCorrectAnswersAreValid) {
        setError('Một hoặc nhiều đáp án đúng đã chọn không hợp lệ!');
        toast.error('Đáp án đúng đã chọn không hợp lệ!', { autoClose: 3000 });
        return;
    }

    const questionToAddOrUpdate = {
        ...newQuestion,
        options: validOptions,
        correct: newQuestion.correct.filter(c => validOptions.includes(c))
    };

    const updatedQuestions = [...quiz.questions];
    if (editIndex !== null) {
      updatedQuestions[editIndex] = questionToAddOrUpdate;
      setEditIndex(null);
      toast.info('Đã cập nhật câu hỏi.', { autoClose: 1500 });
    } else {
      updatedQuestions.push(questionToAddOrUpdate);
      toast.info('Đã thêm câu hỏi mới.', { autoClose: 1500 });
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    setNewQuestion({ question: '', options: ['', '', '', ''], correct: [] });
    setError('');
  };

  const handleEditQuestion = (index) => {
    const questionToEdit = quiz.questions[index];
    const optionsWithPadding = [...questionToEdit.options];
    while (optionsWithPadding.length < 4) {
        optionsWithPadding.push('');
    }

    setNewQuestion({
        question: questionToEdit.question,
        options: optionsWithPadding.slice(0, 4),
        correct: [...questionToEdit.correct]
    });
    setEditIndex(index);
    setError('');
  };

  const handleDeleteQuestion = (index) => {
    toast.warn(
        <div>
            <p>Bạn có chắc muốn xóa câu hỏi này?</p>
            <div className="flex justify-end space-x-2 mt-2">
                <button
                    onClick={() => {
                        const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
                        setQuiz({ ...quiz, questions: updatedQuestions });
                        toast.dismiss();
                        toast.success('Đã xóa câu hỏi.', { autoClose: 1500 });
                        if (editIndex === index) {
                            setNewQuestion({ question: '', options: ['', '', '', ''], correct: [] });
                            setEditIndex(null);
                        }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                > Xóa </button>
                <button onClick={() => toast.dismiss()} className="px-3 py-1 bg-gray-400 text-white rounded text-sm" > Hủy </button>
            </div>
        </div>,
        { autoClose: false, closeOnClick: false, draggable: false, position: "top-center" }
    );
  };
  // --- Kết thúc các hàm xử lý câu hỏi ---


  // handleSubmit (giữ nguyên logic kiểm tra mã trùng và lưu quiz)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset lỗi ở đầu hàm

    // --- Validation cơ bản ---
    if (!quiz.title || !quiz.description || !quiz.code || quiz.totalTime === undefined || quiz.totalTime < 0) {
      setError('Vui lòng điền tiêu đề, mô tả, mã quiz và tổng thời gian hợp lệ (≥ 0)!');
      toast.error('Vui lòng điền đầy đủ thông tin quiz và thời gian!', { autoClose: 3000 });
      return;
    }

    // --- Chuẩn hóa mã và kiểm tra rỗng ---
    const finalCode = quiz.code.trim().toUpperCase();
    if (!finalCode) {
         setError('Mã quiz không được để trống.');
         toast.error('Mã quiz không được để trống!', { autoClose: 3000 });
         return;
    }
    // Cập nhật state với mã đã chuẩn hóa nếu nó khác ban đầu
    // Điều này quan trọng để dữ liệu gửi đi là mã đã chuẩn hóa
    if (quiz.code !== finalCode) {
        // Tạm thời cập nhật trực tiếp, hoặc bạn có thể set state và yêu cầu submit lại
        // setQuiz(prev => ({ ...prev, code: finalCode }));
        // Nếu set state, bạn nên thông báo cho người dùng và không tiếp tục ngay
        // toast.info('Mã quiz đã được chuẩn hóa thành chữ hoa. Vui lòng kiểm tra và nhấn Lưu lại.');
        // return;
        // Hoặc chấp nhận cập nhật ngầm và tiếp tục (như hiện tại)
    }


    // --- Kiểm tra mã trùng lặp (CHỈ KHI TẠO MỚI) ---
    if (!id) { // Chỉ kiểm tra khi không có id (tạo mới)
        setLoading(true); // Bắt đầu loading cho việc kiểm tra
        try {
            console.log(`Kiểm tra mã trùng lặp: ${finalCode}`); // Log mã đang kiểm tra
            const checkRes = await fetch(`http://localhost:3001/quizzes?code=${finalCode}`);

            // Kiểm tra lỗi mạng hoặc server
            if (!checkRes.ok) {
                throw new Error(`Lỗi ${checkRes.status} khi kiểm tra mã quiz`);
            }

            const existingQuizzes = await checkRes.json();
            console.log('Kết quả kiểm tra mã:', existingQuizzes); // Log kết quả

            // Nếu tìm thấy quiz có cùng mã
            if (existingQuizzes.length > 0) {
                setError(`Mã quiz "${finalCode}" đã tồn tại. Vui lòng chọn mã khác hoặc tạo mã ngẫu nhiên.`);
                toast.error('Mã quiz đã tồn tại!', { autoClose: 3000 });
                setLoading(false); // Dừng loading
                return; // Dừng không cho lưu
            }
            // Nếu không trùng, sẽ tiếp tục thực hiện phần lưu bên dưới
        } catch (err) {
            console.error('Lỗi khi kiểm tra mã quiz:', err); // Log lỗi chi tiết
            setError('Lỗi khi kiểm tra mã quiz: ' + err.message);
            toast.error('Lỗi khi kiểm tra mã quiz!', { autoClose: 3000 });
            setLoading(false); // Dừng loading
            return; // Dừng khi có lỗi kiểm tra
        }
        // Không cần setLoading(false) ở đây nếu kiểm tra thành công, vì sẽ tiếp tục loading để lưu
    }
    // --- Kết thúc kiểm tra mã trùng lặp ---


    // --- Cảnh báo nếu không có câu hỏi ---
    if (quiz.questions.length === 0) {
      toast.warn('Quiz chưa có câu hỏi, nhưng vẫn sẽ được lưu.', { autoClose: 3000 });
    }

    // --- Chuẩn bị và Lưu dữ liệu ---
    // Đảm bảo setLoading(true) nếu chưa được set ở phần kiểm tra mã
    if (!loading) setLoading(true);

    const method = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:3001/quizzes/${id}` : 'http://localhost:3001/quizzes';

    // Sử dụng finalCode đã chuẩn hóa để lưu
    const quizData = {
        ...quiz,
        code: finalCode, // <-- Luôn dùng mã đã chuẩn hóa
        id: id || Date.now().toString(),
        questions: quiz.questions.map(q => ({
            ...q,
            correct: Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : [])
        }))
     };

    try {
        const saveRes = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizData),
        });

        if (!saveRes.ok) {
            let errorMsg = `Lỗi ${saveRes.status} khi lưu quiz`;
            try { // Cố gắng đọc lỗi chi tiết từ server nếu có
                const errorBody = await saveRes.json();
                errorMsg = errorBody.message || errorMsg;
            } catch (_) { /* Bỏ qua lỗi parse json */ }
            throw new Error(errorMsg);
        }

        toast.success('Lưu quiz thành công!', { autoClose: 2000 });
        setTimeout(() => navigate('/admin/dashboard'), 2000);

    } catch (err) {
        console.error('Lỗi khi lưu quiz:', err); // Log lỗi chi tiết
        setError('Lỗi khi lưu quiz: ' + err.message);
        toast.error('Lỗi khi lưu quiz!', { autoClose: 3000 });
    } finally {
        setLoading(false); // Dừng loading sau khi lưu xong (thành công hoặc thất bại)
    }
  };
 

  // handleCancel (giữ nguyên)
  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {id ? 'Chỉnh sửa Quiz' : 'Thêm Quiz Mới'}
        </h2>

        {/* Các trường thông tin quiz */}
        {/* ... Tiêu đề, Mô tả, Mã Quiz, URL Hình ảnh giữ nguyên ... */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tiêu đề</label>
          <input
            type="text" name="title" value={quiz.title} onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Mô tả</label>
          <textarea
            name="description" value={quiz.description} onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required rows={3} disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Mã Quiz</label>
          <div className="flex items-center space-x-2">
            <input
              type="text" name="code" value={quiz.code} onChange={handleChange}
              className="flex-grow px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập mã hoặc tạo ngẫu nhiên" required disabled={loading}
              style={{ textTransform: 'uppercase' }}
            />
            <button
              type="button" onClick={handleGenerateCode}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              disabled={loading}
            > Tạo mã </button>
          </div>
           {error && error.includes("Mã quiz") && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">URL hình ảnh (tùy chọn)</label>
          <input
            type="url" name="image" value={quiz.image} onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg" disabled={loading}
          />
        </div>

        {/* Thêm trường nhập Tổng thời gian */}
        <div className="mb-4">
          <label htmlFor="totalTime" className="block text-gray-700 mb-2">Tổng thời gian (phút, nhập 0 nếu không giới hạn)</label>
          <input
            id="totalTime"
            type="number"
            name="totalTime"
            value={quiz.totalTime} // Không cần || '' vì 0 là giá trị hợp lệ
            onChange={handleChange}
            min="0" // Cho phép nhập 0
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
            required // Yêu cầu nhập
          />
           {error && error.includes("thời gian") && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        {/* Thêm checkbox Cho phép làm lại */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="allowRetry"
              checked={quiz.allowRetry}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-gray-700">Cho phép làm lại</span>
          </label>
        </div>

        {/* Phần câu hỏi (giữ nguyên) */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Câu hỏi</h3>
          {/* Danh sách câu hỏi hiện có */}
          <div className="mb-6 max-h-60 overflow-y-auto space-y-4 pr-2">
            {quiz.questions.length === 0 && ( <p className="text-gray-500 italic">Chưa có câu hỏi nào.</p> )}
            {quiz.questions.map((q, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                 <span className="absolute top-2 right-2 text-xs font-bold text-gray-400">#{index + 1}</span>
                <p className="font-medium mb-1 pr-6">{q.question}</p>
                <ul className="list-disc list-inside pl-1 space-y-1 text-sm">
                  {(q.options || []).map((option, i) => (
                    <li key={i} className={`${(q.correct || []).includes(option) ? 'text-green-700 font-semibold' : 'text-gray-700'} break-words`}>
                      {option} {(q.correct || []).includes(option) ? '(Đáp án đúng)' : ''}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex space-x-2">
                  <button type="button" onClick={() => handleEditQuestion(index)} className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm" disabled={loading} > Sửa </button>
                  <button type="button" onClick={() => handleDeleteQuestion(index)} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm" disabled={loading} > Xóa </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form thêm/sửa câu hỏi */}
          <div className="border p-4 rounded-lg bg-white mt-4">
             <h4 className="text-lg font-semibold text-gray-700 mb-3"> {editIndex !== null ? `Chỉnh sửa câu hỏi #${editIndex + 1}` : 'Thêm câu hỏi mới'} </h4>
             {error && (error.includes("câu hỏi") || error.includes("tùy chọn") || error.includes("Đáp án đúng")) && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="mb-3">
              <label className="block text-gray-600 text-sm font-medium mb-1">Câu hỏi</label>
              <input type="text" value={newQuestion.question} onChange={(e) => handleQuestionFieldChange(e, 'question')} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
            </div>
            <div className="mb-3">
              <label className="block text-gray-600 text-sm font-medium mb-1">Các tùy chọn (nhập ít nhất 2)</label>
              {newQuestion.options.map((option, index) => ( <input key={index} type="text" value={option} onChange={(e) => handleQuestionFieldChange(e, 'options', index)} placeholder={`Tùy chọn ${index + 1}`} className="w-full px-3 py-2 border rounded-lg mb-2 text-sm focus:ring-blue-500 focus:border-blue-500" disabled={loading} /> ))}
            </div>
            <div className="mb-3">
                <label className="block text-gray-600 text-sm font-medium mb-1">Chọn đáp án đúng (có thể chọn nhiều)</label>
                <div className="space-y-2 mt-1">
                    {newQuestion.options.map((option, index) => ( option.trim() !== '' && ( <div key={index} className="flex items-center"> <input type="checkbox" id={`correct-option-${index}`} value={option} checked={newQuestion.correct.includes(option)} onChange={handleCorrectAnswerChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={loading} /> <label htmlFor={`correct-option-${index}`} className="ml-2 block text-sm text-gray-900 break-words"> {option} </label> </div> ) ))}
                    {newQuestion.options.every(opt => opt.trim() === '') && ( <p className="text-xs text-gray-500 italic">Nhập các tùy chọn ở trên để chọn đáp án đúng.</p> )}
                </div>
            </div>
            <button type="button" onClick={handleAddOrUpdateQuestion} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm" disabled={loading} > {editIndex !== null ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'} </button>
            {editIndex !== null && ( <button type="button" onClick={() => { setNewQuestion({ question: '', options: ['', '', '', ''], correct: [] }); setEditIndex(null); setError(''); }} className="ml-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm" disabled={loading} > Hủy sửa </button> )}
          </div>
        </div>


        {/* Nút Lưu và Hủy (giữ nguyên) */}
        <div className="flex space-x-4 mt-8">
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed" > {loading ? ( <span className="flex items-center justify-center"> <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Đang lưu... </span> ) : (id ? 'Lưu thay đổi' : 'Tạo Quiz mới')} </button>
          <button type="button" onClick={handleCancel} disabled={loading} className="flex-1 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed" > Hủy </button>
        </div>
      </form>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default QuizForm;
