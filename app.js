(() => {
  const $ = (id) => document.getElementById(id);
  const welcome=$("welcome"), chatView=$("chatView"), messages=$("messages"), question=$("question");
  const Flows=window.GOVAIFlows;
  let conversations=[], activeId=null, storageOK=true, busy=false, typing=false, pending=[];
  const now=()=>new Date().toISOString();
  const makeId=()=>`c_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  function load(){
    try{const raw=localStorage.getItem("govai_conversations_v13");conversations=raw?JSON.parse(raw):[];if(!Array.isArray(conversations))conversations=[];}
    catch(e){storageOK=false;conversations=[];}
  }
  function save(){
    try{localStorage.setItem("govai_conversations_v13",JSON.stringify(conversations));storageOK=true;}
    catch(e){storageOK=false;}
  }
  function active(){return conversations.find(c=>c.id===activeId)||null;}
  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  /* ---------- Rendering ---------- */
  function renderHistory(){
    const host=$("historyList");host.innerHTML="";
    if(!conversations.length){host.innerHTML='<p class="muted side-empty">Your conversations will appear here.</p>';return;}
    [...conversations].sort((a,b)=>b.updated.localeCompare(a.updated)).forEach(c=>{
      const b=document.createElement("button");b.className="history-item";b.textContent=c.title||"New conversation";b.onclick=()=>openConversation(c.id);host.appendChild(b);
    });
  }
  function messageHTML(m,isLast){
    if(m.role==="user")return `<div class="avatar">Y</div><div class="mbody"><div class="bubble">${escapeHTML(m.text)}</div></div>`;
    let h='<div class="avatar">G</div><div class="mbody">';
    if(m.tag)h+=`<div class="qtag">${escapeHTML(m.tag)}</div>`;
    if(m.ack)h+=`<div class="ack">✓ ${escapeHTML(m.ack)}</div>`;
    if(!m.card||m.text)h+=`<div class="bubble">${escapeHTML(m.text)}</div>`;
    if(m.list)h+=`<ul class="msg-list">${m.list.map(x=>`<li><span>${escapeHTML(x[0])}</span><strong>${escapeHTML(x[1])}</strong></li>`).join("")}</ul>`;
    if(m.card&&Flows)h+=Flows.cardHTML(m.card);
    if(isLast&&m.chips&&m.chips.length)h+=`<div class="chips">${m.chips.map(c=>`<button type="button" class="chip" data-chip="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("")}</div>`;
    return h+"</div>";
  }
  function renderMessages(){
    const c=active();messages.innerHTML="";
    if(!c||!c.messages.length)return;
    c.messages.forEach((m,i)=>{
      const row=document.createElement("div");row.className=`message ${m.role}`;
      row.innerHTML=messageHTML(m,i===c.messages.length-1);row.dataset.i=i;messages.appendChild(row);
    });
    if(typing){const row=document.createElement("div");row.className="message assistant";row.innerHTML='<div class="avatar">G</div><div class="mbody"><div class="bubble typing" aria-label="GOVAI is typing"><i></i><i></i><i></i></div></div>';messages.appendChild(row);}
    chatView.scrollTop=chatView.scrollHeight;
  }
  function showChat(){welcome.classList.add("hidden");chatView.classList.remove("hidden");$("suggestions").classList.add("hidden");}
  function openConversation(id){stopSpeak();activeId=id;showChat();renderMessages();closeSidebar();}
  function newChat(){
    stopSpeak();activeId=null;messages.innerHTML="";chatView.classList.add("hidden");welcome.classList.remove("hidden");
    question.value="";resizeInput();$("suggestions").classList.add("hidden");closeSidebar();
  }
  function ensureConversation(firstText){
    let c=active();
    if(!c){c={id:makeId(),title:(firstText||"New conversation").replace(/\s+/g," ").slice(0,42),created:now(),updated:now(),messages:[],flow:null};conversations.push(c);activeId=c.id;}
    return c;
  }
  function addMessage(role,text,extra){
    const c=ensureConversation(role==="user"?text:null);
    if(role==="user"&&c.messages.length===0)c.title=text.replace(/\s+/g," ").slice(0,42);
    c.messages.push(Object.assign({role,text,at:now()},extra||{}));c.updated=now();save();renderHistory();renderMessages();
  }

  /* ---------- Voice: read-out + hands-free listening ---------- */
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition, TTS="speechSynthesis" in window;
  let voiceOn=true;try{voiceOn=localStorage.getItem("govai_voice")!=="off";}catch(e){}
  let voiceMode=false, rec=null, recActive=false, speaking=false, sq=[], sid=0, idle=0;
  function paintVoice(){const b=$("voiceBtn");if(!b)return;b.textContent=voiceOn?"🔊":"🔇";b.setAttribute("aria-pressed",voiceOn);b.title=voiceOn?"Read-out on":"Read-out off";}
  function paintMic(){const m=$("micBtn");if(m){m.classList.toggle("on",voiceMode);m.setAttribute("aria-pressed",voiceMode);}}
  function chunk(text){
    const parts=String(text).replace(/[•–—]/g,",").replace(/\s+/g," ").trim().match(/[^.!?]+[.!?]*/g)||[];
    const out=[];let cur="";
    parts.forEach(p=>{if((cur+p).length>180&&cur){out.push(cur.trim());cur=p;}else cur+=p;});
    if(cur.trim())out.push(cur.trim());return out;
  }
  function stopSpeak(){sid++;sq=[];speaking=false;if(TTS)try{speechSynthesis.cancel();}catch(e){}}
  function speak(text){
    if(!voiceOn||!TTS||!text)return;
    sq.push(...chunk(text));if(!speaking)pump();
  }
  function pump(){
    if(!sq.length){speaking=false;resumeMic();return;}
    speaking=true;pauseRec();
    const id=sid,u=new SpeechSynthesisUtterance(sq.shift());u.lang="en-GB";
    u.onend=u.onerror=()=>{if(id===sid)pump();};
    try{speechSynthesis.speak(u);}catch(e){speaking=false;resumeMic();}
  }
  function speakMessage(m){
    if(m.speak){speak(Array.isArray(m.speak)?m.speak.join(" "):m.speak);return;}
    let t=[m.ack,m.tag&&m.tag+".",m.text].filter(Boolean).join(". ");
    if(!m.flowMsg&&t.length>420){const cut=t.slice(0,420);t=cut.slice(0,Math.max(cut.lastIndexOf("."),200)+1);}
    speak(t);
  }
  function pauseRec(){if(rec&&recActive){try{rec.abort();}catch(e){}}}
  function resumeMic(){if(voiceMode&&!speaking&&!recActive)startRec();}
  function startRec(){
    if(!SR||!voiceMode||speaking||recActive)return;
    rec=new SR();rec.lang="en-GB";rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
    rec.onstart=()=>{recActive=true;question.placeholder="Listening… speak now";};
    rec.onresult=ev=>{
      let interim="",final="";
      for(let i=ev.resultIndex;i<ev.results.length;i++){const r=ev.results[i];if(r.isFinal)final+=r[0].transcript;else interim+=r[0].transcript;}
      if(interim){question.value=interim;resizeInput();}
      if(final){idle=0;question.value="";resizeInput();handleSpoken(final.trim());}
    };
    rec.onerror=e=>{
      if(e.error==="not-allowed"||e.error==="service-not-allowed"){stopVoiceMode();question.placeholder="Microphone blocked. Allow microphone access.";}
      else if(e.error==="no-speech")idle++;
    };
    rec.onend=()=>{
      recActive=false;if(!speaking&&!busy)question.placeholder="Ask anything";
      if(voiceMode&&!speaking){
        if(idle>=3){stopVoiceMode();return;}
        setTimeout(resumeMic,250);
      }
    };
    try{rec.start();}catch(e){recActive=false;}
  }
  function stopVoiceMode(){voiceMode=false;idle=0;if(rec){try{rec.abort();}catch(e){}}recActive=false;paintMic();question.placeholder="Ask anything";}
  function toggleVoiceMode(){
    if(!SR)return;
    if(voiceMode){stopVoiceMode();return;}
    voiceMode=true;idle=0;voiceOn=true;paintVoice();paintMic();
    startRec();
  }
  function handleSpoken(text){
    const t=text.toLowerCase().replace(/[.,!?]/g,"").trim();
    if(/^(stop listening|mic off|turn off (the )?(mic|microphone)|stop voice)$/.test(t)){stopSpeak();stopVoiceMode();return;}
    if(/^(be quiet|stop talking|shut up|silence)$/.test(t)){stopSpeak();return;}
    send(text);
  }

  /* ---------- Sending, typing indicator, flow routing ---------- */
  function answer(text){
    const t=text.toLowerCase();
    if(/pacra|register.*(business|company|name)|business name|limited company/.test(t))return pacraAnswer(t);
    if(/zra|tpin|tax|taxpayer/.test(t))return zraAnswer();
    if(/business plan|startup|starter|budget|business profile/.test(t))return starterAnswer();
    if(/more services|service directory|government services/.test(t))return directoryAnswer();
    return "I can help you prepare for selected services and business tasks in this prototype.\n\nYou can ask about:\n• PACRA business-name or company-registration preparation\n• ZRA TPIN and tax guidance\n• A business plan, profile or startup budget\n\nChoose one of these topics or describe what you are trying to do. I will explain each step in plain language.";
  }
  function pacraAnswer(t){
    const isName=/business name|name reservation|sole trader|trade name/.test(t)&&!/limited company|company registration/.test(t);
    if(isName)return "PACRA – BUSINESS NAME REGISTRATION\n\nA business name is commonly used by a sole trader or partnership. It is not the same as registering a limited company.\n\nTo prepare, gather:\n1. Your proposed business name(s).\n2. Nature of business and business activities.\n3. Owner/partner details and contact information.\n4. Identification and any supporting information PACRA currently requires.\n\nNext step: tell me your proposed business name and what the business will do. I can help you prepare a checklist and draft details for review.\n\nImportant: This prototype does not check name availability or submit an application to PACRA.";
    return "PACRA – LIMITED COMPANY REGISTRATION\n\nA limited company is a separate legal entity. This route is different from registering a business name.\n\nPreparation checklist:\n1. Proposed company name(s).\n2. Company type and principal business activity.\n3. Details of shareholders and directors.\n4. Share structure and registered office details.\n5. Identification and supporting information required by PACRA.\n\nPlain language: shareholders own the company; directors are responsible for managing it. One person may sometimes hold more than one role, subject to applicable rules.\n\nTell me the proposed company name and business activity and I can help organise a preparation checklist.\n\nImportant: GOVAI does not check availability, file documents or obtain official approval from PACRA.";
  }
  function zraAnswer(){return "ZRA – TPIN AND TAX PREPARATION\n\nA TPIN is a Taxpayer Identification Number used by the Zambia Revenue Authority to identify a taxpayer.\n\nTo prepare, you may need:\n1. Your identity or business registration details.\n2. Contact information and physical/business address.\n3. Relevant PACRA documents if registering a company or business.\n4. Details of the type of taxpayer or business activity.\n\nI can help you understand the information and prepare a checklist. Tell me whether you need a TPIN as an individual, sole trader or registered company.\n\nImportant: GOVAI is not connected to ZRA and cannot issue a TPIN, access taxpayer records or submit a tax registration.";
  }
  function starterAnswer(){return "BUSINESS STARTER PACK\n\nI can help prepare these documents:\n• Business profile – what the business does, who it serves and how to contact it.\n• Business plan – objectives, customers, operations, marketing and financial assumptions.\n• Startup budget – estimated setup costs and monthly expenses.\n• Simple cash-flow forecast – expected money coming in and going out.\n\nTo begin, tell me the business idea, where it will operate and whether you are starting from scratch or already trading. I will build the document with you in plain language.\n\nAny figures produced are planning estimates, not guaranteed results or professional accounting advice.";
  }
  function directoryAnswer(){return "GOVERNMENT SERVICES DIRECTORY\n\nAvailable in this prototype:\n• PACRA – business registration preparation\n• ZRA – TPIN and tax guidance\n• Business Starter Pack – plans, profiles and budgets\n\nComing soon (not yet operational):\n• NRC and civil registration\n• Passports and immigration\n• Land and property\n• RTSA and road transport\n• Education and bursaries\n• Health services\n• Agriculture and livestock\n• Mining and minerals\n• Employment and labour\n• NAPSA and social security\n• Local government and council services\n• Public procurement\n• Justice and court information\n• Tourism and environment\n\nThese directory entries are placeholders. They do not imply an integration or official relationship.";
  }
  async function deliver(convId,msgs){
    busy=true;
    for(const m of msgs){
      typing=activeId===convId;if(typing)renderMessages();
      await sleep(Math.min(380+(m.text||"").length*5,950));
      typing=false;
      const c=conversations.find(x=>x.id===convId);if(!c)continue;
      c.messages.push(Object.assign({role:"assistant",at:now(),flowMsg:true},m));c.updated=now();save();
      if(activeId===convId){renderMessages();speakMessage(m);}
    }
    typing=false;busy=false;renderHistory();
    if(pending.length)send(pending.shift());else if(!speaking)resumeMic();
  }
  function respond(value){
    const c=active();let out=null;
    if(Flows){
      if(c.flow){out=Flows.handle(c.flow,value);c.flow=out.flow;}
      else{const k=Flows.detect(value);if(k){out=Flows.start(k);c.flow=out.flow;}}
    }
    save();
    if(out){deliver(c.id,out.messages);return;}
    const reply=answer(value);
    deliver(c.id,[{text:reply,flowMsg:false,chips:Flows?Flows.START_CHIPS:[]}].map(m=>Object.assign(m,{flowMsg:false})));
  }
  function send(text){
    const value=(text??question.value).trim();if(!value)return;
    if(busy){pending.push(value);question.value="";resizeInput();return;}
    stopSpeak();
    addMessage("user",value);question.value="";resizeInput();showChat();
    $("suggestions").classList.add("hidden");
    respond(value);
  }
  function resizeInput(){question.style.height="auto";question.style.height=Math.min(question.scrollHeight,130)+"px";}
  function openSidebar(){$("sidebar").classList.add("open");$("scrim").classList.add("show");}
  function closeSidebar(){$("sidebar").classList.remove("open");$("scrim").classList.remove("show");}

  /* ---------- Printing a result card ---------- */
  function printCard(el){
    const old=$("printArea");if(old)old.remove();
    const area=document.createElement("div");area.id="printArea";area.innerHTML=el.outerHTML;
    area.querySelectorAll(".demo-actions").forEach(x=>x.remove());document.body.appendChild(area);
    const cleanup=()=>{area.remove();window.removeEventListener("afterprint",cleanup);};
    window.addEventListener("afterprint",cleanup);setTimeout(()=>window.print(),50);
  }

  /* ---------- Events ---------- */
  $("composer").addEventListener("submit",e=>{e.preventDefault();send();});
  question.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}});
  question.addEventListener("input",()=>{$("suggestions").classList.toggle("hidden",question.value.length>0);resizeInput();});
  question.addEventListener("focus",()=>{if(!question.value.trim()&&!welcome.classList.contains("hidden"))$("suggestions").classList.remove("hidden");});
  document.addEventListener("click",e=>{
    const p=e.target.closest("[data-prompt]");if(p){closeSidebar();send(p.dataset.prompt);return;}
    const chip=e.target.closest("[data-chip]");if(chip){send(chip.dataset.chip);return;}
    const act=e.target.closest("[data-act]");
    if(act){
      const card=act.closest(".demo-card"),row=act.closest(".message"),c=active();
      const m=c&&row?c.messages[+row.dataset.i]:null;
      if(act.dataset.act==="read"&&m&&m.card){stopSpeak();const was=voiceOn;voiceOn=true;speak((m.card.speak||[]).join(" "));voiceOn=was;}
      if(act.dataset.act==="print"&&card)printCard(card);
      if(act.dataset.act==="again"){const prompts={business:"Register a business",tpin:"Register a TPIN",profile:"Create a business profile"};send(prompts[act.dataset.key]);}
    }
  });
  $("menuBtn").onclick=openSidebar;$("closeSidebar").onclick=closeSidebar;$("scrim").onclick=closeSidebar;
  $("newChatBtn").onclick=newChat;$("newChatTop").onclick=newChat;
  $("voiceBtn").onclick=()=>{voiceOn=!voiceOn;try{localStorage.setItem("govai_voice",voiceOn?"on":"off");}catch(e){}if(!voiceOn)stopSpeak();paintVoice();};
  const micBtn=$("micBtn");if(SR){micBtn.classList.remove("hidden");micBtn.onclick=toggleVoiceMode;}
  $("serviceNav").addEventListener("click",e=>{const b=e.target.closest("[data-service]");if(!b)return;const key=b.dataset.service;const prompts={pacra:"I want to register a business name or limited company with PACRA. Explain the two options.",zra:"Help me understand ZRA TPIN and tax registration.",starter:"Help me create a business plan and startup budget.",directory:"Show me the government services directory."};send(prompts[key]);closeSidebar();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSidebar();});
  load();renderHistory();paintVoice();paintMic();newChat();
  if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  if(!storageOK)console.warn("GOVAI could not access local storage; conversation history may not persist.");
})();
