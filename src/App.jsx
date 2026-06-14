import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const C = {
  bg:"#07090d",bg2:"#0e1117",bg3:"#151a23",bg4:"#1a2030",
  border:"#1c2235",borderHi:"#2a3650",
  t1:"#e6e9f0",t2:"#98a1b3",t3:"#5e6880",t4:"#353f55",
  acc:"#00e5a0",accDim:"#00e5a018",accGlow:"#00e5a044",
  warn:"#f59e0b",warnDim:"#f59e0b18",
  err:"#ef4444",errDim:"#ef444418",
  elite:"#a78bfa",eliteDim:"#a78bfa18",
  blue:"#60a5fa",blueDim:"#60a5fa18",
  coin:"#fbbf24",
};

const INIT=[
  {pos:"QB",sub:"QB",name:"Robert Griffin III",card:"Flashbacks",ovr:96,arch:"Scrambler",start:17.0,price:0,rel:"",abilities:[],s:{SPD:94,AGI:93,THP:96,SAC:93,MAC:92,DAC:96}},
  {pos:"QB",sub:"QB",name:"Drake Maye",card:"Season 5 FP",ovr:95,arch:"Strong Arm",start:10.5,price:0,rel:"",abilities:[],s:{SPD:90,AGI:87,THP:94,SAC:96,MAC:92,DAC:92}},
  {pos:"QB",sub:"QB",name:"Jalen Milroe",card:"Ultimate Upgrades",ovr:95,arch:"Scrambler",start:9.5,price:0,rel:"",abilities:[],s:{SPD:94,AGI:91,THP:96,SAC:96,MAC:91,DAC:94}},
  {pos:"QB",sub:"QB",name:"Sam Darnold",card:"Super Bowl",ovr:95,arch:"Field General",start:7.7,price:0,rel:"",abilities:[],s:{SPD:89,AGI:85,THP:97,SAC:95,MAC:91,DAC:91}},
  {pos:"QB",sub:"QB",name:"John Elway",card:"Super Bowl",ovr:95,arch:"Field General",start:7.9,price:0,rel:"",abilities:[],s:{SPD:88,AGI:84,THP:97,SAC:92,MAC:90,DAC:93}},
  {pos:"HB",sub:"Elusive",name:"Kenneth Walker III",card:"Super Bowl",ovr:99,arch:"Elusive Back",start:19.5,price:0,s:{SPD:97,ACC:96,COD:97,REC:85,ELU:98}},
  {pos:"HB",sub:"Elusive",name:"Walter Payton",card:"Ultimate Legends",ovr:96,arch:"Elusive Back",start:7.3,price:0,s:{SPD:96,ACC:95,COD:94,REC:88,ELU:94}},
  {pos:"HB",sub:"Power",name:"Marshawn Lynch",card:"Super Bowl",ovr:95,arch:"Power Back",start:6.8,price:0,wgt:215,s:{SPD:95,BTK:98,SFA:96,TRK:97}},
  {pos:"HB",sub:"Elusive",name:"Jeremiyah Love",card:"NFL Combine",ovr:93,arch:"Elusive Back",start:5.8,price:0,s:{SPD:95,ACC:93,COD:90,REC:80,ELU:90}},
  {pos:"HB",sub:"Power",name:"LeGarrette Blount",card:"Super Bowl",ovr:95,arch:"Power Back",start:5.8,price:0,wgt:250,s:{SPD:94,BTK:96,SFA:95,TRK:97}},
  {pos:"WR",sub:"WR",name:"Rashid Shaheed",card:"Playoffs",ovr:94,arch:"Playmaker",start:29.2,price:0,s:{SPD:95,CTH:93,SRR:92,MRR:90,DRR:93}},
  {pos:"WR",sub:"WR",name:"Steve Smith Sr",card:"Season 5 FP",ovr:95,arch:"Slot",start:28.8,price:0,s:{SPD:95,CTH:95,SRR:95,MRR:93,DRR:96}},
  {pos:"WR",sub:"WR",name:"Jaxon Smith-Njigba",card:"Super Bowl",ovr:95,arch:"Slot",start:23.0,price:0,s:{SPD:94,CTH:93,SRR:97,MRR:97,DRR:90}},
  {pos:"WR",sub:"WR",name:"Kylie Cox (Sketch)",card:"Super Bowl",ovr:95,arch:"Playmaker",start:18.9,price:0,s:{SPD:94,CTH:95,SRR:95,MRR:96,DRR:94}},
  {pos:"WR",sub:"WR",name:"A.J. Brown",card:"Crystal",ovr:96,arch:"Physical",start:15.0,price:0,s:{SPD:95,CTH:96,SRR:94,MRR:95,DRR:95}},
  {pos:"OL",sub:"LT",name:"Jordan Mailata",card:"Season 4 FP",ovr:93,arch:"Power",start:16.3,price:0,wgt:346,s:{SPD:72,PBK:94,RBK:93,AWR:90,STR:95,IBL:92}},
  {pos:"OL",sub:"LT",name:"Paris Johnson Jr",card:"Genki Force",ovr:96,arch:"Power",start:14.2,price:0,wgt:315,s:{SPD:82,PBK:96,RBK:94,AWR:92,STR:93,IBL:91}},
  {pos:"OL",sub:"LT",name:"Bryant McKinnie",card:"Team Captains",ovr:94,arch:"Pass Protector",start:13.2,price:0,wgt:345,s:{SPD:68,PBK:96,RBK:88,AWR:93,STR:96,IBL:87}},
  {pos:"OL",sub:"LG",name:"David Edwards",card:"Season 5 FP",ovr:95,arch:"Agile",start:44.3,price:0,wgt:308,s:{SPD:75,PBK:95,RBK:94,AWR:94,STR:92,IBL:93}},
  {pos:"OL",sub:"LG",name:"Damien Woody",card:"Super Bowl",ovr:95,arch:"Power",start:16.6,price:0,wgt:320,s:{SPD:74,PBK:94,RBK:95,AWR:91,STR:96,IBL:94}},
  {pos:"OL",sub:"LG",name:"Trevor Penning",card:"Flashbacks",ovr:96,arch:"Power",start:4.4,price:0,wgt:325,s:{SPD:80,PBK:93,RBK:96,AWR:88,STR:95,IBL:95}},
  {pos:"OL",sub:"C",name:"Zach Frazier",card:"Season 6 FP",ovr:97,arch:"Agile",start:47.9,price:0,wgt:305,s:{SPD:78,PBK:97,RBK:96,AWR:96,STR:93,IBL:94}},
  {pos:"OL",sub:"C",name:"Jalen Sundell",card:"Super Bowl",ovr:95,arch:"Agile",start:14.2,price:0,wgt:298,s:{SPD:82,PBK:94,RBK:93,AWR:93,STR:90,IBL:91}},
  {pos:"OL",sub:"C",name:"Jay Hilgenberg",card:"Super Bowl",ovr:95,arch:"Agile",start:9.9,price:0,wgt:310,s:{SPD:76,PBK:95,RBK:94,AWR:94,STR:94,IBL:93}},
  {pos:"OL",sub:"RG",name:"Robert Hunt",card:"Genki Force",ovr:96,arch:"Pass Protector",start:22.1,price:0,wgt:332,s:{SPD:72,PBK:97,RBK:93,AWR:94,STR:96,IBL:92}},
  {pos:"OL",sub:"RG",name:"Marshal Yanda",card:"Super Bowl",ovr:95,arch:"Power",start:12.9,price:0,wgt:315,s:{SPD:70,PBK:94,RBK:96,AWR:93,STR:97,IBL:95}},
  {pos:"OL",sub:"RG",name:"Mike Onwenu",card:"Super Bowl",ovr:95,arch:"Power",start:11.4,price:0,wgt:340,s:{SPD:68,PBK:93,RBK:95,AWR:90,STR:95,IBL:94}},
  {pos:"OL",sub:"RT",name:"Joe Alt",card:"Collector's Series",ovr:96,arch:"Power",start:30.1,price:0,wgt:321,s:{SPD:82,PBK:96,RBK:95,AWR:93,STR:94,IBL:93}},
  {pos:"OL",sub:"RT",name:"George Kittle",card:"Zero Chill",ovr:93,arch:"Agile",start:15.4,price:0,wgt:295,s:{SPD:88,PBK:91,RBK:93,AWR:90,STR:88,IBL:90}},
  {pos:"OL",sub:"RT",name:"John Madden",card:"Autumn",ovr:92,arch:"Power",start:9.6,price:0,wgt:335,s:{SPD:62,PBK:93,RBK:92,AWR:94,STR:94,IBL:91}},
  {pos:"DL",sub:"LEDG",name:"Jevon Kearse",card:"Season 5 FP",ovr:95,arch:"Speed Rusher",start:38.4,price:0,traits:{bullRush:false,swim:true,spin:true},s:{SPD:92,ACC:95,PMV:88,FMV:95,STR:87}},
  {pos:"DL",sub:"LEDG",name:"Reggie White",card:"Super Bowl",ovr:95,arch:"Power Rusher",start:12.0,price:0,traits:{bullRush:true,swim:true,spin:false},s:{SPD:89,ACC:92,PMV:97,FMV:85,STR:97}},
  {pos:"DL",sub:"LEDG",name:"Harold Landry III",card:"Super Bowl",ovr:95,arch:"Speed Rusher",start:5.0,price:0,traits:{bullRush:true,swim:true,spin:false},s:{SPD:92,ACC:96,PMV:93,FMV:94,STR:97}},
  {pos:"DL",sub:"LEDG",name:"DeMarcus Lawrence",card:"Super Bowl",ovr:95,arch:"Run Stopper",start:4.7,price:0,traits:{bullRush:true,swim:false,spin:false},s:{SPD:90,ACC:88,PMV:94,FMV:86,STR:94}},
  {pos:"DL",sub:"LEDG",name:"David Bailey",card:"NFL Combine",ovr:93,arch:"Speed Rusher",start:4.4,price:0,traits:{bullRush:false,swim:true,spin:false},s:{SPD:93,ACC:95,PMV:84,FMV:92,STR:87}},
  {pos:"DL",sub:"DT",name:"William Perry",card:"Super Bowl",ovr:95,arch:"Nose Tackle",start:38.8,price:0,wgt:350,s:{SPD:86,TAK:92,BSH:97,PMV:97,FMV:76,STR:98}},
  {pos:"DL",sub:"DT",name:"Nnamdi Madubuike",card:"Season 4 FP",ovr:93,arch:"Nose Tackle",start:28.0,price:0,wgt:318,s:{SPD:76,TAK:93,BSH:94,PMV:85,FMV:92,STR:92}},
  {pos:"DL",sub:"DT",name:"Haloti Ngata",card:"Super Bowl",ovr:95,arch:"Nose Tackle",start:15.4,price:0,wgt:340,s:{SPD:86,TAK:93,BSH:96,PMV:92,FMV:85,STR:96}},
  {pos:"DL",sub:"DT",name:"Milton Williams",card:"Stocking Stuffers",ovr:93,arch:"Power Rusher",start:12.4,price:0,wgt:283,s:{SPD:91,TAK:93,BSH:84,PMV:95,FMV:87,STR:88}},
  {pos:"DL",sub:"DT",name:"Geno Atkins",card:"Team Captains",ovr:94,arch:"Power Rusher",start:11.3,price:0,wgt:300,s:{SPD:79,TAK:92,BSH:92,PMV:93,FMV:81,STR:93}},
  {pos:"DL",sub:"REDG",name:"Nolan Smith Jr",card:"Season 6 FP",ovr:97,arch:"Speed Rusher",start:35.7,price:0,traits:{bullRush:false,swim:true,spin:true},s:{SPD:95,ACC:99,PMV:82,FMV:97,STR:76}},
  {pos:"DL",sub:"REDG",name:"Myles Garrett",card:"NFL Honors",ovr:96,arch:"Power Rusher",start:9.4,price:0,traits:{bullRush:true,swim:true,spin:false},s:{SPD:92,ACC:91,PMV:98,FMV:90,STR:98}},
  {pos:"DL",sub:"REDG",name:"Za'Darius Smith",card:"Zero Chill",ovr:93,arch:"Power Rusher",start:8.1,price:0,traits:{bullRush:true,swim:false,spin:true},s:{SPD:91,ACC:93,PMV:93,FMV:90,STR:91}},
  {pos:"DL",sub:"REDG",name:"Dwight Freeney",card:"Super Bowl",ovr:96,arch:"Speed Rusher",start:7.4,price:0,traits:{bullRush:false,swim:false,spin:true},s:{SPD:94,ACC:90,PMV:88,FMV:96,STR:97}},
  {pos:"DL",sub:"REDG",name:"Lawrence Taylor",card:"NFL Honors",ovr:96,arch:"Power Rusher",start:6.7,price:0,traits:{bullRush:true,swim:true,spin:false},s:{SPD:92,ACC:93,PMV:95,FMV:88,STR:94}},
  {pos:"DB",sub:"CB",name:"Charles Woodson",card:"Season 6 FP",ovr:97,arch:"Slot",start:49.5,price:0,dna:"Glitchy",abilities:[{name:"One Step Ahead",ap:0}],s:{SPD:96,JMP:95,MCV:96,ZCV:96,PRS:92,TAK:88,POW:82}},
  {pos:"DB",sub:"CB",name:"Plaxico Burress",card:"MCS",ovr:94,arch:"Zone",start:40.0,price:0,dna:"Standard",abilities:[{name:"Deep Out Zone KO",ap:0}],s:{SPD:94,JMP:95,MCV:96,ZCV:94,PRS:89,TAK:85,POW:78}},
  {pos:"DB",sub:"CB",name:"Nick Emmanwori",card:"Super Bowl",ovr:95,arch:"Slot",start:31.8,price:0,dna:"Glitchy",abilities:[{name:"Pick Artist",ap:1}],s:{SPD:96,JMP:97,MCV:97,ZCV:97,PRS:80,TAK:86,POW:80}},
  {pos:"DB",sub:"CB",name:"Tariq Woolen",card:"Ranked",ovr:95,arch:"Zone",start:17.3,price:0,dna:"Standard",abilities:[{name:"Deep Out Zone KO",ap:0}],s:{SPD:95,JMP:96,MCV:93,ZCV:96,PRS:91,TAK:87,POW:82}},
  {pos:"DB",sub:"CB",name:"Randy Moss",card:"Ghost of MUT",ovr:94,arch:"Slot",start:8.8,price:0,dna:"Standard",abilities:[{name:"One Step Ahead",ap:0}],s:{SPD:94,JMP:96,MCV:96,ZCV:95,PRS:94,TAK:80,POW:75}},
  {pos:"DB",sub:"FS",name:"Kamren Kinchens",card:"Season 5 FP",ovr:95,arch:"Zone",start:21.4,price:0,dna:"Standard",abilities:[{name:"Deep Out Zone KO",ap:0}],s:{SPD:94,TAK:91,POW:98,MCV:88,ZCV:96,PRS:78,JMP:90}},
  {pos:"DB",sub:"FS",name:"Steve Atwater",card:"Super Bowl",ovr:95,arch:"Run Support",start:5.9,price:0,dna:"Standard",abilities:[],s:{SPD:95,TAK:92,POW:98,MCV:88,ZCV:97,PRS:82,JMP:88}},
  {pos:"DB",sub:"FS",name:"Jaylinn Hawkins",card:"Playoffs",ovr:94,arch:"Zone",start:5.4,price:0,dna:"Standard",abilities:[{name:"Pick Artist",ap:1}],s:{SPD:93,TAK:90,POW:99,MCV:92,ZCV:95,PRS:75,JMP:92}},
  {pos:"DB",sub:"FS",name:"Earl Thomas III",card:"Super Bowl",ovr:95,arch:"Zone",start:4.4,price:0,dna:"Glitchy",abilities:[{name:"Deep Out Zone KO",ap:0}],s:{SPD:95,TAK:87,POW:95,MCV:94,ZCV:97,PRS:80,JMP:93}},
  {pos:"DB",sub:"FS",name:"Kerby Joseph",card:"Flashbacks",ovr:95,arch:"Zone",start:3.6,price:0,dna:"Standard",abilities:[{name:"Lurk Artist",ap:1}],s:{SPD:94,TAK:93,POW:85,MCV:93,ZCV:98,PRS:76,JMP:91}},
  {pos:"DB",sub:"SS",name:"User",card:"Genki Force",ovr:96,arch:"Run Support",start:49.4,price:0,dna:"Standard",abilities:[{name:"Deep Out Zone KO",ap:0}],s:{SPD:95,TAK:93,POW:95,MCV:92,ZCV:95,PRS:84,JMP:90}},
  {pos:"DB",sub:"SS",name:"Isaiah Pola-Mao",card:"Crystal",ovr:96,arch:"Hybrid",start:18.1,price:0,dna:"Glitchy",abilities:[{name:"One Step Ahead",ap:0}],s:{SPD:96,TAK:98,POW:94,MCV:96,ZCV:97,PRS:82,JMP:94}},
  {pos:"DB",sub:"SS",name:"Kam Chancellor",card:"Black History",ovr:95,arch:"Run Support",start:15.0,price:0,dna:"Heavy",abilities:[],s:{SPD:95,TAK:93,POW:94,MCV:86,ZCV:94,PRS:88,JMP:86}},
  {pos:"DB",sub:"SS",name:"Troy Polamalu",card:"Super Bowl",ovr:96,arch:"Hybrid",start:8.1,price:0,dna:"Glitchy",abilities:[{name:"Pick Artist",ap:1}],s:{SPD:96,TAK:90,POW:97,MCV:94,ZCV:98,PRS:80,JMP:95}},
  {pos:"DB",sub:"SS",name:"Coby Bryant",card:"Super Bowl",ovr:96,arch:"Zone",start:5.7,price:0,dna:"Standard",abilities:[{name:"Deep Out Zone KO",ap:0}],s:{SPD:95,TAK:94,POW:94,MCV:96,ZCV:98,PRS:86,JMP:92}},
];

