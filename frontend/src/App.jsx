import React, { useState, useEffect, useRef } from "react";
import {
  Bot, LayoutDashboard, MessageCircleQuestion, FolderOpen, Layers,
  BrainCircuit, CalendarDays, LineChart as LineChartIcon, MessageSquareHeart,
  Settings, LogOut, Mic, Camera, Send, Star, Bookmark, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, Eye, EyeOff, Search, Filter, Menu, X, Video, FileText,
  BookOpen, ClipboardList, FileCode2, Sparkles, Clock, Flame, Target, TrendingUp,
  Plus, Check, Info, ExternalLink, ArrowRight, ChevronDown, ChevronUp, Cpu, History, Zap,
  ShieldCheck, Users, AlertCircle, Trash2, KeyRound, Lock, User, CheckSquare, GraduationCap,
  RotateCcw, ArrowLeft, Copy
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

/* ---------------------------------- THEME ---------------------------------- */
const C = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  navy: "#0F172A",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  secondary: "#3B82F6",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  text: "#1E293B",
  subtext: "#64748B",
};

const FONT = "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif";

/* Backend API base — set VITE_API_URL in .env to point elsewhere */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ---------------------------------- DATA ---------------------------------- */
const STUDENT_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "ask", label: "Ask Doubt", icon: MessageCircleQuestion },
  { key: "mydoubts", label: "My Doubts", icon: FolderOpen },
  { key: "resources", label: "Resources", icon: Layers },
  { key: "similar", label: "Similar Questions", icon: BrainCircuit },
  { key: "quiz", label: "Quiz", icon: ClipboardList },
  { key: "planner", label: "Study Planner", icon: CalendarDays },
  { key: "progress", label: "Progress", icon: LineChartIcon },
  { key: "feedback", label: "Submit Feedback", icon: MessageSquareHeart },
  { key: "abstract", label: "Project Abstract", icon: Info },
  { key: "settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { key: "admin", label: "Admin Dashboard", icon: ShieldCheck },
  { key: "admin_feedback", label: "Feedback Results", icon: MessageSquareHeart },
  { key: "settings", label: "Settings", icon: Settings },
];

const NAV_ITEMS = STUDENT_NAV_ITEMS;


const STAT_CARDS = [
  { label: "Doubts Asked", value: "42", icon: MessageCircleQuestion, tint: C.primary },
  { label: "Quizzes Completed", value: "17", icon: ClipboardList, tint: C.success },
  { label: "Topics Learned", value: "23", icon: BookOpen, tint: C.warning },
  { label: "Learning Progress", value: "68%", icon: TrendingUp, tint: C.secondary },
];

const SIMILAR_QUESTIONS = [
  { q: "How does a self-balancing BST differ from a regular BST?", sim: 91 },
  { q: "What is the time complexity of BST insertion in the worst case?", sim: 86 },
  { q: "Explain in-order traversal of a Binary Search Tree.", sim: 78 },
];

const RESOURCES = [
  { title: "Calculus: Derivatives & Tangents Masterclass", subject: "Mathematics", topic: "Derivatives", difficulty: "Medium", type: "Video", relevance: 96 },
  { title: "Newton's Laws of Motion & Dynamics Notes", subject: "Physics", topic: "Mechanics", difficulty: "Easy", type: "Notes", relevance: 93 },
  { title: "Photosynthesis & Cellular Energy (PDF)", subject: "Biology", topic: "Photosynthesis", difficulty: "Medium", type: "PDF", relevance: 90 },
  { title: "Binary Search Trees Explained Visually", subject: "Data Structures", topic: "BST", difficulty: "Medium", type: "Video", relevance: 88 },
  { title: "French Revolution & World History Analysis", subject: "History", topic: "French Revolution", difficulty: "Medium", type: "Article", relevance: 85 },
  { title: "Practice Problems: Chemical Bonding & Lewis Structures", subject: "Chemistry", topic: "Covalent Bonds", difficulty: "Hard", type: "Practice Questions", relevance: 84 },
];

const RESOURCE_ICON = {
  Video: Video, PDF: FileText, Article: BookOpen, Notes: FileCode2,
  "Practice Questions": ClipboardList, Documentation: FileText,
};

const MY_DOUBTS = [
  { q: "What is the derivative of sin(x) and its geometric meaning?", domain: "Mathematics", subject: "Calculus", topic: "Derivatives", difficulty: "Medium", date: "Aug 20, 2026", status: "Solved" },
  { q: "How does Newton's third law explain rocket propulsion?", domain: "Physics", subject: "Mechanics", topic: "Newton's Laws", difficulty: "Easy", date: "Aug 18, 2026", status: "Solved" },
  { q: "What was the significance of the storming of the Bastille in 1789?", domain: "History & Social Sciences", subject: "World History", topic: "French Revolution", difficulty: "Medium", date: "Aug 15, 2026", status: "Solved" },
  { q: "How do chloroplasts convert sunlight into glucose during photosynthesis?", domain: "Biology & Life Sciences", subject: "Plant Physiology", topic: "Photosynthesis", difficulty: "Medium", date: "Aug 10, 2026", status: "Solved" },
];

const STATUS_STYLE = {
  Solved: { bg: "#DCFCE7", fg: C.success },
  "In Progress": { bg: "#FEF3C7", fg: C.warning },
  Unanswered: { bg: "#FEE2E2", fg: C.error },
};

const QUIZ_QUESTIONS = [
  {
    q: "What is the derivative of sin(x) with respect to x?",
    options: ["-cos(x)", "cos(x)", "-sin(x)", "tan(x)"],
    correct: 1,
  },
  {
    q: "What does Newton's First Law of Motion primarily define?",
    options: ["Force = mass × acceleration", "Inertia of rest and uniform motion", "Action and Reaction", "Gravitational constant"],
    correct: 1,
  },
  {
    q: "In which cellular organelle does photosynthesis take place?",
    options: ["Mitochondria", "Chloroplast", "Ribosome", "Nucleus"],
    correct: 1,
  },
  {
    q: "In which year did the French Revolution break out with the storming of the Bastille?",
    options: ["1776", "1789", "1804", "1848"],
    correct: 1,
  },
];

const LINE_DATA = [
  { week: "W1", progress: 10 }, { week: "W2", progress: 22 }, { week: "W3", progress: 31 },
  { week: "W4", progress: 40 }, { week: "W5", progress: 52 }, { week: "W6", progress: 68 },
];
const PIE_DATA = [
  { name: "Mathematics", value: 30, color: C.primary },
  { name: "Science & Physics", value: 25, color: C.secondary },
  { name: "Social Sciences", value: 20, color: C.warning },
  { name: "Computer Science", value: 25, color: C.success },
];
const BAR_DATA = [
  { quiz: "Q1", score: 75 }, { quiz: "Q2", score: 85 }, { quiz: "Q3", score: 70 },
  { quiz: "Q4", score: 90 }, { quiz: "Q5", score: 100 },
];

const PLANNER_TASKS = [
  { task: "Revise Derivatives & Product Rule", subject: "Mathematics", date: "Today, 6:00 PM", priority: "High", done: false },
  { task: "Complete Newton's Laws practice worksheet", subject: "Physics", date: "Today, 8:00 PM", priority: "Medium", done: false },
  { task: "Read Chapter on Indian Constitution Fundamental Rights", subject: "Social Sciences", date: "Tomorrow, 10:00 AM", priority: "Medium", done: false },
  { task: "Attempt mock quiz on Photosynthesis & Calvin cycle", subject: "Biology", date: "Aug 24", priority: "Low", done: true },
];

/* ----------------------------- PROJECT ABSTRACT ---------------------------- */
const ABSTRACT = {
  title: "AI Doubt Classification and Resource Recommender",
  tagline: "College mini-project · AI/NLP-powered Multi-Disciplinary EdTech Platform",
  problem: "Students often spend considerable time searching for appropriate learning resources after asking academic questions across Mathematics, Science, Social Studies, and Engineering. Traditional search engines return overwhelming links without diagnosing the student's actual doubt, key concepts, or difficulty level.",
  solution: "The system uses Artificial Intelligence, Keyword Extraction, and Natural Language Processing (NLP) techniques to analyse a student's doubt across any academic discipline (Maths, Science, Social Sciences, Languages, IT). It detects core keywords, identifies domain, subject, topic, and difficulty level, and recommends tailored learning resources. It also generates concise explanations, retrieves similar past questions, creates topic-specific MCQs that require 100% completion (no skipping), and persists all progress to a centralized database with dedicated administrative analytics.",
  outcome: "A fully integrated, multi-disciplinary educational assistant that reduces search fatigue, validates conceptual grasp through strict topic-based quizzes, organizes revision with an interactive study planner, and empowers educators and admins with transparent student progress and feedback tracking.",
};

const MODULES = [
  { name: "User Authentication", desc: "Secure student & administrator signup and login with role-based dashboard access.", nav: null },
  { name: "Multi-Subject Doubt Submission", desc: "Text, voice, and image-based doubt submission across Mathematics, Science, Social Studies, and CS.", nav: "ask" },
  { name: "Keyword Detection & AI Classification", desc: "Extracts keywords and classifies Domain, Subject, Topic, and Difficulty.", nav: "ask" },
  { name: "Precise AI Explanation", desc: "Delivers a crisp 2-sentence explanation and a simple real-world analogy.", nav: "ask" },
  { name: "Similar Question Retrieval", desc: "Finds related earlier doubts using TF-IDF and cosine similarity ranking.", nav: "similar" },
  { name: "Resource Recommendation", desc: "Ranks multi-format study resources (Videos, Notes, Practice sets, PDFs).", nav: "resources" },
  { name: "Strict Topic Quiz Module", desc: "Generates topic-specific quizzes where all questions must be answered without skipping.", nav: "quiz" },
  { name: "Persistent Study Planner", desc: "Create, schedule, track, and complete study tasks stored in the database.", nav: "planner" },
  { name: "Progress Dashboard", desc: "Visualizes quiz trends, domain distribution, and learning analytics via SQL aggregations.", nav: "progress" },
  { name: "Feedback Module", desc: "Collects 5-star ratings and student comments to continuously enhance recommendations.", nav: "feedback" },
  { name: "Admin Dashboard", desc: "Comprehensive monitoring of student progress, quiz performance, and feedback results.", nav: "admin" },
];

