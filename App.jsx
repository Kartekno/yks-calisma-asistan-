import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen, BarChart3, Timer, CheckSquare, Plus, ChevronLeft, ChevronRight,
  Trash2, Play, Pause, RotateCcw, Coffee, X, Home, Clock, Bell,
  TrendingUp, Award, ChevronDown, ChevronUp, Calendar, CalendarDays, Target,
  ArrowRightLeft, Copy, Sparkles, Send, Wand2, Lightbulb, ImagePlus, Maximize2, Minimize2
} from "lucide-react";

/* ============================================================
   EĞİTİM DESTEK UYGULAMASI - Önizleme
   ============================================================ */

const C = {
  bg: "#0f1117",
  bg2: "#171a23",
  card: "#1d212e",
  cardHi: "#252a3a",
  ink: "#eef1f8",
  sub: "#9aa3b8",
  line: "#2b3142",
  amber: "#f4a73a",
  amberGlow: "rgba(244,167,58,0.18)",
  teal: "#3ad6c0",
  rose: "#ff6b6b",
  green: "#4ade80",
  blue: "#5b8def",
  purple: "#a78bfa",
};

const fontDisplay = `'Fraunces', Georgia, serif`;
const fontBody = `'Outfit', -apple-system, sans-serif`;

/* ---------- localStorage tabanlı kalıcı store ---------- */
const load = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ---------- günlük istatistik (soru sayısı + çalışma dakikası) ---------- */
// yapı: { "2026-05-31": { q: 40, min: 90 }, ... }
const getDaily = () => load("eg_daily", {});
const setDaily = (obj) => save("eg_daily", obj);
const bumpDaily = (dateIso, field, delta) => {
  const all = { ...getDaily() };
  const cur = all[dateIso] || { q: 0, min: 0 };
  const next = Math.max(0, (cur[field] || 0) + delta);
  all[dateIso] = { ...cur, [field]: next };
  setDaily(all);
};
const setDailyValue = (dateIso, field, value) => {
  const all = { ...getDaily() };
  const cur = all[dateIso] || { q: 0, min: 0 };
  all[dateIso] = { ...cur, [field]: Math.max(0, value) };
  setDaily(all);
};

/* ---------- günlük hedefler ---------- */
// { q: 60, min: 180 }  (soru hedefi, dakika hedefi)
const getGoals = () => load("eg_goals", { q: 50, min: 120 });
const setGoals = (g) => save("eg_goals", g);

/* ---------- rozetler ---------- */
// kazanılan rozetler: { "2026-05-31_q": true, "2026-05-31_min": true, "2026-05-31_both": true }
const getBadges = () => load("eg_badges", {});
const setBadges = (b) => save("eg_badges", b);
// o gün için hedef durumunu değerlendirip yeni rozet varsa ekle, kazanılan yeni rozetleri döndür
const evaluateBadges = (dateIso) => {
  const daily = getDaily()[dateIso] || { q: 0, min: 0 };
  const goals = getGoals();
  const badges = { ...getBadges() };
  const newly = [];
  const grant = (key) => { if (!badges[key]) { badges[key] = true; newly.push(key); } };
  const qHit = goals.q > 0 && daily.q >= goals.q;
  const mHit = goals.min > 0 && daily.min >= goals.min;
  if (qHit) grant(`${dateIso}_q`);
  if (mHit) grant(`${dateIso}_min`);
  if (qHit && mHit) grant(`${dateIso}_both`);
  if (newly.length) setBadges(badges);
  return newly;
};
// toplam rozet sayıları
const badgeCounts = () => {
  const b = getBadges();
  let q = 0, min = 0, both = 0;
  Object.keys(b).forEach(k => {
    if (k.endsWith("_both")) both++;
    else if (k.endsWith("_q")) q++;
    else if (k.endsWith("_min")) min++;
  });
  return { q, min, both, total: q + min + both };
};

/* ============================================================
   YKS Ders Tanımları
   ============================================================ */
const TYT_DERS = {
  "Türkçe": 40, "Matematik": 40, "Fen Bilimleri": 20, "Sosyal Bilimler": 20,
};
const AYT_DERS = {
  "Matematik": 40, "Fizik": 14, "Kimya": 13, "Biyoloji": 13,
  "Edebiyat": 24, "Tarih": 21, "Coğrafya": 17,
};
const net = (d, y) => Math.max(0, d - y / 4);

/* ============================================================
   ROOT
   ============================================================ */
export default function App() {
  const [tab, setTab] = useState("home");

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.ink,
      fontFamily: fontBody, position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px);} to {opacity:1; transform:none;} }
        @keyframes pop { 0%{transform:scale(.9);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .fade { animation: fadeUp .4s ease both; }
        input, select, textarea { font-family: ${fontBody}; }
        button { font-family: ${fontBody}; cursor: pointer; border: none; }
      `}</style>

      {/* Telefon çerçevesi */}
      <div style={{
        maxWidth: 430, margin: "0 auto", minHeight: "100vh",
        background: `radial-gradient(1200px 600px at 50% -10%, ${C.bg2}, ${C.bg})`,
        position: "relative", paddingBottom: 92,
      }}>
        <Header tab={tab} />
        <div style={{ padding: "0 18px" }}>
          {tab === "home" && <HomeTab go={setTab} />}
          {tab === "books" && <BooksTab />}
          {tab === "exams" && <ExamsTab />}
          {tab === "timer" && <TimerTab />}
          {tab === "tasks" && <TasksTab />}
          {tab === "week" && <WeekTab />}
          {tab === "ai" && <AITab />}
        </div>
        <NavBar tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
const TITLES = {
  home: ["Merhaba 👋", "Bugün ne çalışıyoruz?"],
  books: ["Kaynaklarım", "Kitap & test takibi"],
  exams: ["Deneme Takibi", "Net analizi & grafikler"],
  timer: ["Çalışma Saati", "Odaklan ve dinlen"],
  tasks: ["Günlük Görevler", "Saatlik plan"],
  week: ["Haftalık Takvim", "Saat saat planla"],
  ai: ["AI Koç", "Konu anlat · program yap"],
};
function Header({ tab }) {
  const [t, s] = TITLES[tab];
  return (
    <div style={{ padding: "26px 18px 14px" }}>
      <div className="fade" key={tab}>
        <div style={{ fontSize: 13, color: C.amber, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{s}</div>
        <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 700, marginTop: 2, lineHeight: 1.1 }}>{t}</div>
      </div>
    </div>
  );
}

/* ============================================================
   NAVBAR
   ============================================================ */
function NavBar({ tab, setTab }) {
  // Ana tam ortada: sol 3 + Ana(orta) + sağ 3
  const left = [
    ["books", BookOpen, "Kaynak"],
    ["exams", BarChart3, "Deneme"],
    ["week", CalendarDays, "Takvim"],
  ];
  const right = [
    ["tasks", CheckSquare, "Görev"],
    ["timer", Timer, "Saat"],
    ["ai", Sparkles, "AI Koç"],
  ];

  const Item = ([id, Icon, label]) => {
    const on = tab === id;
    return (
      <button key={id} onClick={() => setTab(id)} style={{
        background: "none", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 3, padding: "4px 2px", color: on ? C.amber : C.sub,
        transition: "color .2s", flex: 1, minWidth: 0,
      }}>
        <div style={{
          padding: 6, borderRadius: 11,
          background: on ? C.amberGlow : "transparent", transition: "all .2s",
        }}>
          <Icon size={20} strokeWidth={on ? 2.4 : 1.9} />
        </div>
        <span style={{ fontSize: 9.5, fontWeight: on ? 600 : 500 }}>{label}</span>
      </button>
    );
  };

  const homeOn = tab === "home";
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, background: "rgba(23,26,35,0.92)",
      backdropFilter: "blur(16px)", borderTop: `1px solid ${C.line}`,
      display: "flex", alignItems: "flex-end", justifyContent: "space-around",
      padding: "8px 4px 26px", zIndex: 50,
    }}>
      {left.map(Item)}

      {/* Ana - tam ortada vurgulu buton */}
      <button onClick={() => setTab("home")} style={{
        background: "none", display: "flex", flexDirection: "column", alignItems: "center",
        gap: 4, padding: "0 2px", flex: 1, minWidth: 0, marginTop: -18,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: homeOn ? C.amber : C.card,
          border: `3px solid ${C.bg2}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: homeOn ? `0 6px 18px ${C.amberGlow}` : "0 4px 12px rgba(0,0,0,.4)",
          transition: "all .2s",
        }}>
          <Home size={24} color={homeOn ? "#1a1206" : C.sub} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: 9.5, fontWeight: homeOn ? 700 : 500, color: homeOn ? C.amber : C.sub }}>Ana</span>
      </button>

      {right.map(Item)}
    </div>
  );
}

/* ============================================================
   ANA SAYFA
   ============================================================ */
