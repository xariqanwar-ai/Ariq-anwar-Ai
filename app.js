/* ARIQ ANWAR V4 TRUE MIC - 2026
   Robust Indonesian speech recognition for Chrome Android.
*/
const $ = (s) => document.querySelector(s);
const chat = $("#chat");
const input = $("#input");
const micBtn = $("#micBtn") || document.querySelector("[data-mic]") || document.querySelector("button[aria-label*='mic' i]");
const statusEl = $("#status") || $("#state") || document.querySelector(".status");

function msg(text, user=false){
  if(!chat) return;
  const d=document.createElement("div");
  d.className="msg "+(user?"user":"assistant");
  d.innerHTML = user
    ? `<strong>Kamu</strong><p>${escapeHtml(text)}</p>`
    : `<strong>ARIQ</strong><p>${escapeHtml(text)}</p>`;
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function setStatus(t){
  if(statusEl) statusEl.textContent=t;
  document.body.classList.toggle("listening", /MENDENGARKAN/i.test(t));
}
function speak(text){
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang="id-ID"; u.rate=.95; u.pitch=1;
    speechSynthesis.speak(u);
  }catch(e){}
}

function reply(text){
  const t=text.toLowerCase().trim();
  if(/^(halo|hai|hi|hello)\b/.test(t))
    return "Halo! Saya Ariq Anwar. Saya siap membantu.";
  if(t.includes("siapa kamu"))
    return "Saya Ariq Anwar, asisten AI pribadi.";
  if(t.includes("dibuat oleh siapa") || t.includes("siapa yang membuat") || t.includes("kamu dibuat"))
    return "Saya dibuat oleh Ariq Anwar.";
  if(t.includes("jam berapa") || t==="jam")
    return "Sekarang pukul "+new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
  if(t.includes("tanggal berapa") || t==="tanggal")
    return "Hari ini "+new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  if(t.includes("buka youtube") || t.includes("youtube")){
    openApp("youtube");
    return "Membuka YouTube.";
  }
  if(t.includes("buka tiktok") || t.includes("tiktok")){
    openApp("tiktok");
    return "Membuka TikTok.";
  }
  if(t.includes("buka minecraft") || t.includes("minecraft")){
    openApp("minecraft");
    return "Membuka Minecraft.";
  }
  if(t.includes("buka blockman") || t.includes("blockman go") || t.includes("blockman")){
    openApp("blockman");
    return "Membuka Blockman GO.";
  }
  if(t.startsWith("cari ") || t.startsWith("google ")){
    const q=t.replace(/^cari\s+|^google\s+/,"").trim();
    if(q) location.href="https://www.google.com/search?q="+encodeURIComponent(q);
    return "Saya mencari "+q+" di Google.";
  }
  if(t.includes("bisa apa") || t.includes("kamu bisa apa"))
    return "Saya bisa menerima perintah suara, menjawab pertanyaan dasar, memberi waktu dan tanggal, membuka aplikasi, dan melakukan pencarian Google.";
  return "Saya mendengar: "+text+". Coba perintah seperti buka YouTube, jam, tanggal, atau cari sesuatu.";
}

function openApp(name){
  const urls={
    youtube:"intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;end",
    minecraft:"intent://launch/#Intent;scheme=minecraft;package=com.mojang.minecraftpe;end",
    tiktok:"intent://#Intent;scheme=snssdk1180;package=com.zhiliaoapp.musically;end",
    blockman:"intent://#Intent;scheme=blockmango;package=com.sandboxol.blockymods;end"
  };
  const fallback={
    youtube:"https://www.youtube.com/",
    minecraft:"https://play.google.com/store/apps/details?id=com.mojang.minecraftpe",
    tiktok:"https://www.tiktok.com/",
    blockman:"https://play.google.com/store/apps/details?id=com.sandboxol.blockymods"
  };
  if(!urls[name]) return;
  location.href=urls[name];
  setTimeout(()=>{ location.href=fallback[name]; },2200);
}

