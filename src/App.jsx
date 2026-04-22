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
