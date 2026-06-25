import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="h-12 w-12 rounded-full bg-[#4A5D4E]/30 animate-breathe" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
