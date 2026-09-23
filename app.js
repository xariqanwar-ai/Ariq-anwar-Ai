(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const micBtn = $("micBtn"), statusEl = $("status"), heardEl = $("heard");
  const chatEl = $("chat"), core = $("core"), dot = $("statusDot"), support = $("support");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let listening = false;
  let finalText = "";
  let restartTimer = null;

  function addMessage(text, who="ai") {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.innerHTML = `<b>${who === "ai" ? "ARIQ:" : "KAMU:"}</b> ${escapeHtml(text)}`;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function setState(label, type="ready") {
    statusEl.textContent = label;
    dot.className = "dot" + (type==="busy" ? " busy" : type==="error" ? " error" : "");
    document.body.classList.toggle("listening", type==="busy");
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 1;
    u.pitch = 1;
    speechSynthesis.speak(u);
  }

  function reply(text, voice=true) {
    addMessage(text, "ai");
    if (voice) speak(text);
  }

  function nowTime() {
    return new Intl.DateTimeFormat("id-ID", {hour:"2-digit", minute:"2-digit"}).format(new Date());
  }

  function today() {
    return new Intl.DateTimeFormat("id-ID", {weekday:"long", day:"numeric", month:"long", year:"numeric"}).format(new Date());
  }

  function openUrl(url) {
    // Gunakan navigasi langsung, bukan window.open/setTimeout, agar tidak
    // diblokir popup blocker saat perintah berasal dari Speech Recognition.
    window.location.href = url;
  }

  function handleCommand(raw) {
    const text = raw.toLowerCase().trim();
    addMessage(raw, "user");

    if (!text) {
      reply("Saya tidak menangkap ucapanmu. Coba bicara lagi.");
      return;
    }

    if (text.includes("halo") || text.includes("hai") || text.includes("hello")) {
      reply("Halo! Saya Ariq Anwar. Ada yang bisa saya bantu?");
    } else if (text.includes("siapa kamu") || text.includes("kamu siapa")) {
      reply("Saya Ariq Anwar, asisten AI berbasis web di HP ini.");
    } else if (text.includes("jam berapa") || text.includes("pukul berapa") || text.includes("jam sekarang")) {
      reply(`Sekarang pukul ${nowTime()}.`);
    } else if (text.includes("tanggal") || text.includes("hari ini")) {
      reply(`Hari ini ${today()}.`);
    } else if (text.includes("buka youtube") || text.includes("membuka youtube") || text === "youtube") {
      reply("Baik, saya membuka YouTube.", true);
      setTimeout(() => openUrl("https://www.youtube.com/"), 700);
    } else if (text.includes("buka google") || text.includes("membuka google") || text === "google") {
      reply("Baik, saya membuka Google.", true);
      setTimeout(() => openUrl("https://www.google.com/"), 700);
    } else if (text.startsWith("buka youtube") || text.startsWith("membuka youtube")) {
      reply("Baik, saya membuka YouTube.", true);
      setTimeout(() => openUrl("https://www.youtube.com/"), 700);
    } else if (text.includes("cari ")) {
      const q = raw.substring(raw.toLowerCase().indexOf("cari ") + 5).trim();
      if (q) {
        reply(`Mencari ${q}.`);
        setTimeout(() => openUrl("https://www.google.com/search?q=" + encodeURIComponent(q)), 350);
      } else reply("Sebutkan apa yang ingin kamu cari.");
    } else if (text.includes("terima kasih") || text.includes("makasih")) {
      reply("Sama-sama. Saya siap membantu.");
    } else if (text.includes("berhenti") || text.includes("diam")) {
      speechSynthesis?.cancel();
      reply("Baik, saya berhenti berbicara.", false);
    } else {
      reply(`Saya mendengar: "${raw}". Untuk saat ini saya belum memiliki jawaban AI online untuk pertanyaan bebas. Kamu bisa mencoba perintah seperti "jam berapa", "buka YouTube", atau "cari kucing".`);
    }
  }

  function createRecognition() {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = "id-ID";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      listening = true;
      finalText = "";
      setState("MENDENGARKAN…", "busy");
      heardEl.textContent = "Silakan bicara…";
      micBtn.setAttribute("aria-label", "Hentikan mikrofon");
    };

    r.onresult = e => {
      let interim = "";
      let finalPart = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalPart += transcript;
        else interim += transcript;
      }
      if (finalPart) finalText += finalPart + " ";
      heardEl.textContent = (finalText + interim).trim() || "Mendengarkan…";
    };

    r.onerror = e => {
      const messages = {
        "not-allowed": "Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini.",
        "service-not-allowed": "Layanan pengenalan suara tidak diizinkan oleh browser.",
        "no-speech": "Tidak ada suara yang terdeteksi. Coba bicara lebih dekat ke mikrofon.",
        "audio-capture": "Mikrofon tidak ditemukan atau sedang digunakan aplikasi lain.",
        "network": "Pengenalan suara membutuhkan koneksi internet di browser ini.",
        "aborted": "Pengenalan suara dihentikan."
      };
      const msg = messages[e.error] || `Mikrofon gagal: ${e.error}`;
      setState("ERROR", "error");
      heardEl.textContent = msg;
      if (e.error !== "aborted") reply(msg, false);
      listening = false;
    };

    r.onend = () => {
      listening = false;
      micBtn.setAttribute("aria-label", "Mulai bicara");
      setState("SIAP");
      const text = finalText.trim();
      if (text) {
        handleCommand(text);
        heardEl.textContent = `Terakhir: ${text}`;
      } else if (!heardEl.textContent || heardEl.textContent === "Silakan bicara…" || heardEl.textContent === "Mendengarkan…") {
        heardEl.textContent = "Tekan mikrofon dan bicara.";
      }
    };
    return r;
  }

  function toggleMic() {
    if (!SpeechRecognition) {
      setState("TIDAK DIDUKUNG", "error");
      heardEl.textContent = "Browser ini tidak mendukung Speech Recognition. Gunakan Google Chrome Android.";
      return;
    }

    if (listening) {
      recognition?.stop();
      return;
    }

    clearTimeout(restartTimer);
    recognition = createRecognition();
    try {
      recognition.start();
    } catch (e) {
      setState("SIAP", "error");
      heardEl.textContent = "Mikrofon sedang sibuk. Tunggu sebentar lalu coba lagi.";
    }
  }

  micBtn.addEventListener("click", toggleMic);

  document.querySelectorAll(".quick button").forEach(btn => {
    btn.addEventListener("click", () => handleCommand(btn.dataset.cmd));
  });

  if (!SpeechRecognition) {
    support.textContent = "⚠️ Speech Recognition tidak didukung. Gunakan Chrome Android.";
  } else {
    support.textContent = "✓ Speech Recognition tersedia";
  }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  window.addEventListener("beforeunload", () => {
    try { recognition?.stop(); } catch {}
  });
})();
