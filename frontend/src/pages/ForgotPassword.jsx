import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      if (data.reset_token) {
        navigate(`/reset-password?token=${encodeURIComponent(data.reset_token)}`);
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12 bg-[#FDFBF7]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="h-12 w-12 rounded-full bg-[#4A5D4E] flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-[#FDFBF7]" strokeWidth={1.5} />
          </span>
          <h1 className="font-serif text-3xl tracking-tight text-[#2D2A26]">Reset your password</h1>
          <p className="text-[#6E6860] mt-2 text-center">Enter your email and we'll start the reset.</p>
        </div>

        {done ? (
          <div className="bg-white border border-[#E8E3D9] rounded-2xl p-8 shadow-sm text-center">
            <p className="text-[#2D2A26]">If an account exists for that email, a reset has been started. Please check and try again.</p>
            <Link to="/login" className="inline-block mt-5 text-[#4A5D4E] font-medium underline underline-offset-4">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white border border-[#E8E3D9] rounded-2xl p-8 shadow-sm space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-[#2D2A26]">Email</span>
              <input
                type="email"
                value={email}
                required
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                data-testid="forgot-email-input"
                className="mt-1.5 w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition"
              />
            </label>
            {error && <p data-testid="forgot-error" className="text-sm text-[#B27A70] bg-[#B27A70]/10 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} data-testid="forgot-submit-button" className="w-full py-3 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 disabled:opacity-60">
              {loading ? "Please wait…" : "Continue"}
            </button>
          </form>
        )}

        <p className="text-center text-[#6E6860] mt-6">
          Remembered it?{" "}
          <Link to="/login" className="text-[#4A5D4E] font-medium underline underline-offset-4">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
