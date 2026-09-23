const $=s=>document.querySelector(s);
const chat=$("#chat"), input=$("#input"), micBtn=$("#micBtn"), listenState=$("#listenState");
let recognition=null, deferredPrompt=null, listening=false, shouldKeepListening=false;

function addMsg(text,user=false){
  const d=document.createElement("div");
  d.className="msg "+(user?"user":"ai");
  d.innerHTML=`<strong>${user?"KAMU":"ARIQ ANWAR"}</strong>${escapeHtml(text)}`;
  chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function speak(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="id-ID"; u.rate=.98; u.pitch=1;
  speechSynthesis.speak(u);
}
function answer(text){addMsg(text); speak(text);}

const APPS={
  youtube:{
    label:"YouTube",
    intent:"intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;end",
    web:"https://www.youtube.com/"
  },
  tiktok:{
    label:"TikTok",
    intent:"intent://#Intent;scheme=snssdk1180;package=com.zhiliaoapp.musically;end",
    web:"https://www.tiktok.com/"
  },
  minecraft:{
    label:"Minecraft",
    intent:"intent://launch/#Intent;scheme=minecraft;package=com.mojang.minecraftpe;end",
    web:"https://play.google.com/store/apps/details?id=com.mojang.minecraftpe"
  },
  blockman:{
    label:"Blockman GO",
    intent:"intent://#Intent;scheme=blockmango;package=com.sandboxol.blockymods;end",
    web:"https://play.google.com/store/apps/details?id=com.sandboxol.blockymods"
  },
  whatsapp:{
    label:"WhatsApp",
    intent:"intent://send/#Intent;scheme=whatsapp;package=com.whatsapp;end",
    web:"https://wa.me/"
  },
  chrome:{
    label:"Chrome",
    intent:"intent://#Intent;scheme=googlechrome;package=com.android.chrome;end",
    web:"https://www.google.com/chrome/"
  },
  playstore:{
    label:"Google Play",
    intent:"intent://#Intent;scheme=market;package=com.android.vending;end",
    web:"https://play.google.com/"
  },
  settings:{
    label:"Setelan",
    intent:"intent://settings/#Intent;scheme=android;end",
    web:""
  }
};

function openApp(name){
  const x=APPS[name];
  if(!x) return;
  answer("Baik, saya mencoba membuka "+x.label+".");
  setTimeout(()=>{
    location.href=x.intent;
    if(x.web) setTimeout(()=>{location.href=x.web},1800);
  },350);
}

function openFavorite(){
  // Personalisasi V5: "aplikasi favorit" milik pengguna membuka Blockman GO.
  openApp("blockman");
}

function googleSearch(q){
  answer("Saya akan mencari "+q+" di Google.");
  setTimeout(()=>location.href="https://www.google.com/search?q="+encodeURIComponent(q),450);
}

function androidOnly(action){
  if(action==="shutdown"){
    answer("Perintah matikan HP terdeteksi. Ariq Anwar versi web tidak punya izin sistem untuk mematikan Android. Silakan gunakan tombol daya atau menu daya HP.");
  }
}

function process(text){
  const t=text.toLowerCase().trim();
  if(!t) return;
  addMsg(text,true);

  // Identity / personal commands
  if(/^(halo|hai|hi|hello)\b/.test(t)){
    answer("Halo! Saya Ariq Anwar V5, asisten digital untuk kamu. Ada yang bisa saya bantu?");
    return;
  }
  if(t.includes("siapa kamu")){
    answer("Saya Ariq Anwar V5, asisten digital berbasis HTML dan JavaScript.");
    return;
  }
  if(t.includes("dibuat oleh siapa")||t.includes("siapa yang membuat")||t.includes("kamu dibuat")){
    answer("Saya dibuat oleh Ariq Anwar.");
    return;
  }
  if(t.includes("aplikasi favorit")||t.includes("buka favorit")||t.includes("favorit saya")){
    openFavorite();
    return;
  }

  // Android power command: web/PWA cannot shut down the phone.
  if(t.includes("matikan hp")||t.includes("matikan handphone")||t.includes("shutdown hp")||t==="shutdown"||t.includes("matiin hp")){
    androidOnly("shutdown");
    return;
  }

  // Time/date
  if(t.includes("jam berapa")||t.includes("sekarang jam")){
    answer("Sekarang pukul "+new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(new Date())+".");
    return;
  }
  if(t.includes("tanggal")||t.includes("hari apa")){
    answer("Hari ini "+new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date())+".");
    return;
  }

  // Common apps
  if(t.includes("buka youtube")||t==="youtube"){openApp("youtube");return;}
  if(t.includes("buka tiktok")||t==="tiktok"){openApp("tiktok");return;}
  if(t.includes("buka minecraft")||t==="minecraft"){openApp("minecraft");return;}
  if(t.includes("buka blockman")||t.includes("blockman go")||t==="blockman"){openApp("blockman");return;}
  if(t.includes("buka whatsapp")||t==="whatsapp"||t.includes("buka wa")){openApp("whatsapp");return;}
  if(t.includes("buka chrome")||t==="chrome"){openApp("chrome");return;}
  if(t.includes("buka play store")||t.includes("buka playstore")){openApp("playstore");return;}
  if(t.includes("buka setelan")||t.includes("buka pengaturan")){openApp("settings");return;}

  // Generic "open app": browser cannot discover/launch literally every
  // installed package, so unknown apps are searched in Play Store.
  const m=t.match(/^(?:buka|jalankan|buka aplikasi)\s+(.+)$/);
  if(m){
    const requested=m[1].trim();
    const aliases={
      "yt":"youtube","youtube":"youtube","tiktok":"tiktok",
      "minecraft":"minecraft","blockman":"blockman","blockman go":"blockman",
      "whatsapp":"whatsapp","wa":"whatsapp","chrome":"chrome",
      "play store":"playstore","playstore":"playstore",
      "setelan":"settings","pengaturan":"settings"
    };
    const key=aliases[requested];
    if(key){openApp(key);return;}
    answer("Saya belum punya tautan aplikasi "+requested+". Saya akan mencari aplikasinya di Google.");
    setTimeout(()=>location.href="https://www.google.com/search?q="+encodeURIComponent(requested+" Android app"),500);
    return;
  }

  // Search
  if(t.startsWith("cari ")||t.startsWith("search ")){
    const q=t.replace(/^(cari|search)\s+/,"").trim();
    if(q){googleSearch(q);return;}
  }

  if(t.includes("bisa apa")||t.includes("fitur kamu")){
    answer("Saya bisa mendengar perintah suara saat Ariq Anwar sedang terbuka, berbicara, membuka beberapa aplikasi, membuka aplikasi favorit Blockman GO, mencari Google, serta membaca jam dan tanggal. Untuk mendengar saat aplikasi benar-benar tertutup dan untuk mematikan HP, diperlukan aplikasi Android native dengan izin sistem.");
    return;
  }
  if(t.includes("terima kasih")||t.includes("makasih")){answer("Sama-sama!");return;}

  answer("Saya belum memahami perintah itu. Coba: buka aplikasi favorit, buka YouTube, buka WhatsApp, buka Minecraft, matikan HP, atau cari di Google.");
}

