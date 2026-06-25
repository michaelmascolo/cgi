import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth, formatApiError } from "@/context/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password updated. Please sign in.");
      navigate("/login");
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
          <h1 className="font-serif text-3xl tracking-tight text-[#2D2A26]">Choose a new password</h1>
          <p className="text-[#6E6860] mt-2 text-center">Set a new password for your account.</p>
        </div>

        <form onSubmit={submit} className="bg-white border border-[#E8E3D9] rounded-2xl p-8 shadow-sm space-y-5">
          {!token && (
            <p className="text-sm text-[#B27A70] bg-[#B27A70]/10 rounded-lg px-3 py-2">
              Missing reset link. Please request a new one from “Forgot password”.
            </p>
          )}
          <div>
            <span className="text-sm font-medium text-[#2D2A26]">New password</span>
            <div className="relative mt-1.5">
              <input
                type={show ? "text" : "password"}
                value={password}
                required
                placeholder="At least 6 characters"
                onChange={(e) => setPassword(e.target.value)}
                data-testid="reset-password-input"
                className="w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 pr-12 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition"
              />
              <button type="button" onClick={() => setShow((s) => !s)} data-testid="reset-toggle-visibility" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6860] hover:text-[#2D2A26]">
                {show ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-[#2D2A26]">Confirm password</span>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              required
              placeholder="Re-enter password"
              onChange={(e) => setConfirm(e.target.value)}
              data-testid="reset-confirm-input"
              className="mt-1.5 w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition"
            />
          </label>
          {error && <p data-testid="reset-error" className="text-sm text-[#B27A70] bg-[#B27A70]/10 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading || !token} data-testid="reset-submit-button" className="w-full py-3 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 disabled:opacity-60">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="text-center text-[#6E6860] mt-6">
          <Link to="/login" className="text-[#4A5D4E] font-medium underline underline-offset-4">Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