/* --------------------------------- HELPERS --------------------------------- */
function Button({ children, variant = "primary", icon: Icon, className = "", disabled, onClick, style = {}, type = "button" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: { background: C.primary, color: "#fff" },
    secondary: { background: "#EFF6FF", color: C.primaryDark },
    ghost: { background: "#F1F5F9", color: C.text },
    subtle: { background: "transparent", color: C.primary, border: `1px solid ${C.primary}` },
    danger: { background: "#FEE2E2", color: C.error },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${className}`}
      style={{ ...styles[variant], ...style }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function Card({ children, className = "", style = {}, hover = true }) {
  return (
    <div
      className={`rounded-2xl border bg-white ${hover ? "hover:shadow-md transition-shadow" : ""} ${className}`}
      style={{ borderColor: "#E2E8F0", ...style }}
    >
      {children}
    </div>
  );
}

function Badge({ children, bg = "#EFF6FF", fg = C.primary, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value, color = C.primary }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

function Input({ label, type = "text", placeholder, value, onChange, className = "", required = false }) {
  return (
    <label className={`block mb-3 ${className}`}>
      {label && <span className="block text-sm font-medium mb-1.5" style={{ color: C.text }}>{label} {required && <span className="text-red-500">*</span>}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
        style={{ borderColor: "#E2E8F0", color: C.text }}
      />
    </label>
  );
}

function Stars({ value = 0, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange && onChange(s)} className="cursor-pointer">
          <Star size={20} fill={s <= value ? C.warning : "none"} color={s <= value ? C.warning : "#CBD5E1"} />
        </button>
      ))}
    </div>
  );
}

/* -------------------------- CODE & EXPLANATION FORMATTER ------------------------------ */
function CodeBlock({ code, language = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  const displayLang = (language || "CODE").toUpperCase();

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700/60 text-xs font-mono">
        <span className="flex items-center gap-2 text-slate-300 font-semibold tracking-wider">
          <FileCode2 size={14} className="text-blue-400" />
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs"
          title="Copy to clipboard"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copied ? "Copied!" : "Copy Code"}</span>
        </button>
      </div>
      <pre className="p-4 text-xs sm:text-sm text-slate-100 font-mono overflow-x-auto leading-relaxed selection:bg-blue-600 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedExplanation({ text }) {
  if (!text) return null;

  let normalizedText = text;
  if (!normalizedText.includes("```")) {
    const langMatch = normalizedText.match(/(?:^|\n)(python|javascript|typescript|java|c\+\+|cpp|c#|sql|html|css)\r?\n/i);
    if (langMatch) {
      const lang = langMatch[1].toLowerCase();
      const startCode = langMatch.index + langMatch[0].length;
      const rest = normalizedText.slice(startCode);
      const notesMatch = rest.match(/\n\n(?=[-*•]|\b(Key\s+points|Notes|How\s+it\s+works|Explanation|Changes\s+made)\b)/i);
      const codePart = (notesMatch ? rest.slice(0, notesMatch.index) : rest).trim();
      const afterPart = notesMatch ? rest.slice(notesMatch.index) : "";
      const beforePart = normalizedText.slice(0, langMatch.index).trim();
      normalizedText = `${beforePart}\n\n\`\`\`${lang}\n${codePart}\n\`\`\`\n${afterPart}`.trim();
    }
  }

  const parts = normalizedText.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineBreak = part.indexOf("\n");
          let lang = "";
          let codeContent = "";
          if (firstLineBreak !== -1) {
            lang = part.slice(3, firstLineBreak).trim();
            codeContent = part.slice(firstLineBreak + 1, -3).trim();
          } else {
            codeContent = part.slice(3, -3).trim();
          }
          return <CodeBlock key={index} code={codeContent} language={lang} />;
        }

        const lines = part.split("\n");
        return (
          <div key={index} className="text-sm leading-relaxed text-slate-700 space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-0.5" />;

              const inlineParts = line.split(/(`[^`]+`)/g);
              const renderedLine = inlineParts.map((sub, sIdx) => {
                if (sub.startsWith("`") && sub.endsWith("`") && sub.length > 2) {
                  return (
                    <code
                      key={sIdx}
                      className="px-1.5 py-0.5 mx-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs border border-blue-200/60 font-semibold"
                    >
                      {sub.slice(1, -1)}
                    </code>
                  );
                }
                return sub;
              });

              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-blue-500 font-bold mt-1 text-xs">•</span>
                    <span className="flex-1">{renderedLine.slice(2)}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{renderedLine}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------- VOICE & OCR INPUT ------------------------------ */
async function extractDoubtFromImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/doubts/image-extract`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Image transcription failed");
  }
  const data = await res.json();
  return data.text || "";
}

function DoubtInputBox({ onSubmit, onToast, rows = 4 }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  const toggleVoice = () => {
    if (recording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onToast("Voice input is best supported in Chrome / Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setRecording(true);
      onToast("Listening… speak your doubt clearly");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }
      setText(finalText);
    };
    recognition.onerror = () => {
      setRecording(false);
      onToast("Microphone input ended or not allowed.");
    };
    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      onToast("Couldn't start voice input.");
    }
  };

  const handleImagePicked = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAttachedImage({ name: file.name, url: previewUrl });
    setExtracting(true);
    onToast(`Scanning ${file.name} with AI Vision OCR…`);
    try {
      const extracted = await extractDoubtFromImage(file);
      if (extracted) {
        setText(extracted);
        onToast("Code & question extracted from image ✓");
      } else {
        onToast("No text recognized. Please type your doubt.");
      }
    } catch (err) {
      onToast(err.message || "Couldn't read image text.");
    } finally {
      setExtracting(false);
    }
  };

  const clearAttachedImage = () => {
    if (attachedImage?.url) {
      URL.revokeObjectURL(attachedImage.url);
    }
    setAttachedImage(null);
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      onToast("Please type your doubt or upload an image first");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <>
      {attachedImage && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 animate-[fadeIn_0.2s_ease]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={attachedImage.url} alt="Attached upload" className="w-9 h-9 object-cover rounded-lg border border-blue-200 shadow-sm shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold truncate text-blue-950 text-xs">{attachedImage.name}</p>
              <p className="text-[11px] text-blue-600 flex items-center gap-1">
                {extracting ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin inline-block" />
                    Analyzing image with AI Vision OCR...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Transcribed & ready to solve
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearAttachedImage}
            className="p-1 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
            title="Remove attached image"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type any doubt from Mathematics, Physics, Chemistry, Biology, Social Studies, or paste/upload a coding screenshot..."
        rows={rows}
        className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 font-sans"
        style={{ borderColor: "#E2E8F0", color: C.text }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div className="flex gap-2">
          <Button variant={recording ? "subtle" : "ghost"} icon={Mic} onClick={toggleVoice}>
            {recording ? "Listening… (tap to stop)" : "Voice Input"}
          </Button>
          <Button variant={attachedImage ? "subtle" : "ghost"} icon={Camera} onClick={() => fileRef.current && fileRef.current.click()} disabled={extracting}>
            {extracting ? "Scanning image…" : attachedImage ? "Change Image" : "Upload Image / Code Screenshot"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePicked} />
        </div>
        <Button icon={Send} onClick={handleSubmit} disabled={extracting}>
          Submit Doubt
        </Button>
      </div>
    </>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-white animate-[fadeIn_0.2s_ease]" style={{ background: C.navy }}>
      <CheckCircle2 size={18} color="#4ADE80" />
      {message}
    </div>
  );
}

function TipButton({ label, children, className = "", as: Comp = "button", ...rest }) {
  return (
    <Comp className={`relative group ${className}`} {...rest}>
      {children}
    </Comp>
  );
}

function Modal({ title, onClose, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-semibold text-sm" style={{ color: C.text }}>{title}</h3>
          <TipButton label="Close" onClick={onClose}>
            <X size={18} color={C.subtext} />
          </TipButton>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* --------------------------------- SIDEBAR & TOPBAR --------------------------------- */
function Sidebar({ current, onNavigate, mobileOpen, setMobileOpen, currentUser, onLogout }) {
  const isAdmin = currentUser?.role === "admin";
  const visibleNav = isAdmin ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 z-40 flex flex-col transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: C.navy }}
      >
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: isAdmin ? "#7C3AED" : C.primary }}>
            {isAdmin ? <ShieldCheck size={20} color="#fff" /> : <Bot size={20} color="#fff" />}
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight block">DoubtAI</span>
            <span className="text-[11px] text-blue-300 font-medium">
              {isAdmin ? "Administrator Portal" : "All Subjects EdTech AI"}
            </span>
          </div>
          <TipButton label="Close menu" className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={20} color="#94A3B8" />
          </TipButton>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {visibleNav.map(({ key, label, icon: Icon }) => {
            const active = current === key;
            return (
              <button
                key={key}
                onClick={() => { onNavigate(key); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{
                  background: active ? (isAdmin ? "rgba(124,58,237,0.22)" : "rgba(37,99,235,0.18)") : "transparent",
                  color: active ? (isAdmin ? "#DDD6FE" : "#93C5FD") : "#CBD5E1",
                }}
              >
                <Icon size={18} />
                {label}
                {key === "admin" && (
                  <span className="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-900 text-purple-300">Admin</span>
                )}
                {key === "admin_feedback" && (
                  <span className="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-900 text-purple-300">Reviews</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-5 pt-3 border-t" style={{ borderColor: "rgba(148,163,184,0.15)" }}>
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl bg-slate-800/60">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: isAdmin ? "#7C3AED" : C.primary }}>
              {(currentUser?.full_name || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.full_name || "User"}</p>
              <p className="text-[10px] text-slate-400 capitalize">{currentUser?.role || "Student"}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors"
            style={{ color: "#CBD5E1" }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ title, subtitle, onMenu = () => {}, currentUser }) {
  const role = currentUser?.role || "student";
  const isAdmin = role === "admin";
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <TipButton label="Open menu" className="lg:hidden mt-1 rounded-lg p-1.5 border" style={{ borderColor: "#E2E8F0" }} onClick={onMenu}>
          <Menu size={20} color={C.text} />
        </TipButton>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>{title}</h1>
          {subtitle && <p className="text-sm mt-1" style={{ color: C.subtext }}>{subtitle}</p>}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2.5 rounded-xl px-3.5 py-2 border" style={{ borderColor: "#E2E8F0", background: "#fff" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: isAdmin ? "#7C3AED" : C.primary }}>
          {(currentUser?.full_name || "S")[0].toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold" style={{ color: C.text }}>{currentUser?.full_name || "Sumedha"}</p>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-purple-600" : "bg-green-500"}`} />
            <p className="text-xs capitalize" style={{ color: C.subtext }}>{role === "admin" ? "Administrator" : "Student"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- AUTHENTICATION --------------------------------- */
function LoginPage({ onLoginSuccess }) {
  const [portal, setPortal] = useState("student"); // "student" | "admin"
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [preferredSubjects, setPreferredSubjects] = useState("Mathematics, Physics, Chemistry, Biology, Social Studies, Computer Science");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePortalSwitch = (target) => {
    setPortal(target);
    setIsSignUp(false);
    setError("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isStudent = portal === "student";
    const url = isSignUp && isStudent ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
    const payload = isSignUp && isStudent
      ? { full_name: fullName, email, password, preferred_subjects: preferredSubjects, role: "student" }
      : { email: email.trim(), password: password.trim() };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail, demoPassword, forcedRole = "student") => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user);
      } else {
        // Safe fallback demo record
        onLoginSuccess({
          id: forcedRole === "admin" ? 2 : 1,
          full_name: forcedRole === "admin" ? "Admin User" : "Sumedha",
          email: demoEmail,
          role: forcedRole,
          preferred_subjects: "Mathematics, Physics, Chemistry, Biology, History, CS",
        });
      }
    } catch (e) {
      onLoginSuccess({
        id: forcedRole === "admin" ? 2 : 1,
        full_name: forcedRole === "admin" ? "Admin User" : "Sumedha",
        email: demoEmail,
        role: forcedRole,
        preferred_subjects: "Mathematics, Physics, Chemistry, Biology, History, CS",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ background: C.bg }}>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          {/* Header Brand */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: portal === "admin" ? "#7C3AED" : C.primary }}>
              {portal === "admin" ? <ShieldCheck size={22} color="#fff" /> : <Bot size={22} color="#fff" />}
            </div>
            <div>
              <span className="font-bold text-xl block" style={{ color: C.text }}>DoubtAI</span>
              <span className="text-xs text-slate-500 font-medium">All Subjects Academic Platform</span>
            </div>
          </div>

          {/* Top-Level Portal Switcher: Student vs Admin Login */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handlePortalSwitch("student")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portal === "student"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap size={15} /> Student Login
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch("admin")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portal === "admin"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={15} /> Admin Login
            </button>
          </div>

          {/* -------------------- STUDENT PORTAL VIEW -------------------- */}
          {portal === "student" && (
            <div>
              <div className="flex border-b border-slate-200 mb-5">
                <button
                  onClick={() => { setIsSignUp(false); setError(""); }}
                  className={`flex-1 pb-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${!isSignUp ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
                >
                  Student Sign In
                </button>
                <button
                  onClick={() => { setIsSignUp(true); setError(""); }}
                  className={`flex-1 pb-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${isSignUp ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
                >
                  Student Registration
                </button>
              </div>

              <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>
                {isSignUp ? "Create Student Account" : "Student Welcome"}
              </h2>
              <p className="text-xs mb-5" style={{ color: C.subtext }}>
                {isSignUp
                  ? "Sign up to clarify doubts across Maths, Science, History, & CS."
                  : "Log in to ask doubts, take quizzes, and track your revision plan."}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isSignUp && (
                  <>
                    <Input
                      label="Full Name"
                      placeholder="e.g. Sumedha"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    <Input
                      label="Preferred Subjects"
                      placeholder="e.g. Mathematics, Physics, History, Java"
                      value={preferredSubjects}
                      onChange={(e) => setPreferredSubjects(e.target.value)}
                    />
                  </>
                )}

                <Input
                  label="Student Email Address"
                  type="email"
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label className="block mb-2">
                  <span className="block text-sm font-medium mb-1.5" style={{ color: C.text }}>Password</span>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none pr-10 focus:border-blue-500"
                      style={{ borderColor: "#E2E8F0", color: C.text }}
                    />
                    <TipButton type="button" label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5">
                      {showPw ? <EyeOff size={18} color={C.subtext} /> : <Eye size={18} color={C.subtext} />}
                    </TipButton>
                  </div>
                </label>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? "Please wait…" : isSignUp ? "Create Student Account" : "Sign In as Student"}
                </Button>
              </form>

              {/* Quick 1-Click Student Login */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-[11px] text-center font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Student Demo Access
                </p>
                <button
                  type="button"
                  onClick={() => quickLogin("sumedha@college.edu", "password123", "student")}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 py-2.5 px-3 text-xs font-semibold text-blue-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <GraduationCap size={15} color={C.primary} /> Instant Student Login (Sumedha)
                </button>
              </div>
            </div>
          )}

          {/* -------------------- ADMIN PORTAL VIEW -------------------- */}
          {portal === "admin" && (
            <div>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-100">
                <ShieldCheck size={18} color="#7C3AED" />
                <span className="text-sm font-bold text-purple-900">Administrator Sign In</span>
              </div>

              <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>Admin Portal</h2>
              <p className="text-xs mb-4" style={{ color: C.subtext }}>
                Secure access for educational administrators, instructors, and system supervisors.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <Input
                  label="Admin Username or Email"
                  type="text"
                  placeholder="Enter administrator email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label className="block mb-2">
                  <span className="block text-sm font-medium mb-1.5" style={{ color: C.text }}>Admin Password</span>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none pr-10 focus:border-purple-500"
                      style={{ borderColor: "#E2E8F0", color: C.text }}
                    />
                    <TipButton type="button" label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5">
                      {showPw ? <EyeOff size={18} color={C.subtext} /> : <Eye size={18} color={C.subtext} />}
                    </TipButton>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#7C3AED" }}
                >
                  <ShieldCheck size={16} />
                  {loading ? "Authenticating Admin…" : "Sign In to Admin Dashboard"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right-hand side illustration banner */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden" style={{ background: C.navy }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #2563EB 0, transparent 45%), radial-gradient(circle at 70% 80%, #3B82F6 0, transparent 45%)" }} />
        <div className="relative text-center px-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: portal === "admin" ? "rgba(124,58,237,0.25)" : "rgba(37,99,235,0.2)" }}>
            {portal === "admin" ? <ShieldCheck size={48} color="#C4B5FD" /> : <Bot size={48} color="#93C5FD" />}
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">
            {portal === "admin" ? "DoubtAI Administration Control" : "Multi-Disciplinary Academic AI Engine"}
          </h2>
          <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
            {portal === "admin"
              ? "Oversee user engagement, review student academic performance, inspect doubt logs, and monitor feedback ratings."
              : "Ask doubts with conceptual depth and instant keyword detection across Mathematics, Physics, Chemistry, Biology, Social Studies, & Computer Science."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- DASHBOARD -------------------------------- */
function Dashboard({ onAsk, onNavigate, onMenu, onToast, currentUser }) {
  const [stats, setStats] = useState(null);
  const [recentDoubts, setRecentDoubts] = useState(MY_DOUBTS);
  const [tasks, setTasks] = useState(PLANNER_TASKS);

  useEffect(() => {
    const userId = currentUser?.id || 1;
    fetch(`${API_BASE}/api/progress/summary?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => data.stats && setStats(data.stats))
      .catch(() => {});

    fetch(`${API_BASE}/api/doubts?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => data.length && setRecentDoubts(data.slice(0, 3).map(normalizeDoubt)))
      .catch(() => {});

    fetch(`${API_BASE}/api/planner?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => data.length && setTasks(data.slice(0, 3).map(normalizeTask)))
      .catch(() => {});
  }, [currentUser]);

  return (
    <div>
      <div className="flex items-start gap-3 mb-1">
        <TipButton label="Open menu" className="lg:hidden mt-1 rounded-lg p-1.5 border shrink-0" style={{ borderColor: "#E2E8F0" }} onClick={onMenu}>
          <Menu size={20} color={C.text} />
        </TipButton>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>
          Welcome back, {currentUser?.full_name || "Student"}! 👋
        </h1>
      </div>
      <p className="text-sm mb-6" style={{ color: C.subtext }}>
        Ask any doubt from Mathematics, Physics, Chemistry, Biology, Social Studies, or Computer Science.
      </p>

      <Card className="p-6 mb-8 border-blue-100 bg-gradient-to-b from-white to-blue-50/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} color={C.primary} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>Ask your academic doubt (Voice, Image, or Text)</span>
        </div>
        <DoubtInputBox onSubmit={onAsk} onToast={onToast} rows={3} />
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Doubts Asked", value: stats ? String(stats.doubtsAsked) : "42", icon: MessageCircleQuestion, tint: C.primary },
          { label: "Quizzes Completed", value: stats ? String(stats.quizzesCompleted) : "17", icon: ClipboardList, tint: C.success },
          { label: "Topics Learned", value: stats ? String(stats.topicsLearned) : "23", icon: BookOpen, tint: C.warning },
          { label: "Quiz Avg. Score", value: stats ? (stats.avgQuizScore != null ? `${stats.avgQuizScore}%` : "—") : "78%", icon: TrendingUp, tint: C.secondary },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.tint}1A` }}>
              <s.icon size={20} color={s.tint} />
            </div>
            <p className="text-2xl font-bold" style={{ color: C.text }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: C.subtext }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: C.text }}>Today's Learning Goals</h3>
            <button className="text-xs font-semibold" style={{ color: C.primary }} onClick={() => onNavigate("planner")}>View planner</button>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 3).map((t, idx) => (
              <div key={`${t.task}-${idx}`} className="flex items-center gap-3">
                {t.done ? <CheckCircle2 size={16} color={C.success} /> : <Circle size={16} color={C.subtext} />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${t.done ? "line-through text-slate-400" : ""}`} style={{ color: t.done ? C.subtext : C.text }}>{t.task}</p>
                  <p className="text-xs" style={{ color: C.subtext }}>{t.subject} · {t.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: C.text }}>Recent Doubts</h3>
            <button className="text-xs font-semibold" style={{ color: C.primary }} onClick={() => onNavigate("mydoubts")}>View all</button>
          </div>
          <div className="space-y-3">
            {recentDoubts.slice(0, 3).map((d) => (
              <div key={d.q} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.text }}>{d.q}</p>
                  <span className="text-[11px] text-slate-400">{d.domain || d.subject}</span>
                </div>
                <Badge bg={STATUS_STYLE[d.status]?.bg || "#DCFCE7"} fg={STATUS_STYLE[d.status]?.fg || C.success}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------- AI ANALYSIS FLOW ---------------------------- */
const ANALYSIS_STEPS = [
  "Detecting core keywords from doubt…",
  "Classifying Domain (Maths, Science, Social, CS) & Subject ✓",
  "Identifying academic topic & Bloom's cognitive level ✓",
  "Scoring difficulty & generating tailored explanations ✓",
  "Constructing customized topic quiz & ranked resources…",
];

function AnalyzingScreen({ doubt }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < ANALYSIS_STEPS.length - 1) {
      const t = setTimeout(() => setStep(step + 1), 600);
      return () => clearTimeout(t);
    }
  }, [step]);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center animate-pulse" style={{ background: "#EFF6FF" }}>
          <Bot size={38} color={C.primary} />
        </div>
      </div>
      <p className="text-sm mb-1 max-w-md font-medium" style={{ color: C.subtext }}>"{doubt}"</p>
      <div className="mt-6 space-y-2.5 text-left max-w-md">
        {ANALYSIS_STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-2.5 transition-opacity duration-300 ${i <= step ? "opacity-100" : "opacity-30"}`}>
            {i < step ? <CheckCircle2 size={16} color={C.success} /> : i === step ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.primary, borderTopColor: "transparent" }} /> : <Circle size={16} color="#CBD5E1" />}
            <span className="text-sm font-medium" style={{ color: i <= step ? C.text : C.subtext }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudyPlanPromptCard({ doubt, result, currentUser, onToast, onNavigate }) {
  const [status, setStatus] = useState("idle"); // "idle" | "saving" | "added" | "dismissed"
  const [savedCount, setSavedCount] = useState(0);

  const rawPlan = Array.isArray(result?.studyPlan) && result.studyPlan.length > 0
    ? result.studyPlan
    : [
        {
          task: `Concept Review: Foundational principles and theory of ${result?.topic || result?.subject || "Topic"}`,
          priority: "High",
          due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          daysOffset: 1,
        },
        {
          task: `Targeted Practice: Solve example problems and exercises on ${result?.topic || result?.subject || "Topic"}`,
          priority: "Medium",
          due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
          daysOffset: 3,
        },
        {
          task: `Mastery & Self-Assessment: Take comprehensive topic quiz on ${result?.topic || result?.subject || "Topic"}`,
          priority: "Low",
          due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          daysOffset: 7,
        },
      ];

  const handleAccept = async () => {
    setStatus("saving");
    const userId = currentUser?.id || 1;
    const tasksToSave = rawPlan.map((p) => ({
      user_id: userId,
      task: p.task,
      subject: result?.subject || "General",
      topic: result?.topic || "",
      due_date: p.due_date || null,
      priority: p.priority || "Medium",
    }));

    try {
      const res = await fetch(`${API_BASE}/api/planner/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, tasks: tasksToSave }),
      });
      if (res.ok) {
        setStatus("added");
        setSavedCount(tasksToSave.length);
        if (onToast) onToast(`Added ${tasksToSave.length} tailored study milestones to your planner ✓`);
      } else {
        for (const t of tasksToSave) {
          await fetch(`${API_BASE}/api/planner`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t),
          });
        }
        setStatus("added");
        setSavedCount(tasksToSave.length);
        if (onToast) onToast(`Added ${tasksToSave.length} tailored study milestones to your planner ✓`);
      }
    } catch (e) {
      setStatus("added");
      if (onToast) onToast("Saved study plan milestones to your study planner ✓");
    }
  };

  const handleDismiss = () => {
    setStatus("dismissed");
    if (onToast) onToast("Study plan suggestion dismissed. Nothing was added.");
  };

  if (status === "dismissed") {
    return (
      <Card className="p-4 border border-slate-200 bg-slate-50/70 text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-slate-400 shrink-0" />
          <span className="text-xs">
            Study plan suggestion for <strong>{result?.topic || result?.subject}</strong> was dismissed. (No tasks were added to your planner).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setStatus("idle")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
          >
            Review suggestion
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onNavigate && onNavigate("planner")}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Open Study Planner
          </button>
        </div>
      </Card>
    );
  }

  if (status === "added") {
    return (
      <Card className="p-5 border-2 border-emerald-200 bg-emerald-50/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge bg="#DCFCE7" fg="#166534">Added to Study Planner</Badge>
                <span className="text-xs font-semibold text-slate-500">{savedCount || rawPlan.length} Milestones Scheduled</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">
                Study roadmap for &ldquo;{result?.topic || result?.subject}&rdquo; is now active!
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Track your progress, check off completed milestones, or reschedule target dates anytime in your Study Planner.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              className="!bg-emerald-600 hover:!bg-emerald-700 font-semibold text-xs !py-2 !px-4"
              icon={CalendarDays}
              onClick={() => onNavigate && onNavigate("planner")}
            >
              View in Study Planner →
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <span>💡 <strong>Tip:</strong> You can also manually add, modify, or prepare custom study tasks anytime.</span>
          <button
            className="text-emerald-700 font-semibold hover:underline text-left sm:text-right cursor-pointer"
            onClick={() => onNavigate && onNavigate("planner")}
          >
            Manually Customize Planner →
          </button>
        </div>
      </Card>
    );
  }

  const priorityBg = {
    High: "#FEE2E2",
    Medium: "#FEF3C7",
    Low: "#ECFDF5",
  };
  const priorityFg = {
    High: "#991B1B",
    Medium: "#92400E",
    Low: "#065F46",
  };

  return (
    <Card className="p-5 border-2 border-indigo-200/90 bg-gradient-to-br from-indigo-50/50 via-blue-50/30 to-purple-50/30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-600 text-white flex items-center gap-1">
              <Sparkles size={11} /> AI Study Planner Recommendation
            </span>
            <Badge bg="#EEF2FF" fg="#3730A3">Tailored to your question</Badge>
          </div>
          <h4 className="font-bold text-base text-slate-900">
            Would you like an AI study plan for &ldquo;{result?.topic || result?.subject}&rdquo;?
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            DoubtAI generated a 3-step structured revision roadmap based on your doubt. If you want this plan, click &ldquo;Yes, Add to My Study Planner&rdquo; below, otherwise click &ldquo;No, Dismiss&rdquo;.
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4 bg-white/80 p-3 rounded-xl border border-indigo-100">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Proposed Revision Roadmap ({rawPlan.length} Milestones):
        </p>
        {rawPlan.map((step, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 leading-snug">{step.task}</p>
                <p className="text-[11px] text-slate-500">Target Date: {step.due_date || `In ${step.daysOffset || (idx + 1) * 2} days`}</p>
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase tracking-wide"
              style={{
                backgroundColor: priorityBg[step.priority] || "#F1F5F9",
                color: priorityFg[step.priority] || "#334155",
              }}
            >
              {step.priority}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="!bg-indigo-600 hover:!bg-indigo-700 font-bold text-xs !py-2 !px-4"
          icon={Check}
          disabled={status === "saving"}
          onClick={handleAccept}
        >
          {status === "saving" ? "Adding to Planner..." : "Yes, Add to My Study Planner"}
        </Button>
        <Button
          variant="secondary"
          className="text-xs !py-2 !px-4"
          icon={X}
          disabled={status === "saving"}
          onClick={handleDismiss}
        >
          No, Dismiss
        </Button>
      </div>

      <div className="mt-4 pt-3 border-t border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-indigo-600 shrink-0" />
          <span>
            <strong>Manual Option:</strong> You can also manually prepare and customize your own study planner anytime in the Study Planner section.
          </span>
        </div>
        <button
          className="text-indigo-600 font-semibold hover:underline text-left sm:text-right shrink-0 cursor-pointer"
          onClick={() => onNavigate && onNavigate("planner")}
        >
          Manually Open Study Planner →
        </button>
      </div>
    </Card>
  );
}

function AnalysisResult({ doubt, result, onExploreResources, onViewQuiz, onAddToPlanner, onAskAnother, onAskDoubt, onNavigate, currentUser, onToast }) {
  const [simplified, setSimplified] = useState(false);

  const keywords = result.analysis?.keywords || [];
  const classification = [
    { label: "Domain", value: result.domain || "General Knowledge" },
    { label: "Subject", value: result.subject || "General" },
    { label: "Topic", value: result.topic || "—" },
    { label: "Difficulty", value: result.difficulty || "Medium" },
    { label: "Confidence Score", value: `${result.confidence ?? 90}%` },
  ];
  const similar = Array.isArray(result.similarQuestions) && result.similarQuestions.length
    ? result.similarQuestions
    : SIMILAR_QUESTIONS.map((s) => ({ question: s.q, similarity: s.sim }));
  const hasQuiz = Array.isArray(result.quiz) && result.quiz.length > 0;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.subtext }}>Your Academic Doubt</p>
          {result.cached && (
            <Badge bg="#DCFCE7" fg={C.success}>Reused from verified database record</Badge>
          )}
        </div>
        <p className="text-base font-medium mb-3" style={{ color: C.text }}>{doubt}</p>

        {keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles size={13} color={C.primary} /> Keywords Detected:
            </span>
            {keywords.map((k) => (
              <span key={k} className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100">
                {k}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot size={16} color={C.primary} />
          <h3 className="font-semibold text-sm" style={{ color: C.text }}>AI Classification & Taxonomy</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {classification.map((c) => (
            <Card key={c.label} className="p-4">
              <p className="text-xs mb-1" style={{ color: C.subtext }}>{c.label}</p>
              <p
                className={`${c.label === "Domain" ? "text-sm leading-snug" : "text-base"} font-bold`}
                style={{ color: c.label === "Difficulty" ? C.warning : C.text }}
              >
                {c.value}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: C.text }}>
            <BookOpen size={16} color={C.primary} />
            AI Explanation & Solution
          </h3>
          <Button variant="subtle" className="!px-3 !py-1.5 text-xs" onClick={() => setSimplified(!simplified)}>
            {simplified ? "Show full solution & code" : "Explain with simple analogy"}
          </Button>
        </div>
        {simplified ? (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-sm leading-relaxed">
            <span className="font-bold text-amber-800 flex items-center gap-1.5 mb-1 text-xs">
              <Sparkles size={14} className="text-amber-600" />
              Simplified Takeaway:
            </span>
            {result.simplifiedExplanation || result.explanation}
          </div>
        ) : (
          <FormattedExplanation text={result.explanation} />
        )}
      </Card>

      {Array.isArray(result.analysis?.sources) && result.analysis.sources.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: C.text }}>Sources checked</h3>
          <ul className="space-y-2">
            {result.analysis.sources.map((source) => (
              <li key={source.url} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                  style={{ color: C.primary }}
                >
                  {source.title}
                </a>
                {(source.publisher || source.date) && (
                  <span className="ml-2 text-xs" style={{ color: C.subtext }}>
                    {[source.publisher, source.date].filter(Boolean).join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {Array.isArray(result.resources) && result.resources.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: C.text }}>
              <Layers size={16} color={C.primary} />
              Recommended Learning Resources (Tailored to this doubt)
            </h3>
            <Button variant="ghost" className="!px-2.5 !py-1 text-xs" onClick={onExploreResources}>
              Explore Full Library →
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {result.resources.map((r, rIdx) => {
              const Icon = RESOURCE_ICON[r.type] || FileText;
              return (
                <Card key={r.title || rIdx} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                        <Icon size={16} />
                      </span>
                      <Badge bg="#EFF6FF" fg={C.primaryDark}>{r.type}</Badge>
                    </div>
                    <p className="text-xs font-semibold mb-2 line-clamp-2" style={{ color: C.text }}>{r.title}</p>
                    <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: C.subtext }}>
                      <span>Relevance</span>
                      <span className="font-bold text-blue-600">{r.relevance}%</span>
                    </div>
                    <ProgressBar value={r.relevance} />
                  </div>
                  <Button variant="subtle" className="mt-3 w-full !py-1.5 text-xs" onClick={onExploreResources}>
                    Open Resource
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3" style={{ color: C.text }}>Similar Questions Retrieved</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {similar.map((s) => (
            <Card key={s.question} className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: C.text }}>{s.question}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge bg="#EFF6FF" fg={C.primaryDark}>{s.similarity}% similar</Badge>
                  {s.source === "history" && <Badge bg="#F1F5F9" fg={C.subtext}>Database record</Badge>}
                </div>
              </div>
              <Button variant="ghost" className="mt-4 w-full !py-2 text-xs" onClick={() => onAskDoubt(s.question)}>View Answer</Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Relevant AI Study Planner Recommendation (Ask Permission with Yes / No) */}
      <StudyPlanPromptCard
        doubt={doubt}
        result={result}
        currentUser={currentUser}
        onToast={onToast}
        onNavigate={onNavigate}
      />

      {hasQuiz && (
        <Card className="p-5 border-2 border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-purple-50/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-600 text-white">
                  Topic Quiz Ready
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  4 Assessment Questions · Strict No-Skipping
                </span>
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">
                Validate Your Conceptual Grasp on {result.topic || result.subject}
              </h4>
              <p className="text-xs text-slate-600">
                All 4 multiple-choice questions must be answered to test understanding and reinforce your mastery.
              </p>
            </div>
            <Button icon={ClipboardList} className="shrink-0 font-bold" onClick={onViewQuiz}>
              Start 4-Question Quiz Now →
            </Button>
          </div>
        </Card>
      )}

      {result.analysis && Object.keys(result.analysis).length > 0 && (
        <AlgorithmInsights analysis={result.analysis} domain={result.domain} cached={result.cached} />
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button icon={ClipboardList} onClick={onViewQuiz}>
          {hasQuiz ? `Take Quiz on ${result.topic || "Topic"}` : "Take Topic Quiz"}
        </Button>
        <Button variant="secondary" icon={CalendarDays} onClick={() => onNavigate && onNavigate("planner")}>
          Open Study Planner
        </Button>
        <Button variant="ghost" icon={Layers} onClick={onExploreResources}>
          Explore Recommended Resources
        </Button>
        <Button variant="ghost" icon={MessageCircleQuestion} onClick={onAskAnother}>
          Ask Another Doubt
        </Button>
      </div>
    </div>
  );
}

function InsightRow({ label, children }) {
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: "#F1F5F9" }}>
      <p className="text-xs font-semibold mb-1.5" style={{ color: C.subtext }}>{label}</p>
      {children}
    </div>
  );
}

function ScorePill({ label, value, strong = false }) {
  return (
    <div className="rounded-xl px-3 py-2 text-center" style={{ background: strong ? "#EFF6FF" : "#F8FAFC" }}>
      <p className="text-[11px]" style={{ color: C.subtext }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: strong ? C.primaryDark : C.text }}>{value}</p>
    </div>
  );
}

function AlgorithmInsights({ analysis, domain, cached }) {
  const [open, setOpen] = useState(false);
  const probs = analysis.domainProbabilities || [];
  const diff = analysis.difficulty || {};
  const conf = analysis.confidence || {};
  const bloom = analysis.bloom || {};
  const dup = analysis.duplicateCheck || {};
  const keywords = analysis.keywords || [];

  return (
    <Card className="p-5" hover={false}>
      <button
        className="w-full flex items-center justify-between text-left cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Cpu size={16} color={C.primary} />
          <span className="font-semibold text-sm" style={{ color: C.text }}>How DoubtAI analysed this (Algorithms Breakdown)</span>
        </span>
        {open ? <ChevronUp size={18} color={C.subtext} /> : <ChevronDown size={18} color={C.subtext} />}
      </button>

      {open && (
        <div className="mt-3">
          {keywords.length > 0 && (
            <InsightRow label="Keywords extracted (TF-IDF & NLP)">
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((k) => <Badge key={k} bg="#F1F5F9" fg={C.text}>{k}</Badge>)}
              </div>
            </InsightRow>
          )}

          {probs.length > 0 && (
            <InsightRow label="Domain Probabilities (Multinomial Naive Bayes Classifier)">
              <div className="space-y-2">
                {probs.map((p) => (
                  <div key={p.domain}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: p.domain === domain ? C.primaryDark : C.text, fontWeight: p.domain === domain ? 600 : 400 }}>
                        {p.domain}
                      </span>
                      <span style={{ color: C.subtext }}>{p.probability}%</span>
                    </div>
                    <ProgressBar value={p.probability} color={p.domain === domain ? C.primary : "#94A3B8"} />
                  </div>
                ))}
              </div>
            </InsightRow>
          )}

          {bloom.name && (
            <InsightRow label="Cognitive Level (Bloom's Taxonomy)">
              <p className="text-sm" style={{ color: C.text }}>
                Level {bloom.level} of 6 · <span className="font-semibold">{bloom.name}</span>
                {bloom.matchedVerb && <span style={{ color: C.subtext }}> (matched “{bloom.matchedVerb}”)</span>}
              </p>
            </InsightRow>
          )}

          {diff.final && (
            <InsightRow label="Difficulty (Weighted Ensemble: 60% AI + 40% Rule-Based)">
              <div className="grid grid-cols-3 gap-2">
                <ScorePill label="AI model" value={diff.llm} />
                <ScorePill label="Rule-based" value={`${diff.heuristic} (${Math.round((diff.heuristicScore || 0) * 100)})`} />
                <ScorePill label="Final" value={diff.final} strong />
              </div>
            </InsightRow>
          )}

          {conf.final !== undefined && (
            <InsightRow label="Confidence (Weighted Ensemble: 60% AI + 40% Naive Bayes)">
              <div className="grid grid-cols-3 gap-2">
                <ScorePill label="AI model" value={`${conf.llm}%`} />
                <ScorePill label="Naive Bayes" value={`${conf.naiveBayes}%`} />
                <ScorePill label="Final" value={`${conf.final}%`} strong />
              </div>
            </InsightRow>
          )}

          <InsightRow label="Similar past questions (TF-IDF cosine similarity)">
            <p className="text-sm flex items-center gap-1.5" style={{ color: C.text }}>
              {cached ? <Zap size={14} color={C.success} /> : <History size={14} color={C.subtext} />}
              Closest earlier question: {dup.bestMatchSimilarity ?? 0}% similar.
              {cached ? " Reused saved answer from database." : " A fresh answer is generated; earlier answers are not reused."}
            </p>
          </InsightRow>
        </div>
      )}
    </Card>
  );
}

function AnalysisError({ doubt, message, onRetry, onBack }) {
  return (
    <Card className="p-8 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#FEF2F2" }}>
        <Bot size={26} color={C.error} />
      </div>
      <p className="font-semibold mb-1" style={{ color: C.text }}>Couldn't analyse your doubt</p>
      <p className="text-sm mb-6" style={{ color: C.subtext }}>{message}</p>
      <div className="flex gap-3 justify-center">
        <Button variant="ghost" onClick={onBack}>Go Back</Button>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    </Card>
  );
}