$("#form").addEventListener("submit",e=>{
  e.preventDefault();
  const v=input.value.trim();
  if(v){input.value="";process(v);}
});

document.querySelectorAll(".quick button").forEach(b=>b.addEventListener("click",()=>process(b.dataset.cmd)));

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){
  recognition=new SR();
  recognition.lang="id-ID";
  recognition.interimResults=true;
  recognition.continuous=true;
  recognition.maxAlternatives=1;

  recognition.onstart=()=>{
    listening=true;
    micBtn.classList.add("listening");
    listenState.textContent="Mendengarkan terus selama Ariq Anwar terbuka...";
  };

  recognition.onresult=e=>{
    let finalText="";
    for(let i=e.resultIndex;i<e.results.length;i++){
      if(e.results[i].isFinal) finalText+=e.results[i][0].transcript;
    }
    if(finalText.trim()) process(finalText.trim());
  };

  recognition.onerror=e=>{
    if(e.error==="not-allowed"||e.error==="service-not-allowed"){
      shouldKeepListening=false;
      listening=false;
      micBtn.classList.remove("listening");
      listenState.textContent="Izin mikrofon ditolak.";
    }else{
      listenState.textContent="Mikrofon aktif — coba bicara lagi.";
    }
  };

  recognition.onend=()=>{
    listening=false;
    micBtn.classList.remove("listening");
    if(shouldKeepListening){
      setTimeout(()=>{
        try{recognition.start();}catch(e){}
      },180);
    }else{
      listenState.textContent="Tekan mikrofon untuk berbicara";
    }
  };

  micBtn.onclick=()=>{
    if(listening){
      shouldKeepListening=false;
      try{recognition.stop();}catch(e){}
    }else{
      shouldKeepListening=true;
      try{recognition.start();}
      catch(e){setTimeout(()=>{try{recognition.start();}catch(e){}},250);}
    }
  };
}else{
  micBtn.onclick=()=>answer("Browser ini belum mendukung pengenalan suara. Gunakan Chrome Android dan izinkan mikrofon.");
}

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();
  deferredPrompt=e;
  $("#installBtn").classList.remove("hidden");
});
$("#installBtn").addEventListener("click",async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  deferredPrompt=null;
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js?v=5").catch(()=>{}));
}

addMsg("Halo! Saya Ariq Anwar V5. Tekan 🎙️ untuk mengaktifkan mode dengar. Perintah favorit kamu: “buka aplikasi favorit”.");