function HomeTab({ go }) {
  const books = load("eg_books", []);
  const exams = load("eg_exams", []);
  const tasks = load("eg_tasks", []);
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.date === today);
  const doneT = todayTasks.filter(t => t.done).length;

  const [daily, setDailyState] = useState(() => getDaily());
  const [goals, setGoalsState] = useState(() => getGoals());
  const [badges, setBadgesState] = useState(() => badgeCounts());
  const [editGoals, setEditGoals] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // yeni kazanılan rozet anahtarı
  // bu haftanın 7 günü (Pzt-Paz)
  const wkStart = mondayOf(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wkStart); d.setDate(d.getDate() + i); return iso(d);
  });
  const todayIso = iso(new Date());
  const refresh = () => setDailyState({ ...getDaily() });

  // değer değişince rozetleri değerlendir, yeni rozet varsa kutla
  const checkBadges = () => {
    const newly = evaluateBadges(todayIso);
    if (newly.length) {
      setBadgesState(badgeCounts());
      // en değerli rozeti kutla (both > diğerleri)
      const best = newly.find(k => k.endsWith("_both")) || newly[0];
      setCelebrate(best.endsWith("_both") ? "both" : best.endsWith("_q") ? "q" : "min");
    }
  };
  const adjust = (field, delta) => {
    bumpDaily(todayIso, field, delta);
    refresh();
    checkBadges();
  };
  const saveGoals = (g) => {
    setGoals(g); setGoalsState(g); setEditGoals(false);
    checkBadges(); // yeni hedef düşükse anında rozet kazanılabilir
  };

  // bugünkü hedef durumu
  const todayQ = (daily[todayIso]?.q) || 0;
  const todayMin = (daily[todayIso]?.min) || 0;
  const qHit = goals.q > 0 && todayQ >= goals.q;
  const mHit = goals.min > 0 && todayMin >= goals.min;

  const cards = [
    { id: "books", Icon: BookOpen, label: "Kaynaklar", val: `${books.length} kitap`, c: C.amber },
    { id: "exams", Icon: BarChart3, label: "Denemeler", val: `${exams.length} deneme`, c: C.teal },
    { id: "week", Icon: CalendarDays, label: "Takvim", val: "Haftalık plan", c: C.rose },
    { id: "timer", Icon: Timer, label: "Çalışma", val: "Pomodoro", c: C.purple },
    { id: "tasks", Icon: CheckSquare, label: "Görevler", val: `${doneT}/${todayTasks.length} bugün`, c: C.blue },
  ];

  return (
    <div className="fade">
      <HomeCarousel todayTasks={todayTasks} doneT={doneT} exams={exams} go={go} />

      {/* günlük soru / çalışma grafikleri - kaydırmalı */}
      <StatsCarousel>
        <DailyChartCard
          title="Günlük Çözülen Soru"
          unit="soru"
          color={C.teal}
          weekDays={weekDays}
          daily={daily}
          field="q"
          todayIso={todayIso}
          onAdjust={(d) => adjust("q", d)}
          steps={[10, 5]}
          goal={goals.q}
          hit={qHit}
        />
        <DailyChartCard
          title="Günlük Çalışma Süresi"
          unit="dk"
          color={C.purple}
          weekDays={weekDays}
          daily={daily}
          field="min"
          todayIso={todayIso}
          onAdjust={(d) => adjust("min", d)}
          steps={[30, 15]}
          formatVal={(v) => v >= 60 ? `${Math.floor(v / 60)}s ${v % 60}dk` : `${v}dk`}
          goal={goals.min}
          hit={mHit}
        />
      </StatsCarousel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        {cards.map((c, i) => (
          <button key={c.id} onClick={() => go(c.id)} className="fade"
            style={{
              animationDelay: `${i * 0.06}s`,
              background: C.card, borderRadius: 18, padding: 16, textAlign: "left",
              border: `1px solid ${C.line}`, color: C.ink, transition: "transform .15s",
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(.97)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: `${c.c}22`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
            }}>
              <c.Icon size={22} color={c.c} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{c.label}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{c.val}</div>
          </button>
        ))}
      </div>

      {/* rozet özeti + hedef ayarı */}
      <div style={{
        background: `linear-gradient(135deg, ${C.card}, ${C.bg2})`, borderRadius: 18, padding: 16,
        border: `1px solid ${C.line}`, marginTop: 18,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: badges.total > 0 ? `${C.amber}22` : C.bg2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Award size={28} color={badges.total > 0 ? C.amber : C.sub} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Rozetler · {badges.total}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
            🎯 {badges.both} altın · 📘 {badges.q} soru · ⏱️ {badges.min} süre
          </div>
        </div>
        <button onClick={() => setEditGoals(true)} style={{
          background: C.bg2, border: `1px solid ${C.line}`, color: C.amber,
          padding: "9px 12px", borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Target size={15} /> Hedef
        </button>
      </div>

      <RecentExams exams={exams} />

      {editGoals && <GoalSheet goals={goals} onClose={() => setEditGoals(false)} onSave={saveGoals} />}
      {celebrate && <BadgeCelebration kind={celebrate} onClose={() => setCelebrate(null)} />}
    </div>
  );
}

/* ---- Hedef belirleme ---- */
function GoalSheet({ goals, onClose, onSave }) {
  const [q, setQ] = useState(String(goals.q));
  const [min, setMin] = useState(String(goals.min));
  return (
    <Sheet onClose={onClose} title="Günlük Hedefler">
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
        Hedefe ulaşınca veya aşınca o gün için rozet kazanırsın. İkisini birden tutturursan altın rozet!
      </div>
      <Field label="Günlük Soru Hedefi" value={q} onChange={setQ} type="number" placeholder="50" />
      <Field label="Günlük Çalışma Hedefi (dakika)" value={min} onChange={setMin} type="number" placeholder="120" />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[60, 90, 120, 180, 240].map(m => (
          <button key={m} onClick={() => setMin(String(m))} style={{
            padding: "7px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: String(m) === min ? C.purple : C.bg2, color: String(m) === min ? "#fff" : C.sub,
            border: `1px solid ${C.line}`, cursor: "pointer",
          }}>{m >= 60 ? `${m / 60}s` : `${m}dk`}</button>
        ))}
      </div>
      <PrimaryBtn onClick={() => onSave({ q: Math.max(0, parseInt(q) || 0), min: Math.max(0, parseInt(min) || 0) })}>
        Hedefleri Kaydet
      </PrimaryBtn>
    </Sheet>
  );
}

/* ---- Rozet kutlaması ---- */
function BadgeCelebration({ kind, onClose }) {
  const info = {
    both: { emoji: "🏆", title: "Altın Rozet!", desc: "Bugün hem soru hem çalışma hedefini tuttun. Harikasın!", c: C.amber },
    q: { emoji: "📘", title: "Soru Rozeti!", desc: "Günlük soru hedefine ulaştın. Devam et!", c: C.teal },
    min: { emoji: "⏱️", title: "Çalışma Rozeti!", desc: "Günlük çalışma hedefine ulaştın. Tebrikler!", c: C.purple },
  }[kind];
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 30,
      animation: "fadeUp .2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bg2, borderRadius: 24, padding: "32px 26px", textAlign: "center",
        border: `1px solid ${info.c}`, boxShadow: `0 0 60px ${info.c}44`, maxWidth: 320,
        animation: "pop .35s ease",
      }}>
        <div style={{ fontSize: 72, lineHeight: 1, animation: "pulse 1.2s ease infinite" }}>{info.emoji}</div>
        <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 700, color: info.c, marginTop: 12 }}>{info.title}</div>
        <div style={{ fontSize: 15, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>{info.desc}</div>
        <PrimaryBtn onClick={onClose} style={{ marginTop: 22, background: info.c, color: "#0f1117" }}>
          Devam et
        </PrimaryBtn>
      </div>
    </div>
  );
}

/* ---- Ana sayfa üst karuseli: görevler ↔ deneme grafiği (yatay kaydırma) ---- */
function HomeCarousel({ todayTasks, doneT, exams, go }) {
  const [page, setPage] = useState(0);
  const ref = useRef(null);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(p);
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        ref={ref}
        onScroll={onScroll}
        style={{
          display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
          gap: 0, borderRadius: 22, scrollBehavior: "smooth",
        }}
      >
        {/* Sayfa 1: bugünün görevleri */}
        <div style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>
          <TodayTasksPanel todayTasks={todayTasks} doneT={doneT} go={go} />
        </div>
        {/* Sayfa 2: deneme grafiği */}
        <div style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>
          <ExamMiniPanel exams={exams} go={go} />
        </div>
      </div>

      {/* sayfa noktaları */}
      <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 10 }}>
        {[0, 1].map(i => (
          <button key={i} onClick={() => {
            const el = ref.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
          }} style={{
            width: page === i ? 22 : 8, height: 8, borderRadius: 4,
            background: page === i ? C.amber : C.line, border: "none",
            transition: "all .25s", cursor: "pointer",
          }} />
        ))}
      </div>
    </div>
  );
}

/* ---- Genel kaydırmalı karusel (günlük grafikler için) ---- */
function StatsCarousel({ children }) {
  const [page, setPage] = useState(0);
  const ref = useRef(null);
  const pages = React.Children.toArray(children);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(p);
  };

  return (
    <div style={{ marginTop: 18 }}>
      <div
        ref={ref}
        onScroll={onScroll}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollBehavior: "smooth" }}
      >
        {pages.map((child, i) => (
          <div key={i} style={{ flex: "0 0 100%", scrollSnapAlign: "start", paddingRight: i < pages.length - 1 ? 0 : 0 }}>
            {child}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 8 }}>
        {pages.map((_, i) => (
          <button key={i} onClick={() => {
            const el = ref.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
          }} style={{
            width: page === i ? 22 : 8, height: 8, borderRadius: 4,
            background: page === i ? C.amber : C.line, border: "none",
            transition: "all .25s", cursor: "pointer",
          }} />
        ))}
      </div>
    </div>
  );
}

function TodayTasksPanel({ todayTasks, doneT, go }) {
  const sorted = [...todayTasks].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const upcoming = sorted.filter(t => !t.done).slice(0, 3);
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.amber}, #e0851f)`,
      borderRadius: 22, padding: 22, color: "#1a1206",
      position: "relative", overflow: "hidden", minHeight: 168,
      boxShadow: `0 12px 30px ${C.amberGlow}`,
    }}>
      <div style={{ position: "absolute", right: -20, top: -20, opacity: .16 }}>
        <CheckSquare size={130} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: .8 }}>BUGÜNÜN GÖREVLERİ</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{doneT}/{todayTasks.length}</div>
      </div>
      {todayTasks.length === 0 ? (
        <>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, marginTop: 8 }}>
            Bugün için plan yok
          </div>
          <button onClick={() => go("tasks")} style={{
            marginTop: 14, background: "rgba(26,18,6,.15)", color: "#1a1206",
            border: "none", padding: "9px 16px", borderRadius: 30, fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>+ Görev ekle</button>
        </>
      ) : (
        <>
          {/* ilerleme çubuğu */}
          <div style={{ height: 7, background: "rgba(26,18,6,.18)", borderRadius: 4, marginTop: 10, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(doneT / todayTasks.length) * 100}%`, background: "#1a1206", borderRadius: 4, transition: "width .3s" }} />
          </div>
          {upcoming.length > 0 ? upcoming.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ fontFamily: fontDisplay, fontSize: 13, fontWeight: 700, width: 42 }}>{t.time}</div>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color || "#1a1206", flexShrink: 0 }} />
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
            </div>
          )) : (
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 700 }}>Hepsi tamam! 🎉</div>
          )}
        </>
      )}
    </div>
  );
}

function ExamMiniPanel({ exams, go }) {
  // son denemeler (en fazla 8), net gelişimi
  const recent = exams.slice(-8);
  const tytAvg = avgOf(exams.filter(e => e.type === "TYT"));
  const aytAvg = avgOf(exams.filter(e => e.type === "AYT"));

  return (
    <div onClick={() => go("exams")} style={{
      background: `linear-gradient(135deg, #1f6f64, #134c45)`,
      borderRadius: 22, padding: 20, color: "#eafff9",
      position: "relative", overflow: "hidden", minHeight: 168, cursor: "pointer",
      boxShadow: `0 12px 30px rgba(58,214,192,.18)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: .8 }}>DENEME NET GELİŞİMİ</div>
        <BarChart3 size={18} style={{ opacity: .7 }} />
      </div>

      {recent.length === 0 ? (
        <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, marginTop: 10 }}>
          Henüz deneme yok
        </div>
      ) : (
        <>
          {/* mini sparkline çubuklar */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 70 }}>
            {recent.map((e, i) => {
              const maxNet = e.type === "TYT" ? 120 : 80;
              const h = Math.max(6, (e.total / maxNet) * 64);
              const col = e.type === "TYT" ? "#7ef0dd" : "#cdbcff";
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, opacity: .9 }}>{e.total.toFixed(0)}</div>
                  <div style={{ width: "100%", maxWidth: 24, height: h, background: col, borderRadius: "4px 4px 0 0" }} />
                </div>
              );
            })}
          </div>
          {/* ortalamalar */}
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {tytAvg != null && (
              <div><span style={{ fontSize: 11, opacity: .75 }}>TYT ort. </span>
                <b style={{ fontFamily: fontDisplay, fontSize: 16 }}>{tytAvg.toFixed(1)}</b></div>
            )}
            {aytAvg != null && (
              <div><span style={{ fontSize: 11, opacity: .75 }}>AYT ort. </span>
                <b style={{ fontFamily: fontDisplay, fontSize: 16 }}>{aytAvg.toFixed(1)}</b></div>
            )}
            <div style={{ marginLeft: "auto", fontSize: 12, opacity: .8, alignSelf: "center" }}>detay →</div>
          </div>
        </>
      )}
    </div>
  );
}
const avgOf = (arr) => arr.length ? arr.reduce((a, e) => a + e.total, 0) / arr.length : null;

/* ---- Ana sayfa haftalık çubuk grafik + bugünkü hızlı düzenleme ---- */
const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
function DailyChartCard({ title, unit, color, weekDays, daily, field, todayIso, onAdjust, steps, formatVal, goal, hit }) {
  const values = weekDays.map(d => (daily[d]?.[field]) || 0);
  const max = Math.max(...values, goal || 0, 1);
  const total = values.reduce((a, b) => a + b, 0);
  const todayVal = (daily[todayIso]?.[field]) || 0;
  const fmt = formatVal || ((v) => `${v}`);
  const chartH = 90;
  const goalY = goal > 0 ? Math.min(chartH, (goal / max) * chartH) : 0;

  return (
    <div style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${hit ? color : C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>{title.toUpperCase()}</div>
        <div style={{ fontSize: 12, color: C.sub }}>bu hafta toplam <b style={{ color }}>{fmt(total)}</b></div>
      </div>
      {goal > 0 && (
        <div style={{ fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={13} color={color} />
          <span style={{ color: C.sub }}>Hedef: <b style={{ color: C.ink }}>{fmt(goal)}</b></span>
          {hit && <span style={{ color, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><Award size={13} /> tutturuldu!</span>}
        </div>
      )}

      {/* çubuklar (hedef çizgisiyle) */}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 8, height: chartH + 30 }}>
        {goal > 0 && (
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 30 + goalY,
            borderTop: `2px dashed ${color}88`, zIndex: 1, pointerEvents: "none",
          }}>
            <span style={{ position: "absolute", right: 0, top: -14, fontSize: 9, color, fontWeight: 700 }}>hedef</span>
          </div>
        )}
        {weekDays.map((d, i) => {
          const v = values[i];
          const isToday = d === todayIso;
          const dayHit = goal > 0 && v >= goal;
          return (
            <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: v > 0 ? color : C.sub, display: "flex", alignItems: "center", gap: 2 }}>
                {dayHit && "⭐"}{v > 0 ? v : ""}
              </div>
              <div style={{
                width: "100%", maxWidth: 30,
                height: `${Math.max(4, (v / max) * chartH)}px`,
                background: v > 0 ? `linear-gradient(to top, ${color}, ${color}99)` : C.line,
                borderRadius: "6px 6px 0 0",
                outline: isToday ? `2px solid ${color}` : "none", outlineOffset: 1,
                transition: "height .3s ease",
              }} />
              <div style={{ fontSize: 10, color: isToday ? color : C.sub, fontWeight: isToday ? 700 : 500 }}>{DAY_SHORT[i]}</div>
            </div>
          );
        })}
      </div>

      {/* bugünkü hızlı düzenleme */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}`,
      }}>
        <div style={{ fontSize: 13, color: C.sub }}>
          Bugün: <b style={{ color: hit ? color : C.ink }}>{fmt(todayVal)}</b>
          {hit && " ✓"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onAdjust(-steps[0])} style={adjBtn}>−{steps[0]}</button>
          <button onClick={() => onAdjust(-steps[1])} style={adjBtn}>−{steps[1]}</button>
          <button onClick={() => onAdjust(steps[1])} style={{ ...adjBtn, color, borderColor: color }}>+{steps[1]}</button>
          <button onClick={() => onAdjust(steps[0])} style={{ ...adjBtn, color, borderColor: color }}>+{steps[0]}</button>
        </div>
      </div>
    </div>
  );
}
const adjBtn = {
  minWidth: 38, padding: "7px 4px", borderRadius: 9, background: C.bg2,
  border: `1px solid ${C.line}`, color: C.sub, fontSize: 13, fontWeight: 700, cursor: "pointer",
};