function fPrice(p){if(!p||p<=0)return null;if(p>=1000000)return(p/1000000).toFixed(2).replace(/\.?0+$/,"")+"M";if(p>=1000)return Math.round(p/1000)+"K";return p.toLocaleString();}

// Persist a piece of state to localStorage so config/thresholds survive reloads
function useLS(key,init){
  const[v,setV]=useState(()=>{try{const s=localStorage.getItem(key);return s!=null?JSON.parse(s):init;}catch{return init;}});
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(v));}catch{}},[key,v]);
  return[v,setV];
}

// Track whether the viewport is phone-narrow so dense rows can simplify.
// Lightweight: one matchMedia listener, cleaned up on unmount.
function useIsNarrow(bp=560){
  const q=`(max-width:${bp}px)`;
  const[narrow,setNarrow]=useState(()=>typeof window!=="undefined"&&typeof window.matchMedia!=="undefined"?window.matchMedia(q).matches:false);
  useEffect(()=>{
    if(typeof window==="undefined"||typeof window.matchMedia==="undefined")return;
    const m=window.matchMedia(q);const on=()=>setNarrow(m.matches);on();
    try{m.addEventListener("change",on);return()=>m.removeEventListener("change",on);}
    catch{m.addListener(on);return()=>m.removeListener(on);}
  },[q]);
  return narrow;
}

// Short beep via WebAudio — used to alert when a fresh snipe appears
function beep(){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type="sine";o.frequency.value=880;g.gain.setValueAtTime(.06,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.25);o.start();o.stop(ctx.currentTime+.25);setTimeout(()=>ctx.close(),300);}catch{}}

// Read a dotted path out of an arbitrary object — e.g. readPath(json,"data.auctionInfo")
function readPath(obj,path){if(path==null||path==="")return obj;return String(path).split(".").reduce((o,k)=>(o==null?undefined:o[k]),obj);}

// Format a signed coin amount (handles negatives/zero, which fPrice returns null for)
function fSigned(n){if(n==null)return"—";const a=Math.abs(n);const f=fPrice(a)??String(a);return(n<0?"−":"+")+f;}

// Parse coin input — accepts 42500, "42500", "42k", "1.2m", "42,500"
function parseCoins(str){
  if(typeof str==="number")return Math.round(str);
  if(!str)return 0;
  const s=String(str).trim().toLowerCase().replace(/[,\s🪙]/g,"");
  const m=s.match(/^([\d.]+)([km]?)$/);
  if(!m)return 0;
  let n=parseFloat(m[1]);if(isNaN(n))return 0;
  if(m[2]==="k")n*=1000;else if(m[2]==="m")n*=1000000;
  return Math.round(n);
}

// Normalize a player name for matching: lowercase, strip accents, parentheticals,
// name suffixes (Jr/Sr/II-V), and all punctuation/spacing. Mirrors api/mutgg.js's
// norm+searchName approach so live-feed listings match the roster reliably.
function normName(s){
  return String(s||"")
    .normalize("NFKD").replace(/[̀-ͯ]/g,"")   // strip accents
    .toLowerCase()
    .replace(/\([^)]*\)/g,"")                            // drop parentheticals
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g,"")           // drop name suffixes
    .replace(/[^a-z0-9]/g,"");                            // drop all punctuation/space
}

// Deterministic 0–100 "heat" score for a snipe — blends profit margin (profit vs
// market value) and discount %. Higher = hotter. Cheap; no randomness.
function heatScore(profit,disc,mv){
  if(profit==null||disc==null||!mv)return 0;
  const marginPct=Math.max(0,Math.min(100,(profit/mv)*100)); // after-tax profit as % of mv
  const d=Math.max(0,Math.min(100,disc));
  return Math.max(0,Math.min(100,Math.round(marginPct*0.6+d*0.4)));
}
// Color ramp for a heat score: hot→acc, mid→warn, low→t3.
function heatColor(h){return h>=66?C.acc:h>=33?C.warn:C.t3;}
// Small colored heat badge for a snipe row — higher heat = hotter color.
function HeatBadge({h}){const c=heatColor(h);return<span title={`heat ${h}/100`} style={{fontSize:7,fontWeight:800,fontFamily:"'Space Mono',monospace",color:c,background:c+"22",border:`1px solid ${c}55`,borderRadius:3,padding:"0 3px",lineHeight:1.4,flexShrink:0}}>{h}</span>;}

const AH_TAX=0.10;

