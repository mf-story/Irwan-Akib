// ===== Pembaca artikel (by ?slug=) =====
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const fmtDate = (s) => { const d = new Date(s); return isNaN(d) ? esc(s || "") : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

  const fmtDateTime = (s) => {
    const d = new Date(s);
    if (isNaN(d)) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${hh}.${mm}`;
  };
  const escBr = (s) => esc(s).replace(/\n/g, "<br>");
  const initialsOf = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";

  function setupComments(slug) {
    const listEl = document.getElementById("commentList");
    const countEl = document.getElementById("commentCount");
    const form = document.getElementById("commentForm");
    const statusEl = document.getElementById("cStatus");
    const submitBtn = document.getElementById("cSubmit");
    if (!listEl || !form) return;

    function render(items) {
      countEl.textContent = items.length ? `(${items.length})` : "";
      if (!items.length) {
        listEl.innerHTML = `<p class="comment-empty">Belum ada komentar. Jadilah yang pertama berkomentar.</p>`;
        return;
      }
      listEl.innerHTML = items
        .slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .map((c) => `
          <div class="comment">
            <span class="comment-avatar">${esc(initialsOf(c.name))}</span>
            <div class="comment-body">
              <div class="comment-head"><b>${esc(c.name)}</b><span>${fmtDateTime(c.date)}</span></div>
              <p>${escBr(c.message)}</p>
            </div>
          </div>`).join("");
    }

    fetch("/api/comments?slug=" + encodeURIComponent(slug), { cache: "no-store" })
      .then((r) => r.json()).then(render).catch(() => render([]));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cName").value.trim();
      const message = document.getElementById("cMessage").value.trim();
      if (name.length < 2 || message.length < 2) { statusEl.textContent = "Isi nama dan komentar dulu."; return; }
      submitBtn.disabled = true; statusEl.textContent = "Mengirim...";
      fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, message }),
      })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (!ok || j.ok === false) { statusEl.textContent = (j && j.error) || "Gagal mengirim."; return; }
          document.getElementById("cMessage").value = "";
          statusEl.textContent = "Komentar terkirim. Terima kasih!";
          fetch("/api/comments?slug=" + encodeURIComponent(slug), { cache: "no-store" }).then((r) => r.json()).then(render).catch(() => {});
          setTimeout(() => { statusEl.textContent = ""; }, 3000);
        })
        .catch(() => { statusEl.textContent = "Gagal mengirim."; })
        .finally(() => { submitBtn.disabled = false; });
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
  const root = document.getElementById("readerRoot");
  const slug = new URLSearchParams(location.search).get("slug");

  const progress = document.getElementById("scrollProgress");
  window.addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
  });

  // Nav toggle mobile
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle) navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    navToggle.classList.toggle("open");
  });

  if (!slug) {
    root.innerHTML = `<div class="empty-note">Tulisan tidak ditemukan.</div>`;
    return;
  }

  Promise.all([
    fetch("/api/article?slug=" + encodeURIComponent(slug), { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
    fetch("/api/content", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
  ]).then(([a, content]) => {
    if (!a || a.ok === false) {
      root.innerHTML = `<div class="empty-note">Tulisan tidak ditemukan.</div>`;
      return;
    }
    const brand = (content && content.brand) || {};
    const hero = (content && content.hero) || {};
    const authorName = brand.name || "Profil Dosen";
    const authorCred = brand.credential || (hero.kicker || "");

    // Set page title & branding
    const siteTitle = (content && content.meta && content.meta.title) || authorName;
    document.title = a.title + " — " + siteTitle.split(" — ")[0];
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", a.excerpt || a.title);

    const badgeEl = document.querySelector(".brand-badge");
    const nameEl = document.querySelector(".brand-name");
    if (badgeEl) {
      if (hero.avatarImage) badgeEl.innerHTML = `<img src="${esc(hero.avatarImage)}" alt="">`;
      else badgeEl.textContent = brand.badge || "PD";
    }
    if (nameEl) nameEl.innerHTML = `${esc(authorName)}<small>${esc(authorCred)}</small>`;

    const ft = document.getElementById("footerText");
    if (ft && content && content.footer) ft.textContent = String(content.footer).replace(/^©\s*/, "");

    const photo = hero.avatarImage || "";
    const badge = photo ? `<img src="${esc(photo)}" alt="">` : esc(brand.badge || "PD");
    const cover = a.cover ? `<div class="reader-cover"><img src="${esc(a.cover)}" alt="${esc(a.title)}"></div>` : "";

    const shareUrl = encodeURIComponent(location.href);
    const shareText = encodeURIComponent(a.title);
    const ic = {
      wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.33 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.02c-1.53 0-3.03-.41-4.34-1.19l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.24-8.23 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.15.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>',
      fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
      x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25H8.1l4.71 6.23 5.43-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z"/></svg>',
      tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
      link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l1.93-1.93a5 5 0 0 0-7.07-7.07l-1 1"/><path d="M14 11a5 5 0 0 0-7.07 0L5 12.93a5 5 0 0 0 7.07 7.07l1-1"/></svg>'
    };
    const shareHtml = `
      <div class="share-bar">
        <span class="share-label">Bagikan tulisan ini</span>
        <div class="share-btns">
          <a class="share-btn wa" href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener" aria-label="Bagikan ke WhatsApp">${ic.wa}</a>
          <a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" aria-label="Bagikan ke Facebook">${ic.fb}</a>
          <a class="share-btn xt" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener" aria-label="Bagikan ke X">${ic.x}</a>
          <a class="share-btn tg" href="https://t.me/share/url?url=${shareUrl}&text=${shareText}" target="_blank" rel="noopener" aria-label="Bagikan ke Telegram">${ic.tg}</a>
          <button class="share-btn copy" id="copyLinkBtn" type="button" aria-label="Salin tautan">${ic.link}</button>
        </div>
      </div>`;

    root.innerHTML = `
      <div class="reader-head">
        <span class="reader-cat">${esc(a.category || "Tulisan")}</span>
        <h1>${esc(a.title)}</h1>
        <div class="reader-meta">
          <span>${fmtDate(a.date)}</span> · <span>${Number(a.readMinutes) || 1} menit baca</span>
        </div>
      </div>
      ${cover}
      <div class="prose">${a.bodyHtml || ""}</div>
      ${shareHtml}
      <div class="reader-footer">
        <div class="byline">
          <span class="badge">${badge}</span>
          <span class="who"><b>${esc(authorName)}</b><span>${esc(authorCred)}</span></span>
        </div>
      </div>
      <section class="comments" id="commentsSection">
        <h3 class="comments-title">Komentar <span id="commentCount"></span></h3>
        <form class="comment-form" id="commentForm">
          <input type="text" id="cName" class="cf-input" placeholder="Nama Anda" maxlength="60" autocomplete="name" required />
          <textarea id="cMessage" class="cf-input" placeholder="Tulis komentar Anda..." rows="3" maxlength="2000" required></textarea>
          <div class="cf-actions">
            <span class="cf-status" id="cStatus"></span>
            <button type="submit" class="btn btn-primary" id="cSubmit">Kirim Komentar</button>
          </div>
        </form>
        <div class="comment-list" id="commentList"></div>
      </section>`;

    const copyBtn = document.getElementById("copyLinkBtn");
    if (copyBtn) copyBtn.addEventListener("click", () => {
      const done = () => { copyBtn.classList.add("copied"); setTimeout(() => copyBtn.classList.remove("copied"), 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done).catch(() => window.prompt("Salin tautan:", location.href));
      else window.prompt("Salin tautan:", location.href);
    });

    setupComments(slug);
  }).catch(() => {
    root.innerHTML = `<div class="empty-note">Gagal memuat tulisan.</div>`;
  });
})();
