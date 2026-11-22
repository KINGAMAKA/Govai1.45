/* GOVAI guided demos, chat edition.
   A conversation engine: each of the three demos asks 10 short questions as normal chat messages,
   answers "what does that mean?" style questions, then shows a demo result card in the chat.
   Pure logic, no DOM except cardHTML(). Demo only: nothing is sent anywhere and all numbers are made up. */
(() => {
  "use strict";
  const PROVINCES = ["Central","Copperbelt","Eastern","Luapula","Lusaka","Muchinga","Northern","North-Western","Southern","Western"];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rnd = (n) => Array.from({length:n}, () => Math.floor(Math.random()*10)).join("");
  const spaced = (s) => String(s).replace(/\D/g, "").split("").join(" ");
  const today = () => new Date().toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"});
  const longDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return iso; return new Date(+m[1], +m[2]-1, +m[3]).toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"}); };
  function lowerFirst(s) { s = String(s || "").trim(); return s ? s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, "") : s; }

  /* ---------- The three flows: 10 short questions each ----------
     k=key, label, q=question, hint, opts=tap choices, alias=spoken synonyms, fmt=value format,
     explain/ex = plain-language answer to "what does that mean?" */
  const FLOWS = {
    business: {
      key: "business", title: "Register a business", opener: "Let's register your business name.",
      steps: [
        {k:"name", label:"Business name", q:"What is your business name?", ph:"Mwila Fresh Foods", fmt:"title", explain:"This is the name your business will trade under, the one on your signs and receipts."},
        {k:"alt", label:"Backup name", q:"Give a backup name.", hint:"Used if your first choice is taken.", ph:"Mwila Greens", fmt:"title", explain:"If another business already has your first name, your backup name can be used instead."},
        {k:"type", label:"Type", q:"What type of business is it?", opts:["Sole trader","Partnership","Limited company"], alias:{"Sole trader":["sole","single","alone","individual"],"Partnership":["partner","partners"],"Limited company":["limited","company","ltd"]}, explain:"Sole trader: you own it alone. Partnership: two or more people share it. Limited company: a separate legal entity owned by shareholders."},
        {k:"activity", label:"Activity", q:"What will the business do?", ph:"Sell fresh vegetables", explain:"Say in a few words what you sell or do."},
        {k:"owner", label:"Owner", q:"What is the owner's full name?", ph:"John Mwila", fmt:"title", explain:"The full name of the person who owns the business, as it appears on their NRC."},
        {k:"nrc", label:"NRC", q:"What is the owner's NRC number?", ph:"123456/78/1", fmt:"nrc", explain:"NRC is the National Registration Card. The number has 9 digits, written like 123456/78/1."},
        {k:"phone", label:"Phone", q:"What is your phone number?", ph:"0977 123 456", fmt:"tel", kw:["mobile","cell"], explain:"A number where the agency can reach you. Use one you answer."},
        {k:"email", label:"Email", q:"What is your email address?", ph:"name@example.com", fmt:"email", kw:["mail"], explain:"Confirmations and updates are usually sent here."},
        {k:"province", label:"Province", q:"Which province is the business in?", opts:PROVINCES, explain:"Zambia has 10 provinces. Choose the one where the business will operate."},
        {k:"address", label:"Address", q:"What is the business address?", ph:"Plot 5, Independence Avenue, Kitwe", kw:["location"], explain:"Where the business is based: plot number, street and town."}
      ],
      build(d) {
        const no = `BN-${new Date().getFullYear()}-${rnd(6)}`;
        return {
          badge: "Business name registered", head: "Your business name is created", main: d.name,
          id: {label: "Registration no.", value: no},
          rows: [["Type", d.type], ["Business activity", d.activity], ["Owner", d.owner], ["NRC", d.nrc], ["Phone", d.phone], ["Email", d.email], ["Province", d.province], ["Address", d.address], ["Backup name", d.alt], ["Date registered", today()], ["Status", "Active (demo)"]],
          fine: "Demo only. This is not a real PACRA registration. To register for real, apply through PACRA.",
          speak: [`Congratulations. Your business name, ${d.name}, is created.`, `Registration number, B N ${spaced(no)}.`, `Type: ${d.type}. Owner: ${d.owner}.`, "This is a demo. It is not a real PACRA registration."]
        };
      }
    },
    tpin: {
      key: "tpin", title: "Register a TPIN", opener: "Let's get your TPIN set up.",
      steps: [
        {k:"type", label:"Taxpayer type", q:"Who is the TPIN for?", opts:["Individual","Sole trader","Company"], alias:{"Individual":["myself","me","person","personal"],"Sole trader":["sole","trader"],"Company":["business","firm","limited"]}, explain:"Individual: you personally, for example if you are employed. Sole trader: you run a business in your own name. Company: a registered limited company."},
        {k:"name", label:"Name", q:"What is the full name or company name?", ph:"John Mwila", fmt:"title", explain:"Your full name as it appears on your NRC, or the company's name for a company."},
        {k:"nrc", label:"NRC", q:"What is your NRC number?", hint:"For a company, use a director's NRC.", ph:"123456/78/1", fmt:"nrc", explain:"NRC is the National Registration Card. The number has 9 digits, written like 123456/78/1."},
        {k:"dob", label:"Date of birth", q:"What is your date of birth?", hint:"For example, 5 March 1990.", fmt:"date", kw:["birthday","birth"], explain:"Your date of birth as it appears on your NRC. For a company, use the owner's."},
        {k:"phone", label:"Phone", q:"What is your phone number?", ph:"0977 123 456", fmt:"tel", kw:["mobile","cell"], explain:"A number where ZRA can reach you. Use one you answer."},
        {k:"email", label:"Email", q:"What is your email address?", ph:"name@example.com", fmt:"email", kw:["mail"], explain:"Your TPIN details and updates are usually sent here."},
        {k:"province", label:"Province", q:"Which province do you live in?", opts:PROVINCES, explain:"Zambia has 10 provinces. Choose the one where you live or where your business is based."},
        {k:"address", label:"Address", q:"What is your physical address?", ph:"Plot 5, Cairo Road, Lusaka", kw:["location"], explain:"Where you live or where the business is based: plot number, street and town."},
        {k:"income", label:"Main income", q:"What is your main source of income?", opts:["Employment","Business","Farming","Rent","Other"], alias:{"Employment":["job","salary","employed","work"],"Business":["trading","self employed"],"Farming":["farm","agriculture"],"Rent":["rental","property"]}, explain:"This tells ZRA what kind of tax may apply to you, such as salary tax, business profits, farming income or rent."},
        {k:"pacra", label:"PACRA no.", q:"Do you have a PACRA number?", hint:"Say “skip” if you do not.", ph:"BN-2026-123456", req:false, explain:"PACRA is where businesses are registered. If your business is registered, the number is on its certificate. If not, just skip."}
      ],
      build(d) {
        const raw = "10" + rnd(8), tpin = `${raw.slice(0,4)} ${raw.slice(4,7)} ${raw.slice(7)}`;
        return {
          badge: "TPIN issued", head: "Your TPIN is created", main: tpin, tagline: "Taxpayer Identification Number",
          rows: [["Taxpayer", d.name], ["Taxpayer type", d.type], ["NRC", d.nrc], ["Date of birth", d.dob], ["Main income", d.income], ["Phone", d.phone], ["Email", d.email], ["Province", d.province], ["Address", d.address], ["PACRA no.", d.pacra], ["Date issued", today()], ["Status", "Active (demo)"]],
          fine: "Demo only. This number is made up. It is not a real ZRA TPIN. Do not use it for any official purpose.",
          speak: [`Congratulations ${d.name}. Your T P I N is created.`, `Your T P I N is ${spaced(raw)}.`, `Taxpayer type: ${d.type}.`, "This is a demo. It is not a real Z R A T P I N."]
        };
      }
    },
    profile: {
      key: "profile", title: "Create a business profile", opener: "Let's create your business profile.",
      steps: [
        {k:"name", label:"Business name", q:"What is your business name?", ph:"Mwila Fresh Foods", fmt:"title", explain:"The name your customers know your business by."},
        {k:"what", label:"What it does", q:"What does your business do?", hint:"One short sentence.", ph:"Sells fresh vegetables", explain:"One short sentence about what you sell or do."},
        {k:"industry", label:"Industry", q:"Which industry is it in?", opts:["Retail","Food & drink","Agriculture","Services","Manufacturing","Technology","Transport","Other"], alias:{"Retail":["shop","shopping","selling"],"Food & drink":["food","restaurant","drink","drinks"],"Agriculture":["farming","farm","agri"],"Technology":["tech","software"]}, explain:"The sector you work in. Pick the closest match."},
        {k:"customers", label:"Customers", q:"Who are your customers?", ph:"Families and local shops", explain:"The people or businesses that buy from you."},
        {k:"town", label:"Town", q:"Which town or city are you in?", ph:"Kitwe", fmt:"title", explain:"Where your business operates from."},
        {k:"team", label:"Team size", q:"How many people work there?", opts:["Just me","Small (2–5)","Medium (6–20)","Large (21+)"], alias:{"Just me":["alone","myself","only me","one"],"Small (2–5)":["small","2 to 5","two to five"],"Medium (6–20)":["medium","6 to 20","six to twenty"],"Large (21+)":["large","big","21 or more","more than twenty"]}, explain:"Count yourself and everyone who works with you, including family helpers."},
        {k:"stage", label:"Stage", q:"What stage are you at?", opts:["Idea","Just started","Already trading"], alias:{"Idea":["planning","thinking"],"Just started":["started","new","beginning"],"Already trading":["trading","running","operating","established"]}, explain:"Idea: not started yet. Just started: you have your first customers. Already trading: you sell regularly."},
        {k:"capital", label:"Startup capital", q:"How much startup money do you have, in kwacha?", ph:"20000", fmt:"num", kw:["money","budget","capital"], explain:"The money you have to start or run the business. A rough figure is fine."},
        {k:"goal", label:"12-month goal", q:"What is your main goal for the next 12 months?", ph:"Open a second shop", explain:"The one thing you most want to achieve in the next year."},
        {k:"contact", label:"Contact", q:"What is the best phone number or email?", ph:"0977 123 456 or name@example.com", fmt:"contact", kw:["phone","email"], explain:"How customers or partners should reach you."}
      ],
      build(d) {
        const summary = `${d.name} is a ${String(d.industry).toLowerCase()} business in ${d.town}. It ${lowerFirst(d.what)}. Its customers are ${lowerFirst(d.customers)}.`;
        return {
          badge: "Business profile created", head: "Your business profile is created", main: d.name, tagline: `${d.industry} · ${d.town}`, summary,
          rows: [["What it does", d.what], ["Industry", d.industry], ["Customers", d.customers], ["Location", d.town], ["Team size", d.team], ["Stage", d.stage], ["Startup capital", d.capital], ["12-month goal", d.goal], ["Contact", d.contact], ["Created", today()]],
          fine: "Demo only. This profile is saved on this device only. It is a planning document, not an official record.",
          speak: [`Done. Your business profile for ${d.name} is created.`, summary, `Stage: ${d.stage}. Goal: ${d.goal}.`, "This is a demo profile."]
        };
      }
    }
  };
  const START_CHIPS = ["Register a business", "Register a TPIN", "Create a business profile"];

  /* ---------- Plain-language answers to side questions ---------- */
  const FAQ = [
    [/\bpacra\b/, "PACRA is the Patents and Companies Registration Agency. It registers business names and companies in Zambia."],
    [/\bzra\b/, "ZRA is the Zambia Revenue Authority. It collects taxes and issues TPINs."],
    [/\btpin\b/, "A TPIN is a Taxpayer Identification Number from the Zambia Revenue Authority. It identifies you for tax, so you usually need it to file returns or pay tax."],
    [/\bnrc\b|national registration/, "NRC is the National Registration Card. The number has 9 digits, written like 123456/78/1."],
    [/\b(provinces?)\b/, "Zambia has 10 provinces: Central, Copperbelt, Eastern, Luapula, Lusaka, Muchinga, Northern, North-Western, Southern and Western."],
    [/\b(sole trader|partnership|limited company|difference)\b/, "Sole trader: you own the business alone. Partnership: two or more people share it. Limited company: a separate legal entity owned by shareholders."],
    [/\b(cost|fees?|price|charge|how much (does|is|do|will))\b/, "Fees are set by the agency and can change, so I cannot quote them here. This demo is free. Check with the agency before you apply."],
    [/\b(how long|how fast|how many days|when will)\b/, "In real life, timing depends on the agency. This demo takes about two minutes."],
    [/\b(documents?|bring|required|requirements?|what do i need)\b/, "In real life you usually need your NRC and your contact details. In this demo, I only need your answers."],
    [/\b(real|official|genuine|legit|fake|is this (a )?(demo|test))\b/, "This is a demo. It practises the steps and makes a sample result. Nothing is sent to PACRA or ZRA, and the numbers are made up."],
    [/\b(save|saved|stored?|private|safe|privacy|my data|who (sees|can see))\b/, "Your answers stay on this device, in your browser. Nothing is sent anywhere."]
  ];
  const EXPLAIN = new RegExp([
    "what does (that|this|it) mean", "what do you mean", "what does .{1,30} mean", "what is (that|this|it)\\b", "what('?s| is| are) (a|an|the|my|your|these) ", "^(please )?explain", "explain (that|this|it|more)",
    "meaning", "mean by", "why (do|are|is|does|did) (you|i|we|this|it|that)", "how (long|much|do i|does it|can i)", "i (don'?t|do not) (understand|know|get)", "not sure", "confus",
    "^help\\b", "help me", "^(any |an |give me |show me )?examples?\\b", "clarify", "elaborate", "^huh", "^pardon", "i'?m lost", "^what\\??$"
  ].join("|"), "i");
  const Q_START = /^(what|what'?s|whats|why|how|who|where|when|which|can you|could you|do i|does|is it|is this|are you|should i|will i)\b/;

  /* ---------- Value helpers (typed and spoken answers) ---------- */
  const NUM = {zero:0, oh:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9};
  const digitsOf = (t) => String(t).toLowerCase().replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g, (m) => NUM[m]).replace(/\D/g, "");
  const nz = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, "");
  const clean = (raw) => String(raw).toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
  function fmtPhone(raw) {
    const plus = /^\s*(\+|plus)/i.test(raw), d = digitsOf(raw);
    if (plus && d.startsWith("260") && d.length === 12) return `+260 ${d.slice(3,6)} ${d.slice(6,9)} ${d.slice(9)}`;
    if (!plus && /^0\d{9}$/.test(d)) return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
    return (plus ? "+" : "") + d;
  }
  function fmtEmail(raw) {
    let t = String(raw).trim().toLowerCase();
    if (!t.includes("@")) t = t.replace(/\s+at\s+/g, "@").replace(/\s+dot\s+/g, ".").replace(/\s+underscore\s+/g, "_").replace(/\s+(dash|hyphen)\s+/g, "-");
    return t.replace(/\s+/g, "");
  }
  const ORD = ["first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth","eleventh","twelfth","thirteenth","fourteenth","fifteenth","sixteenth","seventeenth","eighteenth","nineteenth"];
  function ordinalWords(t) {
    let x = String(t).toLowerCase();
    x = x.replace(/\b(twenty|thirty)[\s-](first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)\b/g, (m, a, b) => (a === "twenty" ? 20 : 30) + ORD.indexOf(b) + 1);
    x = x.replace(/\btwentieth\b/g, "20").replace(/\bthirtieth\b/g, "30");
    ORD.forEach((w, i) => { x = x.replace(new RegExp("\\b" + w + "\\b", "g"), String(i + 1)); });
    return x;
  }
  function fmtDate(raw) {
    const t = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const ms = Date.parse(ordinalWords(t).replace(/(\d)(st|nd|rd|th)\b/gi, "$1").replace(/\bof\b/gi, "").replace(/\s+/g, " "));
    if (isNaN(ms)) return t;
    const d = new Date(ms), p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }
  function norm(s, v) {
    v = String(v == null ? "" : v).trim();
    if (!v) return "";
    switch (s.fmt) {
      case "tel": return fmtPhone(v);
      case "email": return fmtEmail(v);
      case "date": return fmtDate(v);
      case "nrc": { const d = digitsOf(v); return d.length === 9 ? `${d.slice(0,6)}/${d.slice(6,8)}/${d.slice(8)}` : v; }
      case "num": {
        let t = v.toLowerCase().replace(/,/g, "");
        t = t.replace(/(\d+(?:\.\d+)?)\s*thousand/, (_, n) => n * 1000).replace(/(\d+(?:\.\d+)?)\s*million/, (_, n) => n * 1000000);
        return digitsOf(t.replace(/\.\d+/, ""));
      }
      case "contact": return (/@|\bat\b.+\bdot\b/i.test(v)) ? fmtEmail(v) : fmtPhone(v);
      case "title": return v.replace(/\.$/, "").replace(/\s+/g, " ").replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase());
      default: return v.replace(/\.$/, "").replace(/^[a-z]/, (c) => c.toUpperCase());
    }
  }
  function check(s, v) {
    if (!v) return s.req === false ? "" : "Please answer this question.";
    switch (s.fmt) {
      case "tel": { const n = digitsOf(v).length; if (n < 9 || n > 13) return "That does not look like a phone number."; break; }
      case "email": if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "That does not look like an email address."; break;
      case "nrc": if (!/^\d{6}\/\d{2}\/\d$/.test(v)) return "That does not look like an NRC number. It has 9 digits, like 123456/78/1."; break;
      case "date": { const t = Date.parse(v); if (isNaN(t) || t > Date.now() || new Date(t).getFullYear() < 1900) return "I could not read that date. Try “5 March 1990”."; break; }
      case "num": if (!(Number(v) > 0)) return "Please give an amount above zero, like 20000."; break;
      case "contact": if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || (digitsOf(v).length >= 9 && digitsOf(v).length <= 13))) return "Please give a valid phone number or email."; break;
      default: if (v.length < 2) return "Please give a little more detail.";
    }
    return "";
  }
  function disp(s, v) {
    if (!v) return "—";
    if (s.fmt === "date") return longDate(v);
    if (s.fmt === "num") return "K" + Number(v).toLocaleString("en-US");
    return v;
  }
  function spoken(s, v) {
    if (!v) return "none";
    if (s.fmt === "tel" || s.fmt === "nrc") return String(v).replace(/\//g, " slash ").replace(/\d/g, "$& ").replace(/\s+/g, " ").trim();
    if (s.fmt === "email") return v.replace(/@/g, " at ").replace(/\./g, " dot ");
    if (s.fmt === "contact") return /@/.test(v) ? v.replace(/@/g, " at ").replace(/\./g, " dot ") : spaced(v);
    if (s.fmt === "date") return longDate(v);
    if (s.fmt === "num") return `${Number(v)} kwacha`;
    return v;
  }
  const wordsOf = (x) => " " + String(x).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() + " ";
  function matchOpt(s, said) {
    const W = wordsOf(said); if (W.trim() === "") return null;
    const names = (o) => [o, ...((s.alias || {})[o] || [])].map(wordsOf).filter((n) => n.trim());
    // 1) the spoken/typed text contains a whole option name or alias (whole words only)
    for (const o of s.opts) if (names(o).some((n) => W.includes(n))) return o;
    // 2) a single spoken word (4+ letters) equals a word of an option or alias, e.g. "limited", "medium"
    const spokenWords = W.trim().split(" ").filter((w) => w.length >= 4);
    if (spokenWords.length === 1) for (const o of s.opts) if (names(o).some((n) => n.trim().split(" ").includes(spokenWords[0]))) return o;
    return null;
  }

  /* ---------- Starting a demo from what the person says ---------- */
  function detect(raw) {
    const t = String(raw).toLowerCase();
    if (/understand|explain|what is|what's|how (do|does|to)|difference|meaning/.test(t)) return null;
    if (/\bbusiness profile\b/.test(t) && /(create|make|build|write|need|want|start|set ?up|help)/.test(t)) return "profile";
    if (/\btpin\b/.test(t) && /(register|apply|get|start|set ?up|create|need|want|begin|help)/.test(t)) return "tpin";
    if (/\b(register|start|open|set ?up|create|begin)\b.*\bbusiness( name)?\b/.test(t) && !/limited company|profile|plan/.test(t)) return "business";
    return null;
  }

  /* ---------- Conversation engine ---------- */
  const ACKS = ["Got it", "Thanks", "Noted", "Great", "Perfect"];
  const stepsOf = (f) => FLOWS[f.key].steps;
  const cur = (f) => stepsOf(f)[f.i];
  const copy = (f) => JSON.parse(JSON.stringify(f));
  const HELP_CHIP = "What does that mean?";

  function qMsg(f, ack) {
    const s = cur(f), n = stepsOf(f).length;
    const chips = [...(s.opts || [])]; if (s.req === false) chips.push("Skip"); chips.push(HELP_CHIP);
    const m = {tag: `Question ${f.i + 1} of ${n}`, text: s.q + (s.hint ? "\n" + s.hint : ""), chips,
      speak: `Question ${f.i + 1}. ${s.q}${s.hint && !/“/.test(s.hint) ? " " + s.hint : ""}`};
    if (ack) { m.ack = ack.text; m.speak = ack.speak + " " + m.speak; }
    return m;
  }
  function reviewMsg(f, ack) {
    const steps = stepsOf(f);
    const list = steps.map((s) => [s.label, disp(s, f.a[s.k])]);
    const speak = ["Please check your answers.", ...steps.map((s) => `${s.label}: ${spoken(s, f.a[s.k])}.`), "Say create to finish, or tell me what to change."].join(" ");
    const m = {tag: "Review", text: "Here is what I have. Say “create” to finish, or tell me what to change, for example “change phone”.", list, chips: ["Create now", "Change something"], speak};
    if (ack) { m.ack = ack.text; m.speak = ack.speak + " " + m.speak; }
    return m;
  }
  function answersSoFar(f) {
    const steps = stepsOf(f).slice(0, f.i);
    if (!steps.length) return {text: "You have not answered anything yet."};
    return {text: "Your answers so far:", list: steps.map((s) => [s.label, disp(s, f.a[s.k])]), speak: "Your answers so far. " + steps.map((s) => `${s.label}: ${spoken(s, f.a[s.k])}.`).join(" ")};
  }
  function start(key) {
    const fl = FLOWS[key], f = {key, i: 0, a: {}, phase: "ask", edit: false};
    return {flow: f, messages: [
      {text: `${fl.opener} I will ask 10 short questions. You can type, tap an option or speak your answer. Ask me “what does that mean?” any time. This is a demo: nothing is sent to any government office.`, speak: `${fl.opener} I will ask 10 short questions. You can type, tap an option or speak. Ask me what does that mean, any time. This is a demo.`},
      qMsg(f)
    ]};
  }
  function advance(f, ack) {
    if (f.edit) { f.edit = false; f.phase = "confirm"; return {messages: [reviewMsg(f, ack)], flow: f}; }
    if (f.i < stepsOf(f).length - 1) { f.i++; return {messages: [qMsg(f, ack)], flow: f}; }
    f.phase = "confirm"; return {messages: [reviewMsg(f, ack)], flow: f};
  }
  function helpReply(f, raw, t, optStep) {
    const s = cur(f);
    const isQ = /\?\s*$/.test(raw.trim()) || EXPLAIN.test(t) || (optStep && Q_START.test(t));
    if (!isQ) return null;
    let text = null;
    for (const [re, ans] of FAQ) if (re.test(t)) { text = ans; break; }
    if (!text && /^(any |an |give me |show me )?examples?\b/.test(t) && (s.ph || s.opts)) text = s.opts ? `For example: ${s.opts[0]}.` : `For example: ${s.ph}.`;
    if (!text) {
      text = s.explain;
      if (s.ph && !s.opts) text += ` For example: ${s.ph}.`;
      if (/\bwhy\b/.test(t)) text = "The real form asks this so the agency can identify you and reach you. " + text;
    }
    return [{text, speak: text}];
  }
  function findStep(f, t) {
    const T = nz(t); let best = -1, len = 0;
    stepsOf(f).forEach((s, i) => {
      [s.label, s.k, ...(s.kw || [])].forEach((w) => { const n = nz(w); if (n && T.includes(n) && n.length > len) { best = i; len = n.length; } });
    });
    return best;
  }
  function result(f) {
    const fl = FLOWS[f.key], d = {};
    fl.steps.forEach((s) => { d[s.k] = disp(s, f.a[s.k]); });
    const r = fl.build(d); r.key = f.key;
    const others = START_CHIPS.filter((c) => detect(c) !== f.key);
    return {flow: null, messages: [{text: r.head + ". Here is your demo page.", card: r, speak: r.speak, chips: others}]};
  }

  function handle(flowIn, raw) {
    const f = copy(flowIn), fl = FLOWS[f.key], t = clean(raw);
    const out = (messages, flow) => ({messages, flow: flow === undefined ? f : flow});
    if (/^(cancel|stop|quit|exit|never ?mind|forget it|end)( this| the)?( demo)?$/.test(t))
      return out([{text: "No problem, I have stopped. Nothing was saved. Say “register a TPIN”, “register a business” or “create a business profile” whenever you are ready.", chips: START_CHIPS}], null);
    if (/^(start over|restart|start again|begin again)$/.test(t)) return start(f.key);
    const other = detect(raw);
    if (other && other !== f.key) { const r = start(other); r.messages.unshift({text: `Okay, switching to ${FLOWS[other].title.toLowerCase()}.`}); return r; }
    return f.phase === "confirm" ? confirmStep(f, raw, t, out) : askStep(f, raw, t, out);
  }

  function askStep(f, raw, t, out) {
    const s = cur(f);
    if (/^(back|go back|previous|previous question|undo)$/.test(t)) {
      if (f.i > 0) { f.i--; f.edit = false; return out([qMsg(f)]); }
      return out([{text: "This is the first question."}, qMsg(f)]);
    }
    if (/^(repeat|say again|again|read it again|read again|read the question|what was the question|say that again)$/.test(t)) return out([qMsg(f)]);
    if (/^read (all |my )?(answers|back|everything)$/.test(t)) return out([answersSoFar(f), qMsg(f)]);
    if (/^skip( this| it| question)?$/.test(t)) {
      if (s.req === false) { f.a[s.k] = ""; return advance(f, {text: "Skipped", speak: "Skipped."}); }
      return out([{text: "I cannot skip this one. It is needed."}, qMsg(f)]);
    }
    if (/^(next|continue|go on)$/.test(t)) return out([{text: "I need your answer first."}, qMsg(f)]);

    let v = null;
    if (s.opts) v = matchOpt(s, t);
    if (!v) {
      const help = helpReply(f, raw, t, !!s.opts);
      if (help) return out([...help, qMsg(f)]);
    }
    if (s.opts && !v) return out([{text: `Please choose one: ${s.opts.join(", ")}.`, chips: qMsg(f).chips}]);
    if (!s.opts) v = norm(s, raw);
    const err = check(s, v);
    if (err) return out([{text: err + (s.ph && !s.opts && !/like|Try/.test(err) ? ` For example: ${s.ph}.` : ""), chips: qMsg(f).chips}]);
    f.a[s.k] = v;
    const word = ACKS[(f.i + (f.edit ? 1 : 0)) % ACKS.length];
    return advance(f, {text: `${word}: ${disp(s, v)}`, speak: `${word}. ${spoken(s, v)}.`});
  }

  function confirmStep(f, raw, t, out) {
    if (/^(yes|yeah|yep|yup|ok|okay|sure|create|confirm|submit|finish|go ahead|correct|that'?s right|looks good|all good|done|proceed)\b/.test(t)) return result(f);
    if (/^(read|repeat|read back|read all)( my| the)?( answers| again| everything)?$/.test(t)) return out([reviewMsg(f)]);
    const idx = findStep(f, t);
    const questionLike = /\?\s*$/.test(raw.trim()) || EXPLAIN.test(t);
    if (idx >= 0 && !questionLike) {
      f.i = idx; f.edit = true; f.phase = "ask";
      return out([{text: `Okay, let's change ${stepsOf(f)[idx].label.toLowerCase()}.`, speak: `Okay, let's change ${stepsOf(f)[idx].label.toLowerCase()}.`}, qMsg(f)]);
    }
    if (/^(no|nope|change|edit|wrong|not right|something is wrong)\b/.test(t))
      return out([{text: "Which one would you like to change?", chips: stepsOf(f).map((s) => s.label)}]);
    if (questionLike) {
      let text = "I can explain any answer. Say “create” to finish, or tell me what to change.";
      for (const [re, ans] of FAQ) if (re.test(t)) { text = ans; break; }
      return out([{text, speak: text}, {text: "Say “create” to finish, or tell me what to change.", chips: ["Create now", "Change something"]}]);
    }
    return out([{text: "Say “create” to finish, or tell me what to change, for example “change phone”.", chips: ["Create now", "Change something"]}]);
  }

  /* ---------- Result card (shown inside the chat) ---------- */
  function cardHTML(c) {
    return `<article class="demo-card"><div class="demo-tag">DEMO</div><div class="demo-check" aria-hidden="true">✓</div><p class="demo-kicker">${esc(c.badge)}</p><h3>${esc(c.head)}</h3><div class="demo-main">${esc(c.main)}</div>${c.tagline ? `<p class="demo-tagline">${esc(c.tagline)}</p>` : ""}${c.id ? `<div class="demo-id"><span>${esc(c.id.label)}</span><strong>${esc(c.id.value)}</strong></div>` : ""}${c.summary ? `<p class="demo-summary">${esc(c.summary)}</p>` : ""}<dl class="demo-rows">${c.rows.filter((x) => x[1] && x[1] !== "—").map((x) => `<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join("")}</dl><p class="demo-fine">${esc(c.fine)}</p><div class="demo-actions"><button type="button" data-act="read">🔊 Read aloud</button><button type="button" data-act="print">🖨 Print / save PDF</button><button type="button" data-act="again" data-key="${esc(c.key)}">↺ Start again</button></div></article>`;
  }

  window.GOVAIFlows = {detect, start, handle, cardHTML, flows: FLOWS, START_CHIPS};
})();
