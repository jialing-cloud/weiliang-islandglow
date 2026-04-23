import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from "framer-motion";

/* ─────────────────────────────────────────────
   設定
───────────────────────────────────────────── */

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

// 改編自 Maslach Burnout Inventory (MBI) — 結構化以利後台維度分析
const AWARENESS_ITEMS = [
  { id: "ex1", text: "我常常感到精疲力竭，就算睡了一整夜也沒辦法真正恢復。", cat: "exhaustion", catLabel: "心力耗盡" },
  { id: "ex2", text: "我覺得自己的能量，正在被工作或生活一點一點地榨乾。",   cat: "exhaustion", catLabel: "心力耗盡" },
  { id: "ex3", text: "我知道自己需要休息，但就是沒辦法讓自己真正放鬆下來。", cat: "exhaustion", catLabel: "心力耗盡" },
  { id: "cy1", text: "我開始對以前在乎的事情、或在乎的人，感到麻木或冷漠。", cat: "cynicism",   catLabel: "冷感疏離" },
  { id: "cy2", text: "我懷疑自己每天做的事，是否真的有任何意義。",           cat: "cynicism",   catLabel: "冷感疏離" },
  { id: "ef1", text: "完成一件事之後，我很難感受到真正的成就感或喜悅。",     cat: "efficacy",   catLabel: "動力流失" },
  { id: "ef2", text: "我越來越難感受到純粹的快樂，對很多事提不起勁。",       cat: "efficacy",   catLabel: "動力流失" },
  { id: "mk1", text: "我強迫自己維持表面的正常，但內心已經快撐不下去了。",   cat: "mask",       catLabel: "情緒壓抑" },
  { id: "mk2", text: "我害怕讓別人看到我脆弱，或看到「不夠好」的那一面。",   cat: "mask",       catLabel: "情緒壓抑" },
  { id: "me1", text: "深夜裡，我有時候會問自己：「這真的是我想要的人生嗎？」", cat: "meaning",  catLabel: "迷失方向" },
];

const LIKERT = ["完全沒有", "偶爾如此", "有時如此", "經常如此", "幾乎每天"];

const CAT_META = {
  exhaustion: { label: "心力耗盡", color: "#F87171",  desc: "持續疲憊，睡了也補不回來" },
  cynicism:   { label: "冷感疏離", color: "#FB923C",  desc: "對人與事漸漸失去感受" },
  efficacy:   { label: "動力流失", color: "#A78BFA",  desc: "努力過後，卻感受不到意義" },
  mask:       { label: "情緒壓抑", color: "#60A5FA",  desc: "強撐著，不敢讓人看到真實的自己" },
  meaning:    { label: "迷失方向", color: "#34D399",  desc: "夜深了，開始懷疑自己走的路" },
};

const MODULES = [
  {
    step: "STEP 1",
    title: "褪殼見嶼",
    subtitle: "你不是別人給你的那個定義。",
    body: "從小到大，你的身上被貼滿了標籤：「懂事的孩子」、「能幹的員工」、「不夠好的人」……今天，讓我們把它們一張一張撕下來。每一張撕去，你就離真正的自己近一點。沒有標籤的你，才是完整的你。",
    glyph: "✦", accent: "rgba(253,230,138,0.9)", glow: "rgba(253,230,138,0.18)",
  },
  {
    step: "STEP 2",
    title: "裂縫透光",
    subtitle: "每一道裂縫，都是光照進來的地方。",
    body: "你願意在手破皮時貼上 OK 繃，但心裡的傷呢？那些說不出口的委屈、壓下去的眼淚——它們不是你的弱點，而是你還沒被好好照顧過的部分。承認「我現在不好」，需要比逞強更大的勇氣。",
    glyph: "✧", accent: "rgba(167,210,255,0.9)", glow: "rgba(167,210,255,0.12)",
  },
  {
    step: "STEP 3",
    title: "嶼光定向",
    subtitle: "生命有限，你的時間只留給值得的。",
    body: "你的時間與精力，是你這一生最珍貴的資產。那些消耗你、讓你感到空洞的人事物——在你剩下的日子裡，它們真的值得繼續佔據那個位置嗎？朝讓你真正發光的方向走，其餘的，輕輕放手。",
    glyph: "✷", accent: "rgba(253,230,138,0.9)", glow: "rgba(253,230,138,0.18)",
  },
  {
    step: "STEP 4",
    title: "嶼心識己",
    subtitle: "你的價值，不需要他人的蓋章才算數。",
    body: "當你開始從自己的眼睛裡看見自己的價值，別人的評價就再也無法輕易動搖你。這不是驕傲——而是一種穩定。像一棵根扎得夠深的樹，風可以吹，但你不會被吹走。",
    glyph: "✺", accent: "rgba(196,181,253,0.9)", glow: "rgba(196,181,253,0.12)",
  },
  {
    step: "STEP 5",
    title: "渡光歸岸",
    subtitle: "看清了賽局，依然選擇溫柔地活著。",
    body: "這場人生的競賽，規則從來不是為了讓你幸福而設計的。當你看清楚這件事，你不需要憤怒，也不需要逃跑——只需要一個決定：溫柔地對待自己，也溫柔地對待身邊的人。",
    glyph: "❖", accent: "rgba(253,230,138,0.9)", glow: "rgba(253,230,138,0.18)",
  },
];

const NAV_ITEMS = [
  { label: "首頁",    href: "#hero" },
  { label: "旅程",    href: "#relay" },
  { label: "嶼心探照", href: "#awareness" },
  { label: "嶼光五境", href: "#modules" },
  { label: "聯絡我們", href: "#contact" },
];

/* ─────────────────────────────────────────────
   共用樣式
───────────────────────────────────────────── */

const serif   = { fontFamily: "'Noto Serif TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif" };
const display = { fontFamily: "'Cormorant Garamond', Georgia, 'PingFang TC', 'Microsoft JhengHei', sans-serif" };

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

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)",
  color: "rgba(226,232,240,0.9)", fontSize: 14, outline: "none", transition: "border-color 0.3s",
  fontFamily: "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
};

