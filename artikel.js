// ===== Pembaca artikel (by ?slug=) =====
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const fmtDate = (s) => { const d = new Date(s); return isNaN(d) ? esc(s || "") : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

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
      <div class="reader-footer">
        <div class="byline">
          <span class="badge">${badge}</span>
          <span class="who"><b>${esc(authorName)}</b><span>${esc(authorCred)}</span></span>
        </div>
      </div>`;
  }).catch(() => {
    root.innerHTML = `<div class="empty-note">Gagal memuat tulisan.</div>`;
  });
})();
