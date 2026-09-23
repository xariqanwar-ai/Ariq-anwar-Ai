const $=s=>document.querySelector(s);
const chat=$("#chat"), input=$("#input"), micBtn=$("#micBtn"), listenState=$("#listenState");
let recognition=null, deferredPrompt=null;

function addMsg(text,user=false){
  const d=document.createElement("div");
  d.className="msg "+(user?"user":"ai");
  d.innerHTML=`<strong>${user?"KAMU":"ARIQ ANWAR"}</strong>${escapeHtml(text)}`;
  chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function speak(text){
  if(!("speechSynthesis" in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text); u.lang="id-ID"; u.rate=.96; u.pitch=1;
  speechSynthesis.speak(u);
}
function answer(text){addMsg(text); speak(text);}

function openApp(name){
  const data={
    youtube:["intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;end","https://www.youtube.com/"],
    tiktok:["intent://#Intent;scheme=snssdk1180;package=com.zhiliaoapp.musically;end","https://www.tiktok.com/"],
    minecraft:["intent://launch/#Intent;scheme=minecraft;package=com.mojang.minecraftpe;end","https://play.google.com/store/apps/details?id=com.mojang.minecraftpe"],
    blockman:["intent://#Intent;scheme=blockmango;package=com.sandboxol.blockymods;end","https://play.google.com/store/apps/details?id=com.sandboxol.blockymods"]
  };
  const x=data[name]; if(!x)return;
  answer("Baik, saya mencoba membuka "+name+".");
  setTimeout(()=>{location.href=x[0];setTimeout(()=>{location.href=x[1]},1800)},450);
}

function process(text){
  const t=text.toLowerCase().trim();
  addMsg(text,true);
  if(!t)return;
  if(/^(halo|hai|hi|hello)\b/.test(t)){answer("Halo! Saya Ariq Anwar, asisten AI versi V4. Ada yang bisa saya bantu?");return}
  if(t.includes("siapa kamu")){answer("Saya Ariq Anwar, asisten digital berbasis HTML dan JavaScript.");return}
  if(t.includes("dibuat oleh siapa")||t.includes("siapa yang membuat")||t.includes("kamu dibuat")){answer("Saya dibuat oleh Ariq Anwar.");return}
  if(t.includes("bisa apa")||t.includes("fitur kamu")){answer("Saya bisa menjawab perintah dasar, berbicara, mendengar suara, menunjukkan waktu dan tanggal, mencari di Google, serta mencoba membuka YouTube, TikTok, Minecraft, dan Blockman GO.");return}
  if(t.includes("jam berapa")||t.includes("sekarang jam")){answer("Sekarang pukul "+new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(new Date())+".");return}
  if(t.includes("tanggal")||t.includes("hari apa")){answer("Hari ini "+new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date())+".");return}
  if(t.includes("buka youtube")||t.includes("youtube")){openApp("youtube");return}
  if(t.includes("buka tiktok")||t.includes("tiktok")){openApp("tiktok");return}
  if(t.includes("buka minecraft")||t.includes("minecraft")){openApp("minecraft");return}
  if(t.includes("buka blockman")||t.includes("blockman go")||t.includes("blockman")){openApp("blockman");return}
  if(t.startsWith("cari ")||t.startsWith("search ")){
    const q=t.replace(/^(cari|search)\s+/,"").trim();
    if(q){answer("Saya akan mencari "+q+" di Google.");setTimeout(()=>location.href="https://www.google.com/search?q="+encodeURIComponent(q),500);return}
  }
  if(t.includes("terima kasih")||t.includes("makasih")){answer("Sama-sama!");return}
  answer("Saya belum memahami perintah itu. Coba katakan: buka YouTube, jam berapa sekarang, cari di Google, atau siapa kamu.");
}

$("#form").addEventListener("submit",e=>{e.preventDefault();const v=input.value.trim();if(v){input.value="";process(v)}});

document.querySelectorAll(".quick button").forEach(b=>b.addEventListener("click",()=>process(b.dataset.cmd)));

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){
  recognition=new SR(); recognition.lang="id-ID"; recognition.interimResults=false; recognition.continuous=false;
  recognition.onstart=()=>{micBtn.classList.add("listening");listenState.textContent="Mendengarkan... silakan bicara";};
  recognition.onend=()=>{micBtn.classList.remove("listening");listenState.textContent="Tekan mikrofon untuk berbicara";};
  recognition.onerror=e=>{listenState.textContent="Mikrofon: "+(e.error==="not-allowed"?"izin mikrofon ditolak":"coba lagi");};
  recognition.onresult=e=>process(e.results[0][0].transcript);
  micBtn.onclick=()=>{try{recognition.start()}catch(e){}};
}else{
  micBtn.onclick=()=>answer("Browser ini belum mendukung pengenalan suara. Gunakan Chrome Android dan izinkan mikrofon.");
}

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt=null});

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js?v=4").catch(()=>{}));

addMsg("Halo! Saya siap membantu. Tekan mikrofon atau ketik perintah.");