function AskDoubtPage({ onSubmit, onMenu, onToast }) {
  return (
    <div>
      <TopBar title="Ask Doubt" subtitle="Describe your academic doubt — in any subject." onMenu={onMenu} />
      <Card className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={18} color={C.primary} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>AI Assistant is ready to diagnose & explain</span>
        </div>
        <DoubtInputBox onSubmit={onSubmit} onToast={onToast} rows={5} />
      </Card>
    </div>
  );
}

/* ------------------------------- AI BACKEND CALL ------------------------------- */
async function analyzeDoubtWithAI(doubtText, userId = 1) {
  const response = await fetch(`${API_BASE}/api/doubts/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: doubtText, user_id: userId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Backend request failed with status ${response.status}`);
  }

  return response.json();
}

/* -------------------------------- RESOURCES -------------------------------- */
function ResourceCard({ r, saved, onToggleSave, onView }) {
  const Icon = RESOURCE_ICON[r.type] || FileText;
  return (
    <Card className="p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
            <Icon size={19} color={C.primary} />
          </div>
          <TipButton label={saved ? "Remove bookmark" : "Bookmark resource"} onClick={onToggleSave} aria-label="Bookmark resource">
            <Bookmark size={18} fill={saved ? C.primary : "none"} color={saved ? C.primary : C.subtext} />
          </TipButton>
        </div>
        <p className="font-semibold text-sm mb-2" style={{ color: C.text }}>{r.title}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {r.subject && <Badge bg="#F1F5F9" fg={C.subtext}>{r.subject}</Badge>}
          {r.topic && <Badge bg="#F1F5F9" fg={C.subtext}>{r.topic}</Badge>}
          {r.difficulty && <Badge bg="#FEF3C7" fg={C.warning}>{r.difficulty}</Badge>}
        </div>
        <p className="text-xs mb-3" style={{ color: C.subtext }}>{r.type} · {r.relevance}% relevant</p>
        <ProgressBar value={r.relevance} />
      </div>
      <Button variant="primary" className="mt-4 w-full !py-2 text-xs" onClick={onView}>View Resource</Button>
    </Card>
  );
}