function SnipePanel({players,search,listed,setListed,mvOv,setMvOv,profitMin,setProfitMin,discountMin,setDiscountMin,matchMode,setMatchMode,platform="ps5"}){
  const mono="'Space Mono',monospace";
  const inp={background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.t1,fontSize:10,fontFamily:mono,outline:"none",padding:"4px 6px",width:"100%"};
  const setL=(k,v)=>setListed(p=>({...p,[k]:v}));
  const setM=(k,v)=>setMvOv(p=>({...p,[k]:v}));

  // --- LIVE FEED (read-only, display only) ---
  const[feedOpen,setFeedOpen]=useState(false),[feedOn,setFeedOn]=useState(false);
  const[feedUrl,setFeedUrl]=useLS("mut.feed.url",""),[feedTok,setFeedTok]=useLS("mut.feed.tok",""),[feedBody,setFeedBody]=useLS("mut.feed.body","");
  const[feedSecs,setFeedSecs]=useLS("mut.feed.secs",5);
  const[arrPath,setArrPath]=useLS("mut.feed.arrPath",""),[nameKey,setNameKey]=useLS("mut.feed.nameKey",""),[priceKey,setPriceKey]=useLS("mut.feed.priceKey","");
  const[listings,setListings]=useState([]),[feedStat,setFeedStat]=useState(null);
  const[soundOn,setSoundOn]=useLS("mut.feed.sound",true);
  const[notifyOn,setNotifyOn]=useLS("mut.feed.notify",false);
  const[feedAck,setFeedAck]=useLS("mut.feed.ack",false);
  const[guideOpen,setGuideOpen]=useState(false);
  const[notifyPerm,setNotifyPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"unsupported");
  const[scanRes,setScanRes]=useState(null),[scanning,setScanning]=useState(false);
  const[feedRotate,setFeedRotate]=useLS("mut.feed.rotate","");
  const prevSnipes=useRef(new Set());
  const backoffRef=useRef(1),seenRef=useRef(new Set()),weightsRef=useRef([]),creditsRef=useRef([]),startRef=useRef(0);

  // On-demand server-side scan: one read-only fetch + server margin math.
  async function doScan(){
    if(scanning||!feedUrl)return;setScanning(true);setScanRes(null);
    const marketValues={};players.forEach(p=>{const k=`${p.name}__${p.card}__${p.pos}__${p.sub}`;const v=parseCoins(mvOv[k])||p.price||0;if(v>0)marketValues[p.name]=v;});
    try{
      const r=await fetch("/api/snipe-scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        feed:{endpoint:feedUrl,method:feedBody.trim()?"POST":"GET",token:feedTok,body:feedBody.trim()||undefined,arrPath,nameKey,priceKey},
        platform,marketValues,profitMin,discountMin,matchMode})});
      const j=await r.json();setScanRes(j);if(j.ok&&j.summary?.snipes&&soundOn)beep();
    }catch(e){setScanRes({ok:false,error:e.message});}
    setScanning(false);
  }

  // Request desktop-notification permission (user-gesture from the 🛎 button)
  const askNotify=()=>{
    if(typeof Notification==="undefined"){setNotifyPerm("unsupported");return;}
    Notification.requestPermission().then(p=>setNotifyPerm(p)).catch(()=>{});
  };

  // Adaptive poll loop: self-schedules at the floor interval, backs off
  // exponentially on rate-limits/errors (so we never hammer EA into a ban) and
  // recovers on clean polls. Weighted round-robin spends more polls on the
  // higher-velocity (hotter) searches. Auto-pauses after 30 min — a solo safety
  // cap so a personal account never polls indefinitely unattended.
  useEffect(()=>{
    if(!feedOn||!feedUrl)return;
    const CAP_MS=30*60*1000;
    let alive=true,timer=null,capped=false;
    const floor=Math.max(2,feedSecs);
    const stamp=()=>new Date().toLocaleTimeString("en",{hour12:false});
    const bodies=()=>{const extra=(feedRotate||"").split("\n").map(s=>s.trim()).filter(Boolean);return [feedBody.trim(),...extra];};
    const n=bodies().length;
    backoffRef.current=1;startRef.current=Date.now();
    weightsRef.current=Array(n).fill(1);creditsRef.current=Array(n).fill(0);
    // Weighted round-robin: accumulate weight as credit, serve the highest, deduct.
    const pickIdx=()=>{
      const w=weightsRef.current,c=creditsRef.current;if(w.length<=1)return 0;
      let total=0,best=0;for(let i=0;i<w.length;i++){c[i]+=w[i];total+=w[i];}
      for(let i=1;i<c.length;i++)if(c[i]>c[best])best=i;
      c[best]-=total;return best;
    };
    const poll=async()=>{
      if(Date.now()-startRef.current>=CAP_MS){capped=true;setFeedOn(false);setFeedStat({ok:false,err:"auto-paused after 30 min — click Start to resume",ts:stamp()});return;}
      const bs=bodies();const idx=Math.min(pickIdx(),bs.length-1);const body=bs[idx]||"";
      try{
        const r=await fetch("/api/ah-feed",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({endpoint:feedUrl,method:body?"POST":"GET",token:feedTok,body:body||undefined})});
        const j=await r.json();
        if(!alive)return;
        if(!j.ok){
          const throttled=j.status===429;
          backoffRef.current=Math.min(throttled?16:8,backoffRef.current*(throttled?2:1.5));
          setFeedStat({ok:false,err:throttled?"rate-limited — backing off":(j.error||`HTTP ${j.status}`),ts:stamp(),wait:Math.round(floor*backoffRef.current)});
          return;
        }
        backoffRef.current=1;
        const arr=readPath(j.data,arrPath);
        const prev=seenRef.current;
        const list=Array.isArray(arr)?arr.map(it=>{const name=String(readPath(it,nameKey)??"?");const buyNow=Number(readPath(it,priceKey))||0;const sig=`${name}@${buyNow}`;return{name,buyNow,sig,isNew:!prev.has(sig)};}):[];
        seenRef.current=new Set(list.map(x=>x.sig));
        const newCount=list.filter(x=>x.isNew).length;
        // Hotter searches (more fresh listings) earn more weight → polled more often.
        if(weightsRef.current[idx]!=null)weightsRef.current[idx]=Math.max(0.25,0.6*weightsRef.current[idx]+0.4*(1+newCount));
        setListings(list);
        setFeedStat({ok:true,count:list.length,newCount,ts:stamp(),wait:floor,slice:n>1?`${idx+1}/${n}`:null});
      }catch(e){if(alive){backoffRef.current=Math.min(8,backoffRef.current*1.5);setFeedStat({ok:false,err:e.message,ts:stamp(),wait:Math.round(floor*backoffRef.current)});}}
      finally{if(alive&&!capped)timer=setTimeout(poll,Math.min(60,floor*backoffRef.current)*1000);}
    };
    poll();
    return()=>{alive=false;if(timer)clearTimeout(timer);};
  },[feedOn,feedUrl,feedTok,feedBody,feedSecs,arrPath,nameKey,priceKey,feedRotate]);

  // Precompute normalized roster names once per roster change for matching.
  const normRoster=useMemo(()=>players.map(p=>({p,nn:normName(p.name)})),[players]);
  const feedRows=useMemo(()=>{
    return listings.map(l=>{
      const nn=normName(l.name);
      // 1) exact normalized equality, then 2) normalized substring/startsWith fallback
      const mp=(nn&&(
        normRoster.find(x=>x.nn===nn)||
        normRoster.find(x=>x.nn&&x.nn.length>=5&&nn.length>=5&&(nn.startsWith(x.nn)||x.nn.startsWith(nn)||nn.includes(x.nn)))
      ))?.p||null;
      const key=mp?`${mp.name}__${mp.card}__${mp.pos}__${mp.sub}`:null;
      const mv=mp?(parseCoins(mvOv[key])||mp.price||0):0;
      const has=mv>0&&l.buyNow>0;
      const profit=has?Math.round(mv*(1-AH_TAX)-l.buyNow):null;
      const disc=has?Math.round((mv-l.buyNow)/mv*100):null;
      const profitOk=profit!=null&&profit>=profitMin,discOk=disc!=null&&disc>=discountMin;
      const isSnipe=has&&(matchMode==="all"?(profitOk&&discOk):(profitOk||discOk));
      const heat=isSnipe?heatScore(profit,disc,mv):0;
      return{l,mp,mv,profit,disc,isSnipe,heat};
    }).sort((a,b)=>{if(a.isSnipe!==b.isSnipe)return a.isSnipe?-1:1;return (b.profit??-1e12)-(a.profit??-1e12);});
  },[listings,normRoster,mvOv,profitMin,discountMin,matchMode]);
  const feedSnipes=feedRows.filter(r=>r.isSnipe).length;

  // Beep / desktop-notify once per snipe signature that wasn't in the previous poll
  useEffect(()=>{
    const snipes=feedRows.filter(r=>r.isSnipe);
    const cur=new Set(snipes.map(r=>`${r.l.name}@${r.l.buyNow}`));
    if(feedOn){
      const freshRows=snipes.filter(r=>!prevSnipes.current.has(`${r.l.name}@${r.l.buyNow}`));
      if(freshRows.length){
        if(soundOn)beep();
        if(notifyOn&&notifyPerm==="granted"&&typeof Notification!=="undefined"){
          // one notification per fresh snipe signature (throttled by the signature set)
          freshRows.forEach(r=>{try{new Notification("🎯 Panda Actual Sniper snipe",{
            body:`${r.l.name} @ ${fPrice(r.l.buyNow)||r.l.buyNow} · ${fSigned(r.profit)} (${r.disc}%) · heat ${r.heat}`,
            tag:`${r.l.name}@${r.l.buyNow}`,
          });}catch{}});
        }
      }
    }
    prevSnipes.current=cur;
  },[feedRows,feedOn,soundOn,notifyOn,notifyPerm]);

  const fld=(label,val,setter,ph,type)=>(<label style={{display:"block",minWidth:0}}>
    <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,marginBottom:2}}>{label}</div>
    <input type={type==="num"?"text":(type||"text")} value={val} onChange={e=>setter(type==="num"?(parseInt(e.target.value)||0):e.target.value)} placeholder={ph} style={{...inp,fontSize:9,padding:"4px 6px"}}/>
  </label>);

  const rows=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return players
      .filter(p=>!q||p.name.toLowerCase().includes(q)||p.card.toLowerCase().includes(q))
      .map(p=>{
        const key=`${p.name}__${p.card}__${p.pos}__${p.sub}`;
        const mvOvNum=parseCoins(mvOv[key]);
        const mv=mvOvNum>0?mvOvNum:(p.price||0);
        const lp=parseCoins(listed[key]);
        const hasDeal=lp>0&&mv>0;
        const profit=hasDeal?Math.round(mv*(1-AH_TAX)-lp):null; // sell at mv minus 10% tax, minus buy price
        const disc=hasDeal?Math.round((mv-lp)/mv*100):null;
        const profitOk=profit!=null&&profit>=profitMin;
        const discOk=disc!=null&&disc>=discountMin;
        const isSnipe=hasDeal&&(matchMode==="all"?(profitOk&&discOk):(profitOk||discOk));
        const heat=isSnipe?heatScore(profit,disc,mv):0;
        return{p,key,mv,lp,hasDeal,profit,disc,profitOk,discOk,isSnipe,heat};
      })
      .sort((a,b)=>{
        if(a.isSnipe!==b.isSnipe)return a.isSnipe?-1:1;
        if(a.hasDeal!==b.hasDeal)return a.hasDeal?-1:1;
        return (b.profit??-1e12)-(a.profit??-1e12);
      });
  },[players,search,listed,mvOv,profitMin,discountMin,matchMode]);

  const snipes=rows.filter(r=>r.isSnipe);
  const totalProfit=snipes.reduce((s,r)=>s+(r.profit||0),0);
  const noPrices=players.every(p=>!p.price);

  return(<div style={{animation:"fadeIn .4s ease"}}>
    {/* config bar */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-end",padding:"9px 10px",borderRadius:7,background:`linear-gradient(135deg,${C.bg2},${C.bg4})`,border:`1px solid ${C.border}`,marginBottom:7}}>
      <div style={{minWidth:90}}>
        <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,marginBottom:2}}>PROFIT ≥ (AFTER TAX)</div>
        <input value={profitMin===0?"":profitMin} onChange={e=>setProfitMin(parseCoins(e.target.value))} placeholder="5k" style={inp}/>
      </div>
      <div style={{minWidth:70}}>
        <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,marginBottom:2}}>DISCOUNT ≥ %</div>
        <input value={discountMin===0?"":discountMin} onChange={e=>setDiscountMin(Math.max(0,Math.min(99,parseInt(e.target.value)||0)))} placeholder="15" style={inp}/>
      </div>
      <div>
        <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,marginBottom:2}}>MATCH</div>
        <button onClick={()=>setMatchMode(m=>m==="all"?"any":"all")} title={matchMode==="all"?"Both thresholds must pass":"Either threshold passes"} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${C.borderHi}`,background:C.bg3,color:C.acc,fontSize:9,fontWeight:700,fontFamily:mono,cursor:"pointer",letterSpacing:1}}>{matchMode==="all"?"ALL":"ANY"}</button>
      </div>
      <div style={{flex:1}}/>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1}}>ACTIVE SNIPES</div>
        <div style={{fontSize:18,fontWeight:900,color:snipes.length?C.acc:C.t4,fontFamily:mono,lineHeight:1}}>{snipes.length}</div>
        {totalProfit>0&&<div style={{fontSize:8,color:C.coin,fontFamily:mono}}>+{fPrice(totalProfit)} potential</div>}
      </div>
    </div>

    {/* LIVE FEED — read-only EA Companion auction spotter */}
    <div style={{marginBottom:7,borderRadius:7,background:C.bg2,border:`1px solid ${feedOn?C.acc+"55":C.border}`,overflow:"hidden"}}>
      <button onClick={()=>setFeedOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"7px 9px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:feedOn?(feedStat?.ok?C.acc:C.err):C.t4,animation:feedOn?"pulse 1.5s infinite":"none"}}/>
        <span style={{fontSize:8,fontWeight:700,color:C.t2,fontFamily:mono,letterSpacing:1}}>LIVE FEED</span>
        <span style={{fontSize:6,color:C.warn,fontFamily:mono,background:C.warnDim,padding:"1px 4px",borderRadius:2}}>READ-ONLY · ToS RISK</span>
        {feedStat&&<span style={{fontSize:6,color:feedStat.ok?C.t3:C.err,fontFamily:mono,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{feedStat.ok?`${feedStat.count} listings · ${feedStat.newCount||0} new · ${feedSnipes} snipes · ${feedStat.slice?"#"+feedStat.slice+" · ":""}${feedStat.wait}s · ${feedStat.ts}`:`${feedStat.err}${feedStat.wait?" · retry "+feedStat.wait+"s":""} · ${feedStat.ts}`}</span>}
        <div style={{flex:1}}/>
        <span style={{fontSize:7,color:C.t4,transform:feedOpen?"rotate(180deg)":"",display:"inline-block",transition:"transform .2s"}}>▼</span>
      </button>
      {feedOpen&&<div style={{padding:"0 9px 9px",animation:"fadeIn .2s"}}>
        <div style={{fontSize:7,color:C.t3,fontFamily:mono,lineHeight:1.5,marginBottom:7,padding:"5px 7px",background:C.bg3,borderRadius:4,border:`1px solid ${C.border}`}}>
          Capture an auction <b style={{color:C.t2}}>search</b> request from the Madden Companion App (mitmproxy/Charles), then paste the endpoint, your session token, and the JSON paths to map the response. Buy/bid/sell is blocked at the proxy — this only reads &amp; displays.
        </div>

        {/* token-capture wizard */}
        <div style={{marginBottom:7,borderRadius:4,border:`1px solid ${C.border}`,overflow:"hidden"}}>
          <button onClick={()=>setGuideOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:C.bg3,border:"none",cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:8,fontWeight:700,color:C.blue,fontFamily:mono,letterSpacing:1}}>📥 HOW TO CAPTURE YOUR FEED</span>
            <div style={{flex:1}}/>
            <span style={{fontSize:7,color:C.t4,transform:guideOpen?"rotate(180deg)":"",display:"inline-block",transition:"transform .2s"}}>▼</span>
          </button>
          {guideOpen&&<ol style={{margin:0,padding:"7px 8px 8px 22px",fontSize:7.5,color:C.t2,fontFamily:mono,lineHeight:1.7,animation:"fadeIn .2s"}}>
            <li>Install the <b style={{color:C.t1}}>Madden NFL Companion</b> app on your phone and sign in to your EA account.</li>
            <li>On your computer install an HTTPS-intercepting proxy — <b style={{color:C.t1}}>mitmproxy</b> (free) or <b style={{color:C.t1}}>Charles</b> / Fiddler.</li>
            <li>Set the phone's Wi-Fi proxy to your computer, then open the proxy's CA cert URL on the phone and trust it so HTTPS can be decrypted.</li>
            <li>In Companion, open the Auction House and run a normal <b style={{color:C.t1}}>search</b>. Watch the proxy for the request that returns the listings JSON.</li>
            <li>Copy the request's <b style={{color:C.t1}}>endpoint URL</b> (the search one) into <span style={{color:C.acc}}>ENDPOINT URL</span> below.</li>
            <li>Copy the <b style={{color:C.t1}}>auth header value</b> (Authorization / X-BLAZE-SESSION / X-Pin) into <span style={{color:C.acc}}>AUTH HEADER VALUE</span>.</li>
            <li>Inspect the JSON: set <span style={{color:C.acc}}>LISTINGS ARRAY PATH</span> to the array (e.g. <code style={{color:C.t1}}>data.auctionInfo</code>), and <span style={{color:C.acc}}>NAME KEY</span> / <span style={{color:C.acc}}>BUY-NOW KEY</span> to the per-item dotted paths (e.g. <code style={{color:C.t1}}>itemData.fullName</code>, <code style={{color:C.t1}}>buyNowPrice</code>).</li>
            <li>If the request was a POST, paste its JSON into <span style={{color:C.acc}}>REQUEST BODY JSON</span>; otherwise leave it blank for a GET.</li>
          </ol>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
          {fld("ENDPOINT URL (search)",feedUrl,setFeedUrl,"https://...search")}
          {fld("AUTH HEADER VALUE",feedTok,setFeedTok,"Bearer ... / X-Pin token","password")}
          {fld("LISTINGS ARRAY PATH",arrPath,setArrPath,"data.auctionInfo")}
          {fld("POLL EVERY (sec)",feedSecs,setFeedSecs,"5","num")}
          {fld("NAME KEY",nameKey,setNameKey,"itemData.fullName")}
          {fld("BUY-NOW KEY",priceKey,setPriceKey,"buyNowPrice")}
        </div>
        <label style={{display:"block",marginBottom:6}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,marginBottom:2}}>REQUEST BODY JSON (optional — leave blank for GET)</div>
          <textarea value={feedBody} onChange={e=>setFeedBody(e.target.value)} placeholder='{"sort":"...","filter":...}' rows={2} style={{...inp,fontSize:9,padding:"4px 6px",resize:"vertical"}}/>
        </label>
        <label style={{display:"block",marginBottom:6}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,marginBottom:2}}>ROTATE SEARCHES — extra bodies, one JSON per line (widens coverage, same token)</div>
          <textarea value={feedRotate} onChange={e=>setFeedRotate(e.target.value)} placeholder='{"filter":"...QB..."}&#10;{"filter":"...WR..."}' rows={2} style={{...inp,fontSize:9,padding:"4px 6px",resize:"vertical"}}/>
        </label>
        <div style={{fontSize:6,color:C.t4,fontFamily:mono,marginBottom:6,lineHeight:1.5}}>Hotter searches (more fresh listings) are polled more often. Feed auto-pauses after 30 min — click Start to resume.</div>
        {/* ToS acknowledgement gate — required before the feed can start */}
        <label style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:7,padding:"7px 8px",borderRadius:5,background:C.errDim,border:`1px solid ${C.err}66`,cursor:"pointer"}}>
          <input type="checkbox" checked={feedAck} onChange={e=>setFeedAck(e.target.checked)} style={{marginTop:1,accentColor:C.err,cursor:"pointer",flexShrink:0}}/>
          <span style={{fontSize:7.5,color:C.warn,fontFamily:mono,lineHeight:1.6}}>
            <b style={{color:C.err}}>⚠ I understand</b> this live feed uses <b style={{color:C.t1}}>my own captured EA session token</b>, that intercepting Companion traffic <b style={{color:C.t1}}>violates EA's User Agreement</b>, and that it <b style={{color:C.err}}>risks a permanent account ban</b> even though this tool is read-only. I accept that risk on an account I'm willing to lose.
          </span>
        </label>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setFeedOn(v=>!v)} disabled={!feedOn&&!(feedUrl&&feedAck)} title={!feedUrl?"Enter a feed endpoint URL first":!feedAck?"Tick the acknowledgement to enable the feed":""} style={{flex:1,padding:"6px",borderRadius:5,border:`1px solid ${feedOn?C.err+"66":C.acc+"66"}`,background:feedOn?C.errDim:C.accDim,color:feedOn?C.err:C.acc,fontSize:9,fontWeight:800,fontFamily:mono,letterSpacing:1,cursor:(feedOn||(feedUrl&&feedAck))?"pointer":"not-allowed",opacity:(feedOn||(feedUrl&&feedAck))?1:.5}}>{feedOn?"■ STOP POLLING":"▶ START LIVE FEED"}</button>
          <button onClick={()=>setSoundOn(v=>!v)} title="Beep on new snipe" style={{padding:"6px 10px",borderRadius:5,border:`1px solid ${soundOn?C.acc+"66":C.border}`,background:soundOn?C.accDim:C.bg3,color:soundOn?C.acc:C.t4,fontSize:11,cursor:"pointer"}}>{soundOn?"🔔":"🔕"}</button>
          <button onClick={doScan} disabled={scanning||!(feedUrl&&feedAck)} title={!feedUrl?"Enter an endpoint first":!feedAck?"Tick the acknowledgement first":"One read-only server scan (token not stored)"} style={{padding:"6px 10px",borderRadius:5,border:`1px solid ${C.elite}66`,background:C.eliteDim,color:(feedUrl&&feedAck)?C.elite:C.t4,fontSize:9,fontWeight:800,fontFamily:mono,letterSpacing:.5,cursor:(scanning||!(feedUrl&&feedAck))?"default":"pointer",opacity:(feedUrl&&feedAck)?1:.5}}>{scanning?"…":"⚡ SCAN"}</button>
          <button onClick={()=>{if(notifyPerm!=="granted"){askNotify();}else{setNotifyOn(v=>!v);}}} title={notifyPerm==="unsupported"?"Desktop notifications unsupported":notifyPerm!=="granted"?"Click to allow desktop notifications":(notifyOn?"Desktop alerts on":"Desktop alerts off")} disabled={notifyPerm==="unsupported"} style={{padding:"6px 10px",borderRadius:5,border:`1px solid ${notifyOn&&notifyPerm==="granted"?C.acc+"66":C.border}`,background:notifyOn&&notifyPerm==="granted"?C.accDim:C.bg3,color:notifyPerm==="unsupported"?C.t4:notifyOn&&notifyPerm==="granted"?C.acc:notifyPerm==="denied"?C.err:C.t4,fontSize:11,cursor:notifyPerm==="unsupported"?"not-allowed":"pointer",opacity:notifyPerm==="unsupported"?.5:1}}>{notifyPerm==="granted"&&notifyOn?"🛎":"🔔"}</button>
        </div>
        {notifyPerm==="granted"&&!notifyOn&&<div style={{fontSize:6.5,color:C.t4,fontFamily:mono,marginTop:4}}>Desktop alerts allowed — click 🔔 to enable per-snipe notifications.</div>}
        {notifyPerm==="denied"&&<div style={{fontSize:6.5,color:C.err,fontFamily:mono,marginTop:4}}>Desktop notifications blocked in your browser settings.</div>}
      </div>}
    </div>

    {/* server scan results (on-demand, read-only) */}
    {scanRes&&<div style={{marginBottom:7,padding:"7px 9px",borderRadius:7,background:C.bg2,border:`1px solid ${scanRes.ok?C.elite+"44":C.err+"44"}`}}>
      {!scanRes.ok&&<div style={{fontSize:8,color:C.err,fontFamily:mono}}>scan error: {scanRes.error||"failed"}</div>}
      {scanRes.ok&&<>
        <div style={{fontSize:7,color:C.t3,fontFamily:mono,letterSpacing:1,marginBottom:5}}>⚡ SERVER SCAN · {scanRes.summary.scanned} scanned · {scanRes.summary.valued} valued · {scanRes.summary.snipes} snipe{scanRes.summary.snipes===1?"":"s"}</div>
        {scanRes.snipes.length===0&&<div style={{fontSize:8,color:C.t4,fontFamily:mono}}>No snipes at your thresholds.</div>}
        {scanRes.snipes.slice(0,12).map((s,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"minmax(110px,1fr) 70px 64px 44px",gap:5,alignItems:"center",padding:"4px 6px",borderRadius:5,marginBottom:3,background:C.accDim,border:`1px solid ${C.acc}44`}}>
          <div style={{display:"flex",alignItems:"center",gap:4,minWidth:0}}><HeatBadge h={s.heat}/><span style={{fontSize:10,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span></div>
          <div style={{textAlign:"right",fontSize:10,fontWeight:700,color:C.warn,fontFamily:mono}}>{fPrice(s.buyNow)||s.buyNow}</div>
          <div style={{textAlign:"right",fontSize:10,fontWeight:800,color:C.acc,fontFamily:mono}}>{fSigned(s.profit)}</div>
          <div style={{textAlign:"right",fontSize:9,fontWeight:700,color:C.acc,fontFamily:mono}}>{s.disc!=null?s.disc+"%":"—"}</div>
        </div>))}
      </>}
    </div>}

    {/* live listings */}
    {feedOn&&<div style={{marginBottom:7}}>
      {feedRows.length===0&&<div style={{padding:"10px",textAlign:"center",fontSize:8,color:C.t4,fontFamily:mono}}>{feedStat?.ok?"Feed connected — no listings parsed. Check your array/field paths.":"Waiting for feed..."}</div>}
      {feedRows.length>0&&<div style={{overflowX:"auto"}}><div style={{minWidth:330,maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:3,padding:"2px"}}>
        {feedRows.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"minmax(110px,1fr) 74px 64px 48px",gap:5,alignItems:"center",padding:"4px 7px",borderRadius:5,background:r.isSnipe?C.accDim:C.bg3,border:`1px solid ${r.isSnipe?C.acc+"55":C.border}`}}>
          <div style={{minWidth:0,display:"flex",alignItems:"center",gap:4}}>
            {r.isSnipe&&<span style={{fontSize:8}}>🎯</span>}
            {r.isSnipe&&<HeatBadge h={r.heat}/>}
            {r.l.isNew&&<span title="New since last poll" style={{fontSize:6,fontWeight:800,color:C.blue,fontFamily:mono,background:C.blueDim,border:`1px solid ${C.blue}55`,borderRadius:2,padding:"0 2px",flexShrink:0}}>NEW</span>}
            <span style={{fontSize:10,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.l.name}</span>
            {!r.mp&&<span style={{fontSize:6,color:C.t4,fontFamily:mono}}>no mv</span>}
          </div>
          <div style={{textAlign:"right",fontSize:10,fontWeight:700,color:C.warn,fontFamily:mono}}>{fPrice(r.l.buyNow)||r.l.buyNow}</div>
          <div style={{textAlign:"right",fontSize:10,fontWeight:800,color:r.profit!=null?(r.isSnipe?C.acc:r.profit>0?C.blue:C.err):C.t4,fontFamily:mono}}>{fSigned(r.profit)}</div>
          <div style={{textAlign:"right",fontSize:9,fontWeight:700,color:r.disc!=null?(r.disc>=discountMin?C.acc:C.t3):C.t4,fontFamily:mono}}>{r.disc!=null?r.disc+"%":"—"}</div>
        </div>))}
      </div></div>}
    </div>}

    {noPrices&&<div style={{padding:"6px 9px",marginBottom:6,borderRadius:5,background:C.warnDim,border:`1px solid ${C.warn}33`,fontSize:8,color:C.warn,fontFamily:mono}}>
      ⚠ No market values yet. Hit PRICES to pull live values from mut.gg, or type a market value per card below.
    </div>}

    <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,padding:"2px 8px 4px"}}>MANUAL ENTRY</div>

    {/* horizontal-scroll wrapper keeps the fixed grid columns from spilling on phones */}
    <div style={{overflowX:"auto"}}><div style={{minWidth:340}}>
    {/* column header */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(120px,1fr) 78px 78px 64px 52px",gap:5,padding:"0 8px 4px",fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1}}>
      <span>PLAYER</span><span>MARKET</span><span>LISTED @</span><span style={{textAlign:"right"}}>PROFIT</span><span style={{textAlign:"right"}}>DISC</span>
    </div>

    {rows.length===0&&<div style={{padding:20,textAlign:"center",color:C.t4,fontFamily:mono,fontSize:10}}>{search?`No results for "${search}"`:"No players"}</div>}

    {rows.map(r=>{
      const pc=r.isSnipe?C.acc:r.profit!=null?(r.profit>0?C.blue:C.err):C.t4;
      return(<div key={r.key} style={{display:"grid",gridTemplateColumns:"minmax(120px,1fr) 78px 78px 64px 52px",gap:5,alignItems:"center",padding:"6px 8px",marginBottom:4,borderRadius:6,background:r.isSnipe?C.accDim:C.bg2,border:`1px solid ${r.isSnipe?C.acc+"55":C.border}`,boxShadow:r.isSnipe?`0 0 12px ${C.acc}14`:"none",transition:"all .2s"}}>
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {r.isSnipe&&<span style={{fontSize:8,color:C.acc}}>🎯</span>}
            {r.isSnipe&&<HeatBadge h={r.heat}/>}
            <span style={{fontSize:11,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.p.name}</span>
          </div>
          <div style={{fontSize:7,color:C.t3,fontFamily:mono}}>{r.p.pos}{r.p.sub&&r.p.sub!==r.p.pos?` · ${r.p.sub}`:""} · {r.p.card} · {r.p.ovr}</div>
        </div>
        <input value={mvOv[r.key]??""} onChange={e=>setM(r.key,e.target.value)} placeholder={fPrice(r.p.price)||"set mv"} style={{...inp,fontSize:9,padding:"3px 5px"}}/>
        <input value={listed[r.key]??""} onChange={e=>setL(r.key,e.target.value)} placeholder="—" style={{...inp,fontSize:9,padding:"3px 5px",borderColor:r.isSnipe?C.acc+"66":C.border}}/>
        <div style={{textAlign:"right",fontSize:11,fontWeight:800,color:pc,fontFamily:mono}}>{fSigned(r.profit)}</div>
        <div style={{textAlign:"right",fontSize:10,fontWeight:700,color:r.disc!=null?(r.discOk?C.acc:r.disc>0?C.t2:C.err):C.t4,fontFamily:mono}}>{r.disc!=null?r.disc+"%":"—"}</div>
      </div>);
    })}
    </div></div>
  </div>);
}

function fmtPct(n){if(n==null)return null;return (n>0?"+":"")+n.toFixed(1)+"%";}

// Client-side price history. mut.gg exposes no public price series, so we record
// our own real snapshots (capped ring buffer) each time a price is seen.
function histKey(pk,plat){return `mut.hist.${pk}.${plat}`;}
function getHistory(pk,plat){try{return JSON.parse(localStorage.getItem(histKey(pk,plat)))||[];}catch{return[];}}
function pushHistory(pk,plat,price){
  if(!pk||!price||price<=0)return;
  const key=histKey(pk,plat);let arr=[];try{arr=JSON.parse(localStorage.getItem(key))||[];}catch{}
  const now=Date.now(),last=arr[arr.length-1];
  if(!last||last.p!==price||now-last.t>3600000)arr.push({t:now,p:price});
  if(arr.length>40)arr=arr.slice(-40);
  try{localStorage.setItem(key,JSON.stringify(arr));}catch{}
}

// Tiny SVG sparkline of whatever real points we've collected so far.
function Spark({data,w=52,h=16}){
  if(!data||data.length<2)return <div style={{width:w,height:h,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:C.t4,fontFamily:"'Space Mono',monospace"}}>·</div>;
  const ps=data.map(d=>d.p),min=Math.min(...ps),max=Math.max(...ps),rng=max-min||1;
  const pts=data.map((d,i)=>{const x=(i/(data.length-1))*(w-2)+1;const y=h-1-((d.p-min)/rng)*(h-2);return `${x.toFixed(1)},${y.toFixed(1)}`;}).join(" ");
  const up=ps[ps.length-1]>=ps[0];
  return <svg width={w} height={h} style={{display:"block"}}><polyline points={pts} fill="none" stroke={up?C.acc:C.err} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}

// mut.gg position abbreviations (LEDG/REDG for edges; MIKE/WILL/SAM for LBs)
const CAT_POS=["","QB","HB","FB","WR","TE","LT","LG","C","RG","RT","LEDG","REDG","DT","MIKE","WILL","SAM","CB","FS","SS","K","P"];
const CAT_SORTS=[["ovr_desc","OVR ↓"],["ovr_asc","OVR ↑"],["price_desc","PRICE ↓"],["price_asc","PRICE ↑"],["change_desc","CHANGE ↓"],["change_asc","CHANGE ↑"]];

// Market Catalog. Two modes: BROWSE paginates the full card DB (metadata from
// mut.gg's /players/ pages); SEARCH (Pro) hits the priced name index.
function CatalogPanel({platform,search,onAdd,addedKeys,isPro,onUpgrade}){
  const mono="'Space Mono',monospace";
  const sel={height:26,padding:"0 6px",borderRadius:5,border:`1px solid ${C.border}`,background:C.bg2,color:C.t2,fontSize:9,fontFamily:mono,fontWeight:700,cursor:"pointer",outline:"none"};
  const[rows,setRows]=useState([]),[loading,setLoading]=useState(false);
  const[sort,setSort]=useLS("mut.cat.sort","ovr_desc"),[position,setPosition]=useLS("mut.cat.pos","");
  const[ovrMin,setOvrMin]=useLS("mut.cat.ovrmin",0),[auctionOnly,setAuctionOnly]=useLS("mut.cat.auction",false);
  const[page,setPage]=useState(1),[hasMore,setHasMore]=useState(false),[mode,setMode]=useState("browse"),[err,setErr]=useState(null);

  // Search is a Pro feature; free users browse the paginated metadata catalog.
  // Paywall dropped — name search is free for everyone (single-user build).
  const searching=!!search.trim();
  const effQ=search.trim();
  const locked=false;

  // Reset to page 1 whenever the query shape changes.
  useEffect(()=>{setPage(1);},[platform,effQ,sort,position,ovrMin,auctionOnly]);

  useEffect(()=>{
    let alive=true;setLoading(true);setErr(null);
    const params=new URLSearchParams({platform,sort,page:String(page)});
    if(effQ)params.set("q",effQ);
    if(position)params.set("position",position);
    if(ovrMin)params.set("overallMin",String(ovrMin));
    if(auctionOnly)params.set("auctionOnly","1");
    fetch(`/api/catalog?${params.toString()}`).then(r=>r.json()).then(j=>{
      if(!alive)return;
      const data=j.data||[];
      data.forEach(c=>pushHistory(c.pk,platform,c.price));
      setRows(data);setHasMore(!!j.hasMore);setMode(j.mode||"browse");setErr(j.error||null);
    }).catch(e=>{if(alive)setErr(e.message);}).finally(()=>{if(alive)setLoading(false);});
    return()=>{alive=false;};
  },[platform,effQ,sort,position,ovrMin,auctionOnly,page]);

  return(<div style={{animation:"fadeIn .4s ease"}}>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",padding:"7px 9px",borderRadius:7,background:`linear-gradient(135deg,${C.bg2},${C.bg4})`,border:`1px solid ${C.border}`,marginBottom:7}}>
      <select value={position} onChange={e=>setPosition(e.target.value)} title="Position" style={sel}>
        {CAT_POS.map(p=><option key={p} value={p}>{p||"ALL POS"}</option>)}
      </select>
      <select value={sort} onChange={e=>setSort(e.target.value)} title="Sort" style={sel}>
        {CAT_SORTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
      <select value={ovrMin} onChange={e=>setOvrMin(parseInt(e.target.value)||0)} title="Minimum overall" style={sel}>
        {[0,80,85,88,90,92,94,95,96,97,98,99].map(v=><option key={v} value={v}>{v?`OVR ≥ ${v}`:"ANY OVR"}</option>)}
      </select>
      <button onClick={()=>setAuctionOnly(v=>!v)} title="Only auctionable cards" style={{...sel,color:auctionOnly?C.acc:C.t3,borderColor:auctionOnly?C.acc+"66":C.border,background:auctionOnly?C.accDim:C.bg2}}>{auctionOnly?"✓ AUCTIONABLE":"AUCTIONABLE"}</button>
      <div style={{flex:1}}/>
      <span style={{fontSize:7,color:C.t3,fontFamily:mono}}>{loading?"loading…":`${rows.length} ${mode==="browse"?`· pg ${page}`:"matches"} · ${platform.toUpperCase()}`}</span>
    </div>

    {err&&<div style={{padding:"6px 9px",marginBottom:6,borderRadius:5,background:C.errDim,border:`1px solid ${C.err}33`,fontSize:8,color:C.err,fontFamily:mono}}>catalog error: {err}</div>}

    <div style={{overflowX:"auto"}}><div style={{minWidth:360}}>
    <div style={{display:"grid",gridTemplateColumns:"26px minmax(120px,1fr) 52px 72px 48px 22px",gap:5,padding:"0 8px 4px",fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1}}>
      <span/><span>PLAYER</span><span>TREND</span><span style={{textAlign:"right"}}>PRICE</span><span style={{textAlign:"right"}}>CHG</span><span/>
    </div>

    {!loading&&rows.length===0&&!locked&&<div style={{padding:20,textAlign:"center",color:C.t4,fontFamily:mono,fontSize:10}}>{effQ?`No results for "${effQ}"`:"No cards"}</div>}

    {rows.map(c=>{
      const chg=fmtPct(c.pctChange);
      const cc=c.pctChange==null?C.t4:c.pctChange>0?C.acc:c.pctChange<0?C.err:C.t3;
      const ckey=`${c.name}__${c.program}__${c.pos}__${c.pos}`;
      const added=addedKeys&&addedKeys.has(ckey);
      return(<div key={c.pk} style={{display:"grid",gridTemplateColumns:"26px minmax(120px,1fr) 52px 72px 48px 22px",gap:5,alignItems:"center",padding:"5px 8px",marginBottom:4,borderRadius:6,background:C.bg2,border:`1px solid ${C.border}`}}>
        <div style={{width:26,height:26,borderRadius:4,overflow:"hidden",background:C.bg3,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {c.image?<img src={c.image} alt="" width={26} height={26} loading="lazy" style={{objectFit:"cover",objectPosition:"top"}}/>:<span style={{fontSize:8,color:C.t4,fontFamily:mono}}>{c.pos}</span>}
        </div>
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:9,fontWeight:800,color:C.acc,fontFamily:mono,minWidth:18}}>{c.ovr}</span>
            <span style={{fontSize:11,fontWeight:700,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
            {!c.canAuction&&<span style={{fontSize:6,color:C.warn,fontFamily:mono,background:C.warnDim,padding:"1px 3px",borderRadius:2}}>NA</span>}
          </div>
          <div style={{fontSize:7,color:C.t3,fontFamily:mono,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[c.pos,c.program,c.team,c.archetype].filter(Boolean).join(" · ")}</div>
        </div>
        <div title="Price history (builds as you refresh)"><Spark data={getHistory(c.pk,platform)}/></div>
        <div style={{textAlign:"right",fontSize:11,fontWeight:800,color:c.price>0?C.coin:C.t4,fontFamily:mono}}>{c.price>0?(fPrice(c.price)||c.price):"—"}</div>
        <div style={{textAlign:"right",fontSize:9,fontWeight:700,color:cc,fontFamily:mono}}>{chg||"—"}</div>
        <button onClick={()=>!added&&onAdd&&onAdd(c)} disabled={added} title={added?"In Snipe watchlist":"Add to Snipe watchlist"} style={{width:22,height:22,borderRadius:4,border:`1px solid ${added?C.acc+"55":C.border}`,background:added?C.accDim:C.bg3,color:added?C.acc:C.t2,fontSize:11,fontWeight:700,cursor:added?"default":"pointer",lineHeight:1,padding:0}}>{added?"✓":"+"}</button>
      </div>);
    })}
    </div></div>

    {/* Soft paywall — name search is a Pro feature; free users browse the top set. */}
    {locked&&<div style={{margin:"10px 0 2px",padding:"14px 12px",borderRadius:8,textAlign:"center",background:`linear-gradient(135deg,${C.eliteDim},${C.bg2})`,border:`1px solid ${C.elite}44`}}>
      <div style={{fontSize:11,fontWeight:800,color:C.elite,fontFamily:mono,letterSpacing:.5}}>🔒 PRO UNLOCKS CARD SEARCH</div>
      <div style={{fontSize:9,color:C.t2,fontFamily:"'Outfit',sans-serif",margin:"5px auto 9px",maxWidth:320,lineHeight:1.5}}>Free members browse the live top cards. Pro members search the full mut.gg name index for any card on any platform.</div>
      <button onClick={onUpgrade} style={{padding:"7px 18px",borderRadius:6,border:`1px solid ${C.elite}`,background:C.elite,color:C.bg,fontSize:10,fontWeight:800,fontFamily:mono,letterSpacing:1,cursor:"pointer"}}>UPGRADE TO PRO →</button>
    </div>}

    {/* Pager — real in browse mode (mut.gg /players pages); search mode is single-page. */}
    {mode==="browse"&&!locked&&<div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"center",padding:"8px 0 2px"}}>
      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1||loading} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${C.border}`,background:page<=1?C.bg2:C.bg3,color:page<=1?C.t4:C.t2,fontSize:9,fontFamily:mono,fontWeight:700,cursor:page<=1?"default":"pointer"}}>← PREV</button>
      <span style={{fontSize:8,color:C.t3,fontFamily:mono}}>PAGE {page}</span>
      <button onClick={()=>setPage(p=>p+1)} disabled={!hasMore||loading} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${C.border}`,background:!hasMore?C.bg2:C.bg3,color:!hasMore?C.t4:C.t2,fontSize:9,fontFamily:mono,fontWeight:700,cursor:!hasMore?"default":"pointer"}}>NEXT →</button>
    </div>}

    <div style={{textAlign:"center",fontSize:6.5,color:C.t4,fontFamily:mono,padding:"8px 0 2px"}}>{mode==="browse"?"Browsing the full mut.gg catalog (metadata). Search a name for live prices.":"Priced name matches from mut.gg."} Prices are mut.gg community values.</div>
  </div>);
}

// ---- Accounts & subscriptions (Phase 4) ------------------------------------
// useAuth: loads the current user from /api/auth/me on mount and exposes the
// auth actions. Auth state is server-backed (HttpOnly session cookie). NOTE: the
// live-feed EA token IS persisted in localStorage (mut.feed.tok) for convenience —
// it's a live credential at rest, exposed to XSS/shared-machine access.
function useAuth(){
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(true);

  const refresh=useCallback(async()=>{
    try{
      const r=await fetch("/api/auth/me");
      if(r.ok){const j=await r.json();setUser(j.user||null);}
      else setUser(null);
    }catch{setUser(null);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{refresh();},[refresh]);

  // login/signup share a shape: resolve {ok} or {ok:false,error}. On success the
  // server sets the cookie and returns the safe user, which we store directly.
  const auth=useCallback(async(path,email,password)=>{
    try{
      const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok)return{ok:false,error:j.error||`HTTP ${r.status}`};
      setUser(j.user||null);
      return{ok:true};
    }catch(e){return{ok:false,error:e.message};}
  },[]);

  const login=useCallback((email,password)=>auth("/api/auth/login",email,password),[auth]);
  const signup=useCallback((email,password)=>auth("/api/auth/signup",email,password),[auth]);
  const logout=useCallback(async()=>{try{await fetch("/api/auth/logout",{method:"POST"});}catch{}setUser(null);},[]);

  return{user,loading,login,signup,logout,refresh};
}

// Shared centered-overlay shell for the auth + pricing modals.
function Modal({onClose,children,width=340}){
  return(<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"#000000bb",backdropFilter:"blur(2px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto",animation:"fadeIn .2s"}}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:width,maxHeight:"calc(100vh - 32px)",overflowY:"auto",background:C.bg2,border:`1px solid ${C.borderHi}`,borderRadius:10,boxShadow:`0 12px 48px #000a, 0 0 0 1px ${C.border}`}}>
      {children}
    </div>
  </div>);
}