function handleText(text){
  if(!text) return;
  msg(text,true);
  const answer=reply(text);
  msg(answer,false);
  speak(answer);
}

let recognition=null;
let listening=false;

function supported(){
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
function makeRecognition(){
  const SR=window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return null;
  const r=new SR();
  r.lang="id-ID";
  r.continuous=false;
  r.interimResults=true;
  r.maxAlternatives=1;
  r.onstart=()=>{
    listening=true;
    setStatus("MENDENGARKAN…");
    if(micBtn) micBtn.classList.add("active");
  };
  r.onresult=(e)=>{
    let finalText="";
    let interim="";
    for(let i=e.resultIndex;i<e.results.length;i++){
      const s=e.results[i][0].transcript;
      if(e.results[i].isFinal) finalText+=s;
      else interim+=s;
    }
    if(statusEl && interim) statusEl.textContent="MENDENGARKAN: "+interim;
    if(finalText) handleText(finalText.trim());
  };
  r.onerror=(e)=>{
    listening=false;
    if(micBtn) micBtn.classList.remove("active");
    const map={
      "not-allowed":"Izin mikrofon ditolak. Izinkan Mikrofon untuk Chrome.",
      "service-not-allowed":"Layanan suara diblokir oleh browser.",
      "audio-capture":"Mikrofon tidak ditemukan atau sedang dipakai aplikasi lain.",
      "no-speech":"Saya tidak mendengar suara. Coba tekan mic lalu bicara.",
      "network":"Pengenalan suara memerlukan koneksi internet."
    };
    setStatus("SIAP");
    msg(map[e.error] || ("Mic error: "+e.error),false);
  };
  r.onend=()=>{
    listening=false;
    if(micBtn) micBtn.classList.remove("active");
    if(statusEl && !/error/i.test(statusEl.textContent||"")) setStatus("SIAP");
  };
  return r;
}

async function startMic(){
  if(!supported()){
    setStatus("MIC TIDAK DIDUKUNG");
    msg("Chrome pada perangkat ini tidak menyediakan Speech Recognition. Gunakan Chrome Android versi terbaru.",false);
    return;
  }
  try{
    // Meminta izin mikrofon secara eksplisit bila tersedia.
    if(navigator.mediaDevices?.getUserMedia){
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      stream.getTracks().forEach(t=>t.stop());
    }
  }catch(e){
    setStatus("IZIN MIC DITOLAK");
    msg("Izin mikrofon belum diberikan. Buka izin situs Chrome dan pilih Izinkan.",false);
    return;
  }

  if(listening){
    try{ recognition?.stop(); }catch(e){}
    return;
  }
  recognition=makeRecognition();
  try{
    recognition.start();
  }catch(e){
    // Chrome dapat melempar InvalidStateError jika sesi sebelumnya belum selesai.
    setTimeout(()=>{
      try{
        recognition=makeRecognition();
        recognition.start();
      }catch(err){
        setStatus("MIC ERROR");
        msg("Mic gagal dimulai. Muat ulang halaman lalu coba lagi.",false);
      }
    },350);
  }
}

if(micBtn) micBtn.addEventListener("click",startMic);

document.querySelectorAll("[data-command]").forEach(btn=>{
  btn.addEventListener("click",()=>handleText(btn.dataset.command));
});
document.querySelectorAll("button").forEach(btn=>{
  const text=(btn.textContent||"").toLowerCase();
  if(text.includes("youtube")) btn.addEventListener("click",()=>openApp("youtube"));
  if(text.includes("google")) btn.addEventListener("click",()=>location.href="https://www.google.com/");
  if(text.includes("jam")) btn.addEventListener("click",()=>handleText("jam"));
  if(text.includes("tanggal")) btn.addEventListener("click",()=>handleText("tanggal"));
});

if(input){
  input.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      const v=input.value.trim();
      input.value="";
      handleText(v);
    }
  });
}

window.addEventListener("load",()=>{
  setStatus("SIAP");
  if(!supported()) msg("Catatan: Speech Recognition tidak tersedia di browser ini. Gunakan Chrome Android.",false);
});