function RecentExams({ exams }) {
  if (!exams.length) return null;
  const last = [...exams].reverse().slice(0, 3);
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: C.sub }}>Son Denemeler</div>
      {last.map((e, i) => (
        <div key={i} style={{
          background: C.card, borderRadius: 14, padding: "12px 14px", marginBottom: 8,
          display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.line}`,
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>{e.name}</div>
            <div style={{ fontSize: 12, color: C.sub }}>{e.type} · {e.date}</div>
          </div>
          <div style={{
            fontFamily: fontDisplay, fontSize: 22, fontWeight: 700,
            color: e.type === "TYT" ? C.teal : C.purple,
          }}>{e.total.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   KAYNAK KİTAPLAR  (kitap → bölüm/alt konu → test → soru sayısı)
   ============================================================ */
function BooksTab() {
  const [books, setBooks] = useState(() => load("eg_books", []));
  const [openBook, setOpenBook] = useState(null);
  const [addBook, setAddBook] = useState(false);

  useEffect(() => save("eg_books", books), [books]);

  const createBook = (name, subject) => {
    setBooks([...books, { id: Date.now(), name, subject, sections: [] }]);
    setAddBook(false);
  };
  const updateBook = (b) => setBooks(books.map(x => x.id === b.id ? b : x));
  const delBook = (id) => { setBooks(books.filter(b => b.id !== id)); setOpenBook(null); };

  if (openBook) {
    const book = books.find(b => b.id === openBook);
    if (book) return <BookDetail book={book} onChange={updateBook} onDel={delBook} back={() => setOpenBook(null)} />;
  }

  return (
    <div className="fade">
      {books.length === 0 && (
        <Empty Icon={BookOpen} text="Henüz kaynak kitap eklemedin." />
      )}
      {books.map(b => {
        const testCount = b.sections.reduce((a, s) => a + s.tests.length, 0);
        const qCount = b.sections.reduce((a, s) => a + s.tests.reduce((x, t) => x + (t.questions || 0), 0), 0);
        return (
          <button key={b.id} onClick={() => setOpenBook(b.id)} style={{
            width: "100%", textAlign: "left", background: C.card, borderRadius: 16,
            padding: 16, marginBottom: 12, border: `1px solid ${C.line}`, color: C.ink,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 46, height: 60, borderRadius: 6,
              background: `linear-gradient(160deg, ${C.amber}, #c66f12)`,
              boxShadow: "inset -4px 0 8px rgba(0,0,0,.25)", flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{b.name}</div>
              <div style={{ fontSize: 13, color: C.amber, marginTop: 2 }}>{b.subject}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
                {b.sections.length} bölüm · {testCount} test · {qCount} soru
              </div>
            </div>
            <ChevronRight size={20} color={C.sub} />
          </button>
        );
      })}

      <FAB onClick={() => setAddBook(true)} label="Kitap Ekle" />
      {addBook && <AddBookSheet onClose={() => setAddBook(false)} onSave={createBook} />}
    </div>
  );
}

function AddBookSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  return (
    <Sheet onClose={onClose} title="Yeni Kaynak Kitap">
      <Field label="Kitap Adı" value={name} onChange={setName} placeholder="Örn. 345 TYT Matematik" />
      <Field label="Ders / Konu" value={subject} onChange={setSubject} placeholder="Örn. Matematik" />
      <PrimaryBtn disabled={!name.trim()} onClick={() => onSave(name.trim(), subject.trim() || "Genel")}>
        Kaydet
      </PrimaryBtn>
    </Sheet>
  );
}

