"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

interface Article {
  id: string;
  title: string;
  summary: string;
  sentiment: string;
  source: string;
  image_url: string;
  url: string;
  category: string;
  published_at?: string;
  insights: {
    key_points?: string[];
    importance_score?: number;
    companies_mentioned?: string[];
  };
}

const sentimentConfig = {
  positive: {
    label: "Positive",
    dot: "#4ade80",
    badgeDark: "rgba(74,222,128,0.12)",
    badgeDarkText: "#4ade80",
    badgeDarkBorder: "rgba(74,222,128,0.25)",
    badgeLight: "rgba(22,163,74,0.1)",
    badgeLightText: "#15803d",
    badgeLightBorder: "rgba(22,163,74,0.25)",
  },
  neutral: {
    label: "Neutral",
    dot: "#94a3b8",
    badgeDark: "rgba(148,163,184,0.12)",
    badgeDarkText: "#94a3b8",
    badgeDarkBorder: "rgba(148,163,184,0.25)",
    badgeLight: "rgba(100,116,139,0.1)",
    badgeLightText: "#475569",
    badgeLightBorder: "rgba(100,116,139,0.25)",
  },
  negative: {
    label: "Negative",
    dot: "#f87171",
    badgeDark: "rgba(248,113,113,0.12)",
    badgeDarkText: "#f87171",
    badgeDarkBorder: "rgba(248,113,113,0.25)",
    badgeLight: "rgba(220,38,38,0.1)",
    badgeLightText: "#dc2626",
    badgeLightBorder: "rgba(220,38,38,0.25)",
  },
};

const PIE_COLORS = ["#4ade80", "#94a3b8", "#f87171"];

/* ── Skeleton ── */
function SkeletonCard({ dark }: { dark: boolean }) {
  const pulse = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  return (
    <div className="skeleton-card" style={{
      borderRadius: 20, overflow: "hidden",
      background: dark ? "rgba(255,255,255,0.025)" : "#ffffff",
      border: `0.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
    }}>
      <div style={{ height: 176, background: pulse }} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 22, width: 72, borderRadius: 20, background: pulse }} />
          <div style={{ height: 16, width: 56, borderRadius: 6, background: pulse }} />
        </div>
        <div style={{ height: 16, width: "100%", borderRadius: 6, background: pulse }} />
        <div style={{ height: 16, width: "80%", borderRadius: 6, background: pulse }} />
        <div style={{ height: 13, width: "100%", borderRadius: 6, background: pulse }} />
        <div style={{ height: 13, width: "65%", borderRadius: 6, background: pulse }} />
        <div style={{ height: 6, width: "100%", borderRadius: 6, background: pulse, marginTop: 4 }} />
      </div>
    </div>
  );
}

/* ── Importance bar ── */
function ImportanceBar({ score, dark }: { score: number; dark: boolean }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#4ade80" : score >= 4 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 4, overflow: "hidden", background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
        <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, color, fontVariantNumeric: "tabular-nums" }}>{score}/10</span>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, color, dark }: { label: string; value: number; color: string; dark: boolean }) {
  return (
    <div style={{
      borderRadius: 16, padding: "20px 24px",
      background: dark ? "rgba(255,255,255,0.03)" : "#ffffff",
      border: `0.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: dark ? "#64748b" : "#94a3b8", margin: 0 }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 300, letterSpacing: "-0.02em", color, margin: 0 }}>{value}</p>
    </div>
  );
}

