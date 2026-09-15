// ===== Homepage renderer + interactions =====
(function () {
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  function fmtDate(s) {
    const d = new Date(s);
    if (isNaN(d)) return esc(s || "");
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function initials(name) {
    return String(name || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "PD";
  }

  let CONTENT = {};

  fetch("/api/content", { cache: "no-store" })
    .then((r) => r.json())
    .then((c) => {
      CONTENT = c || {};
      window.__CONTENT__ = CONTENT;
      applyMeta(CONTENT.meta);
      renderBrand(CONTENT.brand, (CONTENT.hero && CONTENT.hero.avatarImage) || "");
      renderHero(CONTENT.hero || {});
      renderAbout(CONTENT.about || {});
      renderProfile(CONTENT.about || {}, CONTENT.hero || {}, CONTENT.brand || {});
      renderExperience(CONTENT.experience || {});
      renderEducation(CONTENT.education || {});
      renderWorks(CONTENT.works || {});
      renderWritingsHead(CONTENT.writings || {});
      renderGallery(CONTENT.gallery || {});
      renderContact(CONTENT.contact || {});
      const ft = document.getElementById("footerText");
      if (ft && CONTENT.footer) ft.textContent = String(CONTENT.footer).replace(/^©\s*/, "");
    })
    .catch(() => {})
    .finally(() => {
      loadArticles();
      initInteractions();
    });

  function applyMeta(m) {
    if (!m) return;
    if (m.title) document.title = m.title;
    const d = document.querySelector('meta[name="description"]');
    if (d && m.description) d.setAttribute("content", m.description);
  }

  function renderBrand(b, photo) {
    b = b || {};
    const badge = document.querySelector(".brand-badge");
    const name = document.querySelector(".brand-name");
    if (badge) {
      if (photo) {
        badge.innerHTML = `<img alt="${esc(b.name)}" src="${esc(photo)}">`;
      } else badge.textContent = b.badge || "PD";
    }
    if (name) name.innerHTML = `${esc(b.name || "Profil Dosen")}<small>${esc(b.credential || "")}</small>`;
  }

  function renderHero(h) {
    const hero = document.getElementById("hero");
    const bg = h.backgroundImage || h.avatarImage;
    if (hero && bg) {
      hero.classList.add("has-avatar");
      hero.style.setProperty("--hero-photo", `url('${bg.replace(/'/g, "\\'")}')`);
    }
    if (hero && h.backgroundOpacity != null && h.backgroundOpacity !== "") {
      // 100 = foto sepenuhnya terlihat (overlay minim), 0 = foto tersembunyi (overlay penuh)
      const bo = Math.max(0, Math.min(100, Number(h.backgroundOpacity)));
      const base = 1 - bo / 100;
      const min = Math.max(0, base - 0.1).toFixed(3);
      const max = Math.min(1, base + 0.1).toFixed(3);
      hero.style.setProperty("--hero-overlay-min", min);
      hero.style.setProperty("--hero-overlay-max", max);
    }
    const text = document.querySelector(".hero-text");
    if (text) {
      text.innerHTML = `
        <span class="hero-kicker">${esc(h.kicker || "SITUS PROFIL")}</span>
        <h1>${h.nameHtml || "Nama Dosen"}</h1>
        <p class="hero-role" id="typewriter"></p>
        <div class="hero-desc">${h.desc || ""}</div>
        <div class="hero-actions">
          <a href="${esc(h.btnPrimaryHref || "tulisan.html")}" class="btn btn-primary">${esc(h.btnPrimary || "Baca Tulisan")}</a>
          <a href="${esc(h.btnGhostHref || "#about")}" class="btn btn-ghost">${esc(h.btnGhost || "Tentang Saya")}</a>
          <a href="${esc(h.btnTertiaryHref || "tulisan.html")}" class="btn btn-ghost">${esc(h.btnTertiary || "Tulisan Saya")}</a>
        </div>
        <div class="hero-stats">
          ${(h.stats || []).map((s) => `<div class="stat"><b data-count="${Number(s.count) || 0}">0</b><span>${esc(s.label)}</span></div>`).join("")}
        </div>`;
    }
  }

  function sectionHead(tag, headingHtml, sub) {
    return `
      <span class="section-tag">${esc(tag || "")}</span>
      <h2>${headingHtml || ""}</h2>
      ${sub ? `<div class="section-sub">${sub}</div>` : ""}`;
  }

  // "Fokus & Keahlian" — kartu ala template (heading disembunyikan)
  function renderAbout(a) {
    const head = document.getElementById("aboutHead");
    if (head) head.style.display = "none";
    const cards = document.getElementById("aboutCards");
    if (!cards) return;
    const list = a.cards || [];
    if (!list.length) {
      cards.innerHTML = `<div class="empty-note">Belum ada kartu fokus. Tambahkan lewat halaman admin.</div>`;
      return;
    }
    cards.innerHTML = list.map((m) => `
      <div class="feature-item reveal">
        <div class="feature-ico">${esc(m.icon || "★")}</div>
        <h4>${esc(m.title)}</h4>
        <div>${m.text || ""}</div>
      </div>`).join("");
  }

  // "Tentang" — foto + paragraf
  function renderProfile(a, hero, brand) {
    const photo = document.getElementById("profilePhoto");
    const text = document.getElementById("profileText");
    if (photo) {
      photo.innerHTML = hero.avatarImage
        ? `<img src="${esc(hero.avatarImage)}" alt="Foto profil"><span class="photo-tag">Profil</span>`
        : `<span class="placeholder-initials">${esc(initials(brand.name))}</span><span class="photo-tag">Foto</span>`;
    }
    if (text) {
      text.innerHTML = `
        <span class="section-tag">${esc(a.tag || "Tentang")}</span>
        <h2>Sekilas tentang <em>saya</em></h2>
        ${(a.paragraphs || []).map((p) => `<p>${p}</p>`).join("")}
        ${(a.list || []).length ? `<ul class="about-list">${a.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>` : ""}`;
    }
  }

  function renderExperience(e) {
    const head = document.getElementById("experienceHead");
    if (head) head.innerHTML = sectionHead(e.tag, e.headingHtml);
    const list = document.getElementById("experienceList");
    if (!list) return;
    list.innerHTML = (e.items || []).map((it) => `
      <div class="tl-item reveal">
        <div class="tl-dot"></div>
        <div class="tl-card">
          <span class="tl-date">${esc(it.date)}</span>
          <h4>${esc(it.role)}</h4>
          <p class="tl-org">${esc(it.org)}</p>
          ${(it.desc && String(it.desc).replace(/<[^>]+>|\s/g, "").length) ? `<div class="tl-desc">${it.desc}</div>` : ""}
        </div>
      </div>`).join("") || `<div class="empty-note">Belum ada perjalanan. Tambahkan lewat halaman admin.</div>`;
  }

  function renderEducation(ed) {
    const head = document.getElementById("educationHead");
    if (head) head.innerHTML = sectionHead(ed.tag, ed.headingHtml);
    const list = document.getElementById("educationList");
    if (list) {
      list.innerHTML = (ed.items || []).map((it) => `
        <div class="edu-card reveal">
          <div class="edu-ico">${esc(it.icon || "🎓")}</div>
          <span class="edu-date">${esc(it.date)}</span>
          <h4>${esc(it.degree)}</h4>
          <p class="edu-org">${esc(it.org)}</p>
          <div>${it.desc || ""}</div>
        </div>`).join("") || `<div class="empty-note">Belum ada data pendidikan.</div>`;
    }
    const focusBlock = document.getElementById("focusBlock");
    if (focusBlock) {
      if ((ed.focus || []).length) {
        focusBlock.innerHTML = `
          <h3 class="works-subhead reveal">${esc(ed.focusTitle || "Fokus Keilmuan")}</h3>
          <div class="focus-grid reveal">
            ${ed.focus.map((f) => `
              <div class="focus-card">
                <div class="focus-ico">${esc(f.icon || "🎯")}</div>
                <h4>${esc(f.title)}</h4>
                <div>${f.desc || ""}</div>
              </div>`).join("")}
          </div>`;
      } else {
        focusBlock.innerHTML = "";
      }
    }
  }

  function renderWorks(w) {
    const c = document.getElementById("worksBody");
    if (!c) return;
    const scholarLinks = [];
    if (w.scholarUrl) scholarLinks.push(`<a class="btn btn-primary" href="${esc(w.scholarUrl)}" target="_blank" rel="noopener">${esc(w.scholarBtn || "Google Scholar ↗")}</a>`);
    if (w.sintaUrl) scholarLinks.push(`<a class="btn btn-ghost" href="${esc(w.sintaUrl)}" target="_blank" rel="noopener">${esc(w.sintaBtn || "SINTA ↗")}</a>`);
    if (w.scopusUrl) scholarLinks.push(`<a class="btn btn-ghost" href="${esc(w.scopusUrl)}" target="_blank" rel="noopener">${esc(w.scopusBtn || "Scopus ↗")}</a>`);
    const PUB_LIMIT = 8;
    // Selalu tampilkan dari tahun terbaru, apa pun urutan tersimpan (mis. hasil sinkron Scholar).
    const pubYear = (p) => {
      const n = ((String(p.meta || "") + " " + String(p.title || "")).match(/\b(19|20)\d{2}\b/g) || [])
        .map(Number).filter((y) => y >= 1970 && y <= 2035);
      return n.length ? Math.max(...n) : -1;
    };
    const pubs = (w.publications || []).slice().sort((a, b) => pubYear(b) - pubYear(a));
    const pubCard = (p, i) => {
      const cm = String(p.meta || "").match(/·\s*([\d.,]+)\s*sitasi/i);
      const cites = cm ? cm[1] : "";
      const metaClean = String(p.meta || "").replace(/\s*·\s*[\d.,]+\s*sitasi/i, "").trim();
      return `
        <div class="pub-item${i >= PUB_LIMIT ? " pub-hidden" : ""}">
          <div class="pub-body">
            <div class="pub-title">${esc(p.title)}</div>
            ${metaClean ? `<div class="pub-meta">${esc(metaClean)}</div>` : ""}
          </div>
          ${cites ? `<span class="pub-cite" title="${esc(cites)} sitasi">${esc(cites)}<small>sitasi</small></span>` : ""}
        </div>`;
    };
    const renderCols = (cols) => `
      <div class="works-cols">
        ${(cols || []).map((col) => `
          <div class="work-col reveal">
            <h4><span class="wc-ico">${esc(col.icon || "•")}</span> ${esc(col.title)}</h4>
            <div class="work-items">
              ${(col.items || []).map((it) => `
                <div class="work-item">
                  <div class="wi-title">${esc(it.title)}</div>
                  <div class="wi-meta">${esc(it.meta)}</div>
                </div>`).join("")}
            </div>
          </div>`).join("")}
      </div>`;

    const scopusHasData = (w.scopusStats || []).some((s) => {
      const v = String(s.value || "").trim();
      return v && v !== "—" && v !== "-";
    });

    c.innerHTML = `
      <div class="section-head center reveal">${sectionHead(w.tag, w.headingHtml, w.sub)}</div>

      <h3 class="works-subhead reveal">${esc(w.scholarTitle || "Rekam Jejak Publikasi")}</h3>
      <div class="scholar-stats reveal">
        ${(w.scholarStats || []).map((s) => `
          <div class="sc-stat">
            <span class="sc-ico">${esc(s.icon || "📊")}</span>
            <b>${esc(s.value)}</b>
            <span class="sc-label">${esc(s.label)}</span>
          </div>`).join("")}
      </div>
      ${scholarLinks.length ? `<div class="scholar-cta reveal">${scholarLinks.join("")}</div>` : ""}

      ${scopusHasData ? `
      <h3 class="works-subhead reveal">${esc(w.scopusTitle || "Rekam Jejak Scopus")}</h3>
      <div class="scholar-stats reveal scopus-stats">
        ${w.scopusStats.map((s) => `
          <div class="sc-stat">
            <span class="sc-ico">${esc(s.icon || "📄")}</span>
            <b>${esc(s.value)}</b>
            <span class="sc-label">${esc(s.label)}</span>
          </div>`).join("")}
      </div>` : ""}

      ${pubs.length ? `
      <h3 class="works-subhead reveal">${esc(w.worksListTitle || "Daftar Karya Ilmiah")} <span class="pub-count">${pubs.length}</span></h3>
      <div class="pub-panel reveal" id="pubPanel">
        <div class="pub-grid" id="pubList">
          ${pubs.map(pubCard).join("")}
        </div>
      </div>
      ${pubs.length > PUB_LIMIT ? `<div class="pub-more-wrap reveal"><button class="btn btn-ghost" id="pubMoreBtn">Lihat semua ${pubs.length} karya ↓</button></div>` : ""}
      ` : ""}

      ${(w.columns && w.columns.length) ? `<h3 class="works-subhead reveal">${esc(w.researchTitle || "Penelitian dan Pengabdian")}</h3>${renderCols(w.columns)}` : ""}

      ${(w.kiprahColumns && w.kiprahColumns.length) ? `<h3 class="works-subhead reveal">${esc(w.kiprahTitle || "Amanah dan Kiprah")}</h3>${renderCols(w.kiprahColumns)}` : ""}`;

    const moreBtn = document.getElementById("pubMoreBtn");
    if (moreBtn) {
      moreBtn.addEventListener("click", () => {
        const panel = document.getElementById("pubPanel");
        const expanded = panel.classList.toggle("show-all");
        moreBtn.textContent = expanded ? "Tampilkan lebih sedikit ↑" : `Lihat semua ${pubs.length} karya ↓`;
        if (!expanded) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  function renderWritingsHead(wr) {
    const h = document.getElementById("writingsHead");
    if (h) h.innerHTML = sectionHead(wr.tag, wr.headingHtml, wr.sub);
    const more = document.getElementById("writingsMore");
    if (more) more.innerHTML = `<a class="btn btn-ghost" href="tulisan.html">${esc(wr.viewAll || "Lihat semua tulisan →")}</a>`;
  }

  function renderGallery(g) {
    const head = document.getElementById("galleryHead");
    if (head) head.innerHTML = sectionHead(g.tag || "Galeri", g.headingHtml || "Galeri <em>foto</em>", g.sub || "");
    const grid = document.getElementById("galleryGrid");
    if (!grid) return;
    const items = (g.items || []).filter((it) => it && it.image);
    if (!items.length) {
      grid.innerHTML = `<div class="empty-note">Belum ada foto. Tambahkan lewat halaman admin → Profil → Galeri Foto.</div>`;
      return;
    }
    grid.innerHTML = items.map((it, i) => `
      <div class="gallery-item reveal" data-idx="${i}">
        <img src="${esc(it.image)}" alt="${esc(it.caption || "Foto galeri")}" loading="lazy">
        ${it.caption ? `<div class="gallery-cap">${esc(it.caption)}</div>` : ""}
      </div>`).join("");
    initLightbox(items);
  }

  function initLightbox(items) {
    const box = document.getElementById("lightbox");
    const img = document.getElementById("lbImage");
    const cap = document.getElementById("lbCaption");
    if (!box || !img) return;
    let idx = 0;
    const open = (i) => {
      idx = (i + items.length) % items.length;
      img.src = items[idx].image;
      cap.textContent = items[idx].caption || "";
      box.hidden = false;
      requestAnimationFrame(() => box.classList.add("open"));
      document.body.classList.add("lb-open");
    };
    const close = () => {
      box.classList.remove("open");
      document.body.classList.remove("lb-open");
      setTimeout(() => { box.hidden = true; img.src = ""; }, 250);
    };
    document.querySelectorAll(".gallery-item").forEach((el) => {
      el.addEventListener("click", () => open(Number(el.dataset.idx) || 0));
    });
    document.getElementById("lbClose").onclick = close;
    document.getElementById("lbPrev").onclick = () => open(idx - 1);
    document.getElementById("lbNext").onclick = () => open(idx + 1);
    box.onclick = (e) => { if (e.target === box) close(); };
    document.addEventListener("keydown", (e) => {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") open(idx + 1);
      else if (e.key === "ArrowLeft") open(idx - 1);
    });
  }

  function articleCard(a) {
    const cover = a.cover
      ? `<img src="${esc(a.cover)}" alt="${esc(a.title)}">`
      : `<span>“ ”</span>`;
    return `
      <a class="article-card reveal" href="artikel.html?slug=${encodeURIComponent(a.slug)}">
        <div class="article-cover">${cover}</div>
        <div class="article-body">
          <span class="article-cat">${esc(a.category || "Tulisan")}</span>
          <h3>${esc(a.title)}</h3>
          <p class="article-excerpt">${esc(a.excerpt || "")}</p>
          <div class="article-meta">
            <span>${fmtDate(a.date)}</span><span class="dot"></span>
            <span>${Number(a.readMinutes) || 1} menit baca</span>
          </div>
        </div>
      </a>`;
  }

  function loadArticles() {
    const grid = document.getElementById("writingsGrid");
    if (!grid) return;
    fetch("/api/articles", { cache: "no-store" })
      .then((r) => r.json())
      .then((list) => {
        const arr = (Array.isArray(list) ? list : []).slice(0, 3);
        if (!arr.length) {
          grid.innerHTML = `<div class="empty-note">Belum ada tulisan. Tambahkan lewat halaman admin.</div>`;
          return;
        }
        grid.innerHTML = arr.map(articleCard).join("");
        observeReveal();
      })
      .catch(() => {
        grid.innerHTML = `<div class="empty-note">Gagal memuat tulisan.</div>`;
      });
  }

  function renderContact(ct) {
    const head = document.getElementById("contactHead");
    if (head) head.innerHTML = sectionHead(ct.tag, ct.headingHtml, ct.sub);
    const info = document.getElementById("contactInfo");
    if (info) {
      const rows = [];
      if (ct.email) rows.push(`<div class="contact-row"><span class="ci">✉️</span><div><b>Email</b><br><a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a></div></div>`);
      if (ct.whatsappNumber) rows.push(`<div class="contact-row"><span class="ci">💬</span><div><b>WhatsApp</b><br><a href="https://wa.me/${esc(String(ct.whatsappNumber).replace(/[^0-9]/g, ""))}" target="_blank" rel="noopener">${esc(ct.whatsappNumber)}</a></div></div>`);
      if (ct.location) rows.push(`<div class="contact-row"><span class="ci">📍</span><div><b>Lokasi</b><br><span>${esc(ct.location)}</span></div></div>`);
      const socials = (ct.socials || []).filter((s) => s.url);
      if (socials.length) rows.push(`<div class="socials">${socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.label)}">${esc(s.text)}</a>`).join("")}</div>`);
      info.innerHTML = rows.join("");
    }
  }

  // ---------- Interactions ----------
  let revObserver;
  function observeReveal() {
    if (!revObserver) return;
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => revObserver.observe(el));
  }

  function initInteractions() {
    document.getElementById("year").textContent = new Date().getFullYear();

    const navbar = document.getElementById("navbar");
    const progress = document.getElementById("scrollProgress");
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    });

    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    const backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);
    const setMenu = (open) => {
      navLinks.classList.toggle("open", open);
      navToggle.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
    };
    navToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
    backdrop.addEventListener("click", () => setMenu(false));
    navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

    // Typewriter
    const roles = (CONTENT.hero && CONTENT.hero.roles) || [];
    const tw = document.getElementById("typewriter");
    if (tw && roles.length) {
      let ri = 0, ci = 0, del = false;
      const type = () => {
        const word = roles[ri];
        tw.textContent = word.slice(0, ci);
        if (!del && ci < word.length) ci++;
        else if (del && ci > 0) ci--;
        else if (!del && ci === word.length) { del = true; return setTimeout(type, 1500); }
        else { del = false; ri = (ri + 1) % roles.length; }
        setTimeout(type, del ? 45 : 95);
      };
      type();
    }

    // Reveal on scroll
    revObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); revObserver.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    observeReveal();

    // Count-up
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, target = +el.dataset.count;
        let cur = 0; const step = Math.max(1, Math.round(target / 40));
        const tick = () => { cur += step; if (cur >= target) el.textContent = target; else { el.textContent = cur; requestAnimationFrame(tick); } };
        tick(); countObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".stat b").forEach((el) => countObserver.observe(el));

    // Contact form → mailto
    const form = document.getElementById("contactForm");
    const note = document.getElementById("formNote");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.name.value.trim(), email = form.email.value.trim(), message = form.message.value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !email || !message) { note.textContent = "Mohon lengkapi semua kolom."; note.className = "form-note err"; return; }
      if (!emailOk) { note.textContent = "Format email tidak valid."; note.className = "form-note err"; return; }
      const to = (CONTENT.contact && CONTENT.contact.email) || "";
      window.location.href = `mailto:${to}?subject=${encodeURIComponent("Pesan dari " + name)}&body=${encodeURIComponent(message + "\n\n— " + name + " (" + email + ")")}`;
      note.textContent = "Terima kasih! Aplikasi email Anda akan terbuka."; note.className = "form-note ok"; form.reset();
    });
  }
})();