function BookDetail({ book, onChange, onDel, back }) {
  const [addSec, setAddSec] = useState(false);
  const [addTestTo, setAddTestTo] = useState(null);
  const [openSec, setOpenSec] = useState(null);

  const addSection = (name) => {
    onChange({ ...book, sections: [...book.sections, { id: Date.now(), name, tests: [] }] });
    setAddSec(false);
  };
  const addTest = (secId, name, questions) => {
    onChange({
      ...book,
      sections: book.sections.map(s => s.id === secId
        ? { ...s, tests: [...s.tests, { id: Date.now(), name, questions, done: false }] }
        : s),
    });
    setAddTestTo(null);
  };
  const toggleTest = (secId, testId) => {
    const sec = book.sections.find(s => s.id === secId);
    const test = sec?.tests.find(t => t.id === testId);
    if (test) {
      // çözüldü -> bugünün soru sayısına ekle, geri al -> düş
      const delta = test.done ? -(test.questions || 0) : (test.questions || 0);
      const todayIso = new Date().toISOString().slice(0, 10);
      bumpDaily(todayIso, "q", delta);
      if (delta > 0) evaluateBadges(todayIso);
    }
    onChange({
      ...book,
      sections: book.sections.map(s => s.id === secId
        ? { ...s, tests: s.tests.map(t => t.id === testId ? { ...t, done: !t.done } : t) }
        : s),
    });
  };
  const delTest = (secId, testId) => {
    onChange({
      ...book,
      sections: book.sections.map(s => s.id === secId
        ? { ...s, tests: s.tests.filter(t => t.id !== testId) }
        : s),
    });
  };
  const delSec = (secId) => onChange({ ...book, sections: book.sections.filter(s => s.id !== secId) });

  return (
    <div className="fade">
      <button onClick={back} style={{ background: "none", color: C.sub, display: "flex", alignItems: "center", gap: 4, marginBottom: 12, fontSize: 14 }}>
        <ChevronLeft size={18} /> Kaynaklar
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 700 }}>{book.name}</div>
          <div style={{ color: C.amber, fontSize: 14 }}>{book.subject}</div>
        </div>
        <ConfirmBtn onConfirm={() => onDel(book.id)}
          style={{ background: `${C.rose}22`, padding: 9, borderRadius: 10, border: "none", cursor: "pointer" }}>
          <Trash2 size={18} color={C.rose} />
        </ConfirmBtn>
      </div>

      {book.sections.length === 0 && <Empty Icon={BookOpen} text="Bölüm / alt konu ekleyerek başla." />}

      {book.sections.map(s => {
        const open = openSec === s.id;
        const done = s.tests.filter(t => t.done).length;
        return (
          <div key={s.id} style={{ background: C.card, borderRadius: 16, marginBottom: 12, border: `1px solid ${C.line}`, overflow: "hidden" }}>
            <button onClick={() => setOpenSec(open ? null : s.id)} style={{
              width: "100%", background: "none", color: C.ink, padding: 15,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{done}/{s.tests.length} test çözüldü</div>
              </div>
              {open ? <ChevronUp size={18} color={C.sub} /> : <ChevronDown size={18} color={C.sub} />}
            </button>

            {open && (
              <div style={{ padding: "0 15px 15px" }}>
                {s.tests.map(t => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                    borderTop: `1px solid ${C.line}`,
                  }}>
                    <button onClick={() => toggleTest(s.id, t.id)} style={{
                      width: 24, height: 24, borderRadius: 7, background: t.done ? C.green : "transparent",
                      border: `2px solid ${t.done ? C.green : C.sub}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {t.done && <CheckSquare size={14} color="#0f1117" />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? .6 : 1 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: C.sub }}>{t.questions} soru</div>
                    </div>
                    <button onClick={() => delTest(s.id, t.id)} style={{ background: "none", padding: 4 }}>
                      <X size={16} color={C.sub} />
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => setAddTestTo(s.id)} style={{
                    flex: 1, background: C.amberGlow, color: C.amber, padding: "9px", borderRadius: 10,
                    fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <Plus size={15} /> Test Ekle
                  </button>
                  <ConfirmBtn onConfirm={() => delSec(s.id)} style={{
                    background: `${C.rose}18`, color: C.rose, padding: "9px 12px", borderRadius: 10, fontSize: 13, border: "none", cursor: "pointer",
                  }}>
                    <Trash2 size={15} color={C.rose} />
                  </ConfirmBtn>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={() => setAddSec(true)} style={{
        width: "100%", background: C.card, border: `1.5px dashed ${C.line}`, color: C.sub,
        padding: 14, borderRadius: 14, fontSize: 14, fontWeight: 600, display: "flex",
        alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4,
      }}>
        <Plus size={18} /> Bölüm / Alt Konu Ekle
      </button>

      {addSec && <AddSectionSheet onClose={() => setAddSec(false)} onSave={addSection} />}
      {addTestTo && <AddTestSheet onClose={() => setAddTestTo(null)} onSave={(n, q) => addTest(addTestTo, n, q)} />}
    </div>
  );
}

function AddSectionSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  return (
    <Sheet onClose={onClose} title="Bölüm / Alt Konu">
      <Field label="Ad" value={name} onChange={setName} placeholder="Örn. Türev" />
      <PrimaryBtn disabled={!name.trim()} onClick={() => onSave(name.trim())}>Ekle</PrimaryBtn>
    </Sheet>
  );
}
function AddTestSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  return (
    <Sheet onClose={onClose} title="Test Ekle">
      <Field label="Test Adı" value={name} onChange={setName} placeholder="Örn. Test 1" />
      <Field label="Soru Sayısı" value={q} onChange={setQ} placeholder="20" type="number" />
      <PrimaryBtn disabled={!name.trim()} onClick={() => onSave(name.trim(), parseInt(q) || 0)}>Ekle</PrimaryBtn>
    </Sheet>
  );
}

/* ============================================================
   DENEME TAKİP  (TYT/AYT, net hesabı, grafikler)
   ============================================================ */
function ExamsTab() {
  const [exams, setExams] = useState(() => load("eg_exams", []));
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState("grafik"); // grafik | liste
  const [graphType, setGraphType] = useState("TYT");

  useEffect(() => save("eg_exams", exams), [exams]);

  const addExam = (e) => { setExams([...exams, e]); setAdding(false); };
  const delExam = (id) => setExams(exams.filter(e => e.id !== id));

  return (
    <div className="fade">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, background: C.card, padding: 4, borderRadius: 12 }}>
        {["grafik", "liste"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: "9px", borderRadius: 9, fontSize: 14, fontWeight: 600,
            background: view === v ? C.amber : "transparent", color: view === v ? "#1a1206" : C.sub,
          }}>{v === "grafik" ? "📊 Grafik" : "📋 Tüm Denemeler"}</button>
        ))}
      </div>

      {view === "grafik"
        ? <ExamGraph exams={exams} graphType={graphType} setGraphType={setGraphType} />
        : <ExamList exams={exams} onDel={delExam} />}

      <FAB onClick={() => setAdding(true)} label="Deneme Ekle" />
      {adding && <AddExamSheet onClose={() => setAdding(false)} onSave={addExam} />}
    </div>
  );
}

function ExamGraph({ exams, graphType, setGraphType }) {
  const filtered = exams.filter(e => e.type === graphType);
  // aylık ortalama
  const byMonth = {};
  filtered.forEach(e => {
    const m = e.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(e.total);
  });
  const months = Object.keys(byMonth).sort();
  const avgData = months.map(m => ({
    label: m, avg: byMonth[m].reduce((a, b) => a + b, 0) / byMonth[m].length,
  }));
  const maxNet = graphType === "TYT" ? 120 : 80;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["TYT", "AYT"].map(t => (
          <button key={t} onClick={() => setGraphType(t)} style={{
            flex: 1, padding: "10px", borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: graphType === t ? (t === "TYT" ? C.teal : C.purple) : C.card,
            color: graphType === t ? "#0f1117" : C.sub, border: `1px solid ${C.line}`,
          }}>{t}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <Empty Icon={BarChart3} text={`Henüz ${graphType} denemesi yok.`} />
        : <>
          <div style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 4 }}>AYLIK NET ORTALAMASI</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 700, marginBottom: 16, color: graphType === "TYT" ? C.teal : C.purple }}>
              {(filtered.reduce((a, e) => a + e.total, 0) / filtered.length).toFixed(2)} <span style={{ fontSize: 14, color: C.sub }}>ort. net</span>
            </div>
            <BarsChart data={avgData} max={maxNet} color={graphType === "TYT" ? C.teal : C.purple} />
          </div>

          <div style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.line}`, marginTop: 14 }}>
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 14 }}>DENEME NET GELİŞİMİ</div>
            <LineChart data={filtered.map(e => ({ label: e.name, val: e.total }))} max={maxNet} color={graphType === "TYT" ? C.teal : C.purple} />
          </div>
        </>}
    </div>
  );
}

function BarsChart({ data, max, color }) {
  if (!data.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 150 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{d.avg.toFixed(1)}</div>
          <div style={{
            width: "100%", maxWidth: 44, height: `${Math.max(6, (d.avg / max) * 110)}px`,
            background: `linear-gradient(to top, ${color}, ${color}88)`, borderRadius: "8px 8px 0 0",
            animation: "fadeUp .5s ease both", animationDelay: `${i * 0.05}s`,
          }} />
          <div style={{ fontSize: 10, color: C.sub }}>{d.label.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, max, color }) {
  if (!data.length) return null;
  const W = 360, H = 130, pad = 10;
  const step = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => [pad + i * step, H - pad - (d.val / max) * (H - pad * 2)]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(W, data.length * 50)} height={H + 24} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g, i) => (
          <line key={i} x1={pad} x2={Math.max(W, data.length * 50) - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke={C.line} strokeWidth="1" />
        ))}
        <path d={`${path} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`} fill="url(#lg)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="4" fill={C.bg} stroke={color} strokeWidth="2.5" />
            <text x={p[0]} y={p[1] - 10} fontSize="10" fill={C.ink} textAnchor="middle" fontWeight="700">{data[i].val.toFixed(1)}</text>
            <text x={p[0]} y={H + 14} fontSize="9" fill={C.sub} textAnchor="middle">{data[i].label.slice(0, 8)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ExamList({ exams, onDel }) {
  const [open, setOpen] = useState(null);
  if (!exams.length) return <Empty Icon={BarChart3} text="Henüz deneme girmedin." />;
  return (
    <div>
      {[...exams].reverse().map(e => (
        <div key={e.id} style={{ background: C.card, borderRadius: 16, marginBottom: 10, border: `1px solid ${C.line}`, overflow: "hidden" }}>
          <button onClick={() => setOpen(open === e.id ? null : e.id)} style={{
            width: "100%", background: "none", color: C.ink, padding: 15,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                <span style={{ color: e.type === "TYT" ? C.teal : C.purple, fontWeight: 600 }}>{e.type}</span> · {e.date}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, color: e.type === "TYT" ? C.teal : C.purple }}>{e.total.toFixed(2)}</div>
              {open === e.id ? <ChevronUp size={18} color={C.sub} /> : <ChevronDown size={18} color={C.sub} />}
            </div>
          </button>
          {open === e.id && (
            <div style={{ padding: "0 15px 15px" }}>
              {e.subjects.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${C.line}`, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  <span style={{ color: C.sub }}>
                    <span style={{ color: C.green }}>{s.d}D</span> · <span style={{ color: C.rose }}>{s.y}Y</span> · <b style={{ color: C.ink }}>{net(s.d, s.y).toFixed(2)} net</b>
                  </span>
                </div>
              ))}
              <ConfirmBtn onConfirm={() => onDel(e.id)} label="Sil" confirmLabel="Emin misin? Sil"
                style={{ marginTop: 12, padding: 10, fontSize: 13 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddExamSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("TYT");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const dersler = type === "TYT" ? TYT_DERS : AYT_DERS;
  const [vals, setVals] = useState({});

  const setV = (ders, key, v) => {
    setVals(p => ({ ...p, [ders]: { ...(p[ders] || {}), [key]: v } }));
  };
  const totalNet = Object.keys(dersler).reduce((a, ders) => {
    const d = parseInt(vals[ders]?.d) || 0, y = parseInt(vals[ders]?.y) || 0;
    return a + net(d, y);
  }, 0);

  // soru sayısını aşan dersler
  const overList = Object.keys(dersler).filter(ders => {
    const d = parseInt(vals[ders]?.d) || 0, y = parseInt(vals[ders]?.y) || 0;
    return d + y > dersler[ders];
  });
  const hasOver = overList.length > 0;

  const handleSave = () => {
    if (hasOver) return;
    const subjects = Object.keys(dersler).map(ders => ({
      name: ders, d: parseInt(vals[ders]?.d) || 0, y: parseInt(vals[ders]?.y) || 0,
    }));
    onSave({ id: Date.now(), name: name.trim(), type, date, subjects, total: totalNet });
  };

  return (
    <Sheet onClose={onClose} title="Deneme Ekle" tall>
      <Field label="Deneme Adı" value={name} onChange={setName} placeholder="Örn. 3D Yayınları TYT-5" />
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["TYT", "AYT"].map(t => (
          <button key={t} onClick={() => { setType(t); setVals({}); }} style={{
            flex: 1, padding: "11px", borderRadius: 12, fontWeight: 700,
            background: type === t ? (t === "TYT" ? C.teal : C.purple) : C.bg2,
            color: type === t ? "#0f1117" : C.sub, border: `1px solid ${C.line}`,
          }}>{t}</button>
        ))}
      </div>
      <Field label="Tarih" value={date} onChange={setDate} type="date" />

      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, margin: "10px 0 6px" }}>DERSLER (Doğru / Yanlış)</div>
      {Object.keys(dersler).map(ders => {
        const d = parseInt(vals[ders]?.d) || 0, y = parseInt(vals[ders]?.y) || 0;
        const over = d + y > dersler[ders];
        return (
          <div key={ders}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: over ? 2 : 8,
              background: C.bg2, padding: "8px 10px", borderRadius: 12,
              border: over ? `1px solid ${C.rose}` : `1px solid transparent`,
            }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                {ders} <span style={{ color: over ? C.rose : C.sub, fontSize: 11 }}>({d + y}/{dersler[ders]})</span>
              </div>
              <input type="number" placeholder="D" value={vals[ders]?.d || ""} onChange={e => setV(ders, "d", e.target.value)}
                style={miniInput(over ? C.rose : C.green)} />
              <input type="number" placeholder="Y" value={vals[ders]?.y || ""} onChange={e => setV(ders, "y", e.target.value)}
                style={miniInput(over ? C.rose : C.rose)} />
              <div style={{ width: 46, textAlign: "right", fontSize: 13, fontWeight: 700, color: over ? C.rose : C.amber }}>{net(d, y).toFixed(1)}</div>
            </div>
            {over && (
              <div style={{ fontSize: 11, color: C.rose, margin: "0 0 8px 4px" }}>
                Soru sayısı olması gerekenden fazla: {d + y} girildi, en fazla {dersler[ders]} olmalı.
              </div>
            )}
          </div>
        );
      })}

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: C.amberGlow, padding: "12px 16px", borderRadius: 14, margin: "10px 0 14px",
      }}>
        <span style={{ fontWeight: 600 }}>Toplam Net</span>
        <span style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 700, color: C.amber }}>{totalNet.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 11, color: C.sub, textAlign: "center", marginBottom: 12 }}>
        4 yanlış 1 doğruyu götürür · net = doğru − (yanlış ÷ 4)
      </div>
      {hasOver && (
        <div style={{
          background: `${C.rose}18`, color: C.rose, fontSize: 13, fontWeight: 600,
          padding: "10px 14px", borderRadius: 12, marginBottom: 12, textAlign: "center",
        }}>
          Şu derslerde soru sayısı aşıldı: {overList.join(", ")}. Düzeltmeden kaydedilemez.
        </div>
      )}
      <PrimaryBtn disabled={!name.trim() || hasOver} onClick={handleSave}>Denemeyi Kaydet</PrimaryBtn>
    </Sheet>
  );
}
const miniInput = (c) => ({
  width: 42, padding: "7px 4px", textAlign: "center", borderRadius: 8,
  background: C.card, border: `1px solid ${C.line}`, color: c, fontWeight: 700, fontSize: 14, outline: "none",
});

/* ============================================================
   ZAMANLAYICI  (sade pomodoro + mola + tam ekran odak)
   ============================================================ */

function TimerTab() {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState("work"); // work | break
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [focus, setFocus] = useState(false); // tam ekran odak modu

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs(s => {
        // çalışma modunda her tam dakika geçişinde +1 dk kaydet
        if (mode === "work" && s > 1 && (s - 1) % 60 === 0) {
          const todayIso = new Date().toISOString().slice(0, 10);
          bumpDaily(todayIso, "min", 1);
          evaluateBadges(todayIso);
        }
        if (s <= 1) {
          // seans bitti: son dakikayı da say (çalışma ise)
          if (mode === "work") {
            const todayIso = new Date().toISOString().slice(0, 10);
            bumpDaily(todayIso, "min", 1);
            evaluateBadges(todayIso);
          }
          const nextMode = mode === "work" ? "break" : "work";
          setMode(nextMode);
          return (nextMode === "work" ? workMin : breakMin) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode, workMin, breakMin]);

  const reset = () => {
    setRunning(false);
    setSecs((mode === "work" ? workMin : breakMin) * 60);
  };
  const applyTimes = (w, b) => {
    setWorkMin(w); setBreakMin(b);
    setRunning(false);
    setSecs((mode === "work" ? w : b) * 60);
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const total = (mode === "work" ? workMin : breakMin) * 60;
  const pct = total ? (1 - secs / total) : 0;

  return (
    <div className="fade" style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 22, background: C.card, padding: 4, borderRadius: 12 }}>
        {[["work", "Çalışma", C.amber], ["break", "Mola", C.teal]].map(([m, l, c]) => (
          <button key={m} onClick={() => { setMode(m); setSecs((m === "work" ? workMin : breakMin) * 60); setRunning(false); }} style={{
            flex: 1, padding: "10px", borderRadius: 9, fontWeight: 700, fontSize: 14,
            background: mode === m ? c : "transparent", color: mode === m ? "#0f1117" : C.sub,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {m === "break" && <Coffee size={16} />} {l}
          </button>
        ))}
      </div>

      {/* Sade zaman göstergesi (yatay/dikey uyumlu) */}
      <div style={{
        background: C.card, borderRadius: 20, border: `1px solid ${C.line}`,
        padding: "30px 20px", marginBottom: 8,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 2,
          color: mode === "work" ? C.amber : C.teal, textTransform: "uppercase", marginBottom: 14,
        }}>{mode === "work" ? "ODAKLAN" : "DİNLEN"}</div>

        <div style={{
          fontFamily: fontDisplay, fontWeight: 700, lineHeight: 1,
          fontSize: "clamp(56px, 22vw, 96px)",
          fontVariantNumeric: "tabular-nums", letterSpacing: 2,
        }}>
          {mm}<span style={{ color: C.sub }}>:</span>{ss}
        </div>

        {/* ilerleme çubuğu */}
        <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden", marginTop: 22 }}>
          <div style={{
            height: "100%", width: `${pct * 100}%`,
            background: mode === "work" ? C.amber : C.teal,
            borderRadius: 3, transition: "width 1s linear",
          }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
        <button onClick={reset} style={circleBtn(C.card)}>
          <RotateCcw size={22} color={C.sub} />
        </button>
        <button onClick={() => setRunning(r => !r)} style={{
          ...circleBtn(mode === "work" ? C.amber : C.teal), width: 78, height: 78,
        }}>
          {running ? <Pause size={30} color="#0f1117" /> : <Play size={30} color="#0f1117" style={{ marginLeft: 3 }} />}
        </button>
        <button onClick={() => setFocus(true)} style={circleBtn(C.card)} title="Tam ekran odak">
          <Maximize2 size={22} color={C.sub} />
        </button>
      </div>

      {/* mola/çalışma ayarı */}
      <div style={{ background: C.card, borderRadius: 18, padding: 18, marginTop: 26, border: `1px solid ${C.line}`, textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 14 }}>SÜRE AYARLARI</div>
        <Stepper label="Çalışma (dk)" value={workMin} onChange={v => applyTimes(v, breakMin)} color={C.amber} min={5} max={90} step={5} />
        <div style={{ height: 12 }} />
        <Stepper label="Mola (dk)" value={breakMin} onChange={v => applyTimes(workMin, v)} color={C.teal} min={1} max={30} step={1} />
      </div>

      {focus && (
        <FocusOverlay
          mm={mm} ss={ss} mode={mode} pct={pct} running={running}
          onToggle={() => setRunning(r => !r)}
          onReset={reset}
          onClose={() => setFocus(false)}
        />
      )}
    </div>
  );
}

/* ---- Tam ekran sade geri sayım (dikkat dağıtmayan odak modu) ---- */
function FocusOverlay({ mm, ss, mode, pct, running, onToggle, onReset, onClose }) {
  const accent = mode === "work" ? C.amber : C.teal;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, background: "#07080c",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "fadeUp .25s ease",
    }}>
      {/* kapat */}
      <button onClick={onClose} style={{
        position: "absolute", top: 22, right: 22, background: "rgba(255,255,255,.06)",
        border: "none", borderRadius: 12, padding: 10, cursor: "pointer",
      }}>
        <Minimize2 size={22} color={C.sub} />
      </button>

      {/* etiket */}
      <div style={{
        fontSize: 13, fontWeight: 700, letterSpacing: 3, color: accent,
        textTransform: "uppercase", marginBottom: "4vh",
      }}>{mode === "work" ? "ODAKLAN" : "DİNLEN"}</div>

      {/* sade büyük saat - ekrana göre ölçeklenir (dikey/yatay) */}
      <div style={{
        fontFamily: fontDisplay, fontWeight: 700, color: "#e8ebf2", lineHeight: 1,
        fontSize: "min(34vw, 30vh, 360px)", fontVariantNumeric: "tabular-nums", letterSpacing: 2,
        userSelect: "none",
      }}>
        {mm}<span style={{ color: accent, opacity: .85 }}>:</span>{ss}
      </div>

      {/* ince ilerleme */}
      <div style={{ width: "min(70vw, 420px)", height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden", marginTop: "5vh" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: accent, borderRadius: 2, transition: "width 1s linear" }} />
      </div>

      {/* minimal kontroller */}
      <div style={{ display: "flex", gap: 18, marginTop: "6vh", alignItems: "center" }}>
        <button onClick={onReset} style={{
          width: 54, height: 54, borderRadius: "50%", background: "rgba(255,255,255,.06)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none",
        }}>
          <RotateCcw size={22} color={C.sub} />
        </button>
        <button onClick={onToggle} style={{
          width: 76, height: 76, borderRadius: "50%", background: accent,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none",
          boxShadow: `0 8px 30px ${accent}55`,
        }}>
          {running ? <Pause size={30} color="#0f1117" /> : <Play size={30} color="#0f1117" style={{ marginLeft: 3 }} />}
        </button>
        <div style={{ width: 54 }} />
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange, color, min, max, step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => onChange(Math.max(min, value - step))} style={stepBtn}>−</button>
        <span style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, color, width: 36, textAlign: "center" }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + step))} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
const stepBtn = {
  width: 34, height: 34, borderRadius: 10, background: C.cardHi, color: C.ink,
  fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
};
const circleBtn = (bg) => ({
  width: 56, height: 56, borderRadius: "50%", background: bg,
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 8px 20px rgba(0,0,0,.4)",
});

/* ============================================================
   GÜNLÜK GÖREVLER  (saatlik) + WIDGET önizleme
   ============================================================ */
function TasksTab() {
  const [tasks, setTasks] = useState(() => load("eg_tasks", []));
  const [adding, setAdding] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => save("eg_tasks", tasks), [tasks]);

  const todays = tasks.filter(t => t.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const addTask = (t) => { setTasks([...tasks, ...(Array.isArray(t) ? t : [t])]); setAdding(false); };
  const toggle = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const del = (id) => setTasks(tasks.filter(t => t.id !== id));

  const done = todays.filter(t => t.done).length;

  return (
    <div className="fade">
      {/* WIDGET kartı */}
      <button onClick={() => setShowWidget(true)} style={{
        width: "100%", textAlign: "left", marginBottom: 16,
        background: `linear-gradient(135deg, ${C.blue}, #3a6fd6)`,
        borderRadius: 20, padding: 18, color: "#fff", border: "none",
        boxShadow: "0 12px 30px rgba(91,141,239,.3)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: 12, top: 12, opacity: .25 }}><Calendar size={70} /></div>
        <div style={{ fontSize: 12, fontWeight: 700, opacity: .85, letterSpacing: 1 }}>📱 WIDGET ÖNİZLEME</div>
        <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, marginTop: 4 }}>Bugün · {done}/{todays.length}</div>
        <div style={{ fontSize: 13, opacity: .9, marginTop: 2 }}>Ana ekran widget'ını görüntüle →</div>
      </button>

      {todays.length === 0 && <Empty Icon={CheckSquare} text="Bugün için görev ekle." />}

      {/* saatlik zaman çizelgesi */}
      <div style={{ position: "relative" }}>
        {todays.map((t, i) => (
          <div key={t.id} className="fade" style={{ display: "flex", gap: 12, marginBottom: 10, animationDelay: `${i * 0.04}s` }}>
            <div style={{ width: 52, textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 700, color: C.amber }}>{t.time}</div>
              {t.endTime && <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{t.endTime}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.done ? C.green : (t.color || C.amber), flexShrink: 0 }} />
              {i < todays.length - 1 && <div style={{ width: 2, flex: 1, background: C.line, marginTop: 2 }} />}
            </div>
            <div style={{
              flex: 1, background: C.card, borderRadius: 14, padding: "12px 14px",
              border: `1px solid ${C.line}`, borderLeft: `4px solid ${t.done ? C.green : (t.color || C.amber)}`,
              display: "flex", alignItems: "center", gap: 10,
              opacity: t.done ? .55 : 1,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                {t.note && <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{t.note}</div>}
              </div>
              <button onClick={() => toggle(t.id)} style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: t.done ? C.green : "transparent", border: `2px solid ${t.done ? C.green : C.sub}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {t.done && <CheckSquare size={15} color="#0f1117" />}
              </button>
              <button onClick={() => del(t.id)} style={{ background: "none", padding: 2 }}><X size={16} color={C.sub} /></button>
            </div>
          </div>
        ))}
      </div>

      <FAB onClick={() => setAdding(true)} label="Görev Ekle" />
      {adding && <AddTaskSheet onClose={() => setAdding(false)} onSave={addTask} today={today} />}
      {showWidget && <WidgetPreview tasks={todays} onClose={() => setShowWidget(false)} />}
    </div>
  );
}

const TASK_COLORS = [
  { name: "Amber", v: "#f4a73a" },
  { name: "Mercan", v: "#ff6b6b" },
  { name: "Turkuaz", v: "#3ad6c0" },
  { name: "Mavi", v: "#5b8def" },
  { name: "Mor", v: "#a78bfa" },
  { name: "Yeşil", v: "#4ade80" },
  { name: "Pembe", v: "#f472b6" },
];

const REPEAT_OPTS = [
  { id: "none", label: "Tekrar yok" },
  { id: "daily", label: "Her gün" },
  { id: "every2", label: "2 günde bir" },
  { id: "weekly", label: "Her hafta" },
  { id: "monthly", label: "Her ay" },
];
// tekrar serisinden tarih listesi üret (başlangıçtan itibaren ~3 ay ufuk)
function repeatDates(startIso, repeat) {
  const start = new Date(startIso + "T00:00:00");
  const horizon = new Date(start); horizon.setMonth(horizon.getMonth() + 3);
  const out = [];
  let d = new Date(start);
  let guard = 0;
  while (d <= horizon && guard < 400) {
    out.push(iso(d));
    if (repeat === "daily") d.setDate(d.getDate() + 1);
    else if (repeat === "every2") d.setDate(d.getDate() + 2);
    else if (repeat === "weekly") d.setDate(d.getDate() + 7);
    else if (repeat === "monthly") d.setMonth(d.getMonth() + 1);
    else break; // none
    guard++;
  }
  return out;
}

function AddTaskSheet({ onClose, onSave, today, presetTime }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [time, setTime] = useState(presetTime || "08:00");
  const [endTime, setEndTime] = useState(addHour(presetTime || "08:00"));
  const [date, setDate] = useState(today);
  const [reminder, setReminder] = useState(false);
  const [color, setColor] = useState(TASK_COLORS[0].v);
  const [repeat, setRepeat] = useState("none");

  // başlangıç değişince bitişi otomatik kaydır (bitiş <= başlangıç ise)
  const onStartChange = (v) => {
    setTime(v);
    if (toMin(endTime) <= toMin(v)) setEndTime(addHour(v));
  };

  const handleSave = () => {
    const groupId = repeat === "none" ? null : Date.now();
    const dates = repeat === "none" ? [date] : repeatDates(date, repeat);
    const base = { title: title.trim(), note: note.trim(), time, endTime, done: false, reminder, color, repeat, groupId };
    const list = dates.map((d, i) => ({ ...base, id: Date.now() + i, date: d }));
    onSave(list);
  };

  return (
    <Sheet onClose={onClose} title="Günlük Görev" tall>
      <Field label="Görev" value={title} onChange={setTitle} placeholder="Örn. 40 soru Matematik" />
      <Field label="Not (opsiyonel)" value={note} onChange={setNote} placeholder="Türev konusu" />
      <Field label="Tarih" value={date} onChange={setDate} type="date" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Başlangıç" value={time} onChange={onStartChange} type="time" /></div>
        <div style={{ flex: 1 }}><Field label="Bitiş" value={endTime} onChange={setEndTime} type="time" /></div>
      </div>
      {toMin(endTime) <= toMin(time) && (
        <div style={{ fontSize: 12, color: C.rose, marginTop: -6, marginBottom: 12 }}>
          Bitiş saati başlangıçtan sonra olmalı.
        </div>
      )}

      {/* tekrar sıklığı */}
      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 8 }}>Tekrar</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {REPEAT_OPTS.map(o => (
          <button key={o.id} onClick={() => setRepeat(o.id)} style={{
            padding: "9px 13px", borderRadius: 11, fontSize: 13, fontWeight: 600,
            background: repeat === o.id ? C.amber : C.bg2,
            color: repeat === o.id ? "#1a1206" : C.sub,
            border: `1px solid ${C.line}`,
          }}>{o.label}</button>
        ))}
      </div>
      {repeat !== "none" && (
        <div style={{ fontSize: 12, color: C.sub, marginTop: -8, marginBottom: 14 }}>
          Bu görev önümüzdeki 3 ay boyunca seçilen sıklıkta otomatik eklenir.
        </div>
      )}

      {/* renk seçici */}
      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 8 }}>Renk</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {TASK_COLORS.map(c => (
          <button key={c.v} onClick={() => setColor(c.v)} title={c.name} style={{
            width: 34, height: 34, borderRadius: "50%", background: c.v,
            border: color === c.v ? `3px solid ${C.ink}` : `3px solid transparent`,
            boxShadow: color === c.v ? `0 0 0 2px ${c.v}` : "none",
            transition: "all .15s", cursor: "pointer",
          }} />
        ))}
      </div>

      <button onClick={() => setReminder(r => !r)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: C.bg2, padding: "12px 14px", borderRadius: 12, color: C.ink, marginBottom: 14, border: `1px solid ${C.line}`,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}><Bell size={16} color={C.amber} /> Hatırlatma</span>
        <div style={{ width: 42, height: 24, borderRadius: 12, background: reminder ? C.amber : C.line, position: "relative", transition: "background .2s" }}>
          <div style={{ position: "absolute", top: 2, left: reminder ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
        </div>
      </button>
      <PrimaryBtn disabled={!title.trim() || toMin(endTime) <= toMin(time)} onClick={handleSave}>
        {repeat === "none" ? "Görevi Ekle" : "Tekrarlı Görevi Ekle"}
      </PrimaryBtn>
    </Sheet>
  );
}

/* saat yardımcıları */
const toMin = (t) => { const [h, m] = (t || "0:0").split(":").map(Number); return h * 60 + m; };
const fromMin = (mn) => `${String(Math.floor(mn / 60) % 24).padStart(2, "0")}:${String(mn % 60).padStart(2, "0")}`;
const addHour = (t) => fromMin(Math.min(toMin(t) + 60, 23 * 60 + 59));

function WidgetPreview({ tasks, onClose }) {
  const done = tasks.filter(t => t.done).length;
  const next = tasks.find(t => !t.done);
  return (
    <Sheet onClose={onClose} title="Ana Ekran Widget'ı">
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>
        Telefonun ana ekranında böyle görünür:
      </div>
      <div style={{
        background: `linear-gradient(135deg, #232838, #1a1e2a)`, borderRadius: 24, padding: 18,
        border: `1px solid ${C.line}`, boxShadow: "0 16px 40px rgba(0,0,0,.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>📚 Bugünkü Plan</div>
          <div style={{ fontSize: 13, color: C.amber, fontWeight: 700 }}>{done}/{tasks.length}</div>
        </div>
        <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ height: "100%", width: tasks.length ? `${(done / tasks.length) * 100}%` : "0%", background: C.amber, borderRadius: 3 }} />
        </div>
        {tasks.slice(0, 4).map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 13, fontWeight: 700, color: C.amber, width: 42 }}>{t.time}</div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.done ? C.green : C.sub }} />
            <div style={{ flex: 1, fontSize: 13, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? .5 : 1 }}>{t.title}</div>
          </div>
        ))}
        {tasks.length === 0 && <div style={{ fontSize: 13, color: C.sub, textAlign: "center", padding: 10 }}>Görev yok</div>}
        {next && (
          <div style={{ marginTop: 8, fontSize: 12, color: C.teal, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={13} /> Sıradaki: {next.time} · {next.title}
          </div>
        )}
      </div>
      <PrimaryBtn onClick={onClose} style={{ marginTop: 18 }}>Tamam</PrimaryBtn>
    </Sheet>
  );
}

/* ============================================================
   HAFTALIK TAKVİM  (Google Takvim tarzı, görevlerle senkron)
   ============================================================ */
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 - 23:00
const HOUR_H = 56; // her saatin piksel yüksekliği

// verilen tarihin haftasının Pazartesisini bul
function mondayOf(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Pzt=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
const iso = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

function WeekTab() {
  const [tasks, setTasks] = useState(() => load("eg_tasks", []));
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [sheet, setSheet] = useState(null); // {date, time} ekleme için
  const [detail, setDetail] = useState(null); // görev detayı
  const [moveSheet, setMoveSheet] = useState(null); // {task, mode: 'move'|'copy'}
  const [drag, setDrag] = useState(null); // {task, date, time} sürüklenen
  const gridRef = useRef(null);       // günlerin kapsayıcısı (saat ölçümü için)
  const lpTimer = useRef(null);       // long-press zamanlayıcı
  const movedRef = useRef(false);     // sürükleme gerçekleşti mi (tıklama ayrımı)
  const startXY = useRef(null);       // long-press başlangıç koordinatı

  useEffect(() => save("eg_tasks", tasks), [tasks]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const todayIso = iso(new Date());

  const addTask = (t) => { setTasks([...tasks, ...(Array.isArray(t) ? t : [t])]); setSheet(null); };
  const delTask = (id) => { setTasks(tasks.filter(t => t.id !== id)); setDetail(null); };
  const delSeries = (groupId) => { setTasks(tasks.filter(t => t.groupId !== groupId)); setDetail(null); };
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));

  // görevi yeni gün/saate taşı (süreyi koru)
  const moveTask = (task, newDate, newStart) => {
    const dur = task.endTime ? toMin(task.endTime) - toMin(task.time) : 60;
    const newEnd = fromMin(Math.min(toMin(newStart) + dur, 23 * 60 + 59));
    setTasks(tasks.map(t => t.id === task.id ? { ...t, date: newDate, time: newStart, endTime: newEnd } : t));
    setMoveSheet(null); setDetail(null);
  };
  // görevi yeni gün/saate kopyala
  const copyTask = (task, newDate, newStart) => {
    const dur = task.endTime ? toMin(task.endTime) - toMin(task.time) : 60;
    const newEnd = fromMin(Math.min(toMin(newStart) + dur, 23 * 60 + 59));
    setTasks([...tasks, { ...task, id: Date.now(), date: newDate, time: newStart, endTime: newEnd, done: false }]);
    setMoveSheet(null); setDetail(null);
  };

  /* ---- basılı tutup sürükleme ---- */
  // ekran koordinatından gün ve saat çöz
  const resolveCell = (clientX, clientY) => {
    const el = gridRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    let relX = clientX - r.left;
    let relY = clientY - r.top + el.scrollTop;
    // gün sütunu (7 eşit parça)
    let di = Math.floor((relX / r.width) * 7);
    di = Math.max(0, Math.min(6, di));
    // saat (15 dk adımına yuvarla)
    let mins = HOURS[0] * 60 + (relY / HOUR_H) * 60;
    mins = Math.round(mins / 15) * 15;
    mins = Math.max(HOURS[0] * 60, Math.min((HOURS[HOURS.length - 1] + 1) * 60 - 15, mins));
    const d = new Date(weekStart); d.setDate(d.getDate() + di);
    return { date: iso(d), time: fromMin(mins) };
  };

  const pointerXY = (e) => {
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX, y: p.clientY };
  };

  const startLongPress = (task, e) => {
    movedRef.current = false;
    const { x, y } = pointerXY(e);
    startXY.current = { x, y };
    lpTimer.current = setTimeout(() => {
      const cell = resolveCell(x, y) || { date: task.date, time: task.time };
      setDrag({ task, ...cell });
      if (navigator.vibrate) navigator.vibrate(30);
    }, 350);
  };
  const onMovePointer = (e) => {
    // long-press beklerken belirgin hareket olduysa = scroll niyeti, iptal
    if (lpTimer.current && !drag && startXY.current) {
      const { x, y } = pointerXY(e);
      const dx = Math.abs(x - startXY.current.x), dy = Math.abs(y - startXY.current.y);
      if (dx > 10 || dy > 10) { cancelLongPress(); }
      return;
    }
    if (!drag) return;
    e.preventDefault();
    movedRef.current = true;
    const { x, y } = pointerXY(e);
    const cell = resolveCell(x, y);
    if (cell) setDrag(d => d ? { ...d, ...cell } : d);
  };
  const endPointer = () => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
    if (drag) {
      moveTask(drag.task, drag.date, drag.time);
      setDrag(null);
    }
  };
  const cancelLongPress = () => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
  };

  const shiftWeek = (n) => {
    const x = new Date(weekStart);
    x.setDate(x.getDate() + n * 7);
    setWeekStart(x);
  };

  const monthLabel = `${weekStart.toLocaleDateString("tr-TR", { month: "long" })} ${weekStart.getFullYear()}`;

  // bir görevin üst konumu (saat:dakika -> px)
  const topOf = (time) => {
    const [h, m] = time.split(":").map(Number);
    return (h - HOURS[0]) * HOUR_H + (m / 60) * HOUR_H;
  };
  // görevin süresine göre yükseklik
  const heightOf = (t) => {
    if (!t.endTime) return 26;
    const dur = toMin(t.endTime) - toMin(t.time);
    return Math.max(24, (dur / 60) * HOUR_H - 3);
  };

  return (
    <div className="fade">
      {/* hafta gezinme */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => shiftWeek(-1)} style={navArrow}><ChevronLeft size={20} color={C.ink} /></button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 700 }}>{monthLabel}</div>
          <button onClick={() => setWeekStart(mondayOf(new Date()))} style={{
            background: "none", color: C.amber, fontSize: 12, fontWeight: 600, marginTop: 1,
          }}>Bu haftaya dön</button>
        </div>
        <button onClick={() => shiftWeek(1)} style={navArrow}><ChevronRight size={20} color={C.ink} /></button>
      </div>

      {/* gün başlıkları */}
      <div style={{ display: "flex", marginBottom: 6, paddingLeft: 38 }}>
        {days.map((d, i) => {
          const isToday = iso(d) === todayIso;
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: isToday ? C.amber : C.sub, fontWeight: 600 }}>{DAY_NAMES[i]}</div>
              <div style={{
                fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, marginTop: 2,
                width: 26, height: 26, lineHeight: "26px", borderRadius: "50%", margin: "2px auto 0",
                background: isToday ? C.amber : "transparent", color: isToday ? "#1a1206" : C.ink,
              }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* saat ızgarası */}
      <div style={{
        background: C.card, borderRadius: 16, border: `1px solid ${C.line}`,
        overflow: "hidden", maxHeight: "62vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", position: "relative" }}>
          {/* saat etiketleri */}
          <div style={{ width: 38, flexShrink: 0 }}>
            {HOURS.map(h => (
              <div key={h} style={{ height: HOUR_H, position: "relative" }}>
                <div style={{ position: "absolute", top: -7, right: 5, fontSize: 10, color: C.sub }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              </div>
            ))}
          </div>

          {/* günler (sürükleme alanı) */}
          <div
            ref={gridRef}
            style={{ display: "flex", flex: 1, position: "relative", minWidth: 0,
              touchAction: drag ? "none" : "auto" }}
            onMouseMove={onMovePointer}
            onTouchMove={onMovePointer}
            onMouseUp={endPointer}
            onTouchEnd={endPointer}
            onMouseLeave={() => { if (drag) endPointer(); else cancelLongPress(); }}
          >
          {days.map((d, di) => {
            const dIso = iso(d);
            const dayTasks = tasks.filter(t => t.date === dIso);
            return (
              <div key={di} style={{
                flex: 1, position: "relative", borderLeft: `1px solid ${C.line}`,
                minWidth: 0,
              }}>
                {/* saat satır çizgileri + tıklanabilir hücreler */}
                {HOURS.map(h => (
                  <div key={h} onClick={() => setSheet({ date: dIso, time: `${String(h).padStart(2, "0")}:00` })}
                    style={{
                      height: HOUR_H, borderBottom: `1px solid ${C.line}`,
                      cursor: "pointer",
                    }} />
                ))}
                {/* görev blokları */}
                {dayTasks.map(t => {
                  const col = t.color || C.amber;
                  const isDragging = drag && drag.task.id === t.id;
                  return (
                  <div key={t.id}
                    onMouseDown={(e) => startLongPress(t, e)}
                    onTouchStart={(e) => startLongPress(t, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (movedRef.current) { movedRef.current = false; return; }
                      cancelLongPress();
                      setDetail(t);
                    }}
                    style={{
                      position: "absolute", left: 2, right: 2, top: topOf(t.time),
                      height: heightOf(t), background: t.done ? `${C.green}22` : `${col}26`,
                      borderLeft: `3px solid ${t.done ? C.green : col}`,
                      borderRadius: 6, padding: "3px 5px", overflow: "hidden",
                      cursor: "pointer", userSelect: "none",
                      opacity: isDragging ? 0.25 : 1, transition: "opacity .1s",
                    }}>
                    <div style={{
                      fontSize: 10.5, fontWeight: 600, lineHeight: 1.2,
                      color: t.done ? C.sub : C.ink, textDecoration: t.done ? "line-through" : "none",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{t.title}</div>
                    <div style={{ fontSize: 9, color: C.sub, display: "flex", alignItems: "center", gap: 3 }}>
                      {t.groupId && <RotateCcw size={8} color={C.sub} />}
                      {t.time}{t.endTime ? `–${t.endTime}` : ""}
                    </div>
                  </div>
                  );
                })}
              </div>
            );
          })}

          {/* sürüklenen hayalet blok */}
          {drag && (() => {
            const di = days.findIndex(d => iso(d) === drag.date);
            if (di < 0) return null;
            const col = drag.task.color || C.amber;
            const dur = drag.task.endTime ? toMin(drag.task.endTime) - toMin(drag.task.time) : 60;
            return (
              <div style={{
                position: "absolute", pointerEvents: "none", zIndex: 20,
                left: `calc(${(di / 7) * 100}% + 2px)`, width: `calc(${100 / 7}% - 4px)`,
                top: topOf(drag.time), height: Math.max(24, (dur / 60) * HOUR_H - 3),
                background: `${col}`, borderRadius: 6, padding: "3px 5px",
                boxShadow: "0 8px 20px rgba(0,0,0,.5)", color: "#0f1117",
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{drag.task.title}</div>
                <div style={{ fontSize: 9, opacity: .8 }}>{drag.time}</div>
              </div>
            );
          })()}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 10 }}>
        Boş saate dokun → ekle · göreve dokun → detay · <b style={{ color: C.amber }}>basılı tutup sürükle</b> → taşı
      </div>

      {sheet && (
        <AddTaskSheet
          onClose={() => setSheet(null)}
          onSave={addTask}
          today={sheet.date}
          presetTime={sheet.time}
        />
      )}

      {detail && (
        <Sheet onClose={() => setDetail(null)} title="Görev">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: detail.color || C.amber, flexShrink: 0 }} />
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 700 }}>{detail.title}</div>
          </div>
          <div style={{ fontSize: 14, color: C.amber, fontWeight: 600, marginBottom: 4 }}>
            {new Date(detail.date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} · {detail.time}{detail.endTime ? ` – ${detail.endTime}` : ""}
          </div>
          {detail.note && <div style={{ fontSize: 14, color: C.sub, marginBottom: 14 }}>{detail.note}</div>}

          {/* taşı / çoğalt */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button onClick={() => setMoveSheet({ task: detail, mode: "move" })} style={{
              flex: 1, padding: 13, borderRadius: 12, fontWeight: 600, fontSize: 15,
              background: `${C.blue}22`, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <ArrowRightLeft size={17} /> Taşı
            </button>
            <button onClick={() => setMoveSheet({ task: detail, mode: "copy" })} style={{
              flex: 1, padding: 13, borderRadius: 12, fontWeight: 600, fontSize: 15,
              background: `${C.purple}22`, color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <Copy size={17} /> Çoğalt
            </button>
          </div>

          <button onClick={() => toggleTask(detail.id)} style={{
            width: "100%", padding: 13, borderRadius: 12, fontWeight: 600, fontSize: 15, marginBottom: 10,
            background: detail.done ? C.line : `${C.green}22`, color: detail.done ? C.sub : C.green,
          }}>
            {detail.done ? "✓ Tamamlandı (geri al)" : "Tamamlandı olarak işaretle"}
          </button>
          {detail.groupId && (
            <div style={{
              fontSize: 12, color: C.sub, background: C.bg2, padding: "8px 12px",
              borderRadius: 10, marginBottom: 10, display: "flex", alignItems: "center", gap: 7,
            }}>
              <RotateCcw size={14} color={C.amber} /> Tekrarlı görev serisinin parçası
            </div>
          )}
          <ConfirmBtn onConfirm={() => delTask(detail.id)}
            label={detail.groupId ? "Sadece bunu sil" : "Sil"}
            confirmLabel={detail.groupId ? "Emin misin? Sadece bunu sil" : "Emin misin? Sil"}
            style={{ marginBottom: detail.groupId ? 10 : 0 }} />
          {detail.groupId && (
            <ConfirmBtn onConfirm={() => delSeries(detail.groupId)}
              label="Tüm seriyi sil"
              confirmLabel="Emin misin? Tüm seriyi sil"
              style={{ background: `${C.rose}28` }} />
          )}
        </Sheet>
      )}

      {moveSheet && (
        <MoveSheet
          info={moveSheet}
          onClose={() => setMoveSheet(null)}
          onConfirm={(date, time) =>
            moveSheet.mode === "move"
              ? moveTask(moveSheet.task, date, time)
              : copyTask(moveSheet.task, date, time)
          }
        />
      )}
    </div>
  );
}

/* ---- Görevi başka gün/saate taşı veya çoğalt ---- */
function MoveSheet({ info, onClose, onConfirm }) {
  const { task, mode } = info;
  const isCopy = mode === "copy";
  const [date, setDate] = useState(task.date);
  const [time, setTime] = useState(task.time);

  // hedef haftanın günleri (görevin bulunduğu haftadan başlat)
  const base = mondayOf(date || new Date());
  const [weekBase, setWeekBase] = useState(base);
  const wkDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekBase); d.setDate(d.getDate() + i); return d;
  });
  const shift = (n) => { const x = new Date(weekBase); x.setDate(x.getDate() + n * 7); setWeekBase(x); };

  const dur = task.endTime ? toMin(task.endTime) - toMin(task.time) : 60;
  const previewEnd = fromMin(Math.min(toMin(time) + dur, 23 * 60 + 59));

  return (
    <Sheet onClose={onClose} title={isCopy ? "Görevi Çoğalt" : "Görevi Taşı"}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: task.color || C.amber }} />
        <div style={{ fontWeight: 600, fontSize: 15 }}>{task.title}</div>
      </div>

      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 8 }}>HEDEF GÜN</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <button onClick={() => shift(-1)} style={navArrow}><ChevronLeft size={18} color={C.ink} /></button>
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {wkDays.map((d, i) => {
            const dIso = iso(d);
            const on = dIso === date;
            return (
              <button key={i} onClick={() => setDate(dIso)} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center",
                background: on ? C.amber : C.bg2, color: on ? "#1a1206" : C.sub,
                border: `1px solid ${C.line}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600 }}>{DAY_NAMES[i]}</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700 }}>{d.getDate()}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => shift(1)} style={navArrow}><ChevronRight size={18} color={C.ink} /></button>
      </div>
      <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 16 }}>
        {new Date(date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
      </div>

      <Field label="Başlangıç Saati" value={time} onChange={setTime} type="time" />
      <div style={{
        background: C.bg2, borderRadius: 12, padding: "10px 14px", marginBottom: 16,
        fontSize: 13, color: C.sub, display: "flex", justifyContent: "space-between",
      }}>
        <span>Süre korunur</span>
        <span style={{ color: C.amber, fontWeight: 600 }}>{time} – {previewEnd}</span>
      </div>

      <PrimaryBtn onClick={() => onConfirm(date, time)}
        style={{ background: isCopy ? C.purple : C.blue, color: "#fff" }}>
        {isCopy ? "Bu güne çoğalt" : "Bu güne taşı"}
      </PrimaryBtn>
    </Sheet>
  );
}
const navArrow = {
  width: 38, height: 38, borderRadius: 11, background: C.card,
  border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center",
};
/* ============================================================
   AI KOÇ  (konu anlatımı + program analizi/oluşturma)
   Claude API'sini artifact içinden çağırır.
   ============================================================ */
function callClaude(messages, system, maxTokens = 1200) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })
    .then(r => r.json())
    .then(data => (data.content || []).map(b => (b.type === "text" ? b.text : "")).join("\n").trim());
}

// kullanıcının mevcut durumunu özetle (AI'a bağlam olarak verilir)
function buildUserContext() {
  const exams = load("eg_exams", []);
  const tasks = load("eg_tasks", []);
  const books = load("eg_books", []);
  const daily = getDaily();
  const todayIso = iso(new Date());

  // ders bazında ortalama net (zayıf dersleri bulmak için)
  const dersNet = {};
  exams.forEach(e => (e.subjects || []).forEach(s => {
    if (!dersNet[s.name]) dersNet[s.name] = [];
    dersNet[s.name].push(net(s.d, s.y));
  }));
  const dersOrt = Object.entries(dersNet).map(([n, arr]) =>
    `${n}: ort ${(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)} net`).join("; ");

  // bu hafta görevler
  const wkStart = mondayOf(new Date());
  const wkDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(wkStart); d.setDate(d.getDate() + i); return iso(d); });
  const wkTasks = tasks.filter(t => wkDays.includes(t.date));

  const today = daily[todayIso] || { q: 0, min: 0 };

  return [
    exams.length ? `Deneme sayısı: ${exams.length}. Ders net ortalamaları: ${dersOrt || "yok"}.` : "Henüz deneme girilmemiş.",
    `Bu hafta planlı görev sayısı: ${wkTasks.length}.`,
    books.length ? `Kaynak kitaplar: ${books.map(b => b.name).join(", ")}.` : "Kaynak kitap eklenmemiş.",
    `Bugün: ${today.q} soru, ${today.min} dk çalışma.`,
  ].join(" ");
}

function AITab() {
  const [mode, setMode] = useState("chat"); // chat | plan
  return (
    <div className="fade">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, background: C.card, padding: 4, borderRadius: 12 }}>
        {[["chat", "Konu Anlat", Lightbulb], ["plan", "Program Yap", Wand2]].map(([m, label, Icon]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: "10px", borderRadius: 9, fontSize: 14, fontWeight: 600,
            background: mode === m ? C.amber : "transparent", color: mode === m ? "#1a1206" : C.sub,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      {mode === "chat" ? <AIChat /> : <AIPlanner />}
    </div>
  );
}

/* ---- Konu anlatımı sohbeti ---- */
function AIChat() {
  const [msgs, setMsgs] = useState([]); // {role, text, image?:{dataUrl, media_type, data}}
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(null); // seçilen fotoğraf {dataUrl, media_type, data}
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [msgs, loading]);

  const handleFile = (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const data = String(dataUrl).split(",")[1];
      setPending({ dataUrl, media_type: file.type || "image/jpeg", data });
    };
    reader.readAsDataURL(file);
  };
  const pickImage = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = ""; // aynı dosya tekrar seçilebilsin
  };
  const onPaste = (e) => {
    const items = e.clipboardData?.items || [];
    for (const it of items) {
      if (it.type?.startsWith("image/")) { handleFile(it.getAsFile()); e.preventDefault(); return; }
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  const send = async () => {
    const q = input.trim();
    if ((!q && !pending) || loading) return;
    const userMsg = { role: "user", text: q, image: pending };
    const next = [...msgs, userMsg];
    setMsgs(next); setInput(""); setPending(null); setLoading(true);
    try {
      const hasImage = next.some(m => m.image);
      const system = hasImage
        ? "Sen YKS'ye (TYT/AYT) hazırlanan Türk öğrencilere yardım eden, sıcak ve sabırlı bir özel öğretmensin. Öğrenci çözemediği bir sorunun fotoğrafını gönderdi. Şu sırayla yanıt ver: 1) Soruyu kısaca oku/yorumla. 2) Çözümü adım adım, anlaşılır şekilde anlat. 3) Hangi konu/kavramı ölçtüğünü söyle. 4) Aynı mantıkta 2 benzer ÖRNEK SORU ver ve kısa çözümlerini ekle ki öğrenci pekiştirsin. Türkçe yanıt ver, matematiksel ifadeleri düz metinle yaz."
        : "Sen YKS'ye (TYT/AYT) hazırlanan Türk öğrencilere yardım eden, sıcak ve sabırlı bir özel öğretmensin. Anlaşılmayan konuları lise seviyesinde, adım adım, örneklerle ve sade bir dille açıklarsın. Açıklamadan sonra konuyu pekiştirecek 1-2 örnek soru ver. Türkçe yanıt ver. Matematiksel ifadeleri düz metinle yaz.";

      // API mesajlarını içerik bloklarına çevir (görsel + metin)
      const apiMsgs = next.map(m => {
        if (m.image) {
          const content = [
            { type: "image", source: { type: "base64", media_type: m.image.media_type, data: m.image.data } },
          ];
          content.push({ type: "text", text: m.text || "Bu soruyu çözemedim, açıklar ve benzer örneklerle pekiştirir misin?" });
          return { role: m.role, content };
        }
        return { role: m.role, content: m.text };
      });

      const reply = await callClaude(apiMsgs, system, 2000);
      setMsgs([...next, { role: "assistant", text: reply || "Bir yanıt alınamadı, tekrar dener misin?" }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", text: "Bağlantı hatası oldu. İnternetini kontrol edip tekrar dene." }]);
    }
    setLoading(false);
  };

  const examples = ["Türev nedir, nasıl alınır?", "Paragrafta ana fikir nasıl bulunur?", "Mol kavramını açıkla", "Köklü sayılarda işlemler"];

  return (
    <div onPaste={onPaste} onDrop={onDrop} onDragOver={e => e.preventDefault()}>
      {msgs.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
          <div style={{ display: "inline-flex", padding: 16, borderRadius: 20, background: `${C.amber}18`, marginBottom: 12 }}>
            <Lightbulb size={32} color={C.amber} />
          </div>
          <div style={{ fontSize: 15, color: C.sub, marginBottom: 8 }}>
            Anlamadığın konuyu yaz veya çözemediğin sorunun fotoğrafını gönder.
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 14, opacity: .8 }}>
            Buton çalışmazsa: görseli buraya <b>sürükle-bırak</b> ya da <b>yapıştır (Ctrl/Cmd+V)</b>.
          </div>
          <label style={{
            display: "inline-flex", alignItems: "center", gap: 7, margin: "4px auto 16px",
            background: `${C.teal}1e`, color: C.teal, border: `1px solid ${C.teal}55`,
            padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            <ImagePlus size={17} /> Soru fotoğrafı yükle
            <input type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {examples.map(ex => (
              <button key={ex} onClick={() => setInput(ex)} style={{
                background: C.card, border: `1px solid ${C.line}`, color: C.ink,
                padding: "11px 14px", borderRadius: 12, fontSize: 14, textAlign: "left", cursor: "pointer",
              }}>{ex}</button>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ maxHeight: "48vh", overflowY: "auto", marginBottom: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10,
          }}>
            <div style={{
              maxWidth: "85%", padding: m.image ? 6 : "11px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              background: m.role === "user" ? C.amber : C.card,
              color: m.role === "user" ? "#1a1206" : C.ink,
              border: m.role === "user" ? "none" : `1px solid ${C.line}`,
              borderBottomRightRadius: m.role === "user" ? 4 : 16,
              borderBottomLeftRadius: m.role === "user" ? 16 : 4,
            }}>
              {m.image && (
                <img src={m.image.dataUrl} alt="soru" style={{
                  width: "100%", maxWidth: 240, borderRadius: 12, display: "block",
                  marginBottom: m.text ? 8 : 0,
                }} />
              )}
              {m.text && <span style={{ padding: m.image ? "0 8px 6px" : 0, display: "block" }}>{m.text}</span>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 5, padding: "11px 14px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber, animation: `pulse 1s ease ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      {/* seçili fotoğraf önizleme */}
      {pending && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, background: C.card,
          border: `1px solid ${C.line}`, borderRadius: 12, padding: 8, marginBottom: 8,
        }}>
          <img src={pending.dataUrl} alt="önizleme" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ flex: 1, fontSize: 13, color: C.sub }}>Fotoğraf eklendi</span>
          <button onClick={() => setPending(null)} style={{ background: "none", padding: 4, cursor: "pointer" }}>
            <X size={18} color={C.sub} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <label style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: C.card,
          border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ImagePlus size={20} color={C.teal} />
          <input type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
        </label>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={pending ? "Soruyla ilgili not (opsiyonel)..." : "Konuyu yaz..."} rows={1}
          style={{
            flex: 1, resize: "none", padding: "12px 14px", borderRadius: 14, background: C.card,
            border: `1px solid ${C.line}`, color: C.ink, fontSize: 15, outline: "none", maxHeight: 100,
          }}
        />
        <button onClick={send} disabled={(!input.trim() && !pending) || loading} style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: (input.trim() || pending) && !loading ? C.amber : C.line,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <Send size={20} color={(input.trim() || pending) && !loading ? "#1a1206" : C.sub} />
        </button>
      </div>
    </div>
  );
}

/* ---- Haftalık program: görüntüle / AI ile oluştur ---- */
function AIPlanner() {
  const [tasks, setTasks] = useState(() => load("eg_tasks", []));
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposed, setProposed] = useState(null); // AI önerisi: [{day, time, endTime, title}]
  const [note, setNote] = useState("");

  useEffect(() => save("eg_tasks", tasks), [tasks]);

  const wkStart = mondayOf(new Date());
  const wkDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(wkStart); d.setDate(d.getDate() + i); return d; });
  const wkIso = wkDays.map(iso);
  const weekTasks = tasks.filter(t => wkIso.includes(t.date)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const generate = async () => {
    if (loading) return;
    setLoading(true); setProposed(null); setNote("");
    try {
      const ctx = buildUserContext();
      const system = `Sen YKS koçusun. Öğrenciye HAFTALIK ÇALIŞMA PROGRAMI hazırlıyorsun. Öğrencinin zayıf derslerine (düşük net) daha çok ağırlık ver. Gerçekçi, dengeli, molalı bir program yap. SADECE geçerli JSON dizisi döndür, başka HİÇBİR şey yazma. Format:
[{"day":0,"start":"16:00","end":"17:30","title":"Matematik - Türev tekrar"}]
day: 0=Pazartesi ... 6=Pazar. Hafta içi okul sonrası (16:00 sonrası), hafta sonu gündüz saatleri kullan. Her güne 2-4 blok koy. title kısa ve dersi içersin.`;
      const userMsg = `Öğrenci durumu: ${ctx}\n\nÖğrencinin isteği: ${request.trim() || "Eksiklerime göre dengeli bir haftalık program yap."}`;
      const reply = await callClaude([{ role: "user", content: userMsg }], system, 1800);
      // JSON ayıkla
      const jsonStr = reply.slice(reply.indexOf("["), reply.lastIndexOf("]") + 1);
      const arr = JSON.parse(jsonStr);
      setProposed(arr.filter(x => x && typeof x.day === "number" && x.start && x.title));
    } catch (e) {
      setNote("Program oluşturulamadı. Tekrar dener misin? (İnternet bağlantısı gerekir.)");
    }
    setLoading(false);
  };

  const applyPlan = (replace) => {
    const groupId = Date.now();
    const colorByDer = (title) => {
      const t = title.toLowerCase();
      if (t.includes("mat")) return "#5b8def";
      if (t.includes("fiz")) return "#a78bfa";
      if (t.includes("kim")) return "#3ad6c0";
      if (t.includes("biyo")) return "#4ade80";
      if (t.includes("türk") || t.includes("edebiyat") || t.includes("paragraf")) return "#f4a73a";
      return "#f472b6";
    };
    const newTasks = proposed.map((p, i) => ({
      id: groupId + i,
      title: p.title,
      note: "AI Koç önerisi",
      date: iso(wkDays[Math.max(0, Math.min(6, p.day))]),
      time: p.start,
      endTime: p.end || p.start,
      done: false, reminder: false,
      color: colorByDer(p.title),
      groupId: null,
    }));
    const base = replace ? tasks.filter(t => !wkIso.includes(t.date)) : tasks;
    setTasks([...base, ...newTasks]);
    setProposed(null);
    setNote(`${newTasks.length} blok bu haftaya eklendi. Takvim sekmesinden görebilirsin.`);
  };

  const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  return (
    <div>
      {/* istek + oluştur */}
      <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.line}`, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}>
          <Wand2 size={17} color={C.amber} /> Bana özel program oluştur
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>
          Deneme netlerine ve eksiklerine bakarım. İstersen özel bir not ekle (örn. "Cuma boşum, matematiğe ağırlık ver").
        </div>
        <textarea
          value={request} onChange={e => setRequest(e.target.value)}
          placeholder="İsteğin (opsiyonel)..." rows={2}
          style={{ width: "100%", resize: "none", padding: "11px 13px", borderRadius: 12, background: C.bg2, border: `1px solid ${C.line}`, color: C.ink, fontSize: 14, outline: "none", marginBottom: 10 }}
        />
        <PrimaryBtn onClick={generate} disabled={loading}>
          {loading ? "Hazırlanıyor..." : "✨ Program Oluştur"}
        </PrimaryBtn>
      </div>

      {note && (
        <div style={{ background: `${C.green}18`, color: C.green, padding: "11px 14px", borderRadius: 12, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
          {note}
        </div>
      )}

      {/* AI önerisi önizleme */}
      {proposed && (
        <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.amber}`, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: C.amber }}>Önerilen Program</div>
          {DAYS.map((dn, di) => {
            const items = proposed.filter(p => p.day === di);
            if (!items.length) return null;
            return (
              <div key={di} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 5 }}>{dn}</div>
                {items.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 4, alignItems: "center" }}>
                    <span style={{ fontFamily: fontDisplay, fontWeight: 700, color: C.amber, minWidth: 88 }}>{p.start}–{p.end || "?"}</span>
                    <span>{p.title}</span>
                  </div>
                ))}
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => applyPlan(false)} style={{ flex: 1, background: `${C.amber}22`, color: C.amber, padding: 12, borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Mevcuda Ekle
            </button>
            <button onClick={() => applyPlan(true)} style={{ flex: 1, background: C.amber, color: "#1a1206", padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Haftayı Değiştir
            </button>
          </div>
        </div>
      )}

      {/* mevcut haftalık program */}
      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 10 }}>BU HAFTAKİ PROGRAMIN</div>
      {weekTasks.length === 0 ? (
        <Empty Icon={CalendarDays} text="Bu hafta için plan yok. Yukarıdan AI ile oluşturabilirsin." />
      ) : (
        DAYS.map((dn, di) => {
          const items = weekTasks.filter(t => t.date === wkIso[di]);
          if (!items.length) return null;
          return (
            <div key={di} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 6 }}>{dn}</div>
              {items.map(t => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 10, background: C.card,
                  borderRadius: 12, padding: "10px 12px", marginBottom: 6,
                  borderLeft: `4px solid ${t.color || C.amber}`, opacity: t.done ? .55 : 1,
                }}>
                  <span style={{ fontFamily: fontDisplay, fontSize: 13, fontWeight: 700, color: C.sub, minWidth: 80 }}>
                    {t.time}{t.endTime ? `–${t.endTime}` : ""}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
                  <ConfirmBtn onConfirm={() => setTasks(tasks.filter(x => x.id !== t.id))}
                    style={{ background: "none", padding: 4, border: "none", cursor: "pointer" }}>
                    <X size={16} color={C.sub} />
                  </ConfirmBtn>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

function FAB({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      position: "fixed", bottom: 104, left: "50%", transform: "translateX(-50%)",
      background: C.amber, color: "#1a1206", fontWeight: 700, fontSize: 15,
      padding: "13px 24px", borderRadius: 30, display: "flex", alignItems: "center", gap: 8,
      boxShadow: `0 10px 28px ${C.amberGlow}, 0 4px 12px rgba(0,0,0,.4)`, zIndex: 40,
    }}>
      <Plus size={20} /> {label}
    </button>
  );
}

function Sheet({ children, onClose, title, tall }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeUp .2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 430, background: C.bg2, borderRadius: "26px 26px 0 0",
        padding: "10px 20px 30px", maxHeight: tall ? "92vh" : "82vh", overflowY: "auto",
        border: `1px solid ${C.line}`, animation: "pop .3s ease",
      }}>
        <div style={{ width: 40, height: 4, background: C.line, borderRadius: 2, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 21, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: C.card, padding: 7, borderRadius: 10 }}><X size={18} color={C.sub} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "13px 14px", borderRadius: 12, background: C.card,
          border: `1px solid ${C.line}`, color: C.ink, fontSize: 15, outline: "none",
        }}
        onFocus={e => e.target.style.borderColor = C.amber}
        onBlur={e => e.target.style.borderColor = C.line}
      />
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: 15, borderRadius: 14, fontWeight: 700, fontSize: 16,
      background: disabled ? C.line : C.amber, color: disabled ? C.sub : "#1a1206",
      transition: "all .2s", ...style,
    }}>{children}</button>
  );
}

function Empty({ Icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: C.sub }}>
      <div style={{ display: "inline-flex", padding: 18, borderRadius: 20, background: C.card, marginBottom: 14 }}>
        <Icon size={34} color={C.sub} />
      </div>
      <div style={{ fontSize: 15 }}>{text}</div>
    </div>
  );
}

/* iki aşamalı silme: ilk dokunuş onay ister, ikincisi siler */
function ConfirmBtn({ onConfirm, label = "Sil", confirmLabel = "Emin misin? Dokun", style, children }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  const handle = (e) => {
    e.stopPropagation();
    if (armed) { setArmed(false); onConfirm(); }
    else setArmed(true);
  };
  if (children) {
    // ikon butonu modu
    return <button onClick={handle} style={style}>{armed ? <span style={{ fontSize: 11, fontWeight: 700, color: C.rose }}>Sil?</span> : children}</button>;
  }
  return (
    <button onClick={handle} style={{
      width: "100%", padding: 13, borderRadius: 12, fontWeight: 600, fontSize: 15,
      background: armed ? C.rose : `${C.rose}18`, color: armed ? "#fff" : C.rose,
      transition: "all .15s", ...style,
    }}>{armed ? confirmLabel : label}</button>
  );
}
