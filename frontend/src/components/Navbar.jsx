import { Link, useNavigate } from "react-router-dom";
import { Sprout, LogOut, LayoutGrid, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLab } from "@/context/LabContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { reset } = useLab();
  const navigate = useNavigate();

  const startNew = () => {
    reset();
    navigate("/lab");
  };

  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF7]/85 backdrop-blur-md border-b border-[#E8E3D9]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5" data-testid="navbar-brand">
          <span className="h-9 w-9 rounded-full bg-[#4A5D4E] flex items-center justify-center">
            <Sprout className="h-5 w-5 text-[#FDFBF7]" strokeWidth={1.5} />
          </span>
          <span className="font-serif text-lg tracking-tight text-[#2D2A26]">Collaborative Democracy Lab</span>
        </Link>
        {user && (
          <nav className="flex items-center gap-2">
            <Link
              to="/dashboard"
              data-testid="navbar-dashboard-link"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-[#6E6860] hover:text-[#2D2A26] hover:bg-[#F5F2EA] transition-colors"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.5} /> My Maps
            </Link>
            <button
              onClick={startNew}
              data-testid="navbar-new-issue-button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#4A5D4E] text-[#FDFBF7] hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 shadow-sm"
            >
              <Plus className="h-4 w-4" strokeWidth={2} /> New Issue
            </button>
            <button
              onClick={doLogout}
              data-testid="navbar-logout-button"
              className="p-2 rounded-full text-[#6E6860] hover:text-[#B27A70] hover:bg-[#F5F2EA] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