/* ── Tooltip ── */
function CustomTooltip({ active, payload, dark }: any) {
  if (active && payload?.length) {
    return (
      <div style={{
        borderRadius: 12, padding: "8px 12px", fontSize: 13,
        background: dark ? "rgba(15,17,23,0.95)" : "rgba(255,255,255,0.97)",
        border: `0.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
      }}>
        <p style={{ color: dark ? "#e2e8f0" : "#1e293b", fontWeight: 500, margin: "0 0 2px" }}>{payload[0].name}</p>
        <p style={{ color: dark ? "#94a3b8" : "#64748b", margin: 0 }}>{payload[0].value} articles</p>
      </div>
    );
  }
  return null;
}

/* ── Modal ── */
function ArticleModal({ article, dark, onClose }: { article: Article; dark: boolean; onClose: () => void }) {
  const cfg = sentimentConfig[article.sentiment as keyof typeof sentimentConfig] ?? sentimentConfig.neutral;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-panel"
        style={{
          position: "relative", width: "100%", maxWidth: 640,
          maxHeight: "90vh", overflowY: "auto", borderRadius: 28,
          background: dark ? "#0d1117" : "#ffffff",
          border: `0.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, zIndex: 10,
          width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
          background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
          border: "none", color: dark ? "#94a3b8" : "#64748b",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Image */}
        {article.image_url && (
          <div style={{ height: 220, overflow: "hidden", borderRadius: "28px 28px 0 0" }}>
            <img src={article.image_url} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
              background: dark ? cfg.badgeDark : cfg.badgeLight,
              color: dark ? cfg.badgeDarkText : cfg.badgeLightText,
              border: `0.5px solid ${dark ? cfg.badgeDarkBorder : cfg.badgeLightBorder}`,
            }}>{cfg.label}</span>
            <span style={{ fontSize: 11, color: dark ? "#64748b" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{article.source}</span>
            {article.category && (
              <span style={{
                fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
                background: dark ? "rgba(96,165,250,0.12)" : "rgba(59,130,246,0.1)",
                color: dark ? "#60a5fa" : "#2563eb",
                border: `0.5px solid ${dark ? "rgba(96,165,250,0.25)" : "rgba(59,130,246,0.2)"}`,
              }}>{article.category}</span>
            )}
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 22, lineHeight: 1.35, margin: 0,
            color: dark ? "#f1f5f9" : "#0f172a",
          }}>{article.title}</h2>

          {/* Summary */}
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: dark ? "#94a3b8" : "#475569" }}>
            {article.summary}
          </p>

          {/* Importance */}
          {article.insights?.importance_score !== undefined && (
            <div>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: dark ? "#64748b" : "#94a3b8", marginBottom: 8 }}>
                Importance score
              </p>
              <ImportanceBar score={article.insights.importance_score} dark={dark} />
            </div>
          )}

          {/* Key points */}
          {article.insights?.key_points && article.insights.key_points.length > 0 && (
            <div>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: dark ? "#64748b" : "#94a3b8", marginBottom: 12 }}>
                Key points
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {article.insights.key_points.map((pt, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.5, color: dark ? "#cbd5e1" : "#334155" }}>
                    <span style={{ marginTop: 6, width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: "#60a5fa" }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Companies */}
          {article.insights?.companies_mentioned && article.insights.companies_mentioned.length > 0 && (
            <div>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: dark ? "#64748b" : "#94a3b8", marginBottom: 10 }}>
                Companies mentioned
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {article.insights.companies_mentioned.map((c, i) => (
                  <span key={i} style={{
                    fontSize: 12, padding: "4px 12px", borderRadius: 8,
                    background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    color: dark ? "#cbd5e1" : "#334155",
                    border: `0.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                  }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <a href={article.url} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 500,
            background: "#3b82f6", color: "#ffffff", textDecoration: "none",
            transition: "opacity 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Read full article
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M7 17 17 7M7 7h10v10"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
export default function NewsDashboard({
  articles,
  loading = false,
}: {
  articles: Article[];
  loading?: boolean;
}) {
  const [dark, setDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalArticle, setModalArticle] = useState<Article | null>(null);

  const bg        = dark ? "#070a10" : "#f8fafc";
  const text      = dark ? "#f1f5f9" : "#0f172a";
  const muted     = dark ? "#64748b" : "#94a3b8";
  const cardBg    = dark ? "rgba(255,255,255,0.025)" : "#ffffff";
  const cardBorder = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const allCategories = useMemo(() => {
    const cats = new Set(articles.map((a) => a.category || "Other"));
    return ["all", ...Array.from(cats).sort()];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchSearch =
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSentiment = sentimentFilter === "all" || a.sentiment === sentimentFilter;
      const matchCategory  = categoryFilter  === "all" || (a.category || "Other") === categoryFilter;
      return matchSearch && matchSentiment && matchCategory;
    });
  }, [articles, searchQuery, sentimentFilter, categoryFilter]);

  const sentimentCounts = [
    { name: "Positive", value: filteredArticles.filter((a) => a.sentiment === "positive").length },
    { name: "Neutral",  value: filteredArticles.filter((a) => a.sentiment === "neutral").length },
    { name: "Negative", value: filteredArticles.filter((a) => a.sentiment === "negative").length },
  ];

  const categoryMap: Record<string, number> = {};
  filteredArticles.forEach((a) => {
    const cat = a.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const sentimentPillStyle = useCallback((active: boolean) => ({
    background: active ? (dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)") : "transparent",
    color: active ? text : muted,
    border: `0.5px solid ${active ? (dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)") : "transparent"}`,
    borderRadius: 8, padding: "6px 12px", fontSize: 12,
    fontWeight: active ? 500 : 400, cursor: "pointer",
    transition: "all 0.15s ease", whiteSpace: "nowrap" as const,
  }), [dark, text, muted]);

  const catPillStyle = useCallback((active: boolean) => ({
    background: active
      ? (dark ? "rgba(96,165,250,0.15)" : "rgba(59,130,246,0.1)")
      : (dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"),
    color: active ? (dark ? "#60a5fa" : "#2563eb") : muted,
    border: `0.5px solid ${active
      ? (dark ? "rgba(96,165,250,0.3)" : "rgba(59,130,246,0.25)")
      : (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)")}`,
    borderRadius: 8, padding: "6px 14px", fontSize: 12,
    fontWeight: active ? 500 : 400, cursor: "pointer",
    transition: "all 0.15s ease", whiteSpace: "nowrap" as const,
  }), [dark, muted]);

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'DM Sans', system-ui, sans-serif", transition: "background 0.3s, color 0.3s" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display&display=swap');

        .article-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
        .article-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.15); }

        .modal-overlay { animation: fadeIn 0.2s ease; }
        .modal-panel   { animation: slideUp 0.25s ease; }

        @keyframes fadeIn  { from { opacity: 0 }               to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }

        .card-enter { animation: cardIn 0.35s ease both; }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }

        @keyframes shimmer { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        .skeleton-card { animation: shimmer 1.8s ease-in-out infinite; }

        .cat-strip::-webkit-scrollbar { height: 0 }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 4px; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: dark ? "rgba(7,10,16,0.88)" : "rgba(248,250,252,0.92)",
        borderBottom: `0.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Brand row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: 0, letterSpacing: "-0.01em", color: text }}>
                News<span style={{ color: "#60a5fa" }}>Intel</span>
              </h1>
              <p style={{ fontSize: 11, color: muted, margin: "2px 0 0", letterSpacing: "0.04em" }}>
                AI-powered intelligence · {articles.length} articles indexed
              </p>
            </div>

            {/* Theme toggle */}
            <button onClick={() => setDark(!dark)} aria-label="Toggle theme" style={{
              width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              border: `0.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              color: muted, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {dark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Search + sentiment */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted, pointerEvents: "none" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "9px 16px 9px 36px", borderRadius: 12, boxSizing: "border-box",
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  border: `0.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  color: text, fontSize: 13, outline: "none",
                }}
              />
            </div>
            <div style={{
              display: "flex", padding: 4, gap: 2, borderRadius: 12, flexShrink: 0,
              background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: `0.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
            }}>
              {["all", "positive", "neutral", "negative"].map((s) => (
                <button key={s} onClick={() => setSentimentFilter(s)} style={sentimentPillStyle(sentimentFilter === s)}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category strip */}
          <div className="cat-strip" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={catPillStyle(categoryFilter === cat)}>
                {cat === "all" ? "All categories" : cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          <StatCard label="Total" value={filteredArticles.length} color={dark ? "#e2e8f0" : "#0f172a"} dark={dark} />
          <StatCard label="Positive" value={sentimentCounts[0].value} color="#4ade80" dark={dark} />
          <StatCard label="Neutral"  value={sentimentCounts[1].value} color={dark ? "#94a3b8" : "#64748b"} dark={dark} />
          <StatCard label="Negative" value={sentimentCounts[2].value} color="#f87171" dark={dark} />
        </div>

        {/* ── Charts ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {[
            { title: "Sentiment breakdown", chart: (
              <PieChart>
                <Pie data={sentimentCounts} dataKey="value" nameKey="name"
                  innerRadius={55} outerRadius={85} paddingAngle={3}
                  label={({ name, cx = 0, cy = 0, midAngle = 0, outerRadius: or = 0, value }) => {
                    if (!value) return null;
                    const R = Math.PI / 180;
                    const r = (or as number) + 22;
                    const x = (cx as number) + r * Math.cos(-(midAngle as number) * R);
                    const y = (cy as number) + r * Math.sin(-(midAngle as number) * R);
                    return <text x={x} y={y} fill={muted} fontSize={11} textAnchor={x > (cx as number) ? "start" : "end"} dominantBaseline="central">{name}</text>;
                  }}
                  labelLine={false}>
                  {sentimentCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip dark={dark} />} />
              </PieChart>
            )},
            { title: "Category distribution", chart: (
              <BarChart data={categoryData} barSize={12}>
                <XAxis dataKey="name" tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            )},
          ].map(({ title, chart }) => (
            <div key={title} style={{ borderRadius: 20, padding: 28, background: cardBg, border: `0.5px solid ${cardBorder}` }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, marginBottom: 24 }}>{title}</p>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">{chart as any}</ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* ── Article Grid ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, marginBottom: 24 }}>
            Articles · {filteredArticles.length} results
          </p>

          {loading ? (
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} dark={dark} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {filteredArticles.map((article, idx) => {
                const cfg = sentimentConfig[article.sentiment as keyof typeof sentimentConfig] ?? sentimentConfig.neutral;
                return (
                  <div
                    key={article.id}
                    className="article-card card-enter"
                    style={{
                      animationDelay: `${Math.min(idx * 40, 400)}ms`,
                      borderRadius: 20, overflow: "hidden",
                      display: "flex", flexDirection: "column",
                      background: cardBg, border: `0.5px solid ${cardBorder}`,
                      boxShadow: dark ? "none" : "0 1px 8px rgba(0,0,0,0.05)",
                    }}
                    onClick={() => setModalArticle(article)}
                  >
                    {/* Image */}
                    {article.image_url && (
                      <div style={{ height: 176, overflow: "hidden", position: "relative" }}>
                        <img src={article.image_url} alt={article.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.88)" }} />
                        <div style={{ position: "absolute", top: 12, right: 12, width: 10, height: 10, borderRadius: "50%", background: cfg.dot, boxShadow: "0 0 0 2px rgba(0,0,0,0.4)" }} />
                        {article.category && (
                          <span style={{
                            position: "absolute", bottom: 10, left: 10,
                            fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                            background: "rgba(0,0,0,0.55)", color: "#e2e8f0", backdropFilter: "blur(8px)",
                          }}>{article.category}</span>
                        )}
                      </div>
                    )}

                    <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                          background: dark ? cfg.badgeDark : cfg.badgeLight,
                          color: dark ? cfg.badgeDarkText : cfg.badgeLightText,
                          border: `0.5px solid ${dark ? cfg.badgeDarkBorder : cfg.badgeLightBorder}`,
                        }}>{cfg.label}</span>
                        <span style={{ fontSize: 11, color: muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{article.source}</span>
                      </div>

                      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, lineHeight: 1.4, margin: 0, color: dark ? "#f1f5f9" : "#0f172a" }}>
                        {article.title}
                      </h2>

                      <p style={{
                        fontSize: 13, color: dark ? "#94a3b8" : "#64748b", lineHeight: 1.6, margin: 0,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {article.summary}
                      </p>

                      {article.insights?.importance_score !== undefined && (
                        <div>
                          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: muted, marginBottom: 6 }}>Importance</p>
                          <ImportanceBar score={article.insights.importance_score} dark={dark} />
                        </div>
                      )}

                      <div style={{
                        marginTop: "auto", paddingTop: 12,
                        borderTop: `0.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <span style={{ fontSize: 12, color: "#60a5fa" }}>View insights →</span>
                        {(article.insights?.companies_mentioned?.length ?? 0) > 0 && (
                          <span style={{ fontSize: 11, color: muted }}>{article.insights.companies_mentioned!.length} co.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredArticles.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0", color: muted }}>
              <p style={{ fontSize: 16 }}>No articles found</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      <footer style={{ borderTop: `0.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: muted }}>Powered by Gemini AI · Data via NewsData.io</p>
      </footer>

      {modalArticle && (
        <ArticleModal article={modalArticle} dark={dark} onClose={() => setModalArticle(null)} />
      )}
    </main>
  );
}