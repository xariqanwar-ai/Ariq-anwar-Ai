const $ = (s) => document.querySelector(s);
const chat = $("#chat"), input = $("#input"), status = $("#status"), mic = $("#mic");

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function msg(t, u=false) {
  const d = document.createElement("div");
  d.className = "msg " + (u ? "user" : "ai");
  d.innerHTML = u
    ? `<div><strong>Kamu</strong><p>${esc(t)}</p></div>`
    : `<span>AA</span><div><strong>Ariq Anwar V4</strong><p>${esc(t)}</p></div>`;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function speak(t) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = "id-ID";
  u.rate = 1;
  u.pitch = 1;
  speechSynthesis.speak(u);
}

function reply(t) {
  msg(t);
  speak(t);
  status.textContent = "Siap menerima perintah.";
}

function openApp(n) {
  const a = {
    youtube: [
      "intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;end",
      "https://www.youtube.com/"
    ],
    minecraft: [
      "intent://launch/#Intent;scheme=minecraft;package=com.mojang.minecraftpe;end",
      "https://www.minecraft.net/"
    ],
    tiktok: [
      "intent://#Intent;scheme=snssdk1180;package=com.zhiliaoapp.musically;end",
      "https://www.tiktok.com/"
    ],
    blockman: [
      "intent://#Intent;scheme=blockmango;package=com.sandboxol.blockymods;end",
      "https://play.google.com/store/search?q=Blockman%20GO&c=apps"
    ]
  }[n];

  if (!a) return;
  status.textContent = "Membuka " + n + "...";
  const fallback = setTimeout(() => { location.href = a[1]; }, 1800);
  window.addEventListener("pagehide", () => clearTimeout(fallback), {once:true});
  location.href = a[0];
}

function google(t) {
  const q = t.replace(/^(cari|search|google)\s*/,"").trim();
  if (!q) { reply("Mau mencari apa di Google?"); return; }
  location.href = "https://www.google.com/search?q=" + encodeURIComponent(q);
}

function cmd(raw) {
  const t = raw.toLowerCase().trim();
  if (!t) return;
  msg(raw, true);

  if (/^(halo|hai|hi|hello)/.test(t))
    reply("Halo! Saya Ariq Anwar V4.");
  else if (/siapa kamu|kamu siapa/.test(t))
    reply("Saya Ariq Anwar V4, asisten yang berjalan di browser HP.");
  else if (/dibuat oleh siapa|siapa yang membuat|kamu dibuat/.test(t))
    reply("Saya dibuat oleh Ariq Anwar.");
  else if (/jam berapa|sekarang jam|cek jam/.test(t)) {
    const d = new Date();
    reply("Sekarang pukul " + d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}) + ".");
  } else if (/tanggal berapa|hari apa|tanggal sekarang|cek tanggal/.test(t)) {
    const d = new Date();
    reply("Hari ini " + d.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) + ".");
  } else if (/^buka youtube|^youtube/.test(t)) {
    reply("Baik, saya membuka YouTube.");
    setTimeout(() => openApp("youtube"), 300);
  } else if (/^buka minecraft|^minecraft/.test(t)) {
    reply("Baik, saya mencoba membuka Minecraft.");
    setTimeout(() => openApp("minecraft"), 300);
  } else if (/^buka tiktok|^tiktok/.test(t)) {
    reply("Baik, saya mencoba membuka TikTok.");
    setTimeout(() => openApp("tiktok"), 300);
  } else if (/^buka blockman|blockman go|^blockman/.test(t)) {
    reply("Baik, saya mencoba membuka Blockman GO.");
    setTimeout(() => openApp("blockman"), 300);
  } else if (/^cari |^search |^google /.test(t)) {
    reply("Baik, saya membuka Google.");
    setTimeout(() => google(t), 300);
  } else if (/bisa apa|apa yang bisa/.test(t)) {
    reply("Saya bisa ngobrol, menjawab identitas, jam dan tanggal, menerima suara, mencari Google, dan mencoba membuka aplikasi.");
  } else {
    reply("Perintah belum dikenali. Coba Halo, Siapa kamu, Jam berapa, atau Buka YouTube.");
  }
}

$("#send").onclick = () => {
  cmd(input.value);
  input.value = "";
};
input.onkeydown = e => {
  if (e.key === "Enter") $("#send").click();
};

