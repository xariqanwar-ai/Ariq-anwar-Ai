const $=s=>document.querySelector(s);
const output=$("#output"), transcript=$("#transcript"), status=$("#status"), mic=$("#mic");

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition=null;
let speaking=false;

function say(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="id-ID"; u.rate=.92; u.pitch=.9; u.volume=1;
  speaking=true;
  u.onend=()=>speaking=false;
  speechSynthesis.speak(u);
}

function show(answer,heard=""){
  transcript.textContent=heard?`Anda: ${heard}`:"Siap mendengarkan...";
  output.innerHTML=`<b>Ariq Anwar:</b><br>${escapeHtml(answer)}`;
  say(answer);
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function openUrl(url){ window.open(url,"_blank","noopener,noreferrer"); }

function command(text){
  const q=text.toLowerCase().trim();
  if(q.includes("halo")||q.includes("hai"))
    return "Halo. Sistem Ariq Anwar aktif. Ada yang bisa saya bantu?";
  if(q.includes("siapa kamu"))
    return "Saya Ariq Anwar, asisten AI pribadi Anda.";
  if(q.includes("jam berapa")){
    return "Sekarang pukul "+new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  }
  if(q.includes("tanggal")){
    return "Hari ini "+new Intl.DateTimeFormat("id-ID",{dateStyle:"full"}).format(new Date());
  }
  if(q.includes("buka youtube")){openUrl("https://www.youtube.com");return "Membuka YouTube."; }
  if(q.includes("buka google")){openUrl("https://www.google.com");return "Membuka Google."; }
  if(q.includes("buka whatsapp")){
    openUrl("https://wa.me/"); return "Membuka WhatsApp Web.";
  }
  if(q.startsWith("cari ")){
    const term=text.substring(5).trim();
    if(term){openUrl("https://www.google.com/search?q="+encodeURIComponent(term));return "Saya membuka pencarian untuk "+term+".";}
  }
  if(q.includes("terima kasih")||q.includes("makasih"))
    return "Sama-sama. Saya siap membantu.";
  return `Saya menerima perintah: ${text}. Untuk jawaban AI generatif, hubungkan fungsi ini ke API AI melalui backend yang aman.`;
}

function startListening(){
  if(!SpeechRecognition){
    show("Browser ini belum mendukung Speech Recognition. Coba Chrome Android.");
    return;
  }
  recognition=new SpeechRecognition();
  recognition.lang="id-ID";
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
  recognition.onstart=()=>{
    mic.classList.add("listening");
    status.textContent="● MENDENGARKAN...";
    transcript.textContent="Silakan bicara...";
  };
  recognition.onresult=e=>{
    const text=e.results[0][0].transcript;
    show(command(text),text);
  };
  recognition.onerror=e=>{
    transcript.textContent="Mikrofon: "+e.error;
  };
  recognition.onend=()=>{
    mic.classList.remove("listening");
    status.textContent="● SYSTEM ONLINE";
  };
  recognition.start();
}
mic.onclick=startListening;

document.querySelectorAll("[data-command]").forEach(b=>{
  b.onclick=()=>show(command(b.dataset.command),b.dataset.command);
});

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e; $("#installBtn").classList.remove("hidden");
});
$("#installBtn").onclick=async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice;
  deferredPrompt=null; $("#installBtn").classList.add("hidden");
};
