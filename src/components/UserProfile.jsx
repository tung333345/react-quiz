// src/components/UserProfile.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./content/UserContent"; // Import Context người dùng
import { ToastContainer, toast } from "react-toastify"; // Import thư viện Toast thông báo
import bcrypt from "bcryptjs"; // Import thư viện mã hóa mật khẩu
import "react-toastify/dist/ReactToastify.css"; // Import CSS cho Toast

function UserProfile() {
  // Lấy thông tin người dùng và trạng thái đăng nhập từ Context
  const { userId, isUserLoggedIn } = useContext(UserContext);
  // Hook để điều hướng trang (quan trọng: cần có <BrowserRouter> bao bọc ứng dụng)
  const navigate = useNavigate();

  // State lưu trữ thông tin người dùng lấy từ API
  const [userData, setUserData] = useState(null);
  // State cờ báo hiệu đang tải dữ liệu người dùng
  const [loadingUser, setLoadingUser] = useState(true);

  // State cho các trường trong form đổi mật khẩu
  const [oldPassword, setOldPassword] = useState(""); // Mật khẩu cũ
  const [newPassword, setNewPassword] = useState(""); // Mật khẩu mới
  const [confirmNewPassword, setConfirmNewPassword] = useState(""); // Xác nhận mật khẩu mới
  const [passwordError, setPasswordError] = useState(""); // Thông báo lỗi mật khẩu
  const [passwordLoading, setPasswordLoading] = useState(false); // Cờ báo hiệu đang xử lý đổi mật khẩu

  // State cho form đổi ảnh đại diện (lưu URL)
  const [avatarUrl, setAvatarUrl] = useState(""); // URL ảnh đại diện
  const [avatarLoading, setAvatarLoading] = useState(false); // Cờ báo hiệu đang xử lý đổi avatar
  const [avatarError, setAvatarError] = useState(""); // Thông báo lỗi avatar

  // useEffect Hook: Chạy khi component được mount hoặc userId thay đổi
  // Mục đích: Lấy thông tin người dùng từ API
  useEffect(() => {
    let isMounted = true; // Cờ để kiểm tra component còn tồn tại (tránh lỗi memory leak)

    // Chỉ fetch dữ liệu nếu có userId
    if (userId) {
      setLoadingUser(true); // Bắt đầu trạng thái loading
      fetch(`http://localhost:3001/users/${userId}`) // Gọi API lấy thông tin user
        .then((res) => {
          // Nếu response không thành công (status không phải 2xx)
          if (!res.ok) {
            // Cố gắng đọc nội dung lỗi từ response body
            return res.text().then((text) => {
              let errorMsg = `Không thể tải thông tin người dùng (Status: ${res.status})`;
              try {
                const errorBody = JSON.parse(text);
                errorMsg = errorBody.message || errorMsg;
              } catch (e) {
                /* Bỏ qua lỗi parse */
              }
              throw new Error(errorMsg); // Ném lỗi
            });
          }
          return res.json(); // Nếu thành công, parse response thành JSON
        })
        .then((data) => {
          // Chỉ cập nhật state nếu component vẫn còn mounted
          if (isMounted) {
            setUserData(data); // Lưu dữ liệu người dùng
            setAvatarUrl(data.avatar || ""); // Cập nhật URL avatar
            setLoadingUser(false); // Kết thúc loading
          }
        })
        .catch((err) => {
          // Chỉ xử lý lỗi nếu component vẫn còn mounted
          if (isMounted) {
            console.error("Lỗi khi tải dữ liệu người dùng:", err);
            toast.error(`Lỗi tải thông tin người dùng: ${err.message}`, {
              autoClose: 4000,
            });
            setLoadingUser(false); // Kết thúc loading
            setUserData(null); // Đặt lại userData khi lỗi
          }
        });
    } else {
      // Nếu không có userId
      if (isMounted) {
        setLoadingUser(false);
        setUserData(null);
      }
    }

    // Hàm cleanup: Chạy khi component bị unmount
    return () => {
      isMounted = false; // Đánh dấu đã unmount
    };
  }, [userId]); // Chạy lại nếu userId thay đổi

  // Hàm xử lý sự kiện submit form đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault(); // Ngăn form submit gây reload trang
    setPasswordError("");
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Mật khẩu mới không khớp.");
      return;
    }
    if (!userData || !userData.password) {
      setPasswordError("Không thể xác thực mật khẩu cũ.");
      return;
    }

    setPasswordLoading(true);

    // 1. Xác thực mật khẩu cũ
    const isOldPasswordCorrect = bcrypt.compareSync(
      oldPassword,
      userData.password
    );

    if (!isOldPasswordCorrect) {
      setPasswordError("Mật khẩu cũ không đúng.");
      setPasswordLoading(false);
      return;
    }

    // 2. Kiểm tra nếu mật khẩu mới trùng với mật khẩu cũ
    const isNewPasswordSameAsOld = bcrypt.compareSync(
      newPassword,
      userData.password
    );
    if (isNewPasswordSameAsOld) {
      setPasswordError("Mật khẩu mới không được trùng với mật khẩu cũ.");
      setPasswordLoading(false);
      return;
    }

    // 3. Mã hóa mật khẩu mới
    const salt = bcrypt.genSaltSync(10);
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

    try {
      // 4. Gửi yêu cầu cập nhật lên API
      const res = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: hashedNewPassword }),
      });

      if (!res.ok) throw new Error("Lỗi khi cập nhật mật khẩu");

      // Reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setUserData({ ...userData, password: hashedNewPassword });

      // Hiển thị alert và chuyển về trang chủ
      alert("🎉 Đổi mật khẩu thành công!");
      navigate("/");
    } catch (err) {
      setPasswordError("Đã xảy ra lỗi: " + err.message);
      alert("❌ Lỗi khi đổi mật khẩu!");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Hàm xử lý sự kiện submit form đổi ảnh đại diện
  const handleChangeAvatar = async (e) => {
    e.preventDefault(); // Ngăn form tải lại trang
    setAvatarError(""); // Xóa lỗi cũ
    setAvatarLoading(true); // Bật loading

    // Kiểm tra URL
    if (!avatarUrl || !/^https?:\/\/.+\..+/.test(avatarUrl)) {
      setAvatarError("Vui lòng nhập URL ảnh đại diện hợp lệ.");
      setAvatarLoading(false);
      return;
    }

    try {
      // Gửi yêu cầu cập nhật avatar
      const res = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: avatarUrl }),
      });

      // Xử lý nếu API lỗi
      if (!res.ok) {
        let errorMsg = `Lỗi ${res.status} khi cập nhật ảnh đại diện`;
        try {
          const errorBody = await res.json();
          errorMsg = errorBody.message || errorMsg;
        } catch (parseError) {
          errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Xử lý khi thành công
      toast.success("Cập nhật ảnh đại diện thành công!", { autoClose: 3000 });
      setUserData((prevUserData) => ({ ...prevUserData, avatar: avatarUrl })); // Cập nhật state local
      setAvatarError(""); // Xóa lỗi
    } catch (err) {
      // Bắt và xử lý lỗi
      console.error("Lỗi khi đổi ảnh đại diện:", err);
      setAvatarError("Đã xảy ra lỗi: " + err.message);
      toast.error(`Lỗi khi cập nhật ảnh đại diện: ${err.message}`, {
        autoClose: 4000,
      });
    } finally {
      // Luôn tắt loading
      setAvatarLoading(false);
    }
  };

  // --- Logic Render Component ---

  // Hiển thị loading khi đang tải dữ liệu người dùng
  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Đang tải thông tin hồ sơ...
      </div>
    );
  }

  // Xử lý trường hợp chưa đăng nhập
  if (!isUserLoggedIn) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <p className="text-red-600 mb-4">Vui lòng đăng nhập để xem hồ sơ.</p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  // Xử lý trường hợp không tải được dữ liệu người dùng
  if (!userData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <p className="text-red-600 mb-4">
          Không thể tải hồ sơ. Vui lòng thử lại sau.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  // Render giao diện chính
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          Hồ sơ của bạn
        </h1>

        {/* Phần thông tin cơ bản */}
        <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Thông tin cơ bản
          </h2>
          <div className="flex items-center space-x-4 mb-4">
            <img
              key={userData.avatar}
              src={
                userData.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userData.username || "User"
                )}&background=random&size=80`
              }
              alt={`Avatar của ${userData.username}`}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
              onError={(e) => {
                const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userData.username || "User"
                )}&background=random&size=80`;
                if (e.target.src !== fallbackSrc) {
                  e.target.onerror = null;
                  e.target.src = fallbackSrc;
                }
              }}
            />
            <div className="min-w-0">
              <p className="text-lg font-medium text-gray-900 truncate">
                {userData.username}
              </p>
            </div>
          </div>
        </div>

        {/* Phần đổi ảnh đại diện */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Đổi ảnh đại diện
          </h2>
          <form onSubmit={handleChangeAvatar} className="space-y-4">
            <div>
              <label
                htmlFor="avatarUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                URL ảnh đại diện mới
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  if (avatarError) setAvatarError("");
                }}
                placeholder="https://example.com/image.jpg"
                className={`w-full px-4 py-2 border ${
                  avatarError ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-blue-500 focus:border-blue-500 transition`}
                disabled={avatarLoading}
                aria-describedby="avatar-error-message"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nhập URL trực tiếp đến ảnh (ví dụ: .jpg, .png, .gif).
              </p>
            </div>
            {avatarError && (
              <p
                id="avatar-error-message"
                className="text-red-500 text-sm mt-1"
              >
                {avatarError}
              </p>
            )}
            <button
              type="submit"
              disabled={avatarLoading || !avatarUrl.trim()}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {avatarLoading ? "Đang lưu..." : "Lưu ảnh đại diện"}
            </button>
          </form>
        </div>

        {/* Phần đổi mật khẩu */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Đổi mật khẩu
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Mật khẩu cũ */}
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mật khẩu cũ
              </label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className={`w-full px-4 py-2 border ${
                  passwordError.includes("cũ")
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition`}
                required
                autoComplete="current-password"
                disabled={passwordLoading}
                aria-describedby="password-error-message"
              />
            </div>
            {/* Mật khẩu mới */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mật khẩu mới (ít nhất 6 ký tự)
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className={`w-full px-4 py-2 border ${
                  passwordError && !passwordError.includes("cũ")
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition`}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={passwordLoading}
                aria-describedby="password-error-message"
              />
            </div>
            {/* Xác nhận mật khẩu mới */}
            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className={`w-full px-4 py-2 border ${
                  passwordError.includes("khớp")
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition`}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={passwordLoading}
                aria-describedby="password-error-message"
              />
            </div>
            {/* Hiển thị lỗi mật khẩu */}
            {passwordError && (
              <p
                id="password-error-message"
                className="text-red-500 text-sm mt-1"
              >
                {passwordError}
              </p>
            )}
            {/* Nút submit */}
            <button
              type="submit"
              disabled={
                passwordLoading ||
                !oldPassword ||
                !newPassword ||
                !confirmNewPassword
              }
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {passwordLoading ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>

        {/* Nút quay lại trang chủ */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
      {/* Container cho toast */}
      <ToastContainer
        position="top-right"
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default UserProfile;
