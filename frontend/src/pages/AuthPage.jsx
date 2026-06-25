import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { useAuth, formatApiError } from "@/context/AuthContext";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await register(email, password, name);
      toast.success(isLogin ? "Welcome back." : "Account created.");
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12 bg-[#FDFBF7]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <span className="h-12 w-12 rounded-full bg-[#4A5D4E] flex items-center justify-center mb-4">
            <Sprout className="h-6 w-6 text-[#FDFBF7]" strokeWidth={1.5} />
          </span>
          <h1 className="font-serif text-3xl tracking-tight text-[#2D2A26]">
            {isLogin ? "Welcome back" : "Create your space"}
          </h1>
          <p className="text-[#6E6860] mt-2 text-center">
            {isLogin ? "Sign in to continue your reflections." : "A quiet place to explore difficult issues."}
          </p>
        </div>

        <form onSubmit={submit} className="bg-white border border-[#E8E3D9] rounded-2xl p-8 shadow-sm space-y-5">
          {!isLogin && (
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" testId="auth-name-input" />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            testId="auth-email-input"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            testId="auth-password-input"
          />

          {error && (
            <p data-testid="auth-error" className="text-sm text-[#B27A70] bg-[#B27A70]/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="auth-submit-button"
            className="w-full py-3 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
          >
            {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-[#6E6860] mt-6">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link
            to={isLogin ? "/register" : "/login"}
            className="text-[#4A5D4E] font-medium underline underline-offset-4"
            data-testid="auth-switch-link"
          >
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, required, testId }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#2D2A26]">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="mt-1.5 w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none focus:ring-offset-2 focus:ring-offset-white transition"
      />
    </label>
  );
}
