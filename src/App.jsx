import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from "framer-motion";

/* ─────────────────────────────────────────────
   資料
───────────────────────────────────────────── */

const LIFE_STAGES = [
  { zh: "出生", en: "Birth" },
  { zh: "求學", en: "Schooling" },
  { zh: "職場", en: "Career" },
  { zh: "結婚", en: "Marriage" },
  { zh: "中年", en: "Midlife" },
  { zh: "老年", en: "Aging" },
  { zh: "死亡", en: "Death" },
];

// 改編自 Maslach 職業倦怠量表（MBI）及相關心理健康研究
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
   共用樣式
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

/* ─────────────────────────────────────────────
   粒子微光
───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   浮動導覽列
───────────────────────────────────────────── */

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

          {/* Desktop */}
          <div className="hidden md:flex items-center" style={{ gap: 4 }}>
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ padding: "6px 14px", borderRadius: 999, textDecoration: "none", color: "rgba(148,163,184,0.85)", fontSize: 11, letterSpacing: "0.12em", transition: "color 0.3s, background 0.3s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#FDE68A"; e.currentTarget.style.background = "rgba(253,230,138,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(148,163,184,0.85)"; e.currentTarget.style.background = "transparent"; }}>
                <span style={{ ...serif }}>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }} onClick={() => setMenuOpen((v) => !v)}>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} animate={menuOpen ? i === 0 ? { rotate: 45, y: 7 } : i === 1 ? { opacity: 0 } : { rotate: -45, y: -7 } : { rotate: 0, y: 0, opacity: 1 }}
                style={{ display: "block", width: 20, height: 1, background: "rgba(253,230,138,0.7)", transformOrigin: "center" }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            className="mx-auto" style={{ maxWidth: 960, marginTop: 8, borderRadius: 16, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(24px)", border: "1px solid rgba(253,230,138,0.13)", padding: "12px 28px" }}>
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", color: "rgba(203,213,225,0.85)" }}>
                <span style={{ ...serif, fontSize: 15 }}>{item.label}</span>
                <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(253,230,138,0.5)" }}>{item.en}</span>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─────────────────────────────────────────────
   光帶分隔線
───────────────────────────────────────────── */

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
   新版 Hero 場景 — 海岸夜色
───────────────────────────────────────────── */

function OceanScene({ y }) {
  return (
    <motion.div style={{ y }} className="relative flex items-center justify-center" aria-hidden>
      {/* Outer ambient glow */}
      <motion.div className="absolute rounded-full" style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(253,230,138,0.12) 0%, transparent 65%)", filter: "blur(10px)" }}
        animate={{ scale: [1, 1.07, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />

      <svg width="520" height="320" viewBox="0 0 520 320" style={{ position: "relative", zIndex: 10 }}>
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="1" />
            <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1628" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="reflectionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </linearGradient>
          <mask id="waterMask">
            <rect x="0" y="200" width="520" height="120" fill="white" />
          </mask>
        </defs>

        {/* Sky stars */}
        {[
          [60, 30, 1.2], [120, 55, 0.8], [200, 20, 1.0], [280, 45, 0.7], [360, 25, 1.1],
          [430, 50, 0.9], [490, 35, 0.8], [40, 80, 0.7], [170, 70, 1.0], [330, 65, 0.8],
          [470, 75, 0.6], [100, 110, 0.7], [450, 105, 0.8], [230, 90, 0.6], [380, 95, 0.9],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#FDE68A" opacity={0.5 + Math.random() * 0.4}>
            <animate attributeName="opacity" values={`${0.3 + (i % 4) * 0.15};${0.8 + (i % 3) * 0.1};${0.3 + (i % 4) * 0.15}`} dur={`${2.5 + (i % 5) * 0.8}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Moon halo */}
        <circle cx="260" cy="92" r="64" fill="url(#moonGlow)" opacity="0.5" />
        {/* Moon body */}
        <circle cx="260" cy="92" r="32" fill="#FEFCE8">
          <animate attributeName="opacity" values="0.88;1;0.88" dur="4s" repeatCount="indefinite" />
        </circle>
        {/* Moon subtle texture */}
        <circle cx="252" cy="86" r="7" fill="rgba(200,190,160,0.15)" />
        <circle cx="268" cy="99" r="5" fill="rgba(200,190,160,0.10)" />

        {/* Horizon / sea */}
        <rect x="0" y="200" width="520" height="120" fill="url(#seaGrad)" />

        {/* Sea waves */}
        <path d="M0,203 Q65,198 130,203 Q195,208 260,203 Q325,198 390,203 Q455,208 520,203" fill="none" stroke="rgba(253,230,138,0.25)" strokeWidth="0.8" />
        <path d="M0,210 Q80,205 160,210 Q240,215 320,210 Q400,205 480,210 L520,210 L520,200 L0,200 Z" fill="rgba(253,230,138,0.03)" />

        {/* Moon reflection pillar on water */}
        <rect x="248" y="200" width="24" height="120" fill="url(#reflectionGrad)" opacity="0.6" />
        {/* Reflection shimmer lines */}
        {[215, 225, 235, 240, 248, 265, 275, 282, 293].map((x, i) => (
          <line key={i} x1={x} y1={205 + i * 8} x2={x + 8} y2={205 + i * 8} stroke="rgba(253,230,138,0.2)" strokeWidth="0.6">
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
          </line>
        ))}

        {/* Shore silhouette */}
        <path d="M0,200 Q40,196 80,198 Q130,202 180,199 Q220,196 260,198 Q300,200 340,197 Q400,193 440,196 Q480,199 520,197 L520,200 L0,200 Z"
          fill="#020617" opacity="0.9" />

        {/* Person silhouette at shore */}
        {/* Body */}
        <rect x="255" y="178" width="10" height="22" rx="2" fill="#020617" />
        {/* Head */}
        <circle cx="260" cy="174" r="5.5" fill="#020617" />
        {/* Arms slightly open */}
        <path d="M255,185 L247,193 M265,185 L273,193" stroke="#020617" strokeWidth="2.5" strokeLinecap="round" />
        {/* Tiny light at tip of head / lantern */}
        <circle cx="260" cy="168" r="2" fill="#FDE68A">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values="1.5;2.5;1.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="260" cy="168" r="6" fill="#FDE68A" opacity="0.2">
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Bottom ground fog */}
        <ellipse cx="260" cy="320" rx="260" ry="40" fill="rgba(253,230,138,0.06)" />
      </svg>

      {/* Underneath shadow glow */}
      <div className="absolute" style={{ bottom: -60, width: 380, height: 60, background: "radial-gradient(ellipse at center, rgba(253,230,138,0.14) 0%, transparent 70%)", filter: "blur(12px)" }} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section id="hero" ref={ref} className="relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "100vh" }}>
      <div className="absolute left-0 right-0" style={{ top: "50%", height: 1, background: "linear-gradient(to right, transparent 0%, rgba(253,230,138,0.15) 50%, transparent 100%)" }} />

      <motion.div style={{ opacity }} className="flex flex-col items-center">
        <OceanScene y={sceneY} />

        <motion.div style={{ y: textY }} className="mt-20 text-center px-6">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1.2 }}
            style={{ ...display, color: "rgba(253,230,138,0.7)", letterSpacing: "0.5em", fontSize: 11, marginBottom: 28 }}>
            WEI&nbsp;·&nbsp;LIANG&nbsp;·&nbsp;ISLAND&nbsp;·&nbsp;GLOW
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1.4, ease: "easeOut" }}
            className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.6rem, 6vw, 4.8rem)", lineHeight: 1.2, letterSpacing: "0.05em", maxWidth: 720 }}>
            微亮
            <span style={{ position: "relative", display: "inline-block", marginLeft: "0.15em", color: "#FDE68A" }}>
              嶼光
              <span style={{ position: "absolute", bottom: -4, left: 0, right: 0, height: 1, background: "rgba(253,230,138,0.5)" }} />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 1.4 }}
            className="text-slate-300" style={{ ...serif, marginTop: 28, fontSize: "clamp(1rem, 1.5vw, 1.15rem)", letterSpacing: "0.1em" }}>
            為疲憊的靈魂,留一盞溫柔的光。
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 1.6 }}
            style={{ marginTop: 60, display: "inline-block", padding: "28px 44px", borderRadius: 20, ...glassBase, maxWidth: 460 }}>
            <p style={{ ...display, color: "rgba(253,230,138,0.92)", fontSize: "clamp(1rem, 1.7vw, 1.28rem)", fontStyle: "italic", lineHeight: 1.8 }}>
              「真正重要的事物,用肉眼是看不見的。」
            </p>
            <p style={{ marginTop: 12, color: "rgba(148,163,184,0.6)", fontSize: 11, letterSpacing: "0.3em" }}>—《小王子》</p>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}
        className="absolute flex flex-col items-center" style={{ bottom: 36, left: "50%", transform: "translateX(-50%)", gap: 10 }}>
        <span style={{ color: "rgba(253,230,138,0.5)", fontSize: 9, letterSpacing: "0.5em" }}>SCROLL</span>
        <motion.div animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ width: 1, height: 44, background: "linear-gradient(to bottom, rgba(253,230,138,0.7), transparent)", transformOrigin: "top" }} />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   接力賽 Section（Chapter 01）
───────────────────────────────────────────── */

function AnimatedTimeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative" style={{ marginBottom: 80, overflowX: "auto", padding: "40px 36px", borderRadius: 24, ...glassDeep }}>
      <div className="relative flex items-center justify-between" style={{ minWidth: 680 }}>
        {/* Animated line */}
        <div className="absolute" style={{ left: 0, right: 0, top: "50%", height: 1, background: "rgba(255,255,255,0.06)" }} />
        <motion.div className="absolute" style={{ left: 0, top: "50%", height: 1, background: "linear-gradient(to right, transparent 0%, rgba(253,230,138,0.7) 20%, #FDE68A 50%, rgba(253,230,138,0.7) 80%, transparent 100%)", boxShadow: "0 0 8px rgba(253,230,138,0.5)" }}
          initial={{ width: "0%" }} animate={inView ? { width: "100%" } : { width: "0%" }} transition={{ duration: 2.2, ease: "easeInOut" }} />

        {LIFE_STAGES.map((stage, i) => (
          <motion.div key={stage.zh} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.22, duration: 0.7 }}
            className="relative flex flex-col items-center" style={{ zIndex: 10, flex: 1 }}>
            <motion.div className="rounded-full" style={{ width: 12, height: 12, background: "#FDE68A", boxShadow: "0 0 10px rgba(253,230,138,0.7)" }}
              animate={inView ? { boxShadow: ["0 0 0 0 rgba(253,230,138,0.6)", "0 0 0 10px rgba(253,230,138,0)"] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
            <span className="text-slate-200" style={{ ...serif, marginTop: 14, fontSize: 14, letterSpacing: "0.1em" }}>{stage.zh}</span>
            <span className="text-slate-500" style={{ marginTop: 4, fontSize: 9, letterSpacing: "0.25em" }}>{stage.en.toUpperCase()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RelaySection() {
  return (
    <section id="relay" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1100, marginTop: 96 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 88 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 20 }}>CHAPTER · 01</p>
          <div style={{ width: 40, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 28px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}>
            一路走來,辛苦了
          </h2>
          <p style={{ ...display, color: "rgba(253,230,138,0.75)", fontSize: "clamp(1rem, 1.5vw, 1.2rem)", fontStyle: "italic", marginTop: 14, letterSpacing: "0.04em" }}>
            You've come a long way
          </p>
          <p className="text-slate-400 mx-auto" style={{ marginTop: 28, maxWidth: 600, lineHeight: 2.1, fontSize: 15 }}>
            從最初的起點,到你此刻正站著的位置——<br />
            這條路並不容易,讓我們一起,輕輕回看那些你沉默走過的歲月。
          </p>
        </motion.div>

        <AnimatedTimeline />

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1.2 }}
          className="text-center mx-auto" style={{ maxWidth: 640 }}>
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3.5, repeat: Infinity }}
            className="rounded-full mx-auto" style={{ width: 6, height: 6, background: "#FDE68A", marginBottom: 40, boxShadow: "0 0 16px 3px rgba(253,230,138,0.5)" }} />
          <p className="text-slate-200" style={{ ...serif, fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)", lineHeight: 2.4, fontWeight: 300 }}>
            每走過一個節點,你都沒有告訴任何人有多難。<br />
            你一個人扛著,繼續往前,走到了今天這裡。
          </p>
          <p className="mx-auto" style={{ ...serif, marginTop: 32, color: "rgba(148,163,184,0.75)", fontSize: 15, lineHeight: 2.1, maxWidth: 480 }}>
            你知道嗎——光是走到這裡,就已經很了不起了。<br />
            接下來,讓我們停下來,輕輕幫你,<br />
            好好疼惜那個從來沒有被好好疼惜過的你。
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   自我覺察（Chapter 02）— Maslach 改編量表
───────────────────────────────────────────── */

const CAT_META = {
  exhaustion: { label: "身心耗竭", color: "#F87171" },
  cynicism: { label: "意義感消退", color: "#FB923C" },
  efficacy: { label: "效能感低落", color: "#A78BFA" },
  mask: { label: "情緒壓抑", color: "#60A5FA" },
  meaning: { label: "存在叩問", color: "#34D399" },
};

function AwarenessSection() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const answered = Object.keys(answers).length;
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxScore = AWARENESS_ITEMS.length * 4;

  const catScores = useMemo(() => {
    const result = {};
    AWARENESS_ITEMS.forEach((item) => {
      if (!result[item.cat]) result[item.cat] = { sum: 0, count: 0 };
      result[item.cat].sum += answers[item.id] ?? 0;
      result[item.cat].count += 1;
    });
    return result;
  }, [answers]);

  const getInterpretation = () => {
    const pct = totalScore / maxScore;
    if (answered < AWARENESS_ITEMS.length) return null;
    if (pct < 0.3) return { level: "穩定", msg: "你目前的狀態相對平穩。即使如此，定期的內在照顧仍是必要的。", color: "#34D399" };
    if (pct < 0.55) return { level: "需要關注", msg: "你已感受到一定程度的消耗。是時候好好停下來，聽聽自己內心的聲音了。", color: "#FDE68A" };
    if (pct < 0.75) return { level: "明顯耗損", msg: "你已承受了不少。這份疲憊真實存在，它值得被認真對待。", color: "#FB923C" };
    return { level: "亟需照顧", msg: "你扛著很重的東西走了很長的路。讓這裡成為你第一個允許自己休息的地方。", color: "#F87171" };
  };

  const handleSubmit = () => {
    if (answered < AWARENESS_ITEMS.length) return;
    // Production: POST to your backend endpoint
    // fetch('/api/awareness-submit', { method: 'POST', body: JSON.stringify({ answers, totalScore, catScores }) })
    setSubmitted(true);
  };

  const interp = getInterpretation();

  return (
    <section id="awareness" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1100, marginTop: 96 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 72 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 20 }}>CHAPTER · 02</p>
          <div style={{ width: 40, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 28px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.25rem, 5vw, 3.75rem)", letterSpacing: "0.15em" }}>
            自我覺察
          </h2>
          <p style={{ ...display, color: "rgba(253,230,138,0.75)", fontStyle: "italic", fontSize: "clamp(0.95rem, 1.4vw, 1.15rem)", marginTop: 12, letterSpacing: "0.06em" }}>
            Self-Awareness
          </p>
          <p className="text-slate-400 mx-auto" style={{ marginTop: 24, maxWidth: 580, lineHeight: 1.95, fontSize: 15 }}>
            透過十個句子,與此刻的自己相遇。<br />
            無須評分、無須交卷——這是一次靜靜的內在檢視。
          </p>
          <p style={{ marginTop: 16, color: "rgba(148,163,184,0.45)", fontSize: 11, letterSpacing: "0.2em" }}>
            改編自 Maslach 職業倦怠量表（MBI）及相關心理健康研究
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="form" exit={{ opacity: 0, y: -20 }} className="grid md:grid-cols-2 items-start" style={{ gap: 56 }}>
              {/* Questions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {AWARENESS_ITEMS.map((item, i) => {
                  const val = answers[item.id];
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                      style={{ padding: "20px 22px", borderRadius: 14, ...glassDeep, borderColor: val != null ? "rgba(253,230,138,0.25)" : "rgba(148,163,184,0.12)", transition: "border-color 0.4s" }}>
                      <p style={{ ...serif, fontSize: 14, lineHeight: 1.85, color: val != null ? "rgba(253,230,138,0.95)" : "rgba(203,213,225,0.85)", marginBottom: 16, transition: "color 0.3s" }}>
                        <span style={{ color: "rgba(253,230,138,0.4)", fontSize: 11, marginRight: 10 }}>Q{i + 1}</span>
                        {item.text}
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {LIKERT.map((label, score) => (
                          <button key={score} onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: score }))}
                            style={{
                              padding: "5px 12px", borderRadius: 999, fontSize: 11, letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.25s",
                              background: val === score ? "rgba(253,230,138,0.18)" : "rgba(255,255,255,0.04)",
                              border: val === score ? "1px solid rgba(253,230,138,0.65)" : "1px solid rgba(148,163,184,0.18)",
                              color: val === score ? "#FDE68A" : "rgba(148,163,184,0.7)",
                              boxShadow: val === score ? "0 0 10px rgba(253,230,138,0.12)" : "none",
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={answered < AWARENESS_ITEMS.length}
                  style={{ marginTop: 8, padding: "14px 32px", borderRadius: 999, cursor: answered < AWARENESS_ITEMS.length ? "not-allowed" : "pointer", ...glassBase,
                    border: "1px solid rgba(253,230,138,0.35)", color: "#FDE68A", fontSize: 13, letterSpacing: "0.2em", opacity: answered < AWARENESS_ITEMS.length ? 0.45 : 1,
                    background: "rgba(253,230,138,0.07)", transition: "opacity 0.3s" }}>
                  提交並查看分析 ({answered}/{AWARENESS_ITEMS.length})
                </motion.button>
              </div>

              {/* Right panel — category radar */}
              <div style={{ position: "sticky", top: 96 }}>
                <div style={{ padding: "32px 28px", borderRadius: 20, ...glassDeep }}>
                  <p style={{ color: "rgba(253,230,138,0.65)", fontSize: 9, letterSpacing: "0.35em", marginBottom: 28 }}>REALTIME PROFILE</p>
                  {Object.entries(CAT_META).map(([cat, meta]) => {
                    const data = catScores[cat] || { sum: 0, count: 0 };
                    const pct = data.count > 0 ? (data.sum / (data.count * 4)) * 100 : 0;
                    return (
                      <div key={cat} style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ ...serif, color: "rgba(203,213,225,0.75)", fontSize: 13 }}>{meta.label}</span>
                          <span style={{ fontSize: 12, color: meta.color, opacity: 0.85 }}>{Math.round(pct)}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <motion.div style={{ height: "100%", borderRadius: 4, background: meta.color, boxShadow: `0 0 8px ${meta.color}66` }}
                            animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                        </div>
                      </div>
                    );
                  })}

                  {interp && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                      style={{ marginTop: 32, padding: "20px 20px", borderRadius: 12, background: `${interp.color}12`, border: `1px solid ${interp.color}40` }}>
                      <p style={{ color: interp.color, fontSize: 13, letterSpacing: "0.1em", marginBottom: 10 }}>• {interp.level}</p>
                      <p style={{ ...serif, color: "rgba(226,232,240,0.82)", fontSize: 13, lineHeight: 1.9 }}>{interp.msg}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
              className="text-center mx-auto" style={{ maxWidth: 560, padding: "56px 48px", borderRadius: 24, ...glassBase }}>
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ width: 10, height: 10, borderRadius: "50%", background: "#FDE68A", margin: "0 auto 32px", boxShadow: "0 0 20px rgba(253,230,138,0.6)" }} />
              <p style={{ ...serif, color: "#FDE68A", fontSize: "clamp(1.2rem, 2vw, 1.5rem)", lineHeight: 2 }}>謝謝你如此誠實地面對自己。</p>
              <p style={{ ...serif, color: "rgba(148,163,184,0.75)", fontSize: 14, lineHeight: 2, marginTop: 16 }}>你的回應已記錄。<br />接下來,讓我們一起走向那五個模組。</p>
              <a href="#modules" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 32, padding: "12px 28px", borderRadius: 999, textDecoration: "none",
                color: "#FDE68A", fontSize: 13, letterSpacing: "0.15em", background: "rgba(253,230,138,0.08)", border: "1px solid rgba(253,230,138,0.35)" }}>
                前往重光五練 ↓
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   重光五練（Chapter 03）
───────────────────────────────────────────── */

function ModulesSection() {
  const [expanded, setExpanded] = useState(null);

  return (
    <section id="modules" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1100, marginTop: 96 }}>
        {/* Chapter header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 80 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 20 }}>CHAPTER · 03</p>
          <div style={{ width: 40, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 28px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.25rem, 5vw, 3.75rem)", letterSpacing: "0.18em" }}>
            重光五練
          </h2>
          <p style={{ ...display, color: "rgba(253,230,138,0.75)", fontStyle: "italic", fontSize: "clamp(0.95rem, 1.4vw, 1.15rem)", marginTop: 12 }}>
            Five Steps Back to Yourself
          </p>
        </motion.div>

        {/* Emotional intro banner */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 1.4 }}
          style={{ marginBottom: 80, padding: "44px 52px", borderRadius: 24, ...glassBase, textAlign: "center", maxWidth: 720, margin: "0 auto 80px" }}>
          <p style={{ ...serif, color: "rgba(226,232,240,0.88)", fontSize: "clamp(1rem, 1.6vw, 1.25rem)", lineHeight: 2.5, fontWeight: 300 }}>
            你曾經以為,努力是唯一的答案。<br />
            但有一種回歸——<br />
            <span style={{ color: "#FDE68A" }}>比努力更深,比成功更真。</span>
          </p>
          <div style={{ width: 40, height: 1, background: "rgba(253,230,138,0.3)", margin: "28px auto 0" }} />
          <p style={{ ...serif, color: "rgba(148,163,184,0.65)", fontSize: 13, marginTop: 20, letterSpacing: "0.1em" }}>
            這五個步驟,不是教你跑得更快——<br />
            而是邀請你,慢慢回到自己。
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {MODULES.map((m, i) => {
            const isOpen = expanded === i;
            return (
              <motion.div key={m.step} initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} style={{ marginLeft: `${i * 16}px` }}>
                <motion.div layout onClick={() => setExpanded(isOpen ? null : i)} whileHover={{ y: -3 }}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    padding: "2.6rem 3rem", cursor: "pointer",
                    ...(isOpen
                      ? { background: "linear-gradient(135deg, rgba(30,41,59,0.72) 0%, rgba(15,23,42,0.88) 100%)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: `1px solid ${m.accent.replace("0.9)", "0.4)")}`, boxShadow: `0 24px 72px rgba(0,0,0,0.5), 0 0 48px ${m.glow}` }
                      : { ...glassDeep }),
                    transition: "box-shadow 0.4s, border-color 0.4s",
                  }}>
                  <motion.div className="absolute rounded-full pointer-events-none"
                    style={{ top: -80, right: -80, width: 260, height: 260, background: `radial-gradient(circle, ${m.glow} 0%, transparent 70%)` }}
                    animate={{ scale: [1, 1.2, 1], opacity: isOpen ? [0.8, 1, 0.8] : [0.3, 0.6, 0.3] }} transition={{ duration: 5, repeat: Infinity, delay: i * 0.5 }} />

                  <div className="relative flex flex-col md:flex-row md:items-center" style={{ gap: 28 }}>
                    <div className="flex items-center" style={{ flexShrink: 0, gap: 18 }}>
                      <motion.span animate={{ scale: isOpen ? 1.15 : 1 }} transition={{ duration: 0.4 }}
                        style={{ ...display, fontSize: 52, color: m.accent, lineHeight: 1 }}>{m.glyph}</motion.span>
                      <div>
                        <p style={{ color: "rgba(253,230,138,0.6)", fontSize: 9, letterSpacing: "0.45em" }}>{m.step}</p>
                        <h3 className="font-light text-slate-100" style={{ ...serif, fontSize: 26, marginTop: 3 }}>{m.title}</h3>
                      </div>
                    </div>

                    <div className="flex-1" style={{ borderLeft: `1px solid ${isOpen ? m.accent.replace("0.9)", "0.25)") : "rgba(255,255,255,0.07)"}`, paddingLeft: 28, transition: "border-color 0.4s" }}>
                      <p style={{ ...serif, color: m.accent, fontSize: 15, marginBottom: 8, fontWeight: 400 }}>{m.subtitle}</p>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45 }}
                            className="text-slate-300" style={{ ...serif, fontSize: 14, lineHeight: 2.1, overflow: "hidden" }}>{m.body}</motion.p>
                        )}
                      </AnimatePresence>
                      {!isOpen && <p style={{ color: "rgba(148,163,184,0.4)", fontSize: 10, letterSpacing: "0.2em" }}>點擊展開 · EXPAND</p>}
                    </div>

                    <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}
                      style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", border: `1px solid ${isOpen ? m.accent.replace("0.9)", "0.5)") : "rgba(148,163,184,0.22)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", color: isOpen ? m.accent : "rgba(148,163,184,0.45)", fontSize: 16,
                        background: isOpen ? m.glow : "transparent", transition: "all 0.3s" }}>+</motion.div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   前測問卷（Survey）
───────────────────────────────────────────── */

function SurveySection() {
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (id, value) => setForm((prev) => ({ ...prev, [id]: value }));

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.role || !form.stress) {
      setError("請填寫必填欄位（稱呼、Email、職涯狀態、疲憊原因）");
      return;
    }
    setError("");
    // Production: POST to your backend / Google Apps Script webhook
    // fetch('YOUR_BACKEND_ENDPOINT', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...form, timestamp: new Date().toISOString() }) })
    setSubmitted(true);
  };

  return (
    <section id="survey" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 760, marginTop: 96 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 72 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 20 }}>PRE-TEST · 4/27</p>
          <div style={{ width: 40, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 28px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            心靈前測問卷
          </h2>
          <p style={{ ...display, color: "rgba(253,230,138,0.7)", fontStyle: "italic", fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)", marginTop: 12 }}>Soul Pre-Test · Event 6/8</p>
          <p className="text-slate-400 mx-auto" style={{ marginTop: 24, maxWidth: 560, lineHeight: 1.95, fontSize: 14 }}>
            這份問卷幫助我們了解你目前的心理狀態，<br />
            讓 6/8 的活動更能貼近你真實的需求。<br />
            <span style={{ color: "rgba(253,230,138,0.6)" }}>填寫約需 3 分鐘，我們珍惜你的每一個字。</span>
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="survey-form" exit={{ opacity: 0 }} style={{ padding: "48px 52px", borderRadius: 24, ...glassDeep }}>
              {SURVEY_FIELDS.map((field, i) => (
                <motion.div key={field.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{ marginBottom: 28 }}>
                  <label style={{ ...serif, display: "block", color: "rgba(203,213,225,0.85)", fontSize: 14, marginBottom: 10, letterSpacing: "0.05em" }}>
                    {field.label}
                    {["name", "email", "role", "stress"].includes(field.id) && <span style={{ color: "#F87171", marginLeft: 4 }}>*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select value={form[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.2)",
                        color: form[field.id] ? "rgba(226,232,240,0.9)" : "rgba(148,163,184,0.5)", fontSize: 14, outline: "none", cursor: "pointer",
                        backdropFilter: "blur(12px)", transition: "border-color 0.3s" }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(253,230,138,0.45)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(148,163,184,0.2)"}>
                      <option value="">請選擇…</option>
                      {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea rows={4} value={form[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={field.placeholder}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.2)",
                        color: "rgba(226,232,240,0.9)", fontSize: 14, outline: "none", resize: "vertical", backdropFilter: "blur(12px)",
                        fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8, transition: "border-color 0.3s" }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(253,230,138,0.45)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(148,163,184,0.2)"} />
                  ) : (
                    <input type={field.type} value={form[field.id] || ""} onChange={(e) => handleChange(field.id, e.target.value)} placeholder={field.placeholder}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.2)",
                        color: "rgba(226,232,240,0.9)", fontSize: 14, outline: "none", backdropFilter: "blur(12px)", boxSizing: "border-box", transition: "border-color 0.3s" }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(253,230,138,0.45)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(148,163,184,0.2)"} />
                  )}
                </motion.div>
              ))}

              {error && <p style={{ color: "#F87171", fontSize: 13, marginBottom: 16, ...serif }}>{error}</p>}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginTop: 8 }}>
                <p style={{ color: "rgba(148,163,184,0.5)", fontSize: 12, ...serif }}>
                  6/8 活動：心靈鬆綁工作坊 · 2 小時 · 限額 30 人
                </p>
                <motion.button whileHover={{ y: -2, boxShadow: "0 0 32px rgba(253,230,138,0.25)" }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                  style={{ padding: "13px 36px", borderRadius: 999, background: "rgba(253,230,138,0.10)", border: "1px solid rgba(253,230,138,0.45)",
                    color: "#FDE68A", fontSize: 13, letterSpacing: "0.2em", cursor: "pointer", ...glassBase, transition: "box-shadow 0.3s" }}>
                  送出報名 →
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="survey-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
              style={{ padding: "60px 52px", borderRadius: 24, ...glassBase, textAlign: "center" }}>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ width: 10, height: 10, borderRadius: "50%", background: "#FDE68A", margin: "0 auto 32px", boxShadow: "0 0 20px rgba(253,230,138,0.6)" }} />
              <p style={{ ...serif, color: "#FDE68A", fontSize: "clamp(1.2rem, 2vw, 1.5rem)", lineHeight: 2 }}>你的報名已收到，謝謝！</p>
              <p style={{ ...serif, color: "rgba(148,163,184,0.75)", fontSize: 14, lineHeight: 2.1, marginTop: 16 }}>
                我們將在活動前寄送確認信至您的 Email。<br />
                6/8，我們在島上等你。🌊
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   結語 Closing
───────────────────────────────────────────── */

function Closing() {
  const [picked, setPicked] = useState(null);
  const [stars, setStars] = useState([]);

  const choices = [
    { key: "放下", en: "LET GO", desc: "把不再屬於你的,輕輕鬆開。" },
    { key: "留下", en: "KEEP", desc: "把支撐過你的,靜靜收好。" },
    { key: "前行", en: "WALK ON", desc: "帶著此刻的光,走向下一處海岸。" },
  ];

  const choose = (c) => {
    if (picked) return;
    setPicked(c);
    setStars(Array.from({ length: 16 }).map((_, i) => ({
      id: i, angle: -Math.PI / 2 + (Math.random() - 0.5) * 1.8,
      distance: 160 + Math.random() * 280, delay: Math.random() * 0.5, size: 2 + Math.random() * 2.5,
    })));
  };

  return (
    <section id="closing" className="relative px-6 text-center overflow-hidden" style={{ paddingTop: 144, paddingBottom: 144 }}>
      <GlowDivider />
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.4 }}
        className="mx-auto" style={{ maxWidth: 600, marginTop: 96, marginBottom: 96 }}>
        <motion.div animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity }}
          className="rounded-full mx-auto" style={{ width: 8, height: 8, background: "#FDE68A", marginBottom: 48, boxShadow: "0 0 22px 5px rgba(253,230,138,0.55)" }} />
        <div style={{ padding: "48px 52px", borderRadius: 24, ...glassBase }}>
          <p style={{ ...serif, color: "rgba(226,232,240,0.92)", fontSize: "clamp(1.2rem, 2vw, 1.5rem)", lineHeight: 2.4, fontWeight: 300 }}>
            夜再深、海再寬,<br />
            總有一盞,為你留著的光。
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 1.2 }} style={{ position: "relative" }}>
        <motion.p animate={picked ? { opacity: 0.2 } : { opacity: 1 }} transition={{ duration: 1.2 }}
          style={{ ...serif, color: "rgba(253,230,138,0.75)", fontSize: 12, letterSpacing: "0.45em", marginBottom: 48 }}>
          此刻,把哪一個字,交給夜空?
        </motion.p>

        <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {choices.map((c) => {
            const isPicked = picked?.key === c.key;
            const isDimmed = picked && picked.key !== c.key;
            return (
              <motion.button key={c.key} onClick={() => choose(c)} disabled={!!picked}
                whileHover={!picked ? { y: -8, scale: 1.03 } : {}} whileTap={!picked ? { scale: 0.97 } : {}}
                animate={{ opacity: isDimmed ? 0.15 : 1 }} transition={{ duration: 1 }}
                style={{
                  position: "relative", padding: "36px 44px", minWidth: 168, cursor: picked ? "default" : "pointer", borderRadius: 16,
                  ...(isPicked
                    ? { background: "rgba(253,230,138,0.12)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(253,230,138,0.7)", boxShadow: "0 0 56px rgba(253,230,138,0.28), 0 16px 48px rgba(0,0,0,0.4)" }
                    : { ...glassBase }),
                  transition: "all 0.6s",
                }}>
                {isPicked && (
                  <motion.div animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.85, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
                    className="absolute pointer-events-none" style={{ inset: -3, border: "1px solid rgba(253,230,138,0.35)", borderRadius: 18 }} />
                )}
                <div style={{ ...serif, fontSize: "clamp(1.85rem, 3vw, 2.35rem)", color: isPicked ? "#FDE68A" : "rgba(226,232,240,0.9)", fontWeight: 300, letterSpacing: "0.15em", marginBottom: 10, transition: "color 1s" }}>{c.key}</div>
                <div style={{ color: isPicked ? "rgba(253,230,138,0.65)" : "rgba(148,163,184,0.5)", fontSize: 9, letterSpacing: "0.4em", transition: "color 1s" }}>{c.en}</div>
              </motion.button>
            );
          })}

          {stars.map((s) => (
            <motion.span key={s.id} initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x: Math.cos(s.angle) * s.distance, y: Math.sin(s.angle) * s.distance, opacity: [1, 1, 0.4, 0], scale: 1 }}
              transition={{ duration: 3.5, delay: s.delay, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none"
              style={{ width: s.size, height: s.size, background: "#FDE68A", boxShadow: "0 0 12px 3px rgba(253,230,138,0.9)", left: "50%", top: "50%" }} />
          ))}
        </div>

        <AnimatePresence>
          {picked && (
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 1.6 }} style={{ marginTop: 72 }}>
              <div style={{ display: "inline-block", padding: "40px 52px", borderRadius: 24, maxWidth: 540, ...glassBase }}>
                <p style={{ ...serif, color: "rgba(253,230,138,0.92)", fontSize: "clamp(1.1rem, 1.6vw, 1.3rem)", lineHeight: 2.2 }}>{picked.desc}</p>
                <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 1.2, duration: 1.5 }}
                  style={{ width: 60, height: 1, background: "rgba(253,230,138,0.35)", margin: "32px auto", transformOrigin: "center" }} />
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 2 }}
                  style={{ ...serif, color: "rgba(226,232,240,0.7)", fontSize: 14, lineHeight: 2.1, letterSpacing: "0.12em" }}>
                  這顆星,會記得你今夜來過。
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   聯絡我們
───────────────────────────────────────────── */

