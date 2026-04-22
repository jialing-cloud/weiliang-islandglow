import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from "framer-motion";

/* ─────────────────────────────────────────────
   資料與設定
───────────────────────────────────────────── */

// 您的 Google Apps Script 網址
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyjya026IRhTggepADLed0J6JBjFpK9YIitzQUWFuxsDNdvEskAN3x2MVuoNLZ6eGpK/exec";

const LIFE_STAGES = [
  { zh: "出生", en: "Birth" },
  { zh: "求學", en: "Schooling" },
  { zh: "職場", en: "Career" },
  { zh: "結婚", en: "Marriage" },
  { zh: "中年", en: "Midlife" },
  { zh: "老年", en: "Aging" },
  { zh: "死亡", en: "Death" },
];

const AWARENESS_ITEMS = [
  { id: 0, text: "我常常感到精疲力竭，就算睡了一整夜也沒辦法真正恢復。", cat: "exhaustion" },
  { id: 1, text: "我覺得自己的能量，正在被工作或生活一點一點地榨乾。", cat: "exhaustion" },
  { id: 2, text: "我強迫自己維持表面的正常，但內心已經快撐不下去了。", cat: "mask" },
  { id: 3, text: "我開始對以前在乎的事情、或在乎的人，感到麻木或冷漠。", cat: "cynicism" },
  { id: 4, text: "我懷疑自己每天做的事，是否真的有任何意義。", cat: "cynicism" },
  { id: 5, text: "完成一件事之後，我很難感受到真正的成就感或喜悅。", cat: "efficacy" },
  { id: 6, text: "我知道自己需要休息，但就是沒辦法讓自己真正放鬆下來。", cat: "exhaustion" },
  { id: 7, text: "我害怕讓別人看到我脆弱，或看到「不夠好」的那一面。", cat: "mask" },
  { id: 8, text: "我越來越難感受到純粹的快樂，對很多事提不起勁。", cat: "efficacy" },
  { id: 9, text: "深夜裡，我有時候會問自己：「這真的是我想要的人生嗎？」", cat: "meaning" },
];

const LIKERT = ["完全沒有", "偶爾如此", "有時如此", "經常如此", "幾乎每天"];

const MODULES = [
  {
    step: "STEP 1",
    title: "標籤顯形",
    subtitle: "你不是別人給你的那個定義。",
    body: "從小到大，你的身上被貼滿了標籤：「懂事的孩子」、「能幹的員工」、「不夠好的人」……今天，讓我們把它們一張一張撕下來。每一張撕去，你就離真正的自己近一點。沒有標籤的你，才是完整的你。",
    glyph: "✦",
    accent: "rgba(253,230,138,0.9)",
    glow: "rgba(253,230,138,0.18)",
  },
  {
    step: "STEP 2",
    title: "傷口允許",
    subtitle: "心裡的傷，也值得被好好照顧。",
    body: "你願意在手破皮時貼上OK繃，但你上一次認真照顧心裡的傷，是什麼時候？不是要你示弱，而是要你知道：能開口說「我受傷了、我現在很累」，需要的是比逞強更大的勇氣。你的心，也值得溫柔對待。",
    glyph: "✧",
    accent: "rgba(167,210,255,0.9)",
    glow: "rgba(167,210,255,0.12)",
  },
  {
    step: "STEP 3",
    title: "嶼光定向",
    subtitle: "生命有限，你的時間只留給值得的。",
    body: "你的時間與精力，是你這一生最珍貴的資產。那些消耗你、傷害你、讓你感到空洞的人事物——在你剩下的日子裡，它們真的值得繼續佔據那個位置嗎？朝讓你真正發光的方向走，其餘的，輕輕放手。",
    glyph: "✷",
    accent: "rgba(253,230,138,0.9)",
    glow: "rgba(253,230,138,0.18)",
  },
  {
    step: "STEP 4",
    title: "價值識別",
    subtitle: "你的價值，不需要他人的蓋章才算數。",
    body: "當你開始從自己的眼睛裡看見自己的價值，別人的評價就再也無法輕易動搖你。這不是驕傲，也不是冷漠——而是一種穩定。像一棵根扎得夠深的樹，風可以吹，但你不會被吹走。",
    glyph: "✺",
    accent: "rgba(196,181,253,0.9)",
    glow: "rgba(196,181,253,0.12)",
  },
  {
    step: "STEP 5",
    title: "看穿本質",
    subtitle: "看清了賽局，依然選擇溫柔地活著。",
    body: "這場人生的競賽，規則從來不是為了讓你幸福而設計的。當你看清楚了這件事，你不需要憤怒，也不需要逃跑。你只需要一個決定：在這個世界上，我要如何溫柔地對待自己，也溫柔地對待身邊的人？",
    glyph: "❖",
    accent: "rgba(253,230,138,0.9)",
    glow: "rgba(253,230,138,0.18)",
  },
];