function normalizeResource(r) {
  return {
    id: r.id,
    title: r.title,
    subject: r.subject,
    topic: r.topic,
    difficulty: r.difficulty,
    type: r.resource_type || r.type,
    relevance: r.relevance_score ?? r.relevance,
  };
}

function ResourcesPage({ onMenu, currentUser, onToast }) {
  const [saved, setSaved] = useState({});
  const [filterType, setFilterType] = useState("All");
  const [active, setActive] = useState(null);
  const [libraryResources, setLibraryResources] = useState(RESOURCES);
  const [dynamicResources, setDynamicResources] = useState([]);
  const types = ["All", "Video", "PDF", "Article", "Notes", "Practice Questions", "Documentation"];
  const filtered = filterType === "All" ? libraryResources : libraryResources.filter((r) => r.type === filterType);

  useEffect(() => {
    fetch(`${API_BASE}/api/resources`)
      .then((r) => r.json())
      .then((data) => data.length && setLibraryResources(data.map(normalizeResource)))
      .catch(() => {});

    fetch(`${API_BASE}/api/resources/recent?limit=12`)
      .then((r) => r.json())
      .then((data) => setDynamicResources(data.map(normalizeResource)))
      .catch(() => {});
  }, []);

  const toggleSave = (key, resourceId) => {
    setSaved((s) => ({ ...s, [key]: !s[key] }));
    const userId = currentUser?.id || 1;
    if (resourceId) {
      fetch(`${API_BASE}/api/resources/${resourceId}/bookmark?user_id=${userId}`, { method: "POST" })
        .then(() => onToast && onToast(saved[key] ? "Bookmark removed" : "Resource bookmarked in database ✓"))
        .catch(() => {});
    }
  };

  return (
    <div>
      <TopBar title="Recommended Resources" subtitle="Curated learning materials ranked for your doubts." onMenu={onMenu} currentUser={currentUser} />

      {dynamicResources.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: C.text }}>
            <Sparkles size={16} color={C.primary} /> From Your Latest Doubts
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dynamicResources.map((r, i) => {
              const key = `dyn-${i}-${r.title}`;
              return (
                <ResourceCard
                  key={key}
                  r={r}
                  saved={!!saved[key]}
                  onToggleSave={() => toggleSave(key, r.id)}
                  onView={() => setActive(r)}
                />
              );
            })}
          </div>
        </div>
      )}

      <h3 className="font-semibold text-sm mb-3" style={{ color: C.text }}>All Subject Resources</h3>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        <Filter size={16} color={C.subtext} className="shrink-0" />
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            style={{
              background: filterType === t ? C.primary : "#fff",
              color: filterType === t ? "#fff" : C.subtext,
              border: `1px solid ${filterType === t ? C.primary : "#E2E8F0"}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <ResourceCard
            key={r.title}
            r={r}
            saved={!!saved[r.title]}
            onToggleSave={() => toggleSave(r.title, r.id)}
            onView={() => setActive(r)}
          />
        ))}
      </div>

      {active && (
        <Modal title={active.title} onClose={() => setActive(null)}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {active.subject && <Badge bg="#F1F5F9" fg={C.subtext}>{active.subject}</Badge>}
              {active.topic && <Badge bg="#F1F5F9" fg={C.subtext}>{active.topic}</Badge>}
              {active.difficulty && <Badge bg="#FEF3C7" fg={C.warning}>{active.difficulty}</Badge>}
              <Badge bg="#EFF6FF" fg={C.primaryDark}>{active.type}</Badge>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: C.subtext }}>Relevance to your recent doubts</p>
              <ProgressBar value={active.relevance} />
            </div>
            <Button
              icon={ExternalLink}
              className="w-full"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(active.title + " " + (active.subject || ""))}`, "_blank")}
            >
              Open Resource Material
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- QUIZ (STRICT NO SKIPPING) ---------------------------------- */
function QuizPage({ onMenu, quizData, currentUser, onToast, onBackToDoubt, onExploreResources }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [skippedAlert, setSkippedAlert] = useState(false);

  const questions = (quizData && quizData.questions && quizData.questions.length
    ? quizData.questions.map((q) => ({
        q: q.q || q.question,
        options: q.options,
        correct: q.correct ?? q.correctIndex ?? 0,
        explanation: q.explanation || "",
      }))
    : QUIZ_QUESTIONS);
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const subtitle = quizData
    ? `${quizData.subject || "Academic"} · ${quizData.topic || ""}${quizData.difficulty ? " · " + quizData.difficulty : ""}`
    : "Mathematics, Science & CS · Conceptual Practice";

  if (submitted) {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const pct = Math.round((correct / total) * 100);
    const optionLetters = ["A", "B", "C", "D"];

    return (
      <div className="space-y-6 max-w-3xl">
        <TopBar title="Quiz Results & Detailed Review" subtitle={subtitle} onMenu={onMenu} currentUser={currentUser} />

        {/* Master Score Summary */}
        <Card className="p-6 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
            style={{
              background: pct >= 70 ? "#DCFCE7" : "#FEF3C7",
              color: pct >= 70 ? C.success : C.warning,
            }}
          >
            {pct}%
          </div>
          <p className="font-bold text-xl mb-1" style={{ color: C.text }}>
            {correct} of {total} Questions Answered Correctly
          </p>
          <p className="text-xs max-w-md mx-auto mb-4" style={{ color: C.subtext }}>
            {pct >= 70
              ? "Outstanding conceptual grasp! All 4 questions have been answered and recorded to your progress profile."
              : "Good effort! Review the detailed answers and explanations below to master the core concepts."}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-semibold">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● {correct} Correct
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              ● {total - correct} Incorrect
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              ✓ All {total} Questions Completed
            </span>
          </div>
        </Card>

        {/* Comprehensive Review of all 4 questions & answers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: C.text }}>
              <BookOpen size={18} color={C.primary} />
              Review of All {total} Quiz Questions & Answers
            </h3>
            <span className="text-xs text-slate-500 font-medium">Verified solutions & explanations</span>
          </div>

          <div className="space-y-4">
            {questions.map((item, qIdx) => {
              const userChoice = answers[qIdx];
              const isCorrect = userChoice === item.correct;
              return (
                <Card key={qIdx} className="p-5 border-l-4" style={{ borderLeftColor: isCorrect ? C.success : C.error }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-slate-100 text-slate-700">
                        {qIdx + 1}
                      </span>
                      <p className="font-semibold text-sm leading-snug" style={{ color: C.text }}>{item.q}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {item.options.map((opt, optIdx) => {
                      const wasSelected = userChoice === optIdx;
                      const isOptionCorrect = optIdx === item.correct;
                      let bg = "#F8FAFC";
                      let border = "#E2E8F0";
                      let textColor = C.text;

                      if (isOptionCorrect) {
                        bg = "#ECFDF5";
                        border = "#10B981";
                        textColor = "#065F46";
                      } else if (wasSelected && !isCorrect) {
                        bg = "#FEF2F2";
                        border = "#EF4444";
                        textColor = "#991B1B";
                      }

                      return (
                        <div
                          key={optIdx}
                          className="p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all"
                          style={{ background: bg, borderColor: border, color: textColor }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
                              style={{
                                background: isOptionCorrect ? "#10B981" : (wasSelected ? "#EF4444" : "#E2E8F0"),
                                color: (isOptionCorrect || wasSelected) ? "#fff" : C.subtext
                              }}
                            >
                              {optionLetters[optIdx]}
                            </span>
                            <span className="font-medium">{opt}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {wasSelected && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                Your Choice
                              </span>
                            )}
                            {isOptionCorrect && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {item.explanation && (
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                      <Sparkles size={15} className="shrink-0 text-blue-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Explanation: </span>
                        <span>{item.explanation}</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button icon={RotateCcw} onClick={() => { setSubmitted(false); setIdx(0); setAnswers({}); }}>
            Retake Quiz
          </Button>
          {onBackToDoubt && (
            <Button variant="secondary" icon={ArrowLeft} onClick={onBackToDoubt}>
              Back to Doubt Solution
            </Button>
          )}
          {onExploreResources && (
            <Button variant="ghost" icon={Layers} onClick={onExploreResources}>
              Explore Recommended Resources
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handleSelectOption = (optIndex) => {
    setAnswers((prev) => ({ ...prev, [idx]: optIndex }));
    setSkippedAlert(false);
  };

  const handleNext = () => {
    if (answers[idx] === undefined) {
      setSkippedAlert(true);
      if (onToast) onToast("Please select an answer to proceed. You cannot skip questions!");
      return;
    }
    setSkippedAlert(false);
    setIdx(idx + 1);
  };

  const submitQuiz = () => {
    if (answers[idx] === undefined || Object.keys(answers).length < total) {
      setSkippedAlert(true);
      if (onToast) onToast("Please answer all 4 questions before submitting. No skipping allowed!");
      return;
    }

    setSubmitted(true);
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const pct = Math.round((correct / total) * 100);
    const userId = currentUser?.id || 1;

    if (quizData && quizData.quizId) {
      fetch(`${API_BASE}/api/quiz/${quizData.quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, score: correct, total_questions: total, percentage: pct }),
      })
        .then(() => onToast && onToast("Quiz attempt recorded in database ✓"))
        .catch(() => {});
    }
  };

  const q = questions[idx];
  const isCurrentAnswered = answers[idx] !== undefined;
  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div>
      <TopBar title="Topic Assessment" subtitle={subtitle} onMenu={onMenu} currentUser={currentUser} />
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-2 text-xs font-medium" style={{ color: C.subtext }}>
          <span>Question {idx + 1} of {total}</span>
          <span className="font-semibold text-blue-600">{answeredCount} of {total} Answered (All 4 required · No skipping)</span>
        </div>
        <ProgressBar value={((idx + 1) / total) * 100} />

        {skippedAlert && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-amber-600" />
            <span><b>Answer required:</b> You must select an answer for Question {idx + 1} before proceeding.</span>
          </div>
        )}

        <Card className="p-6 mt-4">
          <p className="font-semibold text-base mb-5" style={{ color: C.text }}>{q.q}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const active = answers[idx] === i;
              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(i)}
                  className="w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors cursor-pointer flex items-center justify-between"
                  style={{
                    borderColor: active ? C.primary : "#E2E8F0",
                    background: active ? "#EFF6FF" : "#fff",
                    color: active ? C.primaryDark : C.text,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{
                        background: active ? C.primary : "#F1F5F9",
                        color: active ? "#fff" : C.subtext,
                      }}
                    >
                      {optionLetters[i]}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {active && <Check size={16} color={C.primary} />}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-between items-center mt-5">
          <Button variant="ghost" icon={ChevronLeft} disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            Previous
          </Button>

          {idx === total - 1 ? (
            <Button onClick={submitQuiz} disabled={!isCurrentAnswered}>
              Submit Quiz
            </Button>
          ) : (
            <Button icon={ChevronRight} onClick={handleNext} disabled={!isCurrentAnswered}>
              Next Question
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- MY DOUBTS -------------------------------- */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "";
  }
}

function normalizeDoubt(d) {
  return {
    q: d.question,
    domain: d.domain || "",
    subject: d.subject || "General",
    topic: d.topic || "—",
    difficulty: d.difficulty || "Medium",
    date: formatDate(d.created_at),
    status: d.status || "Solved",
  };
}

function MyDoubtsPage({ onMenu, onAskDoubt, currentUser }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const [doubts, setDoubts] = useState(MY_DOUBTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = currentUser?.id || 1;
    fetch(`${API_BASE}/api/doubts?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => setDoubts(data.map(normalizeDoubt)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const filtered = doubts.filter((d) => d.q.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <TopBar title="My Doubts" subtitle="Every academic question you've submitted and saved." onMenu={onMenu} currentUser={currentUser} />
      <div className="relative max-w-sm mb-5">
        <Search size={16} className="absolute left-3 top-3" color={C.subtext} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your doubts…"
          className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500"
          style={{ borderColor: "#E2E8F0", color: C.text }}
        />
      </div>
      {loading && <p className="text-xs mb-3" style={{ color: C.subtext }}>Loading your database records…</p>}
      <div className="space-y-3">
        {filtered.map((d) => (
          <Card key={d.q} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2" style={{ color: C.text }}>{d.q}</p>
              <div className="flex flex-wrap gap-1.5">
                {d.domain && <Badge bg="#EFF6FF" fg={C.primaryDark}>{d.domain}</Badge>}
                <Badge bg="#F1F5F9" fg={C.subtext}>{d.subject}</Badge>
                <Badge bg="#F1F5F9" fg={C.subtext}>{d.topic}</Badge>
                <Badge bg="#FEF3C7" fg={C.warning}>{d.difficulty}</Badge>
                <Badge bg={STATUS_STYLE[d.status]?.bg || "#DCFCE7"} fg={STATUS_STYLE[d.status]?.fg || C.success}>{d.status}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs" style={{ color: C.subtext }}>{d.date}</span>
              <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => setActive(d)}>View Details</Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: C.subtext }}>No doubts found.</p>
        )}
      </div>

      {active && (
        <Modal title="Doubt Details" onClose={() => setActive(null)}>
          <p className="text-sm font-medium mb-3" style={{ color: C.text }}>{active.q}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {active.domain && <Badge bg="#EFF6FF" fg={C.primaryDark}>{active.domain}</Badge>}
            <Badge bg="#F1F5F9" fg={C.subtext}>{active.subject}</Badge>
            <Badge bg="#F1F5F9" fg={C.subtext}>{active.topic}</Badge>
            <Badge bg="#FEF3C7" fg={C.warning}>{active.difficulty}</Badge>
          </div>
          <p className="text-xs mb-5" style={{ color: C.subtext }}>Asked on {active.date}</p>
          <Button
            className="w-full"
            icon={Bot}
            onClick={() => { onAskDoubt(active.q); setActive(null); }}
          >
            Ask AI About This Again
          </Button>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ SIMILAR PAGE ------------------------------ */
function SimilarQuestionsPage({ onMenu, onAskDoubt, latest, currentUser }) {
  const items = latest && Array.isArray(latest.similarQuestions) && latest.similarQuestions.length
    ? latest.similarQuestions.map((s) => ({ q: s.question, sim: s.similarity, source: s.source }))
    : SIMILAR_QUESTIONS;
  return (
    <div>
      <TopBar
        title="Similar Questions"
        subtitle={latest ? `Ranked by TF-IDF cosine similarity to “${latest.doubt}”.` : "Based on your recently asked doubts."}
        onMenu={onMenu}
        currentUser={currentUser}
      />
      <div className="grid md:grid-cols-3 gap-4">
        {items.map((s) => (
          <Card key={s.q} className="p-4 flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: C.text }}>{s.q}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge bg="#EFF6FF" fg={C.primaryDark}>{s.sim}% similar</Badge>
                {s.source === "history" && <Badge bg="#F1F5F9" fg={C.subtext}>Database record</Badge>}
              </div>
            </div>
            <Button variant="ghost" className="mt-4 w-full !py-2 text-xs" onClick={() => onAskDoubt(s.q)}>View Answer</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- PLANNER (DATABASE PERSISTENCE) -------------------------------- */
function normalizeTask(t) {
  return {
    id: t.id,
    task: t.task,
    subject: t.subject || "General",
    topic: t.topic || "",
    date: t.due_date || "No date set",
    priority: t.priority || "Medium",
    done: !!t.is_completed,
  };
}

function PlannerPage({ onMenu, onToast, currentUser }) {
  const [tasks, setTasks] = useState(PLANNER_TASKS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ task: "", subject: "", topic: "", date: "", priority: "Medium" });
  const priorityColor = { High: C.error, Medium: C.warning, Low: C.success };

  useEffect(() => {
    const userId = currentUser?.id || 1;
    fetch(`${API_BASE}/api/planner?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => data.length && setTasks(data.map(normalizeTask)))
      .catch(() => {});
  }, [currentUser]);

  const toggle = (i) => {
    const target = tasks[i];
    setTasks((t) => t.map((x, idx) => (idx === i ? { ...x, done: !x.done } : x)));
    if (target.id) {
      fetch(`${API_BASE}/api/planner/${target.id}/toggle`, { method: "PATCH" })
        .then(() => onToast && onToast("Task status updated in database ✓"))
        .catch(() => {});
    }
  };

  const saveTask = async () => {
    if (!form.task.trim()) {
      onToast("Please enter a task name");
      return;
    }
    const userId = currentUser?.id || 1;
    const newTaskLocal = {
      task: form.task,
      subject: form.subject || "General",
      topic: form.topic || "",
      date: form.date || "No date set",
      priority: form.priority,
      done: false,
    };
    setTasks((t) => [newTaskLocal, ...t]);
    setForm({ task: "", subject: "", topic: "", date: "", priority: "Medium" });
    setShowForm(false);
    onToast("Task added & saved to database ✓");

    try {
      const res = await fetch(`${API_BASE}/api/planner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          task: newTaskLocal.task,
          subject: newTaskLocal.subject,
          topic: form.topic || null,
          due_date: form.date || null,
          priority: form.priority,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setTasks((t) => [normalizeTask(saved), ...t.filter((x) => x !== newTaskLocal)]);
      }
    } catch (e) {}
  };

  return (
    <div>
      <TopBar title="Study Planner" subtitle="Plan, schedule, and track academic revision goals." onMenu={onMenu} currentUser={currentUser} />
      
      <div className="mb-5 p-3.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 flex items-start gap-3">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-blue-900 mb-0.5">Custom & Manual Revision Planning</p>
          You can manually prepare, schedule, and customize your study tasks at any time using the <strong>Add Task</strong> button below, or accept tailored AI study plans recommended when asking academic doubts.
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-sm" style={{ color: C.text }}>Learning Goals & Tasks</h3>
        <Button icon={Plus} className="!px-3 !py-2 text-xs" onClick={() => setShowForm(!showForm)}>Add Task</Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-5 border-blue-200 bg-blue-50/20">
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Input label="Task Name" placeholder="e.g. Revise Integration by parts" value={form.task} onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))} required />
            <Input label="Subject" placeholder="e.g. Mathematics" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            <Input label="Topic" placeholder="e.g. Calculus" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
            <Input label="Target Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium" style={{ color: C.text }}>Priority:</span>
            {["High", "Medium", "Low"].map((p) => (
              <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, priority: p }))} className="cursor-pointer">
                <Badge bg={form.priority === p ? `${priorityColor[p]}22` : "#F1F5F9"} fg={priorityColor[p]}>{p}</Badge>
              </button>
            ))}
          </div>
          <Button onClick={saveTask}>Save Task to Database</Button>
        </Card>
      )}

      <div className="space-y-3 mb-8">
        {tasks.map((t, i) => (
          <Card key={`${t.task}-${i}`} className="p-4 flex items-center gap-3">
            <TipButton label={t.done ? "Mark as not done" : "Mark as done"} onClick={() => toggle(i)} aria-label="Toggle complete">
              {t.done ? <CheckCircle2 size={20} color={C.success} /> : <Circle size={20} color={C.subtext} />}
            </TipButton>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${t.done ? "line-through text-slate-400" : ""}`} style={{ color: t.done ? C.subtext : C.text }}>{t.task}</p>
              <p className="text-xs" style={{ color: C.subtext }}>{t.subject} {t.topic ? `· ${t.topic}` : ""} · {t.date}</p>
            </div>
            <Badge bg="#F1F5F9" fg={priorityColor[t.priority] || C.warning}>{t.priority}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- PROGRESS -------------------------------- */
const PIE_COLORS = [C.primary, C.secondary, C.warning, C.success, "#8B5CF6", "#EC4899", "#14B8A6"];

function ProgressPage({ onMenu, currentUser }) {
  const [lineData, setLineData] = useState(LINE_DATA);
  const [pieData, setPieData] = useState(PIE_DATA);
  const [barData, setBarData] = useState(BAR_DATA);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const userId = currentUser?.id || 1;
    fetch(`${API_BASE}/api/progress?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => data.length && setLineData(data.map((d) => ({ week: d.week, progress: d.progress }))))
      .catch(() => {});

    fetch(`${API_BASE}/api/progress/summary?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        if (data.subjectDistribution && data.subjectDistribution.length) {
          setPieData(data.subjectDistribution.map((d, i) => ({ ...d, color: PIE_COLORS[i % PIE_COLORS.length] })));
        }
        if (data.quizPerformance && data.quizPerformance.length) setBarData(data.quizPerformance);
      })
      .catch(() => {});
  }, [currentUser]);

  const latestProgress = lineData.length ? `${lineData[lineData.length - 1].progress}%` : "68%";

  return (
    <div>
      <TopBar title="Progress Dashboard" subtitle="Your learning analytics and mastery metrics." onMenu={onMenu} currentUser={currentUser} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Overall Progress", value: latestProgress, icon: Target, tint: C.primary },
          { label: "Quiz Avg. Score", value: stats ? (stats.avgQuizScore != null ? `${stats.avgQuizScore}%` : "—") : "78%", icon: ClipboardList, tint: C.success },
          { label: "Doubts Solved", value: stats ? String(stats.doubtsSolved) : "36", icon: MessageCircleQuestion, tint: C.warning },
          { label: "Resources Saved", value: stats ? String(stats.resourcesSaved) : "58", icon: Layers, tint: C.secondary },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.tint}1A` }}>
              <s.icon size={20} color={s.tint} />
            </div>
            <p className="text-2xl font-bold" style={{ color: C.text }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: C.subtext }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Learning Progress Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: C.subtext }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: C.subtext }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Line type="monotone" dataKey="progress" stroke={C.primary} strokeWidth={2.5} dot={{ r: 4, fill: C.primary }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Doubts by Academic Domain</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={pieData.length > 1 ? 3 : 0}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs" style={{ color: C.subtext }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /> {p.name} ({p.value})
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Recent Quiz Performance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="quiz" tick={{ fontSize: 12, fill: C.subtext }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: C.subtext }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
            <Bar dataKey="score" fill={C.secondary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* -------------------------------- ADMIN DASHBOARD -------------------------------- */
function AdminDashboardPage({ onMenu, onToast, currentUser, initialTab = "activities" }) {
  const [overview, setOverview] = useState(null);
  const [usersProgress, setUsersProgress] = useState([]);
  const [activities, setActivities] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [tab, setTab] = useState(initialTab); // "activities" | "feedback"
  const [activityView, setActivityView] = useState("progress"); // "progress" | "timeline"
  const [activityFilter, setActivityFilter] = useState("all"); // "all" | "doubt" | "quiz" | "task" | "feedback"
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState("all"); // "all" | "5" | "4" | "3"
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);


  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/admin/overview`).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/admin/users-progress`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/api/admin/activities`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/api/admin/feedback`).then((r) => r.json()).catch(() => []),
    ])
      .then(([ov, up, act, fb]) => {
        if (ov) setOverview(ov);
        if (Array.isArray(up)) setUsersProgress(up);
        if (Array.isArray(act)) setActivities(act);
        if (Array.isArray(fb)) setFeedbacks(fb);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filtered users progress
  const filteredUsers = usersProgress.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.preferred_subjects && u.preferred_subjects.toLowerCase().includes(q))
    );
  });

  // Filtered activities stream
  const filteredActivities = activities.filter((a) => {
    if (activityFilter !== "all" && a.type !== activityFilter) return false;
    if (selectedStudent !== "all" && a.user_name !== selectedStudent && a.user_email !== selectedStudent) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (a.title || "") + " " + (a.user_name || "") + " " + (a.subject || "") + " " + (a.topic || "");
      if (!matchText.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((f) => {
    if (feedbackRatingFilter !== "all") {
      const ratingThreshold = parseInt(feedbackRatingFilter, 10);
      if (feedbackRatingFilter === "3") {
        if ((f.ai_rating || 0) > 3) return false;
      } else {
        if (f.ai_rating !== ratingThreshold) return false;
      }
    }
    if (feedbackSearch.trim()) {
      const q = feedbackSearch.toLowerCase();
      const text = (f.user_name || "") + " " + (f.user_email || "") + " " + (f.comments || "") + " " + (f.doubt_question || "");
      if (!text.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Unique students for filter dropdown
  const studentNames = Array.from(new Set(usersProgress.map((u) => u.full_name).filter(Boolean)));

  // Calculate rating stats
  const totalReviews = feedbacks.length;
  const positiveReviews = feedbacks.filter((f) => (f.ai_rating || 0) >= 4).length;
  const satisfactionRate = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 96;
  const avgAi = overview?.avg_ai_rating ? overview.avg_ai_rating : (
    totalReviews > 0 ? (feedbacks.reduce((acc, cur) => acc + (cur.ai_rating || 5), 0) / totalReviews).toFixed(1) : "4.8"
  );
  const avgResource = overview?.avg_resource_rating ? overview.avg_resource_rating : (
    totalReviews > 0 ? (feedbacks.reduce((acc, cur) => acc + (cur.resource_rating || 5), 0) / totalReviews).toFixed(1) : "4.6"
  );

  return (
    <div className="space-y-6">
      <TopBar
        title="Admin Dashboard"
        subtitle="Comprehensive user activities tracking, progress analytics, and feedback results."
        onMenu={onMenu}
        currentUser={currentUser}
      />

      {/* Top Overview Metric Cards: Focused on User Activities & Feedback */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Enrolled Students",
            value: overview?.total_users != null ? String(overview.total_users) : (usersProgress.length ? String(usersProgress.length) : "5"),
            sub: "Active student accounts",
            icon: Users,
            tint: C.primary,
          },
          {
            label: "User Doubts Submitted",
            value: overview?.total_doubts != null ? String(overview.total_doubts) : "78",
            sub: "Academic doubts classified",
            icon: MessageCircleQuestion,
            tint: C.secondary,
          },
          {
            label: "Quizzes & Tasks Done",
            value: String((overview?.total_quizzes || 0) + (overview?.total_tasks || 0) || "21"),
            sub: "Quizzes & study milestones",
            icon: ClipboardList,
            tint: C.success,
          },
          {
            label: "User Satisfaction Score",
            value: `${avgAi} / 5.0`,
            sub: `${totalReviews || 6} user reviews recorded`,
            icon: Star,
            tint: C.warning,
          },
        ].map((s) => (
          <Card key={s.label} className="p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.tint}18` }}>
                <s.icon size={20} color={s.tint} />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Live</span>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: C.text }}>{s.value}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: C.text }}>{s.label}</p>
            <p className="text-[11px] mt-0.5 text-slate-400">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Primary Navigation Tabs: ONLY User Activities & Feedback Results */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("activities")}
            className={`flex items-center gap-2 pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              tab === "activities"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp size={16} />
            User Activities & Progress
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              tab === "activities" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
            }`}>
              {usersProgress.length || 5}
            </span>
          </button>

          <button
            onClick={() => setTab("feedback")}
            className={`flex items-center gap-2 pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              tab === "feedback"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquareHeart size={16} />
            User Feedback Results
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              tab === "feedback" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}>
              {feedbacks.length || 6}
            </span>
          </button>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh database records"
        >
          <RotateCcw size={13} className={loading ? "animate-spin text-blue-600" : ""} />
          <span>{loading ? "Syncing…" : "Refresh"}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: USER ACTIVITIES & PROGRESS                                      */}
      {/* ========================================================================= */}
      {tab === "activities" && (
        <div className="space-y-4">
          {/* Sub-Header Toolbar: View Modes & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            {/* View Switcher: Progress Table vs Live Timeline */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActivityView("progress")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activityView === "progress"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users size={14} />
                Student Progress Table
              </button>
              <button
                onClick={() => setActivityView("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activityView === "timeline"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <History size={14} />
                Live Activity Timeline
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
                  {activities.length || 0}
                </span>
              </button>
            </div>

            {/* Search and Student Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={activityView === "progress" ? "Search student or email…" : "Search activities…"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {activityView === "timeline" && (
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Students</option>
                  {studentNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Activity View A: Student Progress Table */}
          {activityView === "progress" && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Student Learning Progress & Engagement Overview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track doubts asked, quiz scores, tasks done, and overall learning progress per registered student.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Showing {filteredUsers.length} student{filteredUsers.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Doubts Asked</th>
                      <th className="px-4 py-3.5">Doubts Solved</th>
                      <th className="px-4 py-3.5">Quizzes Attempted</th>
                      <th className="px-4 py-3.5">Avg Quiz Score</th>
                      <th className="px-4 py-3.5">Tasks Done</th>
                      <th className="px-4 py-3.5">Progress</th>
                      <th className="px-4 py-3.5">Activity Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      // Estimate overall student progress percentage
                      const progressPct = Math.min(
                        100,
                        Math.max(
                          15,
                          Math.round((u.doubts_solved * 8) + (u.quizzes_attempted * 15) + (u.tasks_completed * 10))
                        )
                      );
                      const isHighActive = u.doubts_asked > 10 || u.quizzes_attempted > 2;
                      const hasActivity = u.doubts_asked > 0 || u.quizzes_attempted > 0 || u.tasks_completed > 0;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                {u.full_name ? u.full_name[0].toUpperCase() : "S"}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 leading-tight">{u.full_name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge bg={u.role === "admin" ? "#F3E8FF" : "#EFF6FF"} fg={u.role === "admin" ? "#7C3AED" : C.primary}>
                              {u.role === "admin" ? "Admin" : "Student"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">{u.doubts_asked}</td>
                          <td className="px-4 py-3.5 font-semibold text-emerald-600">{u.doubts_solved}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700">{u.quizzes_attempted}</td>
                          <td className="px-4 py-3.5">
                            {u.avg_quiz_score != null ? (
                              <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                                u.avg_quiz_score >= 70
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}>
                                <Target size={12} />
                                {u.avg_quiz_score}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">No quizzes yet</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 font-medium">
                            {u.tasks_completed} done
                          </td>
                          <td className="px-4 py-3.5 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-700">{progressPct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {isHighActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                High Activity
                              </span>
                            ) : hasActivity ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Registered</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedStudent(u.full_name);
                                setActivityView("timeline");
                              }}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              View Trail →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-slate-500">
                          <Users size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">No students found matching your search</p>
                          <p className="text-xs text-slate-400 mt-1">Try resetting the search query.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Activity View B: Live Chronological Activity Timeline */}
          {activityView === "timeline" && (
            <div className="space-y-3">
              {/* Filter Pills for Activity Stream */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                  <Filter size={13} /> Filter:
                </span>
                {[
                  { key: "all", label: "All Activities" },
                  { key: "doubt", label: "Doubts Asked" },
                  { key: "quiz", label: "Quizzes Attempted" },
                  { key: "task", label: "Study Tasks" },
                  { key: "feedback", label: "Feedback Given" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActivityFilter(f.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activityFilter === f.key
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                {selectedStudent !== "all" && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold">
                    <span>Filtering: {selectedStudent}</span>
                    <button
                      onClick={() => setSelectedStudent("all")}
                      className="hover:text-blue-900 cursor-pointer"
                      title="Clear student filter"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Activity Cards List */}
              <div className="space-y-2.5">
                {filteredActivities.map((act) => {
                  const isDoubt = act.type === "doubt";
                  const isQuiz = act.type === "quiz";
                  const isTask = act.type === "task";
                  const isFeedback = act.type === "feedback";

                  const iconColor = isDoubt ? C.primary : isQuiz ? C.success : isTask ? "#7C3AED" : C.warning;
                  const IconComponent = isDoubt
                    ? MessageCircleQuestion
                    : isQuiz
                    ? ClipboardList
                    : isTask
                    ? CheckSquare
                    : Star;

                  return (
                    <Card key={act.id} className="p-4 hover:border-slate-300 transition-all">
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${iconColor}18` }}
                        >
                          <IconComponent size={18} color={iconColor} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{act.user_name}</span>
                              <span className="text-xs text-slate-400">({act.user_email})</span>
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {act.action}
                              </span>
                            </div>

                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <Clock size={12} />
                              {act.timestamp ? formatDate(act.timestamp) : "Recently"}
                            </span>
                          </div>

                          <p className="text-sm text-slate-800 font-medium line-clamp-2 mt-0.5">
                            {act.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {act.subject && (
                              <Badge bg="#EFF6FF" fg={C.primaryDark}>
                                {act.subject}
                              </Badge>
                            )}
                            {act.topic && (
                              <Badge bg="#F1F5F9" fg="#475569">
                                {act.topic}
                              </Badge>
                            )}
                            {act.badge && (
                              <Badge bg="#FEF3C7" fg="#B45309">
                                {act.badge}
                              </Badge>
                            )}
                            {act.status && (
                              <Badge bg={act.status === "Solved" || act.status === "Passed" || act.status === "Completed" ? "#DCFCE7" : "#F8FAFC"} fg={act.status === "Solved" || act.status === "Passed" || act.status === "Completed" ? C.success : "#64748B"}>
                                {act.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {filteredActivities.length === 0 && (
                  <Card className="p-12 text-center">
                    <History size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No activities match your current filters</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {searchQuery || activityFilter !== "all" || selectedStudent !== "all"
                        ? "Try resetting your filter or search query."
                        : "No user activities recorded yet in the database."}
                    </p>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActivityFilter("all");
                        setSelectedStudent("all");
                        setSearchQuery("");
                      }}
                    >
                      Reset All Filters
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: USER FEEDBACK RESULTS                                           */}
      {/* ========================================================================= */}
      {tab === "feedback" && (
        <div className="space-y-5">
          {/* Feedback Analytics Banner Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">AI Explanation Rating</span>
                <Star size={16} fill={C.warning} color={C.warning} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-900">{avgAi}</span>
                <span className="text-xs text-amber-700 font-semibold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} fill={i <= Math.round(Number(avgAi)) ? C.warning : "none"} color={C.warning} />
                ))}
              </div>
            </Card>

            <Card className="p-4 border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Resource Recommendation</span>
                <Layers size={16} className="text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-900">{avgResource}</span>
                <span className="text-xs text-blue-700 font-semibold">/ 5.0</span>
              </div>
              <p className="text-xs text-blue-700 mt-2 font-medium">Curated videos, docs & articles score</p>
            </Card>

            <Card className="p-4 border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Positive Satisfaction</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-900">{satisfactionRate}%</span>
                <span className="text-xs text-emerald-700 font-semibold">Satisfaction</span>
              </div>
              <p className="text-xs text-emerald-700 mt-2 font-medium">{positiveReviews} of {totalReviews} rated 4★ or 5★</p>
            </Card>

            <Card className="p-4 border border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Total User Reviews</span>
                <MessageSquareHeart size={16} className="text-purple-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-purple-900">{totalReviews}</span>
                <span className="text-xs text-purple-700 font-semibold">Responses</span>
              </div>
              <p className="text-xs text-purple-700 mt-2 font-medium">From student study sessions</p>
            </Card>
          </div>

          {/* Feedback Filter & Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                <Filter size={13} /> Rating:
              </span>
              {[
                { key: "all", label: "All Reviews" },
                { key: "5", label: "★ 5 Stars Only" },
                { key: "4", label: "★ 4 Stars" },
                { key: "3", label: "★ 3 Stars & Under" },
              ].map((rf) => (
                <button
                  key={rf.key}
                  onClick={() => setFeedbackRatingFilter(rf.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    feedbackRatingFilter === rf.key
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search feedback comments or student…"
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {feedbackSearch && (
                <button
                  onClick={() => setFeedbackSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Feedback Results Table */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Student Reviews & System Feedback Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct evaluation of AI explanations, accuracy, and recommended academic resources.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredFeedbacks.length} feedback entr{filteredFeedbacks.length === 1 ? "y" : "ies"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-4 py-3.5">AI Rating</th>
                    <th className="px-4 py-3.5">Resource Rating</th>
                    <th className="px-5 py-3.5">Written Feedback & Comments</th>
                    <th className="px-4 py-3.5">Related Doubt Context</th>
                    <th className="px-4 py-3.5">Submitted On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFeedbacks.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            {f.user_name ? f.user_name[0].toUpperCase() : "S"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{f.user_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{f.user_email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={13}
                                fill={i <= (f.ai_rating || 5) ? C.warning : "none"}
                                color={C.warning}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{f.ai_rating || 5}/5</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={13}
                                fill={i <= (f.resource_rating || 5) ? C.warning : "none"}
                                color={C.warning}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{f.resource_rating || 5}/5</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700 max-w-md">
                        <p className="text-xs leading-relaxed text-slate-800 italic bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                          "{f.comments || "No detailed remarks provided."}"
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs">
                        {f.doubt_question ? (
                          <p className="truncate text-slate-700 font-medium" title={f.doubt_question}>
                            {f.doubt_question}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">General Session</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(f.created_at)}
                      </td>
                    </tr>
                  ))}

                  {filteredFeedbacks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                        <MessageSquareHeart size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No feedback entries found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {feedbackSearch || feedbackRatingFilter !== "all"
                            ? "Try resetting your filter or search query."
                            : "No user reviews have been submitted yet."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}


/* -------------------------------- FEEDBACK -------------------------------- */
function FeedbackPage({ onToast, onMenu, currentUser }) {
  const [aiRating, setAiRating] = useState(5);
  const [resourceRating, setResourceRating] = useState(5);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const userId = currentUser?.id || 1;
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ai_rating: aiRating,
          resource_rating: resourceRating,
          comments: text,
        }),
      });
      setSent(true);
      onToast("Feedback saved in database ✓");
    } catch (e) {
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div>
        <TopBar title="Feedback" subtitle="" onMenu={onMenu} currentUser={currentUser} />
        <Card className="p-8 text-center max-w-md mx-auto">
          <CheckCircle2 size={40} color={C.success} className="mx-auto mb-3" />
          <p className="font-semibold" style={{ color: C.text }}>Thanks for your feedback!</p>
          <p className="text-sm mt-1" style={{ color: C.subtext }}>Your rating and comments have been stored in the database for the administration team.</p>
          <Button className="mt-5" variant="ghost" onClick={() => setSent(false)}>Submit another response</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Student Feedback" subtitle="Help us refine AI doubt explanations & resources." onMenu={onMenu} currentUser={currentUser} />
      <Card className="p-6 max-w-lg space-y-6">
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: C.text }}>Rate the AI Doubt Classification & Explanation</p>
          <Stars value={aiRating} onChange={setAiRating} />
        </div>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: C.text }}>Rate the Recommended Learning Materials</p>
          <Stars value={resourceRating} onChange={setResourceRating} />
        </div>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: C.text }}>Additional suggestions or comments</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Tell us how we can help you learn better across Maths, Science, History, etc…"
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
            style={{ borderColor: "#E2E8F0", color: C.text }}
          />
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Feedback to Database"}
        </Button>
      </Card>
    </div>
  );
}

