import { useState, useEffect, useReducer, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- Keys cho localStorage ---
const getStorageKey = (quizId) => `quizState_${quizId}`;
const getResultKey = (quizId) => `quiz_${quizId}_result`;

// --- Định nghĩa các Action Types cho Reducer ---
const actionTypes = {
  FETCH_INIT: 'FETCH_INIT',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_FAILURE: 'FETCH_FAILURE',
  RESET_QUIZ: 'RESET_QUIZ', // Khi allowRetry: true
  BLOCK_QUIZ: 'BLOCK_QUIZ', // Khi đã hoàn thành và không cho làm lại
  RESTORE_STATE: 'RESTORE_STATE', // Khôi phục từ localStorage
  START_FRESH: 'START_FRESH', // Bắt đầu mới (không khôi phục)
  SELECT_OPTION: 'SELECT_OPTION',
  NEXT_QUESTION: 'NEXT_QUESTION',
  PREVIOUS_QUESTION: 'PREVIOUS_QUESTION',
  FINISH_QUIZ: 'FINISH_QUIZ',
  TIME_TICK: 'TIME_TICK', // Giảm thời gian
  QUESTION_TIMEOUT: 'QUESTION_TIMEOUT', // Hết giờ câu hỏi (nếu cần xử lý riêng)
  OVERALL_TIMEOUT: 'OVERALL_TIMEOUT', // Hết giờ tổng
  SET_ERROR: 'SET_ERROR',
};

// --- Initial State cho Reducer ---
const initialState = {
  quiz: null,
  currentQuestionIndex: 0,
  score: 0,
  selectedOptions: [], // Luôn là mảng
  questionTimeLeft: 30, // Thời gian còn lại cho câu hiện tại
  overallTimeLeft: null, // Tổng thời gian còn lại (giây), null = không giới hạn
  isLoading: true,
  error: null,
  isFinished: false, // Đánh dấu quiz đã kết thúc chưa
  isBlocked: false, // Đánh dấu quiz bị chặn làm lại
  restoredFromStorage: false, // Đánh dấu đã khôi phục từ storage
};

// --- Reducer Function ---
function quizReducer(state, action) {
  console.log(`[Reducer] Action: ${action.type}`, action.payload); // Log action để debug
  switch (action.type) {
    case actionTypes.FETCH_INIT:
      return {
        ...initialState, // Reset hoàn toàn khi fetch quiz mới
        isLoading: true,
      };
    case actionTypes.FETCH_SUCCESS: {
      const quizData = action.payload;
      const firstQuestionTime = quizData.questions[0]?.time || 30;
      const initialOverallTime = quizData.totalTime !== null && quizData.totalTime > 0
        ? quizData.totalTime * 60
        : null;
      return {
        ...state,
        quiz: quizData,
        questionTimeLeft: firstQuestionTime,
        overallTimeLeft: initialOverallTime,
        // isLoading sẽ được set false sau khi logic reset/restore hoàn tất
      };
    }
    case actionTypes.FETCH_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case actionTypes.RESET_QUIZ: { // Xử lý khi allowRetry: true
      const quizData = state.quiz; // Lấy quiz data từ state hiện tại
      const firstQuestionTime = quizData.questions[0]?.time || 30;
      const initialOverallTime = quizData.totalTime !== null && quizData.totalTime > 0
        ? quizData.totalTime * 60
        : null;
      return {
        ...initialState, // Reset về trạng thái ban đầu
        quiz: quizData, // Giữ lại quiz data đã fetch
        questionTimeLeft: firstQuestionTime,
        overallTimeLeft: initialOverallTime,
        isLoading: false, // Hoàn tất reset
      };
    }
    case actionTypes.BLOCK_QUIZ: // Khi đã hoàn thành và không cho làm lại
      return {
        ...state,
        isLoading: false,
        isBlocked: true,
        error: 'Bạn đã hoàn thành quiz này và không được phép làm lại.',
      };
    case actionTypes.RESTORE_STATE: { // Khôi phục từ localStorage
      const { currentQuestionIndex, score, overallTimeLeft } = action.payload;
      const questionTime = state.quiz.questions[currentQuestionIndex]?.time || 30;
      return {
        ...state,
        currentQuestionIndex,
        score,
        overallTimeLeft,
        questionTimeLeft: questionTime, // Reset time cho câu được khôi phục
        selectedOptions: [], // Không khôi phục lựa chọn
        isLoading: false,
        restoredFromStorage: true,
      };
    }
    case actionTypes.START_FRESH: { // Bắt đầu mới (không khôi phục)
      const quizData = state.quiz;
      const firstQuestionTime = quizData.questions[0]?.time || 30;
      const initialOverallTime = quizData.totalTime !== null && quizData.totalTime > 0
        ? quizData.totalTime * 60
        : null;
      return {
        ...state, // Giữ lại quiz data
        currentQuestionIndex: 0,
        score: 0,
        selectedOptions: [],
        questionTimeLeft: firstQuestionTime,
        overallTimeLeft: initialOverallTime,
        isLoading: false,
        restoredFromStorage: false,
      };
    }
    case actionTypes.SELECT_OPTION: {
      const { option, isMultipleChoice } = action.payload;
      let newSelectedOptions;
      if (isMultipleChoice) {
        const currentIndex = state.selectedOptions.indexOf(option);
        if (currentIndex === -1) {
          newSelectedOptions = [...state.selectedOptions, option];
        } else {
          newSelectedOptions = state.selectedOptions.filter((_, index) => index !== currentIndex);
        }
      } else {
        newSelectedOptions = [option]; // Single choice luôn là mảng 1 phần tử
      }
      return {
        ...state,
        selectedOptions: newSelectedOptions,
        error: null, // Xóa lỗi khi chọn
      };
    }
    case actionTypes.NEXT_QUESTION: {
      const { scoreIncrease } = action.payload;
      const nextIndex = state.currentQuestionIndex + 1;
      const nextQuestionTime = state.quiz.questions[nextIndex]?.time || 30;
      return {
        ...state,
        currentQuestionIndex: nextIndex,
        score: state.score + scoreIncrease,
        selectedOptions: [], // Reset lựa chọn
        questionTimeLeft: nextQuestionTime, // Reset time cho câu mới
        error: null,
      };
    }
    case actionTypes.PREVIOUS_QUESTION: {
      const prevIndex = state.currentQuestionIndex - 1;
      if (prevIndex < 0) return state; // Không làm gì nếu ở câu đầu
      const prevQuestion = state.quiz.questions[prevIndex];
      const prevQuestionTime = prevQuestion?.time || 30;
      // Khôi phục lựa chọn đã lưu (nếu có) - Cần lưu lựa chọn vào state quiz khi chuyển câu
      // Tạm thời reset lựa chọn khi quay lại để đơn giản
      return {
        ...state,
        currentQuestionIndex: prevIndex,
        selectedOptions: [], // Reset lựa chọn khi quay lại (cần cải thiện nếu muốn giữ)
        questionTimeLeft: prevQuestionTime, // Reset time
        error: null,
      };
    }
    case actionTypes.FINISH_QUIZ: {
       const { scoreIncrease, updatedQuestions } = action.payload;
       // Cập nhật câu hỏi cuối cùng với lựa chọn (nếu cần)
       const finalQuizState = {
           ...state.quiz,
           questions: updatedQuestions || state.quiz.questions
       };
       return {
        ...state,
        quiz: finalQuizState,
        score: state.score + scoreIncrease,
        isFinished: true, // Đánh dấu đã hoàn thành
        isLoading: false, // Đảm bảo tắt loading
      };
    }
    case actionTypes.TIME_TICK: {
      let newOverallTime = state.overallTimeLeft;
      if (newOverallTime !== null && newOverallTime > 0) {
        newOverallTime -= 1;
      }

      let newQuestionTime = state.questionTimeLeft;
      if (newQuestionTime > 0) {
        newQuestionTime -= 1;
      }

      // Kiểm tra hết giờ tổng
      if (newOverallTime !== null && newOverallTime <= 0 && !state.isFinished) {
         // Dispatch OVERALL_TIMEOUT thay vì xử lý trực tiếp ở đây
         // Hoặc giữ lại logic điều hướng ở đây nếu muốn
         console.log("[Reducer] Overall Timeout Detected!");
         return { ...state, overallTimeLeft: 0, questionTimeLeft: 0, isFinished: true }; // Đánh dấu hết giờ
      }

      // Kiểm tra hết giờ câu hỏi (nếu cần xử lý riêng)
      // if (newQuestionTime <= 0) {
      //   // Dispatch QUESTION_TIMEOUT
      // }

      return {
        ...state,
        overallTimeLeft: newOverallTime,
        questionTimeLeft: newQuestionTime,
      };
    }
     case actionTypes.OVERALL_TIMEOUT: // Xử lý khi action OVERALL_TIMEOUT được dispatch
       return {
         ...state,
         overallTimeLeft: 0,
         questionTimeLeft: 0,
         isFinished: true, // Đánh dấu hết giờ và hoàn thành
         error: 'Đã hết tổng thời gian làm bài!', // Có thể set lỗi
       };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// --- Hàm xáo trộn mảng (Fisher-Yates Shuffle) ---
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function Quiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const {
    quiz,
    currentQuestionIndex,
    score,
    selectedOptions,
    questionTimeLeft,
    overallTimeLeft,
    isLoading,
    error,
    isFinished,
    isBlocked,
    restoredFromStorage,
  } = state;

  // --- Fetch Data useEffect ---
  useEffect(() => {
    if (!quizId) {
      dispatch({ type: actionTypes.FETCH_FAILURE, payload: 'Quiz ID không hợp lệ' });
      return;
    }

    const storageKey = getStorageKey(quizId);
    const resultKey = getResultKey(quizId);

    const fetchData = async () => {
      dispatch({ type: actionTypes.FETCH_INIT }); // Bắt đầu fetch, reset state
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`);
        if (!res.ok) throw new Error('Không thể tải dữ liệu quiz');
        const data = await res.json();

        console.log('[Fetch Effect] Raw data fetched:', data);
        const sanitizedData = {
          ...data,
          allowRetry: data.allowRetry === true,
          totalTime: data.totalTime !== undefined ? data.totalTime : null,
          questions: (data.questions || []).map(q => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : [],
            correct: Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : []),
            time: q.time !== undefined ? q.time : 30
          }))
        };
        console.log('[Fetch Effect] Sanitized data (before shuffle):', sanitizedData);

        // --- Xáo trộn câu hỏi ---
        const shuffledQuestions = shuffleArray([...sanitizedData.questions]); // Tạo bản sao và xáo trộn
        sanitizedData.questions = shuffledQuestions;
        console.log('[Fetch Effect] Sanitized data (after shuffle):', sanitizedData);

        // Dispatch FETCH_SUCCESS để cập nhật quiz data vào state
        dispatch({ type: actionTypes.FETCH_SUCCESS, payload: sanitizedData });

        // --- Logic xử lý sau khi fetch thành công ---
        if (sanitizedData.allowRetry) {
          console.log('[Fetch Effect] Dispatching RESET_QUIZ');
          localStorage.removeItem(storageKey);
          localStorage.removeItem(resultKey);
          dispatch({ type: actionTypes.RESET_QUIZ });
          return; // Dừng lại
        }

        // Nếu không cho làm lại
        const savedResult = localStorage.getItem(resultKey);
        console.log('[Fetch Effect] Checking resultKey:', resultKey, 'Value:', savedResult);
        if (savedResult) {
          console.log('[Fetch Effect] Dispatching BLOCK_QUIZ');
          dispatch({ type: actionTypes.BLOCK_QUIZ });
          return; // Dừng lại
        }

        // Nếu chưa hoàn thành và không cho làm lại -> Thử khôi phục
        try {
          const savedStateJSON = localStorage.getItem(storageKey);
          console.log('[Fetch Effect] Checking storageKey:', storageKey, 'Value:', savedStateJSON);
          if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            if (
              savedState &&
              savedState.quizId === quizId &&
              (savedState.overallTimeLeft === null || savedState.overallTimeLeft > 0) &&
              savedState.currentQuestion < sanitizedData.questions.length
            ) {
              console.log('[Fetch Effect] Dispatching RESTORE_STATE');
              dispatch({
                type: actionTypes.RESTORE_STATE,
                payload: {
                  currentQuestionIndex: savedState.currentQuestion,
                  score: savedState.score,
                  overallTimeLeft: savedState.overallTimeLeft,
                },
              });
               toast.info('Đã khôi phục trạng thái làm bài.', { autoClose: 1500 });
            } else {
              console.log('[Fetch Effect] Invalid saved state. Dispatching START_FRESH');
              localStorage.removeItem(storageKey); // Xóa state cũ lỗi
              dispatch({ type: actionTypes.START_FRESH });
            }
          } else {
            console.log('[Fetch Effect] No saved state. Dispatching START_FRESH');
            dispatch({ type: actionTypes.START_FRESH });
          }
        } catch (parseError) {
          console.error("[Fetch Effect] Error parsing state. Dispatching START_FRESH", parseError);
          localStorage.removeItem(storageKey); // Xóa state lỗi
          dispatch({ type: actionTypes.START_FRESH });
        }

      } catch (err) {
        console.error('[Fetch Effect] Fetch error:', err);
        localStorage.removeItem(storageKey); // Dọn dẹp nếu fetch lỗi
        localStorage.removeItem(resultKey);
        dispatch({ type: actionTypes.FETCH_FAILURE, payload: 'Không thể tải quiz. Vui lòng thử lại.' });
      }
    };

    fetchData();

  }, [quizId]); // Chỉ chạy khi quizId thay đổi

  // --- Timer useEffect ---
  useEffect(() => {
    // Chỉ chạy timer khi quiz đã load, chưa hoàn thành, và có thời gian tổng hoặc không giới hạn
    if (isLoading || isFinished || isBlocked || !quiz) {
      return;
    }

    // Timer chỉ chạy khi overallTimeLeft > 0 hoặc là null (không giới hạn)
    if (overallTimeLeft !== null && overallTimeLeft <= 0) {
        // Nếu hết giờ tổng nhưng isFinished chưa là true (trường hợp hiếm), dispatch timeout
        if (!isFinished) {
            console.log("[Timer Effect] Dispatching OVERALL_TIMEOUT because overallTimeLeft <= 0");
            dispatch({ type: actionTypes.OVERALL_TIMEOUT });
        }
        return;
    }


    const timerId = setInterval(() => {
      dispatch({ type: actionTypes.TIME_TICK });
    }, 1000);

    // Cleanup timer
    return () => clearInterval(timerId);
  }, [isLoading, isFinished, isBlocked, quiz, overallTimeLeft]); // Phụ thuộc các trạng thái này

   // --- useEffect điều hướng khi hết giờ tổng ---
   // Tách riêng để xử lý điều hướng sau khi state isFinished được cập nhật
   useEffect(() => {
       if (isFinished && overallTimeLeft === 0 && quiz) { // Chỉ điều hướng khi hết giờ thực sự
           console.log("[Navigate Effect] Navigating due to overall timeout.");
           const storageKey = getStorageKey(quizId);
           const resultKey = getResultKey(quizId);
           localStorage.removeItem(storageKey); // Xóa state đang làm dở

           // Lưu dấu hiệu đã hoàn thành nếu không cho làm lại
           if (!quiz.allowRetry) {
               const resultData = {
                 score: score,
                 total: quiz.questions.length,
                 finishedAt: new Date().toISOString(),
                 timedOut: true
               };
               try {
                 localStorage.setItem(resultKey, JSON.stringify(resultData));
                 console.log('[Timeout Navigate] Saved resultKey (no retry):', resultKey);
               } catch (e) {
                 console.error("[Timeout Navigate] Error saving resultKey:", e);
               }
           }

           navigate('/result', {
               state: {
                   score: score,
                   total: quiz.questions.length,
                   quizTitle: quiz.title,
                   timeUp: true,
                   quizId: quizId,
                   questions: quiz.questions // Gửi câu hỏi để tính lại điểm
               },
               replace: true
           });
       }
   }, [isFinished, overallTimeLeft, quiz, score, quizId, navigate]);


  // --- State Saving useEffect ---
  useEffect(() => {
    // Chỉ lưu khi: không loading, có quiz, chưa xong, chưa bị chặn, và *không* phải câu cuối
    const isLastQuestion = quiz && quiz.questions && currentQuestionIndex === quiz.questions.length - 1;

    if (!isLoading && quiz && quiz.questions.length > 0 && !isFinished && !isBlocked && !isLastQuestion &&
        (overallTimeLeft === null || overallTimeLeft > 0)) {
      const storageKey = getStorageKey(quizId);
      const stateToSave = {
        quizId,
        currentQuestion: currentQuestionIndex,
        score,
        overallTimeLeft,
      };
      console.log('[Save State Effect] Saving state:', stateToSave);
      try {
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        console.error("[Save State Effect] Error saving state:", e);
      }
    }
  }, [isLoading, quiz, currentQuestionIndex, score, overallTimeLeft, isFinished, isBlocked, quizId]);


  // --- Event Handlers ---
  const handleOptionChange = useCallback((option, isMultipleChoice) => {
    dispatch({ type: actionTypes.SELECT_OPTION, payload: { option, isMultipleChoice } });
  }, []);

  const handleNext = useCallback(() => {
    if (!quiz || currentQuestionIndex >= quiz.questions.length) return;

    const currentQ = quiz.questions[currentQuestionIndex];
    const isMultipleChoice = currentQ.correct.length > 1;

    // Tính điểm
    const arraysEqual = (arr1, arr2) => { // Helper function
        if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length !== arr2.length) return false;
        const sortedArr1 = [...arr1].sort();
        const sortedArr2 = [...arr2].sort();
        return sortedArr1.every((val, index) => val === sortedArr2[index]);
    };
    const isCorrect = isMultipleChoice
      ? arraysEqual(selectedOptions, currentQ.correct)
      : selectedOptions[0] === (currentQ.correct[0] || null);
    const scoreIncrease = isCorrect ? 1 : 0;

    // Lưu lựa chọn vào câu hỏi hiện tại (để gửi đi khi hoàn thành)
     const updatedQuestions = quiz.questions.map((q, index) =>
        index === currentQuestionIndex ? { ...q, selectedOptions: selectedOptions } : q
    );


    if (currentQuestionIndex < quiz.questions.length - 1) {
      // Chuyển câu tiếp theo
      dispatch({ type: actionTypes.NEXT_QUESTION, payload: { scoreIncrease } });
    } else {
      // Hoàn thành quiz
      dispatch({ type: actionTypes.FINISH_QUIZ, payload: { scoreIncrease, updatedQuestions } });

      // Xử lý sau khi state FINISH_QUIZ được cập nhật
      const finalScore = score + scoreIncrease;
      const storageKey = getStorageKey(quizId);
      const resultKey = getResultKey(quizId);
      localStorage.removeItem(storageKey); // Xóa state đang làm dở
      console.log('[Finish Quiz] Removed storageKey:', storageKey);

      // Lưu dấu hiệu đã hoàn thành nếu không cho làm lại
      if (!quiz.allowRetry) {
        const resultData = { score: finalScore, total: quiz.questions.length, finishedAt: new Date().toISOString() };
        try {
          localStorage.setItem(resultKey, JSON.stringify(resultData));
          console.log('[Finish Quiz] Saved resultKey (no retry):', resultKey);
        } catch (e) { console.error("[Finish Quiz] Error saving resultKey:", e); }
      }

      // Điều hướng đến trang kết quả
      navigate('/result', {
        state: {
          score: finalScore,
          total: quiz.questions.length,
          quizTitle: quiz.title,
          timeUp: overallTimeLeft !== null && overallTimeLeft <= 0,
          quizId: quizId,
          questions: updatedQuestions, // Gửi câu hỏi với lựa chọn
        },
        replace: true,
      });
    }
  }, [quiz, currentQuestionIndex, selectedOptions, score, overallTimeLeft, navigate, quizId]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch({ type: actionTypes.PREVIOUS_QUESTION });
    }
  }, [currentQuestionIndex]);


  // --- Render Logic ---
  if (isLoading) {
    return <div className="text-center py-12">Đang tải câu hỏi...</div>;
  }

  // Lỗi chặn làm lại hoặc lỗi fetch
  if (error || isBlocked) {
    return <div className="text-center py-12 text-red-600">{error || 'Quiz này không thể truy cập.'}</div>;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <div className="text-center py-12 text-red-600">Không có câu hỏi nào cho quiz này hoặc quiz không tồn tại.</div>;
  }

  // Lấy câu hỏi hiện tại một cách an toàn
  const currentQ = quiz.questions[currentQuestionIndex];
  if (!currentQ) {
     console.error("Không tìm thấy câu hỏi tại index:", currentQuestionIndex);
     return <div className="text-center py-12 text-red-600">Lỗi: Không tìm thấy câu hỏi hiện tại.</div>;
  }
  // Kiểm tra cấu trúc câu hỏi cơ bản
  if (!currentQ.question || !Array.isArray(currentQ.options) || !Array.isArray(currentQ.correct)) {
    console.error("Dữ liệu câu hỏi không hợp lệ tại index:", currentQuestionIndex, currentQ);
    return <div className="text-center py-12 text-red-600">Lỗi: Dữ liệu câu hỏi không hợp lệ.</div>;
  }

  const isMultipleChoice = currentQ.correct.length > 1;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isNextDisabled = (!isMultipleChoice && selectedOptions.length === 0) || (isMultipleChoice && selectedOptions.length === 0) || (overallTimeLeft !== null && overallTimeLeft <= 0);

  const formatOverallTime = (seconds) => {
    if (seconds === null) return 'Không giới hạn';
    if (seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-xl">
        <h1 className="text-xl font-semibold text-gray-700 mb-4 text-center">{quiz.title}</h1>
        <div className="flex justify-between items-center mb-4 text-sm">
          <p className="font-medium text-gray-600">
            Tổng thời gian: <span className="font-mono font-semibold">{formatOverallTime(overallTimeLeft)}</span>
          </p>
          <p className="font-medium text-gray-600">
            Thời gian câu: <span className="font-mono font-semibold">{questionTimeLeft}s</span>
          </p>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Câu hỏi {currentQuestionIndex + 1}/{quiz.questions.length}
          </h2>
        </div>
        <p className="text-xl text-gray-700 mb-6">{currentQ.question}</p>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <label key={index} className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 transition cursor-pointer ${
                selectedOptions.includes(option) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
              {isMultipleChoice ? (
                <input
                  type="checkbox"
                  value={option}
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleOptionChange(option, true)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 flex-shrink-0"
                  disabled={overallTimeLeft !== null && overallTimeLeft <= 0}
                />
              ) : (
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  value={option}
                  checked={selectedOptions[0] === option}
                  onChange={() => handleOptionChange(option, false)}
                  className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3 flex-shrink-0"
                  disabled={overallTimeLeft !== null && overallTimeLeft <= 0}
                />
              )}
              <span className="text-gray-800 break-words">{option}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="mt-6 flex justify-between">
          <button
            onClick={handlePrevious}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentQuestionIndex === 0 || isLoading || (overallTimeLeft !== null && overallTimeLeft <= 0)}
          >
            Quay lại
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isNextDisabled || isLoading}
          >
            {isLastQuestion ? 'Hoàn thành' : 'Tiếp theo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