const NAV_ITEMS = [
  { label: "首頁", en: "HOME", href: "#hero" },
  { label: "旅程", en: "JOURNEY", href: "#relay" },
  { label: "自我覺察", en: "AWARENESS", href: "#awareness" },
  { label: "五大模組", en: "MODULES", href: "#modules" },
  { label: "前測問卷", en: "SURVEY", href: "#survey" },
  { label: "聯絡我們", en: "CONTACT", href: "#contact" },
];

const SURVEY_FIELDS = [
  { id: "name", label: "您的稱呼（暱稱即可）", type: "text", placeholder: "例：小明" },
  { id: "email", label: "Email（活動通知用）", type: "email", placeholder: "your@email.com" },
  {
    id: "role", label: "目前職涯狀態", type: "select",
    options: ["全職工作者", "自由工作者 / 接案", "學生", "轉職 / 待業中", "其他"],
  },
  {
    id: "stress", label: "最近讓你最感到疲憊的是？", type: "select",
    options: ["工作壓力", "人際關係", "自我要求過高", "對未來感到迷茫", "情緒管理困難", "其他"],
  },
  {
    id: "time", label: "你願意為心靈成長花多少時間？", type: "select",
    options: ["每週 1 小時以內", "每週 1–3 小時", "每週 3 小時以上", "看情況"],
  },
  {
    id: "source", label: "如何得知這個活動？", type: "select",
    options: ["朋友介紹", "社群媒體", "網路搜尋", "其他"],
  },
  { id: "expect", label: "你最期待從活動中獲得什麼？（自由填寫）", type: "textarea", placeholder: "例：學會放鬆、找回自己……" },
];

/* ─────────────────────────────────────────────
   共用樣式與組件
───────────────────────────────────────────── */

const serif = { fontFamily: "'Noto Serif TC', serif" };
const display = { fontFamily: "'Cormorant Garamond', 'Noto Serif TC', serif" };

const glassBase = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const glassDeep = {
  background: "linear-gradient(145deg, rgba(30,41,59,0.55) 0%, rgba(15,23,42,0.72) 100%)",
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
  border: "1px solid rgba(148,163,184,0.14)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
};