// Auth modal — toggles between Login and Sign up against the same fields.
function AuthModal({onClose,login,signup}){
  const mono="'Space Mono',monospace";
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState(""),[pw,setPw]=useState("");
  const[busy,setBusy]=useState(false),[err,setErr]=useState(null);
  const inp={width:"100%",padding:"8px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.t1,fontSize:11,fontFamily:mono,outline:"none",marginBottom:8};

  const submit=async(e)=>{
    e.preventDefault();
    if(busy)return;
    setErr(null);
    if(mode==="signup"&&pw.length<8){setErr("Password must be at least 8 characters.");return;}
    setBusy(true);
    const r=await (mode==="login"?login(email,pw):signup(email,pw));
    setBusy(false);
    if(r.ok)onClose();
    else setErr(r.error||"Something went wrong.");
  };

  return(<Modal onClose={onClose}>
    <div style={{padding:"16px 16px 6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{fontSize:14,fontWeight:800,letterSpacing:-.3}}>{mode==="login"?"Sign in":"Create account"}</div>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.t3,fontSize:16,cursor:"pointer",lineHeight:1,padding:2}}>✕</button>
    </div>
    <form onSubmit={submit} style={{padding:"4px 16px 16px"}}>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" style={inp}/>
      <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder={mode==="signup"?"Password (8+ chars)":"Password"} autoComplete={mode==="login"?"current-password":"new-password"} style={inp}/>
      {err&&<div style={{fontSize:9,color:C.err,fontFamily:mono,marginBottom:8,padding:"5px 7px",background:C.errDim,borderRadius:4,border:`1px solid ${C.err}33`}}>{err}</div>}
      <button type="submit" disabled={busy||!email||!pw} style={{width:"100%",padding:"9px",borderRadius:6,border:"none",background:C.acc,color:C.bg,fontSize:11,fontWeight:800,fontFamily:mono,letterSpacing:1,cursor:busy?"default":"pointer",opacity:(busy||!email||!pw)?.6:1}}>{busy?"…":(mode==="login"?"SIGN IN":"SIGN UP")}</button>
    </form>
    <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,fontSize:9,color:C.t3,fontFamily:mono,textAlign:"center"}}>
      {mode==="login"?"No account yet? ":"Already have one? "}
      <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr(null);}} style={{background:"none",border:"none",color:C.acc,fontSize:9,fontFamily:mono,fontWeight:700,cursor:"pointer",padding:0}}>{mode==="login"?"Create one":"Sign in"}</button>
    </div>
  </Modal>);
}