/* ─────────────────────────────────────────────
   粒子
───────────────────────────────────────────── */

function Particles({ count = 55 }) {
  const pts = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, delay: Math.random() * 8,
      duration: 10 + Math.random() * 14, drift: (Math.random() - 0.5) * 36,
      opacity: 0.3 + Math.random() * 0.45,
      color: Math.random() > 0.85 ? "#BAE6FD" : "#FDE68A",
    })), [count]);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {pts.map(p => (
        <motion.span key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, boxShadow: `0 0 6px 1px ${p.color}88` }}
          animate={{ y: [0, -55, 0], x: [0, p.drift, 0], opacity: [0, p.opacity, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   導覽列
───────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1 }}
      className="fixed top-0 left-0 right-0" style={{ zIndex: 100, padding: "0 20px" }}>
      <div className="mx-auto" style={{ maxWidth: 960, marginTop: 14, borderRadius: 999, transition: "all 0.5s",
        ...(scrolled ? { background: "rgba(2,6,23,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(253,230,138,0.12)", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" } : { background: "transparent", border: "1px solid transparent" }) }}>
        <div className="flex items-center justify-between" style={{ padding: "11px 28px" }}>
          <a href="#hero" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" fill="#FDE68A"><animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" /></circle>
              <circle cx="9" cy="9" r="7" stroke="rgba(253,230,138,0.3)" strokeWidth="0.8" fill="none" />
            </svg>
            <span style={{ ...serif, color: "#FDE68A", fontSize: 13, letterSpacing: "0.25em", fontWeight: 300 }}>微亮嶼光</span>
          </a>
          <div className="hidden md:flex items-center" style={{ gap: 2 }}>
            {NAV_ITEMS.map(item => (
              <a key={item.href} href={item.href} style={{ padding: "6px 13px", borderRadius: 999, textDecoration: "none", color: "rgba(148,163,184,0.85)", fontSize: 11, letterSpacing: "0.1em", transition: "color 0.3s, background 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#FDE68A"; e.currentTarget.style.background = "rgba(253,230,138,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(148,163,184,0.85)"; e.currentTarget.style.background = "transparent"; }}>
                <span style={serif}>{item.label}</span>
              </a>
            ))}
          </div>
          <button className="md:hidden" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }} onClick={() => setOpen(v => !v)}>
            {[0, 1, 2].map(i => (
              <motion.span key={i} animate={open ? (i === 0 ? { rotate: 45, y: 7 } : i === 1 ? { opacity: 0 } : { rotate: -45, y: -7 }) : { rotate: 0, y: 0, opacity: 1 }}
                style={{ display: "block", width: 20, height: 1, background: "rgba(253,230,138,0.7)", transformOrigin: "center" }} />
            ))}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            className="mx-auto" style={{ maxWidth: 960, marginTop: 8, borderRadius: 16, background: "rgba(2,6,23,0.93)", backdropFilter: "blur(24px)", border: "1px solid rgba(253,230,138,0.12)", padding: "12px 28px" }}>
            {NAV_ITEMS.map(item => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", color: "rgba(203,213,225,0.85)" }}>
                <span style={{ ...serif, fontSize: 15 }}>{item.label}</span>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div className="fixed" style={{ top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, rgba(253,230,138,0.4), #FDE68A)", zIndex: 200, originX: 0, scaleX, boxShadow: "0 0 10px rgba(253,230,138,0.7)" }} />
  );
}

/* ─────────────────────────────────────────────
   Hero
───────────────────────────────────────────── */

function OceanScene({ y }) {
  return (
    <motion.div style={{ y }} className="relative flex items-center justify-center" aria-hidden>
      <motion.div className="absolute rounded-full" style={{ width: 540, height: 540, background: "radial-gradient(circle, rgba(253,230,138,0.11) 0%, transparent 65%)", filter: "blur(10px)" }}
        animate={{ scale: [1, 1.07, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
      <svg width="500" height="300" viewBox="0 0 520 310" style={{ position: "relative", zIndex: 10 }}>
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="1" />
            <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1628" /><stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.38" /><stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[[60,30,1.1],[120,55,0.8],[200,20,1],[280,45,0.7],[360,25,1],[430,50,0.9],[490,35,0.7],[40,80,0.7],[170,70,0.9],[330,65,0.8],[470,75,0.6],[100,110,0.7],[450,105,0.8],[230,90,0.6],[380,95,0.8]].map(([cx,cy,r],i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#FDE68A">
            <animate attributeName="opacity" values={`${0.3+(i%4)*0.12};${0.8+(i%3)*0.1};${0.3+(i%4)*0.12}`} dur={`${2.5+(i%5)*0.7}s`} repeatCount="indefinite" />
          </circle>
        ))}
        <circle cx="260" cy="90" r="60" fill="url(#moonGlow)" opacity="0.5" />
        <circle cx="260" cy="90" r="29" fill="#FEFCE8"><animate attributeName="opacity" values="0.88;1;0.88" dur="4s" repeatCount="indefinite" /></circle>
        <circle cx="252" cy="84" r="6" fill="rgba(200,190,160,0.12)" />
        <rect x="0" y="200" width="520" height="110" fill="url(#seaGrad)" />
        <path d="M0,203 Q65,198 130,203 Q195,208 260,203 Q325,198 390,203 Q455,208 520,203" fill="none" stroke="rgba(253,230,138,0.22)" strokeWidth="0.8" />
        <rect x="250" y="200" width="20" height="118" fill="url(#refGrad)" opacity="0.55" />
        {[215,225,235,248,262,275,285].map((x,i)=>(
          <line key={i} x1={x} y1={204+i*10} x2={x+9} y2={204+i*10} stroke="rgba(253,230,138,0.17)" strokeWidth="0.5">
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur={`${1.6+i*0.3}s`} repeatCount="indefinite" />
          </line>
        ))}
        <path d="M0,200 Q80,196 180,199 Q220,196 260,198 Q300,200 340,197 Q420,193 520,197 L520,200 L0,200 Z" fill="#020617" opacity="0.9" />
        {/* subtle shimmer over text */}
        <rect x="160" y="238" width="200" height="22" fill="url(#refGrad)" opacity="0.3" />
        <rect x="255" y="178" width="10" height="22" rx="2" fill="#020617" />
        <circle cx="260" cy="174" r="5.5" fill="#020617" />
        <path d="M255,185 L247,193 M265,185 L273,193" stroke="#020617" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="260" cy="168" r="2" fill="#FDE68A">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values="1.5;2.5;1.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="260" cy="168" r="6" fill="#FDE68A" opacity="0.2"><animate attributeName="opacity" values="0.1;0.28;0.1" dur="3s" repeatCount="indefinite" /></circle>
      </svg>
      <div className="absolute" style={{ bottom: -55, width: 320, height: 52, background: "radial-gradient(ellipse at center, rgba(253,230,138,0.11) 0%, transparent 70%)", filter: "blur(12px)" }} />
    </motion.div>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneY  = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const textY   = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  return (
    <section id="hero" ref={ref} className="relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "100vh" }}>
      <div className="absolute left-0 right-0" style={{ top: "50%", height: 1, background: "linear-gradient(to right, transparent, rgba(253,230,138,0.13) 50%, transparent)" }} />
      <motion.div style={{ opacity }} className="flex flex-col items-center">
        <OceanScene y={sceneY} />
        <motion.div style={{ y: textY }} className="mt-20 text-center px-6">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1.2 }}
            style={{ ...display, color: "rgba(253,230,138,0.7)", letterSpacing: "0.5em", fontSize: 11, marginBottom: 24 }}>
            WEI&nbsp;·&nbsp;LIANG&nbsp;·&nbsp;ISLAND&nbsp;·&nbsp;GLOW
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.4, ease: "easeOut" }}
            style={{ fontFamily: "'Noto Serif TC','PingFang TC','Microsoft JhengHei',sans-serif", fontWeight: 300, fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 1.15, letterSpacing: "0.2em", margin: "0 0 0 0", color: "rgba(226,232,240,0.92)" }}>
            微亮<span style={{ color: "#FDE68A" }}>嶼光</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1.4 }}
            style={{ fontFamily: "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif", color: "rgba(148,163,184,0.75)", marginTop: 20, fontSize: "clamp(0.88rem, 1.3vw, 1rem)", letterSpacing: "0.14em" }}>
            為疲憊的靈魂，留一盞溫柔的光。
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 1.6 }}
            style={{ marginTop: 52, display: "inline-block", padding: "22px 38px", borderRadius: 20, ...glassBase, maxWidth: 420 }}>
            <p style={{ ...serif, color: "rgba(253,230,138,0.88)", fontSize: "clamp(0.9rem, 1.5vw, 1.15rem)", lineHeight: 1.9, fontWeight: 300, letterSpacing: "0.06em" }}>
              「真正重要的事物，用肉眼是看不見的。」
            </p>
            <p style={{ marginTop: 8, color: "rgba(148,163,184,0.5)", fontSize: 10, letterSpacing: "0.3em" }}>— 《小王子》</p>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}
        className="absolute flex flex-col items-center" style={{ bottom: 36, left: "50%", transform: "translateX(-50%)", gap: 10 }}>
        <span style={{ color: "rgba(253,230,138,0.45)", fontSize: 9, letterSpacing: "0.5em" }}>SCROLL</span>
        <motion.div animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(253,230,138,0.65), transparent)", transformOrigin: "top" }} />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Chapter 01 — 旅程
───────────────────────────────────────────── */

function AnimatedTimeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [litIndex, setLitIndex] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const timer = setInterval(() => {
      setLitIndex(i);
      i++;
      if (i >= LIFE_STAGES.length) clearInterval(timer);
    }, 400);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div ref={ref} style={{ marginBottom: 64, overflowX: "auto", padding: "36px 28px", borderRadius: 22, ...glassDeep }}>
      <div className="relative flex items-center justify-between" style={{ minWidth: 640, position: "relative" }}>
        {/* dim base line */}
        <div className="absolute" style={{ left: 0, right: 0, top: "14px", height: 1, background: "rgba(255,255,255,0.05)" }} />

        {LIFE_STAGES.map((s, i) => {
          const isLit = litIndex >= i;
          return (
            <div key={s.zh} className="relative flex flex-col items-center" style={{ zIndex: 10, flex: 1 }}>
              {/* connecting line segment to next dot */}
              {i < LIFE_STAGES.length - 1 && (
                <motion.div className="absolute"
                  style={{ top: "14px", left: "50%", height: 1, width: "100%", transformOrigin: "left", originX: 0 }}
                  initial={{ scaleX: 0, background: "rgba(253,230,138,0.5)" }}
                  animate={{ scaleX: litIndex > i ? 1 : 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }} />
              )}
              {/* dot */}
              <motion.div className="rounded-full"
                animate={isLit
                  ? { background: "#FDE68A", boxShadow: "0 0 14px 3px rgba(253,230,138,0.7)", scale: [1,1.4,1] }
                  : { background: "rgba(100,116,139,0.3)", boxShadow: "none", scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ width: 11, height: 11 }} />
              {/* label */}
              <motion.span
                animate={{ opacity: isLit ? 1 : 0.25 }}
                transition={{ duration: 0.4 }}
                style={{ fontFamily: "'Noto Serif TC','PingFang TC','Microsoft JhengHei',sans-serif", marginTop: 12, fontSize: 13, letterSpacing: "0.08em", color: isLit ? "#E2E8F0" : "#64748B" }}>
                {s.zh}
              </motion.span>
              <motion.span
                animate={{ opacity: isLit ? 0.5 : 0.15 }}
                transition={{ duration: 0.4 }}
                style={{ marginTop: 3, fontSize: 9, letterSpacing: "0.2em", color: "#64748B" }}>
                {s.en.toUpperCase()}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RelaySection() {
  return (
    <section id="relay" className="relative px-6" style={{ paddingTop: 140, paddingBottom: 140 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1100, marginTop: 88 }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 72 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 16 }}>CHAPTER · 01</p>
          <div style={{ width: 36, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 22px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>一路走來，辛苦了</h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(253,230,138,0.65)", fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)", marginTop: 10, letterSpacing: "0.08em", fontStyle: "italic" }}>
            You've come a long way
          </p>
        </motion.div>

        <AnimatedTimeline />

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 1.2 }}
          className="text-center mx-auto" style={{ maxWidth: 520 }}>
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3.5, repeat: Infinity }}
            className="rounded-full mx-auto" style={{ width: 5, height: 5, background: "#FDE68A", marginBottom: 28, boxShadow: "0 0 12px 2px rgba(253,230,138,0.5)" }} />
          {/* 精簡為兩句 */}
          <p className="text-slate-200" style={{ ...serif, fontSize: "clamp(0.95rem, 1.6vw, 1.15rem)", lineHeight: 2.4, fontWeight: 300 }}>
            你一個人，帶著重量繼續往前，走到了今天這裡。<br />
            <span style={{ color: "rgba(253,230,138,0.8)" }}>光是你願意停下來——就已經是給自己最好的事。</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Chapter 02 — 自我覺察（MBI）整合報名
───────────────────────────────────────────── */

function AwarenessSection() {
  const [phase, setPhase] = useState("quiz"); // quiz → result → done
  const [answers, setAnswers] = useState({});
  const [reg, setReg] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const resultRef = useRef(null);

  const answered   = Object.keys(answers).length;
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxScore   = AWARENESS_ITEMS.length * 4;

  const catScores = useMemo(() => {
    const r = {};
    AWARENESS_ITEMS.forEach(item => {
      if (!r[item.cat]) r[item.cat] = { sum: 0, count: 0 };
      r[item.cat].sum   += answers[item.id] ?? 0;
      r[item.cat].count += 1;
    });
    return r;
  }, [answers]);

  const getInterp = () => {
    const pct = totalScore / maxScore;
    if (pct < 0.30) return { level: "穩定",    levelEn: "Stable",    color: "#34D399", msg: "你目前的狀態相對平穩。即便如此，心靈的照顧仍值得持續。" };
    if (pct < 0.55) return { level: "需要關注", levelEn: "Attention", color: "#FDE68A", msg: "你已感受到一定程度的消耗。是時候停下來，聽聽自己內心的聲音了。" };
    if (pct < 0.75) return { level: "明顯耗損", levelEn: "Depleted",  color: "#FB923C", msg: "你已承受了不少。這份疲憊真實存在，它值得被認真對待。" };
    return               { level: "亟需照顧", levelEn: "Critical",  color: "#F87171", msg: "你扛著很重的東西走了很長的路。讓這裡成為你第一個允許自己休息的地方。" };
  };

  // 送出完整 MBI 結構供分析
  const submitMBI = async () => {
    if (answered < AWARENESS_ITEMS.length) return;
    setSubmitting(true);
    const interp = getInterp();
    const payload = {
      type: "mbi_assessment",
      timestamp: new Date().toISOString(),
      // 個別題目（id 對應題目，直接可交叉分析）
      answers: Object.fromEntries(AWARENESS_ITEMS.map(i => [i.id, answers[i.id] ?? 0])),
      // 各維度分數（供統計）
      dimensions: Object.fromEntries(
        Object.entries(catScores).map(([cat, d]) => [cat, {
          score: d.sum, max: d.count * 4,
          pct: Math.round((d.sum / (d.count * 4)) * 100),
          label: CAT_META[cat]?.label,
        }])
      ),
      totalScore,
      maxScore,
      burnoutPct: Math.round((totalScore / maxScore) * 100),
      burnoutLevel: interp.level,
    };
    try {
      await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (_) {}
    setSubmitting(false);
    setPhase("result");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  };

  // 報名送出（附帶倦怠等級）
  const submitReg = async () => {
    if (!reg.name || !reg.email) return;
    setSubmitting(true);
    const interp = getInterp();
    try {
      await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "event_registration", timestamp: new Date().toISOString(), ...reg, burnoutLevel: interp.level, burnoutPct: Math.round((totalScore / maxScore) * 100) }) });
    } catch (_) {}
    setSubmitting(false);
    setPhase("done");
  };

  const interp = phase !== "quiz" ? getInterp() : null;

  return (
    <section id="awareness" className="relative px-6" style={{ paddingTop: 140, paddingBottom: 140 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1100, marginTop: 88 }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 60 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 16 }}>CHAPTER · 02</p>
          <div style={{ width: 36, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 22px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.2rem, 5vw, 3.6rem)", letterSpacing: "0.15em" }}>嶼心探照</h2>
          <p style={{ color: "rgba(253,230,138,0.6)", fontSize: 10, letterSpacing: "0.4em", marginTop: 10 }}>ISLAND MIRROR · MBI ADAPTED</p>
          <p className="text-slate-400 mx-auto" style={{ marginTop: 18, maxWidth: 480, lineHeight: 1.9, fontSize: 13 }}>
            十個句子，輕輕靠近自己一點。
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* Phase: quiz */}
          {phase === "quiz" && (
            <motion.div key="quiz" exit={{ opacity: 0, y: -16 }} className="grid md:grid-cols-2 items-start" style={{ gap: 44 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AWARENESS_ITEMS.map((item, i) => {
                  const val = answers[item.id];
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                      style={{ padding: "14px 16px", borderRadius: 12, transition: "all 0.4s",
                        ...(val != null ? { background: "rgba(253,230,138,0.06)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(253,230,138,0.25)" }
                          : { background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(148,163,184,0.09)" }) }}>
                      <p style={{ ...serif, fontSize: 13, lineHeight: 1.8, color: val != null ? "rgba(253,230,138,0.95)" : "rgba(203,213,225,0.8)", marginBottom: 10, transition: "color 0.3s" }}>
                        <span style={{ color: "rgba(253,230,138,0.38)", fontSize: 10, marginRight: 8 }}>Q{i + 1}</span>{item.text}
                      </p>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {LIKERT.map((label, score) => (
                          <button key={score} onClick={() => setAnswers(prev => ({ ...prev, [item.id]: score }))}
                            style={{ padding: "4px 10px", borderRadius: 999, fontSize: 10, cursor: "pointer", transition: "all 0.22s",
                              background: val === score ? "rgba(253,230,138,0.16)" : "rgba(255,255,255,0.04)",
                              border: val === score ? "1px solid rgba(253,230,138,0.6)" : "1px solid rgba(148,163,184,0.14)",
                              color: val === score ? "#FDE68A" : "rgba(148,163,184,0.65)" }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={submitMBI}
                  disabled={answered < AWARENESS_ITEMS.length || submitting}
                  style={{ marginTop: 6, padding: "12px 24px", borderRadius: 999, ...glassBase,
                    border: "1px solid rgba(253,230,138,0.35)", color: "#FDE68A", fontSize: 12, letterSpacing: "0.18em",
                    cursor: (answered < AWARENESS_ITEMS.length || submitting) ? "not-allowed" : "pointer",
                    opacity: (answered < AWARENESS_ITEMS.length || submitting) ? 0.45 : 1, background: "rgba(253,230,138,0.07)" }}>
                  {submitting ? "傳送中…" : `查看分析結果 (${answered} / ${AWARENESS_ITEMS.length})`}
                </motion.button>
              </div>

              {/* Realtime radar */}
              <div style={{ position: "sticky", top: 96 }}>
                <div style={{ padding: "26px 22px", borderRadius: 20, ...glassDeep }}>
                  <p style={{ color: "rgba(253,230,138,0.6)", fontSize: 9, letterSpacing: "0.35em", marginBottom: 22 }}>REALTIME PROFILE</p>
                  {Object.entries(CAT_META).map(([cat, meta]) => {
                    const d = catScores[cat] || { sum: 0, count: 0 };
                    const pct = d.count > 0 ? (d.sum / (d.count * 4)) * 100 : 0;
                    return (
                      <div key={cat} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ ...serif, color: "rgba(203,213,225,0.72)", fontSize: 12 }}>{meta.label}</span>
                          <span style={{ fontSize: 11, color: meta.color, opacity: 0.85 }}>{Math.round(pct)}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <motion.div style={{ height: "100%", borderRadius: 3, background: meta.color, boxShadow: `0 0 5px ${meta.color}55` }}
                            animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                        </div>
                        <p style={{ color: "rgba(100,116,139,0.55)", fontSize: 9, marginTop: 3 }}>{meta.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase: result + invite */}
          {phase === "result" && interp && (
            <motion.div key="result" ref={resultRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
              className="mx-auto" style={{ maxWidth: 660 }}>
              {/* Score card */}
              <div style={{ padding: "40px 44px", borderRadius: 22, ...glassBase, textAlign: "center", marginBottom: 28, border: `1px solid ${interp.color}40` }}>
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}
                  style={{ width: 9, height: 9, borderRadius: "50%", background: interp.color, margin: "0 auto 24px", boxShadow: `0 0 16px ${interp.color}` }} />
                <p style={{ color: interp.color, fontSize: 10, letterSpacing: "0.3em", marginBottom: 10 }}>
                  {interp.levelEn.toUpperCase()} · 倦怠指數 {Math.round((totalScore / maxScore) * 100)}%
                </p>
                <p style={{ ...serif, color: "#FDE68A", fontSize: "clamp(1.25rem, 2.2vw, 1.6rem)", lineHeight: 1.5, marginBottom: 16 }}>{interp.level}</p>
                <p style={{ ...serif, color: "rgba(203,213,225,0.82)", fontSize: 13, lineHeight: 2 }}>{interp.msg}</p>
                {/* Dimension bars */}
                <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                  {Object.entries(CAT_META).map(([cat, meta]) => {
                    const d = catScores[cat] || { sum: 0, count: 0 };
                    const pct = d.count > 0 ? (d.sum / (d.count * 4)) * 100 : 0;
                    return (
                      <div key={cat} style={{ textAlign: "center" }}>
                        <div style={{ height: 52, background: "rgba(255,255,255,0.05)", borderRadius: 4, position: "relative", overflow: "hidden", marginBottom: 6 }}>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }}
                            style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: meta.color, boxShadow: `0 0 5px ${meta.color}55` }} />
                        </div>
                        <p style={{ color: meta.color, fontSize: 8 }}>{meta.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Event invite */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9 }}
                style={{ padding: "32px 40px", borderRadius: 20, ...glassDeep, textAlign: "center" }}>
                <p style={{ color: "rgba(253,230,138,0.65)", fontSize: 10, letterSpacing: "0.4em", marginBottom: 14 }}>6 / 8 · EVENT INVITATION</p>
                <h3 style={{ ...serif, color: "#FDE68A", fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", marginBottom: 10, fontWeight: 300 }}>心靈鬆綁工作坊</h3>
                <p style={{ ...serif, color: "rgba(203,213,225,0.72)", fontSize: 13, lineHeight: 1.9, marginBottom: 24 }}>
                  2 小時 · 限額 30 人 · 台南<br />
                  你的測驗結果將幫助我們為你設計最適合的體驗。
                </p>
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexDirection: "column" }}>
                  {[{ id: "name", type: "text", placeholder: "你的稱呼" }, { id: "email", type: "email", placeholder: "Email（活動通知用）" }].map(f => (
                    <input key={f.id} type={f.type} value={reg[f.id]} placeholder={f.placeholder}
                      onChange={e => setReg(p => ({ ...p, [f.id]: e.target.value }))}
                      style={{ ...inputStyle }}
                      onFocus={e => e.target.style.borderColor = "rgba(253,230,138,0.42)"}
                      onBlur={e  => e.target.style.borderColor = "rgba(148,163,184,0.18)"} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={submitReg}
                    disabled={!reg.name || !reg.email || submitting}
                    style={{ padding: "11px 28px", borderRadius: 999, background: "rgba(253,230,138,0.09)", border: "1px solid rgba(253,230,138,0.42)",
                      color: "#FDE68A", fontSize: 12, letterSpacing: "0.18em", cursor: "pointer", ...glassBase,
                      opacity: (!reg.name || !reg.email || submitting) ? 0.5 : 1 }}>
                    {submitting ? "傳送中…" : "我要參加 →"}
                  </motion.button>
                  <button onClick={() => setPhase("done")}
                    style={{ padding: "11px 20px", borderRadius: 999, background: "transparent", border: "1px solid rgba(148,163,184,0.18)", color: "rgba(148,163,184,0.55)", fontSize: 11, cursor: "pointer", letterSpacing: "0.1em" }}>
                    先不了
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Phase: done */}
          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
              className="text-center mx-auto" style={{ maxWidth: 500, padding: "48px 40px", borderRadius: 22, ...glassBase }}>
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ width: 9, height: 9, borderRadius: "50%", background: "#FDE68A", margin: "0 auto 26px", boxShadow: "0 0 16px rgba(253,230,138,0.6)" }} />
              <p style={{ ...serif, color: "#FDE68A", fontSize: "clamp(1.1rem, 1.9vw, 1.35rem)", lineHeight: 2 }}>謝謝你如此誠實地面對自己。</p>
              <p style={{ ...serif, color: "rgba(148,163,184,0.65)", fontSize: 13, lineHeight: 2, marginTop: 12 }}>你的回應已記錄。接下來，讓我們一起走向五個步驟。</p>
              <a href="#modules" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24, padding: "10px 22px", borderRadius: 999, textDecoration: "none",
                color: "#FDE68A", fontSize: 11, letterSpacing: "0.15em", background: "rgba(253,230,138,0.07)", border: "1px solid rgba(253,230,138,0.3)" }}>
                前往嶼光五境 ↓
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Chapter 03 — 嶼光五境
───────────────────────────────────────────── */

function ModulesSection() {
  const [expanded, setExpanded] = useState(null);
  return (
    <section id="modules" className="relative px-6" style={{ paddingTop: 140, paddingBottom: 140 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 1100, marginTop: 88 }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 64 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 16 }}>CHAPTER · 03</p>
          <div style={{ width: 36, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 22px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(2.2rem, 5vw, 3.6rem)", letterSpacing: "0.18em" }}>嶼光五境</h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(253,230,138,0.65)", fontSize: "clamp(0.88rem, 1.3vw, 1.05rem)", marginTop: 10, fontStyle: "italic", letterSpacing: "0.08em" }}>
            Five Realms Back to Yourself
          </p>
        </motion.div>

        {/* Intro */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 1.4 }}
          style={{ padding: "32px 44px", borderRadius: 20, ...glassBase, textAlign: "center", maxWidth: 640, margin: "0 auto 64px" }}>
          <p style={{ ...serif, color: "rgba(226,232,240,0.88)", fontSize: "clamp(0.92rem, 1.4vw, 1.15rem)", lineHeight: 2.4, fontWeight: 300 }}>
            有一種回歸——<span style={{ color: "#FDE68A" }}>比努力更深，比成功更真。</span>
          </p>
          <p style={{ ...serif, color: "rgba(148,163,184,0.6)", fontSize: 12, marginTop: 16 }}>
            現在，讓我們一起走回來——回到那個，真正屬於你的方向。
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {MODULES.map((m, i) => {
            const isOpen = expanded === i;
            return (
              <motion.div key={m.step} initial={{ opacity: 0, x: i % 2 === 0 ? -34 : 34 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} style={{ marginLeft: `${i * 13}px` }}>
                <motion.div layout onClick={() => setExpanded(isOpen ? null : i)} whileHover={{ y: -3 }}
                  className="relative overflow-hidden rounded-2xl"
                  style={{ padding: "2.2rem 2.6rem", cursor: "pointer",
                    ...(isOpen ? { background: "linear-gradient(135deg, rgba(30,41,59,0.72) 0%, rgba(15,23,42,0.88) 100%)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: `1px solid ${m.accent.replace("0.9)", "0.35)")}`, boxShadow: `0 20px 56px rgba(0,0,0,0.5), 0 0 36px ${m.glow}` }
                      : { ...glassDeep }), transition: "box-shadow 0.4s, border-color 0.4s" }}>
                  <motion.div className="absolute rounded-full pointer-events-none"
                    style={{ top: -70, right: -70, width: 230, height: 230, background: `radial-gradient(circle, ${m.glow} 0%, transparent 70%)` }}
                    animate={{ scale: [1, 1.2, 1], opacity: isOpen ? [0.8, 1, 0.8] : [0.3, 0.55, 0.3] }} transition={{ duration: 5, repeat: Infinity, delay: i * 0.5 }} />
                  <div className="relative flex flex-col md:flex-row md:items-center" style={{ gap: 22 }}>
                    <div className="flex items-center" style={{ flexShrink: 0, gap: 14 }}>
                      <motion.span animate={{ scale: isOpen ? 1.12 : 1 }} transition={{ duration: 0.4 }}
                        style={{ ...display, fontSize: 46, color: m.accent, lineHeight: 1 }}>{m.glyph}</motion.span>
                      <div>
                        <p style={{ color: "rgba(253,230,138,0.55)", fontSize: 9, letterSpacing: "0.44em" }}>{m.step}</p>
                        <h3 className="font-light text-slate-100" style={{ ...serif, fontSize: 23, marginTop: 2 }}>{m.title}</h3>
                      </div>
                    </div>
                    <div className="flex-1" style={{ borderLeft: `1px solid ${isOpen ? m.accent.replace("0.9)", "0.2)") : "rgba(255,255,255,0.06)"}`, paddingLeft: 22, transition: "border-color 0.4s" }}>
                      <p style={{ ...serif, color: m.accent, fontSize: 14, marginBottom: 6 }}>{m.subtitle}</p>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.42 }}
                            className="text-slate-300" style={{ ...serif, fontSize: 13, lineHeight: 2, overflow: "hidden" }}>{m.body}</motion.p>
                        )}
                      </AnimatePresence>
                      {!isOpen && <p style={{ color: "rgba(148,163,184,0.36)", fontSize: 9, letterSpacing: "0.18em" }}>點擊展開 · EXPAND</p>}
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}
                      style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", border: `1px solid ${isOpen ? m.accent.replace("0.9)", "0.42)") : "rgba(148,163,184,0.18)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", color: isOpen ? m.accent : "rgba(148,163,184,0.38)", fontSize: 14,
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
   結語
───────────────────────────────────────────── */

function Closing() {
  const [picked, setPicked] = useState(null);
  const [stars, setStars] = useState([]);
  const choices = [
    { key: "放下", en: "LET GO",  desc: "把不再屬於你的，輕輕鬆開。" },
    { key: "留下", en: "KEEP",    desc: "把支撐過你的，靜靜收好。" },
    { key: "前行", en: "WALK ON", desc: "帶著此刻的光，走向下一處海岸。" },
  ];
  const choose = c => {
    if (picked) return;
    setPicked(c);
    setStars(Array.from({ length: 16 }).map((_, i) => ({ id: i, angle: -Math.PI / 2 + (Math.random() - 0.5) * 1.8, distance: 150 + Math.random() * 260, delay: Math.random() * 0.5, size: 2 + Math.random() * 2.3 })));
  };
  return (
    <section className="relative px-6 text-center overflow-hidden" style={{ paddingTop: 140, paddingBottom: 140 }}>
      <GlowDivider />
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.4 }}
        className="mx-auto" style={{ maxWidth: 520, marginTop: 88, marginBottom: 80 }}>
        <motion.div animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity }}
          className="rounded-full mx-auto" style={{ width: 7, height: 7, background: "#FDE68A", marginBottom: 40, boxShadow: "0 0 18px 4px rgba(253,230,138,0.5)" }} />
        <div style={{ padding: "36px 40px", borderRadius: 20, ...glassBase }}>
          <p style={{ ...serif, color: "rgba(226,232,240,0.9)", fontSize: "clamp(1.05rem, 1.7vw, 1.3rem)", lineHeight: 2.6, fontWeight: 300, letterSpacing: "0.04em" }}>
            夜再深，海再寬，<br />總有一盞，為你留著的光。
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 1.2 }} style={{ position: "relative" }}>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }}
          style={{ ...serif, color: "rgba(203,213,225,0.6)", fontSize: 13, lineHeight: 2, maxWidth: 540, margin: "0 auto 28px", letterSpacing: "0.04em" }}>
          走過了褪殼見嶼、裂縫透光、嶼光定向、嶼心識己、渡光歸岸——<br />
          你現在心裡，有什麼留下來了？
        </motion.p>
        <motion.p animate={picked ? { opacity: 0.18 } : { opacity: 1 }} transition={{ duration: 1.2 }}
          style={{ ...serif, color: "rgba(253,230,138,0.7)", fontSize: 11, letterSpacing: "0.44em", marginBottom: 40 }}>
          把那個字，交給今晚的夜空。
        </motion.p>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {choices.map(c => {
            const isPicked = picked?.key === c.key;
            const isDimmed = picked && picked.key !== c.key;
            return (
              <motion.button key={c.key} onClick={() => choose(c)} disabled={!!picked}
                whileHover={!picked ? { y: -7, scale: 1.03 } : {}} whileTap={!picked ? { scale: 0.97 } : {}}
                animate={{ opacity: isDimmed ? 0.13 : 1 }} transition={{ duration: 1 }}
                style={{ position: "relative", padding: "30px 38px", minWidth: 148, cursor: picked ? "default" : "pointer", borderRadius: 14,
                  ...(isPicked ? { background: "rgba(253,230,138,0.09)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(253,230,138,0.62)", boxShadow: "0 0 44px rgba(253,230,138,0.22), 0 12px 36px rgba(0,0,0,0.4)" }
                    : { ...glassBase }), transition: "all 0.6s" }}>
                {isPicked && <motion.div animate={{ scale: [1, 1.17, 1], opacity: [0.35, 0.78, 0.35] }} transition={{ duration: 3, repeat: Infinity }}
                  className="absolute pointer-events-none" style={{ inset: -3, border: "1px solid rgba(253,230,138,0.3)", borderRadius: 16 }} />}
                <div style={{ ...serif, fontSize: "clamp(1.7rem, 2.7vw, 2.1rem)", color: isPicked ? "#FDE68A" : "rgba(226,232,240,0.88)", fontWeight: 300, letterSpacing: "0.15em", marginBottom: 7, transition: "color 1s" }}>{c.key}</div>
                <div style={{ color: isPicked ? "rgba(253,230,138,0.58)" : "rgba(148,163,184,0.46)", fontSize: 9, letterSpacing: "0.36em", transition: "color 1s" }}>{c.en}</div>
              </motion.button>
            );
          })}
          {stars.map(s => (
            <motion.span key={s.id} initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x: Math.cos(s.angle) * s.distance, y: Math.sin(s.angle) * s.distance, opacity: [1, 1, 0.4, 0], scale: 1 }}
              transition={{ duration: 3.5, delay: s.delay, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none"
              style={{ width: s.size, height: s.size, background: "#FDE68A", boxShadow: "0 0 10px 2px rgba(253,230,138,0.8)", left: "50%", top: "50%" }} />
          ))}
        </div>
        <AnimatePresence>
          {picked && (
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1.6 }} style={{ marginTop: 56 }}>
              <div style={{ display: "inline-block", padding: "32px 44px", borderRadius: 20, maxWidth: 480, ...glassBase }}>
                <p style={{ ...serif, color: "rgba(253,230,138,0.9)", fontSize: "clamp(1rem, 1.5vw, 1.2rem)", lineHeight: 2.2 }}>{picked.desc}</p>
                <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 1, duration: 1.4 }}
                  style={{ width: 46, height: 1, background: "rgba(253,230,138,0.3)", margin: "24px auto", transformOrigin: "center" }} />
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 2 }}
                  style={{ ...serif, color: "rgba(226,232,240,0.65)", fontSize: 12, lineHeight: 2, letterSpacing: "0.1em" }}>
                  這顆星，會記得你今夜來過。
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
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!msg.name || !msg.email || !msg.content) return;
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...msg, timestamp: new Date().toISOString() }) });
    } catch (_) {}
    setLoading(false);
    setSent(true);
  };

  return (
    <section id="contact" className="relative px-6" style={{ paddingTop: 140, paddingBottom: 100 }}>
      <GlowDivider />
      <div className="mx-auto" style={{ maxWidth: 960, marginTop: 88 }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
          className="text-center" style={{ marginBottom: 56 }}>
          <p style={{ color: "rgba(253,230,138,0.7)", fontSize: 10, letterSpacing: "0.55em", marginBottom: 16 }}>GET IN TOUCH</p>
          <div style={{ width: 36, height: 1, background: "rgba(253,230,138,0.4)", margin: "0 auto 22px" }} />
          <h2 className="font-light text-slate-100" style={{ ...serif, fontSize: "clamp(1.7rem, 3.5vw, 2.8rem)" }}>聯絡我們</h2>
          <p className="text-slate-400 mx-auto" style={{ marginTop: 14, maxWidth: 420, lineHeight: 1.9, fontSize: 13 }}>
            有任何問題，或想分享你的故事，我們都在這裡。
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 items-start" style={{ gap: 44 }}>
          <motion.div initial={{ opacity: 0, x: -22 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "✉",  label: "Email",       value: "hello@weiliang-islandglow.com", href: "mailto:hello@weiliang-islandglow.com" },
              { icon: "📸", label: "Instagram",   value: "@weiliang_islandglow",          href: "https://instagram.com/weiliang_islandglow" },
              { icon: "💬", label: "LINE 官方帳號", value: "@weiliang",                   href: "https://line.me/ti/p/@weiliang" },
              { icon: "📍", label: "活動地點",     value: "701 臺南市東區榮譽街 67 號 ZA301", href: "https://maps.google.com/?q=701臺南市東區榮譽街67號" },
              { icon: "📞", label: "電話",          value: "06 260 6123", href: "tel:0626060123" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", borderRadius: 12, ...glassDeep }}>
                <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <p style={{ color: "rgba(253,230,138,0.58)", fontSize: 9, letterSpacing: "0.22em", marginBottom: 4 }}>{item.label}</p>
                  {item.href
                    ? <a href={item.href} style={{ ...serif, color: "rgba(226,232,240,0.8)", fontSize: 13, textDecoration: "none", transition: "color 0.3s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#FDE68A"} onMouseLeave={e => e.currentTarget.style.color = "rgba(226,232,240,0.8)"}>{item.value}</a>
                    : <p style={{ ...serif, color: "rgba(226,232,240,0.8)", fontSize: 13 }}>{item.value}</p>}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 22 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div key="cform" exit={{ opacity: 0 }} style={{ padding: "32px 32px", borderRadius: 18, ...glassDeep }}>
                  {[{ id: "name", type: "text", label: "稱呼", placeholder: "暱稱即可" }, { id: "email", type: "email", label: "Email", placeholder: "your@email.com" }].map(f => (
                    <div key={f.id} style={{ marginBottom: 16 }}>
                      <label style={{ ...serif, display: "block", color: "rgba(148,163,184,0.68)", fontSize: 11, marginBottom: 6, letterSpacing: "0.08em" }}>{f.label}</label>
                      <input type={f.type} value={msg[f.id]} onChange={e => setMsg(p => ({ ...p, [f.id]: e.target.value }))} placeholder={f.placeholder}
                        style={{ ...inputStyle }}
                        onFocus={e => e.target.style.borderColor = "rgba(253,230,138,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(148,163,184,0.18)"} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ ...serif, display: "block", color: "rgba(148,163,184,0.68)", fontSize: 11, marginBottom: 6, letterSpacing: "0.08em" }}>想說的話</label>
                    <textarea rows={5} value={msg.content} onChange={e => setMsg(p => ({ ...p, content: e.target.value }))} placeholder="想問什麼、想說什麼，都可以……"
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.75 }}
                      onFocus={e => e.target.style.borderColor = "rgba(253,230,138,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(148,163,184,0.18)"} />
                  </div>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={send} disabled={loading}
                    style={{ width: "100%", padding: 11, borderRadius: 999, background: "rgba(253,230,138,0.07)", border: "1px solid rgba(253,230,138,0.32)", color: "#FDE68A", fontSize: 11, letterSpacing: "0.2em", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                    {loading ? "傳送中…" : "送出訊息 →"}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="csent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                  style={{ padding: "40px 32px", borderRadius: 18, ...glassBase, textAlign: "center" }}>
                  <p style={{ ...serif, color: "#FDE68A", fontSize: "1.1rem", lineHeight: 2 }}>訊息已送出，謝謝你。</p>
                  <p style={{ ...serif, color: "rgba(148,163,184,0.62)", fontSize: 12, marginTop: 10, lineHeight: 1.9 }}>我們會盡快回覆。</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="text-center" style={{ marginTop: 80, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(71,85,105,0.52)", fontSize: 9, letterSpacing: "0.4em" }}>
            © WEI · LIANG · ISLAND · GLOW · 微亮嶼光 · 2025
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   App
───────────────────────────────────────────── */

export default function App() {
  return (
    <div className="relative min-h-screen w-full text-slate-100"
      style={{ background: "linear-gradient(180deg, #020617 0%, #0A1120 30%, #0F172A 60%, #020617 100%)", fontFamily: "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&family=Noto+Sans+TC:wght@300;400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #020617; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(253,230,138,0.15); border-radius: 4px; }
        ::selection { background: rgba(253,230,138,0.2); color: #FDE68A; }
        input, textarea, select, button { font-family: 'Noto Sans TC', sans-serif; }
        select option { background: #1E293B; color: #E2E8F0; }
        @supports not (backdrop-filter: blur(1px)) {
          [style*="backdropFilter"] { background: rgba(10,17,40,0.9) !important; }
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0" style={{ opacity: 0.03, mixBlendMode: "overlay", zIndex: 10,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(253,230,138,0.02) 0%, transparent 55%)", zIndex: 5 }} />

      <ScrollProgress />
      <Particles />
      <Navbar />

      <main className="relative" style={{ zIndex: 20 }}>
        <Hero />
        <RelaySection />
        <AwarenessSection />
        <ModulesSection />
        <Closing />
        <ContactSection />
      </main>
    </div>
  );
}