/* -------------------------------- SETTINGS -------------------------------- */
function SettingsPage({ onMenu, onToast, currentUser, onUpdateUser }) {
  const [name, setName] = useState(currentUser?.full_name || "Sumedha");
  const [email, setEmail] = useState(currentUser?.email || "sumedha@college.edu");
  const [subjects, setSubjects] = useState(currentUser?.preferred_subjects || "Mathematics, Physics, History, Java");

  const saveSettings = () => {
    const updated = { ...currentUser, full_name: name, email, preferred_subjects: subjects };
    localStorage.setItem("doubtai_user", JSON.stringify(updated));
    if (onUpdateUser) onUpdateUser(updated);
    onToast("Profile preferences updated ✓");
  };

  return (
    <div>
      <TopBar title="Settings" subtitle="Manage your profile preferences." onMenu={onMenu} currentUser={currentUser} />
      <Card className="p-6 max-w-lg">
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Preferred Subjects" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
        <Button className="mt-2" onClick={saveSettings}>Save Changes</Button>
      </Card>
    </div>
  );
}

/* -------------------------------- ABSTRACT -------------------------------- */
function AbstractPage({ onMenu, onNavigate, currentUser }) {
  const statusStyle = {
    Live: { bg: "#DCFCE7", fg: C.success },
  };
  return (
    <div>
      <TopBar title="Project Abstract" subtitle="Overview of the full-stack architecture and multi-disciplinary modules." onMenu={onMenu} currentUser={currentUser} />

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
            <Bot size={20} color={C.primary} />
          </div>
          <div>
            <h2 className="font-bold text-lg" style={{ color: C.text }}>{ABSTRACT.title}</h2>
            <p className="text-xs" style={{ color: C.subtext }}>{ABSTRACT.tagline}</p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-2" style={{ color: C.text }}>Problem Statement</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.subtext }}>{ABSTRACT.problem}</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-2" style={{ color: C.text }}>Proposed Solution</h3>
          <p className="text-sm leading-relaxed" style={{ color: C.subtext }}>{ABSTRACT.solution}</p>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-sm mb-2" style={{ color: C.text }}>Expected Outcome</h3>
        <p className="text-sm leading-relaxed" style={{ color: C.subtext }}>{ABSTRACT.outcome}</p>
      </Card>

      <h3 className="font-semibold text-sm mb-3" style={{ color: C.text }}>Project Modules & Navigation</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {MODULES.map((m) => {
          const isRestrictedAdmin = m.nav === "admin" && currentUser?.role !== "admin";
          return (
            <Card key={m.name} className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{m.name}</p>
                <p className="text-xs mb-3" style={{ color: C.subtext }}>{m.desc}</p>
              </div>
              {m.nav && !isRestrictedAdmin && (
                <button
                  className="text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  style={{ color: C.primary }}
                  onClick={() => onNavigate(m.nav)}
                >
                  Open module <ArrowRight size={13} />
                </button>
              )}
              {isRestrictedAdmin && (
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Lock size={12} /> Requires Admin Login
                </span>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- APP MAIN ---------------------------------- */
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("doubtai_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [view, setView] = useState(() => {
    try {
      const saved = localStorage.getItem("doubtai_user");
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.role === "admin" ? "admin" : "dashboard";
    } catch (e) {
      return "dashboard";
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [doubtFlow, setDoubtFlow] = useState({ phase: "idle", doubt: "", result: null, error: null });
  const [quizData, setQuizData] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const showToast = (msg) => setToast(msg);
  const openMenu = () => setMobileOpen(true);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem("doubtai_user", JSON.stringify(user));
    if (user.role === "admin") {
      setView("admin");
      showToast(`Welcome Administrator, ${user.full_name}! 🛡️`);
    } else {
      setView("dashboard");
      showToast(`Welcome, ${user.full_name}! 🎓`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("doubtai_user");
    setDoubtFlow({ phase: "idle", doubt: "", result: null, error: null });
    setView("dashboard");
    showToast("Logged out successfully.");
  };

  const resetDoubtFlow = () => setDoubtFlow({ phase: "idle", doubt: "", result: null, error: null });

  const navigate = (key) => {
    if (currentUser?.role === "admin") {
      if (key !== "admin" && key !== "admin_feedback" && key !== "settings") {
        setView("admin");
        return;
      }
    } else {
      if (key === "admin" || key === "admin_feedback") {
        showToast("Access Denied: Administrator Portal is restricted to admins.");
        return;
      }
    }
    resetDoubtFlow();
    setView(key);
  };


  const submitDoubt = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) {
      showToast("Please type your doubt first");
      return;
    }
    setDoubtFlow({ phase: "analyzing", doubt: trimmed, result: null, error: null });
    try {
      const result = await analyzeDoubtWithAI(trimmed, currentUser?.id || 1);
      setDoubtFlow({ phase: "result", doubt: trimmed, result, error: null });
      setLatestAnalysis({ ...result, doubt: trimmed });
      if (result && Array.isArray(result.quiz) && result.quiz.length) {
        setQuizData({
          subject: result.subject,
          topic: result.topic,
          difficulty: result.difficulty,
          questions: result.quiz,
          quizId: result.quizId,
        });
      }
    } catch (err) {
      setDoubtFlow({
        phase: "error",
        doubt: trimmed,
        result: null,
        error: "AI analysis service is unavailable right now. Please check your connection and try again.",
      });
    }
  };

  const openQuizForDoubt = () => {
    if (doubtFlow.result && Array.isArray(doubtFlow.result.quiz) && doubtFlow.result.quiz.length) {
      setQuizData({
        subject: doubtFlow.result.subject,
        topic: doubtFlow.result.topic,
        difficulty: doubtFlow.result.difficulty,
        questions: doubtFlow.result.quiz,
        quizId: doubtFlow.result.quizId,
      });
    }
    navigate("quiz");
  };

  const addDoubtTopicToPlanner = async () => {
    if (!doubtFlow.result) return;
    const taskName = `Revise: ${doubtFlow.result.topic || doubtFlow.result.subject}`;
    try {
      await fetch(`${API_BASE}/api/planner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser?.id || 1,
          task: taskName,
          subject: doubtFlow.result.subject,
          topic: doubtFlow.result.topic,
          priority: "High",
        }),
      });
      showToast(`Added "${taskName}" to your study plan ✓`);
      navigate("planner");
    } catch (e) {
      showToast("Could not save task to database.");
    }
  };

  if (!currentUser) {
    return (
      <div style={{ fontFamily: FONT }}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  const pages = {
    dashboard: <Dashboard onAsk={submitDoubt} onNavigate={navigate} onMenu={openMenu} onToast={showToast} currentUser={currentUser} />,
    ask: <AskDoubtPage onSubmit={submitDoubt} onMenu={openMenu} onToast={showToast} />,
    mydoubts: <MyDoubtsPage onMenu={openMenu} onAskDoubt={submitDoubt} currentUser={currentUser} />,
    resources: <ResourcesPage onMenu={openMenu} currentUser={currentUser} onToast={showToast} />,
    similar: <SimilarQuestionsPage onMenu={openMenu} onAskDoubt={submitDoubt} latest={latestAnalysis} currentUser={currentUser} />,
    quiz: (
      <QuizPage
        onMenu={openMenu}
        quizData={quizData}
        currentUser={currentUser}
        onToast={showToast}
        onBackToDoubt={() => {
          if (latestAnalysis) {
            setDoubtFlow({ phase: "result", doubt: latestAnalysis.doubt, result: latestAnalysis, error: null });
          } else {
            navigate("ask");
          }
        }}
        onExploreResources={() => navigate("resources")}
      />
    ),
    planner: <PlannerPage onMenu={openMenu} onToast={showToast} currentUser={currentUser} />,
    progress: <ProgressPage onMenu={openMenu} currentUser={currentUser} />,
    admin: currentUser?.role === "admin" ? (
      <AdminDashboardPage onMenu={openMenu} onToast={showToast} currentUser={currentUser} initialTab="activities" />
    ) : (
      <Dashboard onAsk={submitDoubt} onNavigate={navigate} onMenu={openMenu} onToast={showToast} currentUser={currentUser} />
    ),
    admin_feedback: currentUser?.role === "admin" ? (
      <AdminDashboardPage onMenu={openMenu} onToast={showToast} currentUser={currentUser} initialTab="feedback" />
    ) : (
      <Dashboard onAsk={submitDoubt} onNavigate={navigate} onMenu={openMenu} onToast={showToast} currentUser={currentUser} />
    ),
    feedback: <FeedbackPage onToast={showToast} onMenu={openMenu} currentUser={currentUser} />,
    abstract: <AbstractPage onMenu={openMenu} onNavigate={navigate} currentUser={currentUser} />,
    settings: <SettingsPage onMenu={openMenu} onToast={showToast} currentUser={currentUser} onUpdateUser={setCurrentUser} />,
  };

  let mainContent;
  if (doubtFlow.phase === "analyzing") {
    mainContent = (
      <div>
        <TopBar title="Ask Doubt" subtitle="" onMenu={openMenu} currentUser={currentUser} />
        <AnalyzingScreen doubt={doubtFlow.doubt} />
      </div>
    );
  } else if (doubtFlow.phase === "result") {
    mainContent = (
      <div>
        <TopBar title="AI Doubt Analysis & Diagnosis" subtitle="Multi-disciplinary academic classification and resources." onMenu={openMenu} currentUser={currentUser} />
        <AnalysisResult
          doubt={doubtFlow.doubt}
          result={doubtFlow.result}
          onExploreResources={() => navigate("resources")}
          onViewQuiz={openQuizForDoubt}
          onAddToPlanner={addDoubtTopicToPlanner}
          onAskAnother={resetDoubtFlow}
          onAskDoubt={submitDoubt}
          onNavigate={navigate}
          currentUser={currentUser}
          onToast={showToast}
        />
      </div>
    );
  } else if (doubtFlow.phase === "error") {
    mainContent = (
      <div>
        <TopBar title="Ask Doubt" subtitle="" onMenu={openMenu} currentUser={currentUser} />
        <AnalysisError
          doubt={doubtFlow.doubt}
          message={doubtFlow.error}
          onRetry={() => submitDoubt(doubtFlow.doubt)}
          onBack={resetDoubtFlow}
        />
      </div>
    );
  } else {
    mainContent = pages[view] || (currentUser?.role === "admin" ? pages.admin : pages.dashboard);
  }

  const mobileNavItems = (currentUser?.role === "admin")
    ? ADMIN_NAV_ITEMS
    : STUDENT_NAV_ITEMS.slice(0, 5);


  return (
    <div className="min-h-screen flex" style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
      <Sidebar
        current={view}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-1 min-w-0 px-5 sm:px-8 py-6 pb-24 lg:pb-6">
        {mainContent}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white border-t flex items-center justify-around py-2" style={{ borderColor: "#E2E8F0" }}>
        {mobileNavItems.map(({ key, icon: Icon, label }) => (
          <TipButton key={key} label={label} onClick={() => navigate(key)} className="flex flex-col items-center gap-0.5 px-2 py-1">
            <Icon size={20} color={view === key && doubtFlow.phase === "idle" ? C.primary : C.subtext} />
          </TipButton>
        ))}
      </nav>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
