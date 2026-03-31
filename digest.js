// AI-style RSS digest (client-side)
// Note: For static hosting (GitHub Pages), this depends on CORS access to rss2json.

const DIGEST_FEEDS = [
  {
    label: "BBC Africa",
    rssUrl: "http://feeds.bbci.co.uk/news/world/africa/rss.xml"
  },
  {
    label: "SABC Africa",
    rssUrl: "http://www.sabcnews.com/sabcnews/category/africa/feed/"
  },
  {
    label: "GroundUp",
    rssUrl: "https://groundup.org.za/sitenews/rss/"
  },
  {
    label: "Lesotho Times",
    rssUrl: "https://lestimes.com/feed/"
  },
  {
    label: "News24 Africa",
    rssUrl: "http://feeds.news24.com/articles/news24/Africa/rss"
  }
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "after",
  "over",
  "under",
  "between",
  "more",
  "most",
  "after",
  "an",
  "a",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "it",
  "this",
  "that",
  "these",
  "those",
  "new",
  "report",
  "reports",
  "update",
  "updates",
  "news"
]);

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return m;
    }
  });
}

function aiSummarizeTitle(title, sourceLabel) {
  const words = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 4)
    .filter((w) => !STOPWORDS.has(w));

  const keywords = [];
  for (const w of words) {
    if (!keywords.includes(w)) keywords.push(w);
    if (keywords.length >= 5) break;
  }

  if (keywords.length === 0) {
    return `AI highlight: ${sourceLabel} is featuring a developing story.`;
  }
  return `AI highlight: ${sourceLabel} focuses on ${keywords.join(", ")}.`;
}

async function fetchRssViaRss2Json(rssUrl) {
  const rss2jsonUrl =
    "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl);

  const res = await fetch(rss2jsonUrl, { method: "GET" });
  if (!res.ok) throw new Error("RSS2JSON failed: " + res.status);

  const data = await res.json();
  if (!data || data.status !== "ok" || !Array.isArray(data.items)) {
    throw new Error("Bad RSS2JSON response");
  }
  return data.items;
}

function safeDate(pubDate) {
  const t = Date.parse(pubDate);
  return Number.isNaN(t) ? null : new Date(t);
}

function formatDate(d) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(d);
  } catch {
    return d.toDateString();
  }
}

function renderDigest(items) {
  const listEl = document.getElementById("digest-list");
  const statusEl = document.getElementById("digest-status");
  if (!listEl || !statusEl) return;

  listEl.innerHTML = "";

  if (!items.length) {
    statusEl.textContent = "Could not load RSS stories right now.";
    listEl.innerHTML = "<li class=\"digest-item\">Please refresh later.</li>";
    return;
  }

  for (const item of items) {
    const d = safeDate(item.pubDate);
    const dateText = d ? formatDate(d) : "";
    const summary = aiSummarizeTitle(item.title, item.sourceLabel);

    const li = document.createElement("li");
    li.className = "digest-item";
    li.innerHTML = `
      <div class="digest-title">
        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
      </div>
      <div class="digest-source">${escapeHtml(item.sourceLabel)}${dateText ? " | " + escapeHtml(dateText) : ""}</div>
      <div class="ai-summary">${escapeHtml(summary)}</div>
    `;
    listEl.appendChild(li);
  }

  statusEl.textContent = "Updated just now (RSS).";
}

function renderSkeleton(count = 6) {
  const listEl = document.getElementById("digest-list");
  const statusEl = document.getElementById("digest-status");
  if (!listEl || !statusEl) return;

  statusEl.textContent = "Loading latest stories...";
  listEl.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const li = document.createElement("li");
    li.className = "digest-item";
    li.innerHTML = `
      <div class="digest-title">Loading...</div>
      <div class="digest-source">Please wait</div>
      <div class="ai-summary">AI summary will appear shortly.</div>
    `;
    listEl.appendChild(li);
  }
}

const STATIC_MOCK_ITEMS = [
  {
    title: "Lesotho's Economy Shows Growth in Q2 2024 - LNBS",
    link: "#",
    pubDate: new Date().toISOString(),
    sourceLabel: "LNBS"
  },
  {
    title: "SABC Announces New Digital Broadcasting Initiative",
    link: "#",
    pubDate: new Date().toISOString(),
    sourceLabel: "SABC"
  },
  {
    title: "Redi Tlhabi Wins African Journalism Award",
    link: "#",
    pubDate: new Date().toISOString(),
    sourceLabel: "Africa Media"
  },
  {
    title: "Maseru Hosts Southern African Media Summit",
    link: "#",
    pubDate: new Date().toISOString(),
    sourceLabel: "Southern Africa"
  }
];

function setDigestUpdatedTimestamp() {
  const el = document.getElementById("digest-updated");
  if (!el) return;
  try {
    el.textContent = "Last updated: " + new Date().toLocaleString();
  } catch {
    el.textContent = "Last updated: just now";
  }
}

async function loadAiDigest() {
  const statusEl = document.getElementById("digest-status");
  renderSkeleton(6);

  try {
    const all = [];
    const results = await Promise.allSettled(
      DIGEST_FEEDS.map(async (src) => {
        const items = await fetchRssViaRss2Json(src.rssUrl);
        return items.map((it) => ({
          title: it.title || it.description || "Untitled",
          link: it.link || "",
          pubDate: it.pubDate || "",
          sourceLabel: src.label
        }));
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") all.push(...r.value);
    }

    // Deduplicate by link
    const seen = new Set();
    const deduped = [];
    for (const it of all) {
      if (!it.link) continue;
      if (seen.has(it.link)) continue;
      seen.add(it.link);
      deduped.push(it);
    }

    // Sort newest first if dates exist
    deduped.sort((a, b) => {
      const da = safeDate(a.pubDate)?.getTime() ?? 0;
      const db = safeDate(b.pubDate)?.getTime() ?? 0;
      return db - da;
    });

    const top = deduped.slice(0, 9);
    if (top.length) {
      renderDigest(top);
      setDigestUpdatedTimestamp();
      return;
    }

    // Empty results -> static mock
    renderDigest(STATIC_MOCK_ITEMS);
    if (statusEl) statusEl.textContent = "Using offline mock headlines.";
    setDigestUpdatedTimestamp();
  } catch {
    renderDigest(STATIC_MOCK_ITEMS);
    if (statusEl) statusEl.textContent = "Using offline mock headlines (network/CORS issue).";
    setDigestUpdatedTimestamp();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("digest-refresh");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadAiDigest();
    });
  }

  loadAiDigest();
});