function ContactSection() {
  const [msg, setMsg] = useState({ name: "", email: "", content: "" });
  const [sent, setSent] = useState(false);

  const sendMsg = () => {
    if (!msg.name || !msg.email || !msg.content) return;
    // Production: POST to backend
    setSent(true);
  };

  return (
    <section id="contact" className="relative px-6" style={{ paddingTop: 144, paddingBottom: 100 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1000, marginTop: 96 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 72 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 20 }}>GET IN TOUCH</p>
          <div style={{ width: 40, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 28px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>聯絡我們</h2>
          <p className="text-slate-400 mx-auto" style={{ marginTop: 20, maxWidth: 520, lineHeight: 2, fontSize: 14 }}>
            無論你有任何問題，或想分享你的故事，<br />我們都在這裡等你。
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 items-start" style={{ gap: 56 }}>
          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { icon: "✉", label: "Email", value: "hello@weiliang-islandglow.com", href: "mailto:hello@weiliang-islandglow.com" },
              { icon: "📸", label: "Instagram", value: "@weiliang_islandglow", href: "https://instagram.com/weiliang_islandglow" },
              { icon: "💬", label: "LINE 官方帳號", value: "@weiliang", href: "https://line.me/ti/p/@weiliang" },
              { icon: "📍", label: "活動地點", value: "台南市 · 6/8 工作坊（地點另行通知）", href: null },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: 18, padding: "20px 24px", borderRadius: 14, ...glassDeep }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                <div>
                  <p style={{ color: "rgba(253,230,138,0.65)", fontSize: 10, letterSpacing: "0.25em", marginBottom: 6 }}>{item.label}</p>
                  {item.href ? (
                    <a href={item.href} style={{ ...serif, color: "rgba(226,232,240,0.85)", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#FDE68A"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(226,232,240,0.85)"}>{item.value}</a>
                  ) : (
                    <p style={{ ...serif, color: "rgba(226,232,240,0.85)", fontSize: 14 }}>{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact form */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div key="cform" exit={{ opacity: 0 }} style={{ padding: "40px 40px", borderRadius: 20, ...glassDeep }}>
                  {[
                    { id: "name", label: "您的稱呼", type: "text", placeholder: "暱稱即可" },
                    { id: "email", label: "Email", type: "email", placeholder: "your@email.com" },
                  ].map((f) => (
                    <div key={f.id} style={{ marginBottom: 20 }}>
                      <label style={{ ...serif, display: "block", color: "rgba(148,163,184,0.75)", fontSize: 12, marginBottom: 8, letterSpacing: "0.1em" }}>{f.label}</label>
                      <input type={f.type} value={msg[f.id]} onChange={(e) => setMsg((p) => ({ ...p, [f.id]: e.target.value }))} placeholder={f.placeholder}
                        style={{ width: "100%", padding: "11px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)", color: "rgba(226,232,240,0.9)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(253,230,138,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(148,163,184,0.18)"} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ ...serif, display: "block", color: "rgba(148,163,184,0.75)", fontSize: 12, marginBottom: 8, letterSpacing: "0.1em" }}>想說的話</label>
                    <textarea rows={5} value={msg.content} onChange={(e) => setMsg((p) => ({ ...p, content: e.target.value }))} placeholder="想問什麼、想說什麼，都可以……"
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)", color: "rgba(226,232,240,0.9)", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "'Noto Serif TC', serif", lineHeight: 1.8, boxSizing: "border-box", transition: "border-color 0.3s" }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(253,230,138,0.4)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(148,163,184,0.18)"} />
                  </div>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={sendMsg}
                    style={{ width: "100%", padding: "13px", borderRadius: 999, background: "rgba(253,230,138,0.09)", border: "1px solid rgba(253,230,138,0.38)", color: "#FDE68A", fontSize: 13, letterSpacing: "0.2em", cursor: "pointer" }}>
                    送出訊息 →
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="csent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                  style={{ padding: "48px 40px", borderRadius: 20, ...glassBase, textAlign: "center" }}>
                  <p style={{ ...serif, color: "#FDE68A", fontSize: "1.2rem", lineHeight: 2 }}>訊息已送出，謝謝你。</p>
                  <p style={{ ...serif, color: "rgba(148,163,184,0.7)", fontSize: 14, marginTop: 12, lineHeight: 2 }}>我們會盡快回覆你。</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
          className="text-center" style={{ marginTop: 100, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "rgba(71,85,105,0.6)", fontSize: 9, letterSpacing: "0.45em" }}>
            © WEI · LIANG · ISLAND · GLOW · 微亮嶼光 · 2025
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   進度條
───────────────────────────────────────────── */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div className="fixed" style={{ top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, rgba(253,230,138,0.4), #FDE68A)", zIndex: 200, originX: 0, scaleX, boxShadow: "0 0 10px rgba(253,230,138,0.7)" }} />
  );
}

/* ─────────────────────────────────────────────
   APP
───────────────────────────────────────────── */

export default function App() {
  return (
    <div className="relative min-h-screen w-full text-slate-100"
      style={{ background: "linear-gradient(180deg, #020617 0%, #0A1120 30%, #0F172A 60%, #020617 100%)", fontFamily: "'Noto Sans TC', 'Noto Serif TC', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&family=Noto+Sans+TC:wght@300;400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        html { scroll-behavior: smooth; }
        body { background: #020617; margin: 0; }
        *::-webkit-scrollbar { width: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(253,230,138,0.18); border-radius: 4px; }
        *::-webkit-scrollbar-thumb:hover { background: rgba(253,230,138,0.38); }
        ::selection { background: rgba(253,230,138,0.22); color: #FDE68A; }
        input, textarea, select { font-family: 'Noto Sans TC', sans-serif; }
        @supports not (backdrop-filter: blur(1px)) {
          [style*="backdropFilter"] { background: rgba(10,17,40,0.9) !important; }
        }
      `}</style>

      {/* Noise overlay */}
      <div className="pointer-events-none fixed inset-0" style={{ opacity: 0.03, mixBlendMode: "overlay", zIndex: 10,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Top ambient glow */}
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(253,230,138,0.022) 0%, transparent 55%)", zIndex: 5 }} />

      <ScrollProgress />
      <Particles />
      <Navbar />

      <main className="relative" style={{ zIndex: 20 }}>
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