function Particles({ count = 60 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.2 + 0.5,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 14,
        drift: (Math.random() - 0.5) * 38,
        opacity: 0.3 + Math.random() * 0.5,
        color: Math.random() > 0.85 ? "#BAE6FD" : "#FDE68A",
      })),
    [count]
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, boxShadow: `0 0 8px 1px ${p.color}99` }}
          animate={{ y: [0, -60, 0], x: [0, p.drift, 0], opacity: [0, p.opacity, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 1 }}
      className="fixed top-0 left-0 right-0"
      style={{ zIndex: 100, padding: "0 20px" }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: 960,
          marginTop: 14,
          borderRadius: 999,
          transition: "all 0.5s ease",
          ...(scrolled
            ? { background: "rgba(2,6,23,0.82)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(253,230,138,0.13)", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }
            : { background: "transparent", border: "1px solid transparent" }),
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: "11px 28px" }}>
          <a href="#hero" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" fill="#FDE68A"><animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" /></circle>
              <circle cx="9" cy="9" r="7" stroke="rgba(253,230,138,0.3)" strokeWidth="0.8" fill="none" />
            </svg>
            <span style={{ ...serif, color: "#FDE68A", fontSize: 13, letterSpacing: "0.25em", fontWeight: 300 }}>微亮嶼光</span>
          </a>
          <div className="hidden md:flex items-center" style={{ gap: 4 }}>
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} style={{ padding: "6px 14px", borderRadius: 999, textDecoration: "none", color: "rgba(148,163,184,0.85)", fontSize: 11, letterSpacing: "0.12em", transition: "color 0.3s, background 0.3s" }}>
                <span style={{ ...serif }}>{item.label}</span>
              </a>
            ))}
          </div>
          <button className="md:hidden" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} onClick={() => setMenuOpen((v) => !v)}>
             <div style={{ width: 20, height: 1, background: "rgba(253,230,138,0.7)", marginBottom: 5 }} />
             <div style={{ width: 20, height: 1, background: "rgba(253,230,138,0.7)", marginBottom: 5 }} />
             <div style={{ width: 20, height: 1, background: "rgba(253,230,138,0.7)" }} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function GlowDivider() {
  return (
    <div className="relative flex items-center justify-center" style={{ margin: "0 auto", maxWidth: 800, padding: "0 24px" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(253,230,138,0.2))" }} />
      <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}
        style={{ width: 5, height: 5, borderRadius: "50%", background: "#FDE68A", margin: "0 16px", boxShadow: "0 0 12px 3px rgba(253,230,138,0.5)" }} />
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(253,230,138,0.2))" }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hero 場景
───────────────────────────────────────────── */

function OceanScene({ y }) {
  return (
    <motion.div style={{ y }} className="relative flex items-center justify-center" aria-hidden>
      <motion.div className="absolute rounded-full" style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(253,230,138,0.12) 0%, transparent 65%)", filter: "blur(10px)" }}
        animate={{ scale: [1, 1.07, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
      <svg width="520" height="320" viewBox="0 0 520 320" style={{ position: "relative", zIndex: 10 }}>
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="1" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1628" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>
        <circle cx="260" cy="92" r="64" fill="url(#moonGlow)" opacity="0.5" />
        <circle cx="260" cy="92" r="32" fill="#FEFCE8" />
        <rect x="0" y="200" width="520" height="120" fill="url(#seaGrad)" />
        <path d="M0,203 Q65,198 130,203 Q195,208 260,203 Q325,198 390,203 Q455,208 520,203" fill="none" stroke="rgba(253,230,138,0.25)" strokeWidth="0.8" />
        <rect x="255" y="178" width="10" height="22" rx="2" fill="#020617" />
        <circle cx="260" cy="174" r="5.5" fill="#020617" />
        <circle cx="260" cy="168" r="2" fill="#FDE68A"><animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" /></circle>
      </svg>
    </motion.div>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section id="hero" ref={ref} className="relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "100vh" }}>
      <motion.div style={{ opacity }} className="flex flex-col items-center">
        <OceanScene y={sceneY} />
        <motion.div style={{ y: textY }} className="mt-20 text-center px-6">
          <p style={{ ...display, color: "rgba(253,230,138,0.7)", letterSpacing: "0.5em", fontSize: 11, marginBottom: 28 }}>WEI·LIANG·ISLAND·GLOW</p>
          <h1 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.6rem, 6vw, 4.8rem)", lineHeight: 1.2, letterSpacing: "0.05em" }}>
            微亮 <span style={{ color: "#FDE68A" }}>嶼光</span>
          </h1>
          <p className="text-slate-300" style={{ ...serif, marginTop: 28, fontSize: "clamp(1rem, 1.5vw, 1.15rem)", letterSpacing: "0.1em" }}>為疲憊的靈魂，留一盞溫柔的光。</p>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   各 Section 組件 (Relay, Awareness, Modules, Survey, Closing, Contact)
───────────────────────────────────────────── */

function RelaySection() {
  return (
    <section id="relay" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto text-center" style={{ maxWidth: 1100, marginTop: 96 }}>
        <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}>一路走來，辛苦了</h2>
        <p className="text-slate-400 mx-auto" style={{ marginTop: 28, maxWidth: 600, lineHeight: 2.1 }}>
          從最初的起點，到你此刻正站著的位置——這條路並不容易。<br />光是走到這裡，就已經很了不起了。
        </p>
      </div>
    </section>
  );
}

function AwarenessSection() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = async () => {
    if (answeredCount < AWARENESS_ITEMS.length) return;
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      setSubmitted(true);
    } catch (e) {
      alert("傳送失敗，請稍後再試。");
    }
    setLoading(false);
  };

  return (
    <section id="awareness" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 800, marginTop: 96 }}>
        <h2 className="text-center font-light text-slate-100" style={{ ...serif, fontSize: "2rem", marginBottom: 40 }}>自我覺察測驗</h2>
        {!submitted ? (
          <div style={{ ...glassDeep, padding: 40, borderRadius: 24 }}>
            {AWARENESS_ITEMS.map((item, i) => (
              <div key={item.id} style={{ marginBottom: 30 }}>
                <p style={{ color: "#E2E8F0", marginBottom: 12 }}>{i + 1}. {item.text}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LIKERT.map((label, score) => (
                    <button key={score} onClick={() => setAnswers({ ...answers, [item.id]: score })}
                      style={{
                        padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                        background: answers[item.id] === score ? "#FDE68A" : "rgba(255,255,255,0.05)",
                        color: answers[item.id] === score ? "#020617" : "#94A3B8",
                        border: "1px solid rgba(253,230,138,0.2)"
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={handleSubmit} disabled={answeredCount < AWARENESS_ITEMS.length || loading}
              style={{ width: "100%", padding: 14, borderRadius: 12, background: "#FDE68A", color: "#020617", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
              {loading ? "傳送中..." : `提交測驗 (${answeredCount}/10)`}
            </button>
          </div>
        ) : (
          <div className="text-center" style={{ ...glassBase, padding: 60, borderRadius: 24 }}>
            <h3 style={{ color: "#FDE68A", fontSize: "1.5rem" }}>謝謝妳的誠實面對</h3>
            <p style={{ color: "#94A3B8", marginTop: 20 }}>數據已記錄，我們將在活動中與妳分享分析結果。</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ModulesSection() {
  const [expanded, setExpanded] = useState(null);
  return (
    <section id="modules" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1100, marginTop: 96 }}>
        <h2 className="text-center font-light text-slate-100" style={{ ...serif, fontSize: "2.5rem", marginBottom: 60 }}>重光五練</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {MODULES.map((m, i) => (
            <div key={i} onClick={() => setExpanded(expanded === i ? null : i)} style={{ ...glassDeep, padding: 30, borderRadius: 20, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <h3 style={{ color: m.accent, fontSize: "1.2rem" }}>{m.step}: {m.title}</h3>
                 <span>{expanded === i ? "−" : "+"}</span>
              </div>
              <AnimatePresence>
                {expanded === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                    <p style={{ marginTop: 20, color: "#CBD5E1", lineHeight: 1.8 }}>{m.body}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SurveySection() {
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return alert("請填寫姓名與 Email");
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch (e) {
      alert("傳送失敗");
    }
    setLoading(false);
  };

  return (
    <section id="survey" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 600, marginTop: 96 }}>
        <h2 className="text-center font-light text-slate-100" style={{ ...serif, fontSize: "2rem", marginBottom: 40 }}>前測問卷</h2>
        {!submitted ? (
          <div style={{ ...glassDeep, padding: 40, borderRadius: 24 }}>
            {SURVEY_FIELDS.map((f) => (
              <div key={f.id} style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "#94A3B8", marginBottom: 8, fontSize: 14 }}>{f.label}</label>
                {f.type === "select" ? (
                  <select onChange={(e) => setForm({...form, [f.id]: e.target.value})} style={{ width: "100%", padding: 12, borderRadius: 8, background: "#1E293B", color: "white", border: "1px solid #334155" }}>
                    <option value="">請選擇</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea onChange={(e) => setForm({...form, [f.id]: e.target.value})} style={{ width: "100%", padding: 12, borderRadius: 8, background: "#1E293B", color: "white", border: "1px solid #334155" }} rows={4} />
                ) : (
                  <input type={f.type} onChange={(e) => setForm({...form, [f.id]: e.target.value})} style={{ width: "100%", padding: 12, borderRadius: 8, background: "#1E293B", color: "white", border: "1px solid #334155" }} />
                )}
              </div>
            ))}
            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: 14, borderRadius: 12, background: "#FDE68A", color: "#020617", fontWeight: "bold", cursor: "pointer" }}>
              {loading ? "傳送中..." : "送出報名"}
            </button>
          </div>
        ) : (
          <div className="text-center" style={{ ...glassBase, padding: 60, borderRadius: 24 }}>
            <h3 style={{ color: "#FDE68A" }}>報名成功！</h3>
            <p style={{ color: "#94A3B8", marginTop: 20 }}>我們已收到您的資訊，請留意信箱通知。</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="relative px-6 text-center" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 600, marginTop: 96 }}>
        <p style={{ ...serif, color: "#E2E8F0", fontSize: "1.5rem", lineHeight: 2 }}>夜再深、海再寬，<br />總有一盞，為你留著的光。</p>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <footer id="contact" className="px-6 pb-20 text-center">
      <p style={{ color: "#475569", fontSize: 12, letterSpacing: "0.2em" }}>© WEI · LIANG · ISLAND · GLOW · 2026</p>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   主應用程式
───────────────────────────────────────────── */

export default function App() {
  return (
    <div className="relative min-h-screen w-full text-slate-100" style={{ background: "#020617", fontFamily: "'Noto Sans TC', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&family=Noto+Sans+TC:wght@300;400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #020617; }
      `}</style>
      <Particles />
      <Navbar />
      <main>
        <Hero />
        <RelaySection />
        <AwarenessSection />
        <ModulesSection />
        <SurveySection />
        <Closing />
        <ContactSection />
      </main>
    </div>
  );
}