// Pricing modal — one paid tier ("Pro"). Marketing copy is original to this app.
function PricingModal({onClose,user,isPro,onUpgrade,onNeedAuth}){
  const mono="'Space Mono',monospace";
  const[busy,setBusy]=useState(false),[err,setErr]=useState(null);
  const perks=[
    "Search the full mut.gg name index — find any card, not just the top set",
    "Every platform's pricing in one sweep (PS5/PS4/XBSX/XB1/PC)",
    "Priority on new spotter features as they ship",
    "Support an indie tool built by one flipper, for flippers",
  ];

  const upgrade=async()=>{
    if(busy)return;
    if(!user){onNeedAuth&&onNeedAuth();return;}
    setBusy(true);setErr(null);
    const r=await onUpgrade();
    setBusy(false);
    if(r&&r.error)setErr(r.error);
  };

  return(<Modal onClose={onClose} width={380}>
    <div style={{padding:"16px 16px 6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{fontSize:14,fontWeight:800,letterSpacing:-.3}}>Panda Actual Sniper <span style={{color:C.elite}}>Pro</span></div>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.t3,fontSize:16,cursor:"pointer",lineHeight:1,padding:2}}>✕</button>
    </div>
    <div style={{padding:"4px 16px 16px"}}>
      <div style={{fontSize:10,color:C.t2,fontFamily:"'Outfit',sans-serif",lineHeight:1.5,marginBottom:12}}>
        The free tier flags snipes and shows you the top of the market. Pro takes the lid off — browse the whole board and keep every edge as the tool grows.
      </div>
      <div style={{borderRadius:8,border:`1px solid ${C.elite}44`,background:`linear-gradient(135deg,${C.eliteDim},${C.bg})`,padding:"14px 14px 16px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:10}}>
          <span style={{fontSize:24,fontWeight:900,color:C.t1,fontFamily:mono}}>Pro</span>
          <span style={{fontSize:9,color:C.t3,fontFamily:mono}}>billed via Stripe</span>
        </div>
        {perks.map((p,i)=>(<div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:7}}>
          <span style={{color:C.elite,fontSize:11,lineHeight:1.3,flexShrink:0}}>◆</span>
          <span style={{fontSize:10,color:C.t1,fontFamily:"'Outfit',sans-serif",lineHeight:1.4}}>{p}</span>
        </div>))}
      </div>
      {err&&<div style={{fontSize:9,color:C.err,fontFamily:mono,marginBottom:8,padding:"5px 7px",background:C.errDim,borderRadius:4,border:`1px solid ${C.err}33`}}>{err}</div>}
      {isPro
        ?<div style={{padding:"9px",borderRadius:6,textAlign:"center",background:C.accDim,border:`1px solid ${C.acc}55`,fontSize:10,fontWeight:800,color:C.acc,fontFamily:mono,letterSpacing:1}}>✓ YOU'RE ON PRO — full catalog unlocked</div>
        :<button onClick={upgrade} disabled={busy} style={{width:"100%",padding:"10px",borderRadius:6,border:"none",background:C.elite,color:C.bg,fontSize:11,fontWeight:800,fontFamily:mono,letterSpacing:1,cursor:busy?"default":"pointer",opacity:busy?.6:1}}>{busy?"REDIRECTING…":(user?"UPGRADE TO PRO →":"SIGN IN TO UPGRADE")}</button>}
      <div style={{fontSize:7.5,color:C.t4,fontFamily:mono,textAlign:"center",marginTop:9,lineHeight:1.5}}>Checkout is handled by Stripe. Billing is disabled until the operator configures Stripe keys.</div>
    </div>
  </Modal>);
}

// Password screen shown when the server gate is enabled and the visitor isn't authed.
function GateScreen({onUnlock}){
  const mono="'Space Mono',monospace";
  const[pw,setPw]=useState(""),[busy,setBusy]=useState(false),[err,setErr]=useState(null);
  const submit=async(e)=>{
    e.preventDefault();if(busy||!pw)return;setBusy(true);setErr(null);
    try{
      const r=await fetch("/api/gate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});
      if(r.ok)onUnlock();else{const j=await r.json().catch(()=>({}));setErr(j.error||"Incorrect password.");}
    }catch{setErr("Connection error.");}
    setBusy(false);
  };
  return(<div style={{minHeight:"100vh",background:C.bg,color:C.t1,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <form onSubmit={submit} style={{width:"100%",maxWidth:320,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,padding:24,textAlign:"center"}}>
      <div style={{width:34,height:34,borderRadius:8,margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.acc},${C.elite})`,fontSize:16,fontWeight:900}}>◈</div>
      <div style={{fontSize:15,fontWeight:800,letterSpacing:-.5}}>PANDA ACTUAL <span style={{color:C.acc}}>SNIPER</span></div>
      <div style={{fontSize:9,color:C.t3,fontFamily:mono,letterSpacing:1,margin:"4px 0 16px"}}>🔒 ACCESS PASSWORD</div>
      <input type="password" value={pw} onChange={e=>setPw(e.target.value)} autoFocus placeholder="Password" style={{width:"100%",padding:"9px 11px",background:C.bg,border:`1px solid ${err?C.err:C.border}`,borderRadius:6,color:C.t1,fontSize:13,fontFamily:mono,outline:"none",marginBottom:10}}/>
      {err&&<div style={{fontSize:9,color:C.err,fontFamily:mono,marginBottom:10}}>{err}</div>}
      <button type="submit" disabled={busy||!pw} style={{width:"100%",padding:"9px",borderRadius:6,border:`1px solid ${C.acc}`,background:busy||!pw?C.bg3:C.acc,color:busy||!pw?C.t4:C.bg,fontSize:12,fontWeight:800,fontFamily:mono,letterSpacing:1,cursor:busy||!pw?"default":"pointer"}}>{busy?"…":"UNLOCK"}</button>
    </form>
  </div>);
}

export default function App(){
  const[loaded,setLoaded]=useState(false);
  const[tab,setTab]=useLS("mut.tab","snipe");
  const[search,setSearch]=useState("");
  const[players,setPlayers]=useState(INIT);
  const[lr,setLr]=useState("Initial · Mar 2 2026 · mut.gg verified");
  const[snListed,setSnListed]=useLS("mut.snipe.listed",{}),[snMvOv,setSnMvOv]=useLS("mut.snipe.mvOv",{});
  const[profitMin,setProfitMin]=useLS("mut.snipe.profitMin",5000),[discountMin,setDiscountMin]=useLS("mut.snipe.discountMin",15),[matchMode,setMatchMode]=useLS("mut.snipe.matchMode","any");
  const[plat,setPlat]=useLS("mut.plat","ps5"),[mgRfr,setMgRfr]=useState(false);
  const[heroDismissed,setHeroDismissed]=useLS("mut.hero.dismissed",false);
  const narrow=useIsNarrow();
  // Access gate: if the server has APP_GATE_SECRET set, prompt for the password.
  const[gate,setGate]=useState({checked:false,enabled:false,authed:true});
  useEffect(()=>{let a=true;fetch("/api/gate").then(r=>r.json()).then(j=>{if(a)setGate({checked:true,enabled:!!j.enabled,authed:j.authed!==false});}).catch(()=>{if(a)setGate({checked:true,enabled:false,authed:true});});return()=>{a=false;};},[]);

  // --- Accounts & subscriptions ---
  const{user,loading:authLoading,login,signup,logout}=useAuth();
  const isPro=user?.subStatus==="active";
  const[authOpen,setAuthOpen]=useState(false),[pricingOpen,setPricingOpen]=useState(false),[acctMenu,setAcctMenu]=useState(false);

  // Kick off Stripe Checkout and redirect to the returned session URL.
  const startCheckout=useCallback(async()=>{
    try{
      const r=await fetch("/api/billing/checkout",{method:"POST",headers:{"Content-Type":"application/json"}});
      const j=await r.json().catch(()=>({}));
      if(r.ok&&j.url){window.location.href=j.url;return{ok:true};}
      return{error:j.error||`Checkout failed (HTTP ${r.status}).`};
    }catch(e){return{error:e.message};}
  },[]);

  useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap";l.rel="stylesheet";document.head.appendChild(l);setTimeout(()=>setLoaded(true),150);},[]);

  // Pull live market values from mut.gg's public price index and merge onto the roster
  const doMutgg=useCallback(async()=>{
    if(mgRfr)return;setMgRfr(true);
    try{
      const payload=players.map(p=>({key:`${p.name}__${p.card}__${p.pos}__${p.sub}`,name:p.name,ovr:p.ovr,program:p.card}));
      const r=await fetch("/api/mutgg",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({players:payload,platform:plat})});
      const j=await r.json();
      const map={};(j.prices||[]).forEach(x=>{map[x.key]=x;});
      setPlayers(ps=>ps.map(p=>{const m=map[`${p.name}__${p.card}__${p.pos}__${p.sub}`];return m&&m.price>0?{...p,price:m.price}:p;}));
      const n=(j.prices||[]).filter(x=>x.price>0).length;
      setLr(`${new Date().toLocaleTimeString()} · mut.gg ${plat.toUpperCase()} · ${n}/${payload.length} priced`);
    }catch(e){console.error("mut.gg refresh failed:",e);setLr("mut.gg refresh failed — see console");}
    setMgRfr(false);
  },[mgRfr,players,plat]);

  // Add a catalog card to the Snipe roster (dedup by name+program+pos)
  const addToSnipe=useCallback((c)=>{
    setPlayers(ps=>{
      const sub=c.pos,key=`${c.name}__${c.program}__${c.pos}__${sub}`;
      if(ps.some(p=>`${p.name}__${p.card}__${p.pos}__${p.sub}`===key))return ps;
      return[...ps,{pos:c.pos,sub,name:c.name,card:c.program||"?",ovr:c.ovr||0,arch:c.archetype||"",start:0,price:c.price||0,s:{}}];
    });
  },[]);
  const addedKeys=useMemo(()=>new Set(players.map(p=>`${p.name}__${p.card}__${p.pos}__${p.sub}`)),[players]);

  if(gate.checked&&gate.enabled&&!gate.authed)return <GateScreen onUnlock={()=>setGate(g=>({...g,authed:true}))}/>;

  return(<div style={{minHeight:"100vh",background:C.bg,color:C.t1,fontFamily:"'Outfit',sans-serif",opacity:loaded?1:0,transition:"opacity .5s"}}>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input::placeholder{color:${C.t4}}`}</style>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100,background:`repeating-linear-gradient(0deg,transparent,transparent 2px,${C.bg}05 2px,${C.bg}05 4px)`}}/>

    <div style={{padding:"11px 15px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(180deg,${C.bg2},${C.bg})`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:7,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.acc},${C.elite})`,fontSize:13,fontWeight:900}}>◈</div>
          <div><div style={{fontSize:15,fontWeight:800,letterSpacing:-.5}}>PANDA ACTUAL <span style={{color:C.acc}}>SNIPER</span></div><div style={{fontSize:7,color:C.t3,fontFamily:"'Space Mono',monospace",letterSpacing:1}}>SNIPE · CATALOG · MUT.GG PRICED</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",background:C.accDim,borderRadius:4,border:`1px solid ${C.acc}33`}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:C.acc,animation:"pulse 2s infinite"}}/><span style={{fontSize:7,color:C.acc,fontFamily:"'Space Mono',monospace",fontWeight:700}}>LIVE</span>
          </div>
          <select value={plat} onChange={e=>setPlat(e.target.value)} title="Price platform" style={{height:28,padding:"0 4px",borderRadius:5,border:`1px solid ${C.border}`,background:C.bg2,color:C.t2,fontSize:8,fontFamily:"'Space Mono',monospace",fontWeight:700,cursor:"pointer",outline:"none"}}>
            <option value="ps5">PS5</option><option value="ps4">PS4</option><option value="xbsx">XBSX</option><option value="xb1">XB1</option><option value="pc">PC</option>
          </select>
          <button onClick={doMutgg} disabled={mgRfr} title="Refresh market values from mut.gg" style={{height:28,padding:"0 9px",borderRadius:5,border:`1px solid ${mgRfr?C.coin+"66":C.border}`,background:mgRfr?C.warnDim:C.bg2,cursor:mgRfr?"default":"pointer",display:"flex",alignItems:"center",gap:4,transition:"all .2s"}}>
            <span style={{fontSize:11}}>🪙</span>
            <span style={{fontSize:8,fontWeight:600,color:mgRfr?C.coin:C.t3,fontFamily:"'Space Mono',monospace"}}>{mgRfr?"...":"PRICES"}</span>
          </button>

          {/* Account button — email + menu when signed in, "Sign in" otherwise. */}
          <div style={{position:"relative"}}>
            {authLoading
              ?<div style={{height:28,padding:"0 9px",display:"flex",alignItems:"center",fontSize:8,color:C.t4,fontFamily:"'Space Mono',monospace"}}>…</div>
              :user
                ?<button onClick={()=>setAcctMenu(o=>!o)} title={user.email} style={{height:28,padding:"0 9px",borderRadius:5,border:`1px solid ${isPro?C.elite+"66":C.border}`,background:isPro?C.eliteDim:C.bg2,cursor:"pointer",display:"flex",alignItems:"center",gap:5,maxWidth:160}}>
                    <span style={{width:16,height:16,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isPro?C.elite:C.acc,color:C.bg,fontSize:9,fontWeight:900,fontFamily:"'Space Mono',monospace"}}>{(user.email||"?")[0].toUpperCase()}</span>
                    <span style={{fontSize:8,fontWeight:600,color:C.t2,fontFamily:"'Space Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</span>
                    {isPro&&<span style={{fontSize:6,fontWeight:800,color:C.elite,fontFamily:"'Space Mono',monospace",letterSpacing:.5}}>PRO</span>}
                  </button>
                :<button onClick={()=>setAuthOpen(true)} style={{height:28,padding:"0 11px",borderRadius:5,border:`1px solid ${C.acc}55`,background:C.accDim,color:C.acc,fontSize:8,fontWeight:800,fontFamily:"'Space Mono',monospace",letterSpacing:1,cursor:"pointer"}}>SIGN IN</button>}
            {user&&acctMenu&&<>
              <div onClick={()=>setAcctMenu(false)} style={{position:"fixed",inset:0,zIndex:149}}/>
              <div style={{position:"absolute",right:0,top:32,zIndex:150,minWidth:170,background:C.bg2,border:`1px solid ${C.borderHi}`,borderRadius:7,boxShadow:"0 8px 28px #000a",overflow:"hidden",animation:"fadeIn .15s"}}>
                <div style={{padding:"8px 11px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:9,color:C.t1,fontFamily:"'Space Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
                  <div style={{fontSize:7,color:isPro?C.elite:C.t3,fontFamily:"'Space Mono',monospace",letterSpacing:.5,marginTop:2}}>{isPro?"PRO MEMBER":"FREE TIER"}</div>
                </div>
                {!isPro&&<button onClick={()=>{setAcctMenu(false);setPricingOpen(true);}} style={{width:"100%",textAlign:"left",padding:"8px 11px",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,color:C.elite,fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",cursor:"pointer"}}>◆ Upgrade to Pro</button>}
                <button onClick={()=>{setAcctMenu(false);logout();}} style={{width:"100%",textAlign:"left",padding:"8px 11px",background:"none",border:"none",color:C.t2,fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",cursor:"pointer"}}>Log out</button>
              </div>
            </>}
          </div>
        </div>
      </div>
      <div style={{marginTop:3,fontSize:7,color:C.t4,fontFamily:"'Space Mono',monospace"}}>{lr}</div>
    </div>

    <div style={{padding:"6px 15px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:130,position:"relative"}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.t4} strokeWidth="2" style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)"}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player or card..." style={{width:"100%",padding:"5px 7px 5px 24px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,color:C.t1,fontSize:10,fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
      </div>
    </div>

    {/* Landing / hero — dismissible value-prop. Original copy. */}
    {!heroDismissed&&<div style={{margin:"11px 15px 0",padding:narrow?"12px 13px":"15px 17px",borderRadius:10,position:"relative",overflow:"hidden",background:`linear-gradient(135deg,${C.bg2},${C.bg4})`,border:`1px solid ${C.borderHi}`,boxShadow:`0 0 0 1px ${C.acc}11, 0 0 30px ${C.acc}0c`}}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:`radial-gradient(120% 120% at 100% 0%,${C.acc}10,transparent 55%)`}}/>
      <button onClick={()=>setHeroDismissed(true)} title="Dismiss" style={{position:"absolute",top:8,right:9,zIndex:2,background:"none",border:"none",color:C.t3,fontSize:14,lineHeight:1,cursor:"pointer",padding:3}}>✕</button>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 8px",borderRadius:20,background:C.accDim,border:`1px solid ${C.acc}33`,marginBottom:9}}>
          <div style={{width:4,height:4,borderRadius:"50%",background:C.acc,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:7,fontWeight:700,letterSpacing:1.2,color:C.acc,fontFamily:"'Space Mono',monospace"}}>LIVE MADDEN 26 MARKET INTEL</span>
        </div>
        <div style={{fontSize:narrow?17:21,fontWeight:900,letterSpacing:-.6,lineHeight:1.15,maxWidth:560}}>Catch the underpriced cards <span style={{color:C.acc}}>before the board does</span>.</div>
        <div style={{fontSize:narrow?10:11,color:C.t2,fontFamily:"'Outfit',sans-serif",lineHeight:1.55,marginTop:7,maxWidth:520}}>Panda Actual Sniper reads the live auction-house market so you don't have to. Set your margin, let the <b style={{color:C.t1}}>Snipe</b> engine flag every flip worth taking, or sweep the priced <b style={{color:C.t1}}>Catalog</b> to see where the whole market is moving.</div>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:11}}>
          {[["🎯","Snipe","margin-aware deal radar"],["📊","Catalog","live mut.gg priced index"],["📈","Trends","real per-card price history"]].map(([ic,h,s])=>(
            <div key={h} style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
              <span style={{fontSize:15}}>{ic}</span>
              <div style={{minWidth:0}}>
                <div style={{fontSize:9.5,fontWeight:800,color:C.t1,letterSpacing:-.2}}>{h}</div>
                <div style={{fontSize:7,color:C.t3,fontFamily:"'Space Mono',monospace",whiteSpace:"nowrap"}}>{s}</div>
              </div>
            </div>))}
        </div>
      </div>
    </div>}

    <div style={{display:"flex",gap:3,padding:"8px 15px 0",overflowX:"auto"}}>
      {[{k:"snipe",l:"🎯 Snipe"},{k:"catalog",l:"📊 Catalog"}].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{flexShrink:0,padding:"5px 14px",borderRadius:"6px 6px 0 0",border:`1px solid ${tab===t.k?C.borderHi:C.border}`,borderBottom:tab===t.k?`1px solid ${C.bg}`:`1px solid ${C.border}`,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'Space Mono',monospace",background:tab===t.k?C.bg3:"transparent",color:tab===t.k?C.t1:C.t3,marginBottom:-1,position:"relative",zIndex:1}}>{t.l}</button>)}
    </div>

    <div style={{padding:"9px 15px 36px",maxHeight:"calc(100vh - 150px)",overflowY:"auto",borderTop:`1px solid ${C.border}`}}>
      {tab==="snipe"&&<SnipePanel players={players} search={search} listed={snListed} setListed={setSnListed} mvOv={snMvOv} setMvOv={setSnMvOv} profitMin={profitMin} setProfitMin={setProfitMin} discountMin={discountMin} setDiscountMin={setDiscountMin} matchMode={matchMode} setMatchMode={setMatchMode} platform={plat}/>}
      {tab==="catalog"&&<CatalogPanel platform={plat} search={search} onAdd={addToSnipe} addedKeys={addedKeys} isPro={isPro} onUpgrade={()=>setPricingOpen(true)}/>}
    </div>

    {/* Footer — independent project, original copy, trademark + ToS disclaimers. */}
    <footer style={{borderTop:`1px solid ${C.border}`,background:`linear-gradient(180deg,${C.bg},${C.bg2})`,padding:"16px 15px 22px"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
          <div style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.acc},${C.elite})`,fontSize:10,fontWeight:900}}>◈</div>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:-.4}}>PANDA ACTUAL <span style={{color:C.acc}}>SNIPER</span></div>
        </div>
        <div style={{fontSize:9,color:C.t2,fontFamily:"'Outfit',sans-serif",lineHeight:1.55,marginBottom:10,maxWidth:560}}>
          A scrappy market terminal for Ultimate Team flippers — built to surface the snipes and read the board, fast.
        </div>
        <div style={{fontSize:7.5,color:C.t3,fontFamily:"'Space Mono',monospace",lineHeight:1.75,marginBottom:8}}>
          <div>Independent fan-made project. Not affiliated with, sponsored by, or endorsed by EA Sports / Electronic Arts Inc.</div>
          <div>"Madden", "Madden NFL", and "Madden Ultimate Team" are trademarks of their respective owners. All player and team names belong to their holders.</div>
          <div>Pricing reflects third-party community data (mut.gg) and may lag the in-game market. No coins, accounts, or in-game value are bought, sold, or transferred here.</div>
          <div>The optional <button onClick={()=>{setHeroDismissed(true);setTab("snipe");}} style={{background:"none",border:"none",padding:0,color:C.warn,fontFamily:"'Space Mono',monospace",fontSize:7.5,fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>live feed</button> reads your own captured EA session and may violate EA's terms — see the in-app risk notice before enabling it. Use it on an account you accept the risk of losing.</div>
        </div>
        <div style={{fontSize:7,color:C.t4,fontFamily:"'Space Mono',monospace",letterSpacing:.5,borderTop:`1px solid ${C.border}`,paddingTop:8}}>© {new Date().getFullYear()} Panda Actual Sniper · An indie tool, built by one flipper for flippers.</div>
      </div>
    </footer>

    {authOpen&&<AuthModal onClose={()=>setAuthOpen(false)} login={login} signup={signup}/>}
    {pricingOpen&&<PricingModal onClose={()=>setPricingOpen(false)} user={user} isPro={isPro} onUpgrade={startCheckout} onNeedAuth={()=>{setPricingOpen(false);setAuthOpen(true);}}/>}
  </div>);
}
