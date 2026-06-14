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

const AH_TAX=0.10;

function SnipePanel({players,search,listed,setListed,mvOv,setMvOv,profitMin,setProfitMin,discountMin,setDiscountMin,matchMode,setMatchMode}){
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
  const prevSnipes=useRef(new Set());

  useEffect(()=>{
    if(!feedOn||!feedUrl)return;
    let alive=true;
    const stamp=()=>new Date().toLocaleTimeString("en",{hour12:false});
    const poll=async()=>{
      try{
        const r=await fetch("/api/ah-feed",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({endpoint:feedUrl,method:feedBody.trim()?"POST":"GET",token:feedTok,body:feedBody.trim()||undefined})});
        const j=await r.json();
        if(!alive)return;
        if(!j.ok){setFeedStat({ok:false,err:j.error||`HTTP ${j.status}`,ts:stamp()});return;}
        const arr=readPath(j.data,arrPath);
        const list=Array.isArray(arr)?arr.map(it=>({name:String(readPath(it,nameKey)??"?"),buyNow:Number(readPath(it,priceKey))||0})):[];
        setListings(list);
        setFeedStat({ok:true,count:list.length,ts:stamp()});
      }catch(e){if(alive)setFeedStat({ok:false,err:e.message,ts:stamp()});}
    };
    poll();
    const id=setInterval(poll,Math.max(2,feedSecs)*1000);
    return()=>{alive=false;clearInterval(id);};
  },[feedOn,feedUrl,feedTok,feedBody,feedSecs,arrPath,nameKey,priceKey]);

  const feedRows=useMemo(()=>{
    return listings.map(l=>{
      const nm=(l.name||"").toLowerCase();
      const mp=players.find(p=>p.name.toLowerCase()===nm)||players.find(p=>nm&&nm.includes(p.name.toLowerCase()));
      const key=mp?`${mp.name}__${mp.card}__${mp.pos}__${mp.sub}`:null;
      const mv=mp?(parseCoins(mvOv[key])||mp.price||0):0;
      const has=mv>0&&l.buyNow>0;
      const profit=has?Math.round(mv*(1-AH_TAX)-l.buyNow):null;
      const disc=has?Math.round((mv-l.buyNow)/mv*100):null;
      const profitOk=profit!=null&&profit>=profitMin,discOk=disc!=null&&disc>=discountMin;
      const isSnipe=has&&(matchMode==="all"?(profitOk&&discOk):(profitOk||discOk));
      return{l,mp,mv,profit,disc,isSnipe};
    }).sort((a,b)=>{if(a.isSnipe!==b.isSnipe)return a.isSnipe?-1:1;return (b.profit??-1e12)-(a.profit??-1e12);});
  },[listings,players,mvOv,profitMin,discountMin,matchMode]);
  const feedSnipes=feedRows.filter(r=>r.isSnipe).length;

  // Beep once when a snipe signature appears that wasn't in the previous poll
  useEffect(()=>{
    const cur=new Set(feedRows.filter(r=>r.isSnipe).map(r=>`${r.l.name}@${r.l.buyNow}`));
    if(feedOn){let fresh=false;cur.forEach(s=>{if(!prevSnipes.current.has(s))fresh=true;});if(fresh&&soundOn)beep();}
    prevSnipes.current=cur;
  },[feedRows,feedOn,soundOn]);

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
        return{p,key,mv,lp,hasDeal,profit,disc,profitOk,discOk,isSnipe};
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
        {feedStat&&<span style={{fontSize:6,color:feedStat.ok?C.t3:C.err,fontFamily:mono,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{feedStat.ok?`${feedStat.count} listings · ${feedSnipes} snipes · ${feedStat.ts}`:`err: ${feedStat.err}`}</span>}
        <div style={{flex:1}}/>
        <span style={{fontSize:7,color:C.t4,transform:feedOpen?"rotate(180deg)":"",display:"inline-block",transition:"transform .2s"}}>▼</span>
      </button>
      {feedOpen&&<div style={{padding:"0 9px 9px",animation:"fadeIn .2s"}}>
        <div style={{fontSize:7,color:C.t3,fontFamily:mono,lineHeight:1.5,marginBottom:7,padding:"5px 7px",background:C.bg3,borderRadius:4,border:`1px solid ${C.border}`}}>
          Capture an auction <b style={{color:C.t2}}>search</b> request from the Madden Companion App (mitmproxy/Charles), then paste the endpoint, your session token, and the JSON paths to map the response. Buy/bid/sell is blocked at the proxy — this only reads &amp; displays.
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
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setFeedOn(v=>!v)} disabled={!feedUrl} style={{flex:1,padding:"6px",borderRadius:5,border:`1px solid ${feedOn?C.err+"66":C.acc+"66"}`,background:feedOn?C.errDim:C.accDim,color:feedOn?C.err:C.acc,fontSize:9,fontWeight:800,fontFamily:mono,letterSpacing:1,cursor:feedUrl?"pointer":"not-allowed",opacity:feedUrl?1:.5}}>{feedOn?"■ STOP POLLING":"▶ START LIVE FEED"}</button>
          <button onClick={()=>setSoundOn(v=>!v)} title="Beep on new snipe" style={{padding:"6px 10px",borderRadius:5,border:`1px solid ${soundOn?C.acc+"66":C.border}`,background:soundOn?C.accDim:C.bg3,color:soundOn?C.acc:C.t4,fontSize:11,cursor:"pointer"}}>{soundOn?"🔔":"🔕"}</button>
        </div>
      </div>}
    </div>

    {/* live listings */}
    {feedOn&&<div style={{marginBottom:7}}>
      {feedRows.length===0&&<div style={{padding:"10px",textAlign:"center",fontSize:8,color:C.t4,fontFamily:mono}}>{feedStat?.ok?"Feed connected — no listings parsed. Check your array/field paths.":"Waiting for feed..."}</div>}
      {feedRows.length>0&&<div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:3,padding:"2px"}}>
        {feedRows.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr 74px 64px 48px",gap:5,alignItems:"center",padding:"4px 7px",borderRadius:5,background:r.isSnipe?C.accDim:C.bg3,border:`1px solid ${r.isSnipe?C.acc+"55":C.border}`}}>
          <div style={{minWidth:0,display:"flex",alignItems:"center",gap:4}}>
            {r.isSnipe&&<span style={{fontSize:8}}>🎯</span>}
            <span style={{fontSize:10,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.l.name}</span>
            {!r.mp&&<span style={{fontSize:6,color:C.t4,fontFamily:mono}}>no mv</span>}
          </div>
          <div style={{textAlign:"right",fontSize:10,fontWeight:700,color:C.warn,fontFamily:mono}}>{fPrice(r.l.buyNow)||r.l.buyNow}</div>
          <div style={{textAlign:"right",fontSize:10,fontWeight:800,color:r.profit!=null?(r.isSnipe?C.acc:r.profit>0?C.blue:C.err):C.t4,fontFamily:mono}}>{fSigned(r.profit)}</div>
          <div style={{textAlign:"right",fontSize:9,fontWeight:700,color:r.disc!=null?(r.disc>=discountMin?C.acc:C.t3):C.t4,fontFamily:mono}}>{r.disc!=null?r.disc+"%":"—"}</div>
        </div>))}
      </div>}
    </div>}

    {noPrices&&<div style={{padding:"6px 9px",marginBottom:6,borderRadius:5,background:C.warnDim,border:`1px solid ${C.warn}33`,fontSize:8,color:C.warn,fontFamily:mono}}>
      ⚠ No market values yet. Hit PRICES to pull live values from mut.gg, or type a market value per card below.
    </div>}

    <div style={{fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1,padding:"2px 8px 4px"}}>MANUAL ENTRY</div>

    {/* column header */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 78px 78px 64px 52px",gap:5,padding:"0 8px 4px",fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1}}>
      <span>PLAYER</span><span>MARKET</span><span>LISTED @</span><span style={{textAlign:"right"}}>PROFIT</span><span style={{textAlign:"right"}}>DISC</span>
    </div>

    {rows.length===0&&<div style={{padding:20,textAlign:"center",color:C.t4,fontFamily:mono,fontSize:10}}>{search?`No results for "${search}"`:"No players"}</div>}

    {rows.map(r=>{
      const pc=r.isSnipe?C.acc:r.profit!=null?(r.profit>0?C.blue:C.err):C.t4;
      return(<div key={r.key} style={{display:"grid",gridTemplateColumns:"1fr 78px 78px 64px 52px",gap:5,alignItems:"center",padding:"6px 8px",marginBottom:4,borderRadius:6,background:r.isSnipe?C.accDim:C.bg2,border:`1px solid ${r.isSnipe?C.acc+"55":C.border}`,boxShadow:r.isSnipe?`0 0 12px ${C.acc}14`:"none",transition:"all .2s"}}>
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {r.isSnipe&&<span style={{fontSize:8,color:C.acc}}>🎯</span>}
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

// Market Catalog — live, server-paginated read of mut.gg's public price index.
function CatalogPanel({platform,search,onAdd,addedKeys}){
  const mono="'Space Mono',monospace";
  const sel={height:26,padding:"0 6px",borderRadius:5,border:`1px solid ${C.border}`,background:C.bg2,color:C.t2,fontSize:9,fontFamily:mono,fontWeight:700,cursor:"pointer",outline:"none"};
  const[rows,setRows]=useState([]),[page,setPage]=useState(1),[loading,setLoading]=useState(false);
  const[sort,setSort]=useLS("mut.cat.sort","ovr_desc"),[position,setPosition]=useLS("mut.cat.pos","");
  const[auctionOnly,setAuctionOnly]=useLS("mut.cat.auction",false);
  const[hasMore,setHasMore]=useState(false),[err,setErr]=useState(null);

  useEffect(()=>{setPage(1);},[platform,search,sort,position,auctionOnly]);

  useEffect(()=>{
    let alive=true;setLoading(true);setErr(null);
    const params=new URLSearchParams({page:String(page),platform,sort});
    if(search.trim())params.set("q",search.trim());
    if(position)params.set("position",position);
    if(auctionOnly)params.set("auctionOnly","1");
    fetch(`/api/catalog?${params.toString()}`).then(r=>r.json()).then(j=>{
      if(!alive)return;
      const data=j.data||[];
      data.forEach(c=>pushHistory(c.pk,platform,c.price));
      setRows(data);setHasMore(!!j.hasMore);setErr(j.error||null);
    }).catch(e=>{if(alive)setErr(e.message);}).finally(()=>{if(alive)setLoading(false);});
    return()=>{alive=false;};
  },[page,platform,search,sort,position,auctionOnly]);

  return(<div style={{animation:"fadeIn .4s ease"}}>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",padding:"7px 9px",borderRadius:7,background:`linear-gradient(135deg,${C.bg2},${C.bg4})`,border:`1px solid ${C.border}`,marginBottom:7}}>
      <select value={position} onChange={e=>setPosition(e.target.value)} title="Position" style={sel}>
        {CAT_POS.map(p=><option key={p} value={p}>{p||"ALL POS"}</option>)}
      </select>
      <select value={sort} onChange={e=>setSort(e.target.value)} title="Sort" style={sel}>
        {CAT_SORTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
      <button onClick={()=>setAuctionOnly(v=>!v)} title="Only auctionable cards" style={{...sel,color:auctionOnly?C.acc:C.t3,borderColor:auctionOnly?C.acc+"66":C.border,background:auctionOnly?C.accDim:C.bg2}}>{auctionOnly?"✓ AUCTIONABLE":"AUCTIONABLE"}</button>
      <div style={{flex:1}}/>
      <span style={{fontSize:7,color:C.t3,fontFamily:mono}}>{loading?"loading…":`${rows.length} cards · ${platform.toUpperCase()}`}</span>
    </div>

    {err&&<div style={{padding:"6px 9px",marginBottom:6,borderRadius:5,background:C.errDim,border:`1px solid ${C.err}33`,fontSize:8,color:C.err,fontFamily:mono}}>catalog error: {err}</div>}

    <div style={{display:"grid",gridTemplateColumns:"26px 1fr 52px 72px 48px 22px",gap:5,padding:"0 8px 4px",fontSize:6,color:C.t3,fontFamily:mono,letterSpacing:1}}>
      <span/><span>PLAYER</span><span>TREND</span><span style={{textAlign:"right"}}>PRICE</span><span style={{textAlign:"right"}}>CHG</span><span/>
    </div>

    {!loading&&rows.length===0&&<div style={{padding:20,textAlign:"center",color:C.t4,fontFamily:mono,fontSize:10}}>{search?`No results for "${search}"`:"No cards"}</div>}

    {rows.map(c=>{
      const chg=fmtPct(c.pctChange);
      const cc=c.pctChange==null?C.t4:c.pctChange>0?C.acc:c.pctChange<0?C.err:C.t3;
      const ckey=`${c.name}__${c.program}__${c.pos}__${c.pos}`;
      const added=addedKeys&&addedKeys.has(ckey);
      return(<div key={c.pk} style={{display:"grid",gridTemplateColumns:"26px 1fr 52px 72px 48px 22px",gap:5,alignItems:"center",padding:"5px 8px",marginBottom:4,borderRadius:6,background:C.bg2,border:`1px solid ${C.border}`}}>
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

    <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"center",padding:"8px 0 2px"}}>
      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1||loading} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${C.border}`,background:page<=1?C.bg2:C.bg3,color:page<=1?C.t4:C.t2,fontSize:9,fontFamily:mono,fontWeight:700,cursor:page<=1?"default":"pointer"}}>← PREV</button>
      <span style={{fontSize:8,color:C.t3,fontFamily:mono}}>PAGE {page}</span>
      <button onClick={()=>setPage(p=>p+1)} disabled={!hasMore||loading} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${C.border}`,background:!hasMore?C.bg2:C.bg3,color:!hasMore?C.t4:C.t2,fontSize:9,fontFamily:mono,fontWeight:700,cursor:!hasMore?"default":"pointer"}}>NEXT →</button>
    </div>
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

  return(<div style={{minHeight:"100vh",background:C.bg,color:C.t1,fontFamily:"'Outfit',sans-serif",opacity:loaded?1:0,transition:"opacity .5s"}}>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input::placeholder{color:${C.t4}}`}</style>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100,background:`repeating-linear-gradient(0deg,transparent,transparent 2px,${C.bg}05 2px,${C.bg}05 4px)`}}/>

    <div style={{padding:"11px 15px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(180deg,${C.bg2},${C.bg})`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:7,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.acc},${C.elite})`,fontSize:13,fontWeight:900}}>◈</div>
          <div><div style={{fontSize:15,fontWeight:800,letterSpacing:-.5}}>MUT <span style={{color:C.acc}}>ALPHA</span></div><div style={{fontSize:7,color:C.t3,fontFamily:"'Space Mono',monospace",letterSpacing:1}}>SNIPER · CATALOG · MUT.GG PRICED</div></div>
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

    <div style={{display:"flex",gap:3,padding:"8px 15px 0"}}>
      {[{k:"snipe",l:"🎯 Snipe"},{k:"catalog",l:"📊 Catalog"}].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"5px 14px",borderRadius:"6px 6px 0 0",border:`1px solid ${tab===t.k?C.borderHi:C.border}`,borderBottom:tab===t.k?`1px solid ${C.bg}`:`1px solid ${C.border}`,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'Space Mono',monospace",background:tab===t.k?C.bg3:"transparent",color:tab===t.k?C.t1:C.t3,marginBottom:-1,position:"relative",zIndex:1}}>{t.l}</button>)}
    </div>

    <div style={{padding:"9px 15px 36px",maxHeight:"calc(100vh - 150px)",overflowY:"auto",borderTop:`1px solid ${C.border}`}}>
      {tab==="snipe"&&<SnipePanel players={players} search={search} listed={snListed} setListed={setSnListed} mvOv={snMvOv} setMvOv={setSnMvOv} profitMin={profitMin} setProfitMin={setProfitMin} discountMin={discountMin} setDiscountMin={setDiscountMin} matchMode={matchMode} setMatchMode={setMatchMode}/>}
      {tab==="catalog"&&<CatalogPanel platform={plat} search={search} onAdd={addToSnipe} addedKeys={addedKeys}/>}
    </div>
  </div>);
}