document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  cmd({
    jam:"Jam berapa?",
    tanggal:"Tanggal berapa?",
    youtube:"Buka YouTube",
    google:"Cari Google",
    minecraft:"Buka Minecraft",
    tiktok:"Buka TikTok",
    blockman:"Buka Blockman GO"
  }[b.dataset.c]);
});

/* =========================
   MICROPHONE / VOICE V4
   ========================= */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

function setMicText(text) {
  const span = mic.querySelector("span");
  if (span) span.textContent = text;
}

function voiceError(code) {
  const messages = {
    "not-allowed": "Mikrofon ditolak. Izinkan Mikrofon untuk situs ini di Chrome.",
    "service-not-allowed": "Layanan suara Chrome tidak diizinkan. Coba gunakan Google Chrome.",
    "no-speech": "Saya tidak mendengar suara. Tekan mic lalu bicara.",
    "audio-capture": "Mikrofon tidak ditemukan atau sedang dipakai aplikasi lain.",
    "network": "Layanan pengenalan suara membutuhkan koneksi internet.",
    "aborted": "Perekaman dibatalkan. Tekan mic lagi.",
    "language-not-supported": "Bahasa Indonesia tidak didukung oleh layanan suara ini.",
    "service-unavailable": "Layanan pengenalan suara sedang tidak tersedia."
  };
  return messages[code] || ("Mikrofon: " + code);
}

function makeRecognition() {
  if (!SR) return null;
  const r = new SR();
  r.lang = "id-ID";
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 1;

  r.onstart = () => {
    listening = true;
    mic.classList.add("on");
    setMicText("Mendengarkan...");
    status.textContent = "🎙️ Silakan bicara bahasa Indonesia...";
  };

  r.onresult = (e) => {
    const text = e?.results?.[0]?.[0]?.transcript?.trim();
    if (text) {
      input.value = text;
      cmd(text);
      input.value = "";
    } else {
      status.textContent = "Suara tidak terbaca. Coba lagi.";
    }
  };

  r.onerror = (e) => {
    listening = false;
    mic.classList.remove("on");
    setMicText("Tekan untuk bicara");
    status.textContent = voiceError(e.error);
  };

  r.onend = () => {
    listening = false;
    mic.classList.remove("on");
    setMicText("Tekan untuk bicara");
    if (!status.textContent.startsWith("Mikrofon") &&
        !status.textContent.startsWith("Layanan") &&
        !status.textContent.startsWith("Mikrofon tidak")) {
      status.textContent = "Siap menerima perintah.";
    }
    recognition = null;
  };

  return r;
}

async function startVoice() {
  if (listening) {
    try { recognition?.stop(); } catch(e) {}
    return;
  }

  if (!window.isSecureContext) {
    status.textContent = "Buka Ariq Anwar melalui HTTPS/GitHub Pages.";
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "Browser ini tidak menyediakan akses mikrofon.";
    return;
  }

  if (!SR) {
    status.textContent = "Pengenalan suara tidak tersedia. Gunakan Chrome Android terbaru.";
    return;
  }

  /* Meminta izin mikrofon dahulu. Ini membantu Android/Chrome menampilkan dialog izin. */
  try {
    status.textContent = "Meminta izin mikrofon...";
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    stream.getTracks().forEach(track => track.stop());
  } catch (e) {
    if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
      status.textContent = "❌ Mikrofon ditolak. Chrome → Setelan situs → Mikrofon → Izinkan.";
    } else if (e.name === "NotFoundError") {
      status.textContent = "❌ Mikrofon HP tidak ditemukan.";
    } else {
      status.textContent = "❌ Mikrofon gagal: " + e.name;
    }
    return;
  }

  recognition = makeRecognition();
  if (!recognition) return;

  try {
    recognition.start();
  } catch (e) {
    status.textContent = "Tidak bisa memulai mic. Tunggu sebentar lalu tekan lagi.";
    recognition = null;
  }
}

mic.addEventListener("click", startVoice);

/* Cek dukungan suara saat halaman dibuka */
if (!SR) {
  status.textContent = "⚠️ Speech Recognition tidak tersedia di browser ini. Gunakan Chrome.";
}

let dp = null;
addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  dp = e;
  $("#install").hidden = false;
});
$("#install").onclick = async () => {
  if (dp) {
    dp.prompt();
    await dp.userChoice;
    dp = null;
    $("#install").hidden = true;
  }
};

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
