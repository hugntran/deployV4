import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import "./SayHi.css";
import { API_BASE_URL } from "../../config";

interface DecodedToken {
  scope: string;
  exp: number;
  locationId: string;
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => setFlipped(!flipped);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/identity/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      const token = data.result.token;
      const expiry = data.result.expiryTime;

      // token
      const decoded: DecodedToken = jwtDecode(token);
      const userRole = decoded.scope?.replace("ROLE_", "") || "USER";
      const locationId = decoded.locationId;

      // save to localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("authTokenExpiry", expiry);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("locationId", locationId);

      // test userRole and nagivate
      if (userRole !== "ADMIN" && userRole !== "STAFF") {
        // 404
        navigate("*"); // path '*' (404)
      } else {
        navigate("/home"); // ADMIN, STAFF
      }
    } catch (err) {
      setError((err as Error).message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-sky-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 space-y-6">
        <div className="relative w-full h-12 perspective zoom-on-hover" onClick={handleFlip}>
          <div className={`transition-transform duration-700 transform-style-preserve-3d ${flipped ? "rotate-y-180" : ""} w-full h-full`}>
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center text-2xl font-bold text-gray-800 dark:text-white">Hi, friend. Give me high five 👋</div>
            <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center text-2xl font-bold text-red-600 dark:text-red-400">Now, get back to work 🔪</div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Label>
              Email <span className="text-red-500">*</span>
            </Label>
            <Input placeholder="info@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer">
                {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between"></div>

          {error && <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-md font-medium">{error}</div>}

          <button type="submit" className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
