import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Layers, HeartHandshake, Lightbulb } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLab } from "@/context/LabContext";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: d, ease: "easeOut" },
});

export default function Landing() {
  const { user } = useAuth();
  const { reset } = useLab();
  const navigate = useNavigate();

  const start = () => {
    if (!user) return navigate("/login");
    reset();
    navigate("/lab");
  };

  return (
    <div className="bg-[#FDFBF7]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/13551573/pexels-photo-13551573.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/70 via-[#FDFBF7]/85 to-[#FDFBF7]" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 pt-28 pb-24 text-center">
          <motion.p {...fade(0)} className="text-sm uppercase tracking-[0.25em] text-[#6E6860] mb-6">
            A practice in collaborative democracy
          </motion.p>
          <motion.h1
            {...fade(0.08)}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-[#2D2A26]"
          >
            Collaborative Democracy Lab
          </motion.h1>
          <motion.p {...fade(0.16)} className="mt-6 text-lg sm:text-xl text-[#4A5D4E] font-medium">
            Move beneath positions. Discover needs. Create better solutions.
          </motion.p>
          <motion.p {...fade(0.24)} className="mt-6 max-w-2xl mx-auto text-base leading-relaxed text-[#6E6860]">
            Most political conflict begins with opposing positions. This app helps you identify the human
            needs underneath those positions and generate solutions that satisfy more needs than either
            side's original position alone.
          </motion.p>
          <motion.div {...fade(0.32)} className="mt-10">
            <button
              onClick={start}
              data-testid="start-issue-button"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#4A5D4E] text-[#FDFBF7] text-base font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 shadow-md"
            >
              Start a New Issue
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Layers,
              title: "Distinguish positions from needs",
              body: "Positions are what we say we want. Needs are the deeper fears, values, and hopes beneath them.",
            },
            {
              icon: HeartHandshake,
              title: "Honor both sides",
              body: "Translate hostile framings into legitimate human needs. No demonizing, no telling you who's right.",
            },
            {
              icon: Lightbulb,
              title: "Design integrative solutions",
              body: "Generate novel solutions that satisfy needs from both sides — not bland compromises.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              {...fade(i * 0.1)}
              className="bg-white border border-[#E8E3D9] rounded-2xl p-7 shadow-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F2EA] mb-4">
                <c.icon className="h-5 w-5 text-[#4A5D4E]" strokeWidth={1.5} />
              </span>
              <h3 className="font-serif text-xl text-[#2D2A26] mb-2">{c.title}</h3>
              <p className="text-[#6E6860] leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          {!user && (
            <p className="text-[#6E6860]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#4A5D4E] font-medium underline underline-offset-4" data-testid="landing-login-link">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
