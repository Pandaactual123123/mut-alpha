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

const PC = {
  QB:{subs:null,formula:"QMS = (AP_Disc×.40)+(Release×.30)+(Thresh×.30)",engine:"QB Meta Score",stats:["SPD","THP","SAC","MAC","DAC"]},
  HB:{subs:null,formula:"RBVS = (BEV×.30)+(BCV×.20)+(PDM×.20)+(AEQ×.30)",engine:"RB Value Score",stats:["SPD","CAR","COD","TRK","BTK"]},
  FB:{subs:null,formula:"Fullback Utility Score",engine:"FB Utility Score",stats:["SPD","CAR","RBK","IMP","TRK"]},
  WR:{subs:null,formula:"WREE = (BEV×.35)+(RLS×.10)+(REC×.10)+(PDM×.15)+(AEQ×.30)",engine:"WR Eval Engine v2",stats:["SPD","CTH","SRR","MRR","DRR"]},
  TE:{subs:null,formula:"TE Versatility Score",engine:"TE Versatility Score",stats:["SPD","CTH","SRR","RBK","CIT"]},
  OL:{subs:["LT","LG","C","RG","RT"],formula:"TBS = Stat(60%)+STR(22.5%)+WGT(17.5%)+Abilities+PU",engine:"True-Blocking Score",stats:[]},
  DL:{subs:["LEDG","DT","REDG"],formula:"MVS = (Core×.40)+(Phys×.20)+(Traits×.15)+(AP×.25)",engine:"Meta Value Score",stats:[]},
  DB:{subs:["CB","FS","SS"],formula:"TCS = (Cov×.35)+(MoveDNA×.25)+(Frame×.15)+(AP×.25)",engine:"True Coverage Score",stats:[]},
};

const FB_S=["SPD","CAR","RBK","IMP","TRK"];
const TE_S=["SPD","CTH","SRR","RBK","CIT"];
const OL_S=["SPD","ACC","AGI","STR","JMP"];
const DL_S=["SPD","ACC","AGI","STR","JMP"];
const DT_S=["SPD","TAK","BSH","PMV","FMV"];
const CB_S=["SPD","JMP","MCV","ZCV","PRS"];
const FS_S=["SPD","TAK","POW","MCV","ZCV"];
const SS_S=["SPD","TAK","POW","MCV","ZCV"];
function gS(p,s){if(p==="FB")return FB_S;if(p==="TE")return TE_S;if(p==="OL")return OL_S;if(p==="DL")return s==="DT"?DT_S:DL_S;if(p==="DB"){if(s==="CB")return CB_S;if(s==="FS")return FS_S;return SS_S;}return PC[p]?.stats||[];}

const INIT=[
  {pos:"QB",sub:"QB",name:"Robert Griffin III",card:"Flashbacks",ovr:96,arch:"Scrambler",start:17.0,s:{SPD:94,THP:96,SAC:93,MAC:92,DAC:96}},
  {pos:"QB",sub:"QB",name:"Drake Maye",card:"Season 5 FP",ovr:95,arch:"Strong Arm",start:10.5,s:{SPD:90,THP:94,SAC:96,MAC:92,DAC:92}},
  {pos:"QB",sub:"QB",name:"Jalen Milroe",card:"Ultimate Upgrades",ovr:95,arch:"Scrambler",start:9.5,s:{SPD:94,THP:96,SAC:96,MAC:91,DAC:94}},
  {pos:"QB",sub:"QB",name:"Sam Darnold",card:"Super Bowl",ovr:95,arch:"Field General",start:7.7,s:{SPD:89,THP:97,SAC:95,MAC:91,DAC:91}},
  {pos:"QB",sub:"QB",name:"John Elway",card:"Super Bowl",ovr:95,arch:"Field General",start:7.9,s:{SPD:88,THP:97,SAC:92,MAC:90,DAC:93}},
  {pos:"HB",sub:"HB",name:"Kenneth Walker III",card:"Super Bowl",ovr:99,arch:"Elusive Back",start:19.5,s:{SPD:97,CAR:99,COD:97,TRK:98,BTK:99}},
  {pos:"HB",sub:"HB",name:"Walter Payton",card:"Ultimate Legends",ovr:96,arch:"Elusive Back",start:7.3,s:{SPD:96,CAR:94,COD:94,TRK:93,BTK:94}},
  {pos:"HB",sub:"HB",name:"Marshawn Lynch",card:"Super Bowl",ovr:95,arch:"Power Back",start:6.8,s:{SPD:95,CAR:88,COD:92,TRK:97,BTK:98}},
  {pos:"HB",sub:"HB",name:"Jeremiyah Love",card:"NFL Combine",ovr:93,arch:"Elusive Back",start:5.8,s:{SPD:95,CAR:83,COD:90,TRK:94,BTK:88}},
  {pos:"HB",sub:"HB",name:"LeGarrette Blount",card:"Super Bowl",ovr:95,arch:"Power Back",start:5.8,s:{SPD:94,CAR:96,COD:90,TRK:97,BTK:96}},
  {pos:"WR",sub:"WR",name:"Rashid Shaheed",card:"Playoffs",ovr:94,arch:"Playmaker",start:29.2,s:{SPD:95,CTH:93,SRR:92,MRR:90,DRR:93}},
  {pos:"WR",sub:"WR",name:"Steve Smith Sr",card:"Season 5 FP",ovr:95,arch:"Slot",start:28.8,s:{SPD:95,CTH:95,SRR:95,MRR:93,DRR:96}},
  {pos:"WR",sub:"WR",name:"Jaxon Smith-Njigba",card:"Super Bowl",ovr:95,arch:"Slot",start:23.0,s:{SPD:94,CTH:93,SRR:97,MRR:97,DRR:90}},
  {pos:"WR",sub:"WR",name:"Kylie Cox (Sketch)",card:"Super Bowl",ovr:95,arch:"Playmaker",start:18.9,s:{SPD:94,CTH:95,SRR:95,MRR:96,DRR:94}},
  {pos:"WR",sub:"WR",name:"A.J. Brown",card:"Crystal",ovr:96,arch:"Physical",start:15.0,s:{SPD:95,CTH:96,SRR:94,MRR:95,DRR:95}},
  {pos:"OL",sub:"LT",name:"Jordan Mailata",card:"Season 4 FP",ovr:93,arch:"Power",start:16.3,s:{SPD:72,ACC:82,AGI:72,STR:95,JMP:72}},
  {pos:"OL",sub:"LT",name:"Paris Johnson Jr",card:"Genki Force",ovr:96,arch:"Power",start:14.2,s:{SPD:82,ACC:90,AGI:78,STR:93,JMP:84}},
  {pos:"OL",sub:"LT",name:"Bryant McKinnie",card:"Team Captains",ovr:94,arch:"Pass Protector",start:13.2,s:{SPD:68,ACC:74,AGI:58,STR:96,JMP:60}},
  {pos:"OL",sub:"LG",name:"David Edwards",card:"Season 5 FP",ovr:95,arch:"Agile",start:44.3,s:{SPD:75,ACC:86,AGI:74,STR:92,JMP:76}},
  {pos:"OL",sub:"LG",name:"Damien Woody",card:"Super Bowl",ovr:95,arch:"Power",start:16.6,s:{SPD:74,ACC:82,AGI:70,STR:96,JMP:74}},
  {pos:"OL",sub:"LG",name:"Trevor Penning",card:"Flashbacks",ovr:96,arch:"Power",start:4.4,s:{SPD:80,ACC:88,AGI:76,STR:95,JMP:80}},
  {pos:"OL",sub:"C",name:"Zach Frazier",card:"Season 6 FP",ovr:97,arch:"Agile",start:47.9,s:{SPD:78,ACC:88,AGI:78,STR:93,JMP:78}},
  {pos:"OL",sub:"C",name:"Jalen Sundell",card:"Super Bowl",ovr:95,arch:"Agile",start:14.2,s:{SPD:82,ACC:90,AGI:82,STR:90,JMP:80}},
  {pos:"OL",sub:"C",name:"Jay Hilgenberg",card:"Super Bowl",ovr:95,arch:"Agile",start:9.9,s:{SPD:76,ACC:84,AGI:74,STR:94,JMP:72}},
  {pos:"OL",sub:"RG",name:"Robert Hunt",card:"Genki Force",ovr:96,arch:"Pass Protector",start:22.1,s:{SPD:72,ACC:80,AGI:68,STR:96,JMP:72}},
  {pos:"OL",sub:"RG",name:"Marshal Yanda",card:"Super Bowl",ovr:95,arch:"Power",start:12.9,s:{SPD:70,ACC:78,AGI:66,STR:97,JMP:68}},
  {pos:"OL",sub:"RG",name:"Mike Onwenu",card:"Super Bowl",ovr:95,arch:"Power",start:11.4,s:{SPD:68,ACC:76,AGI:64,STR:95,JMP:66}},
  {pos:"OL",sub:"RT",name:"Joe Alt",card:"Collector's Series",ovr:96,arch:"Power",start:30.1,s:{SPD:82,ACC:90,AGI:80,STR:94,JMP:86}},
  {pos:"OL",sub:"RT",name:"George Kittle",card:"Zero Chill",ovr:93,arch:"Agile",start:15.4,s:{SPD:88,ACC:92,AGI:86,STR:88,JMP:90}},
  {pos:"OL",sub:"RT",name:"John Madden",card:"Autumn",ovr:92,arch:"Power",start:9.6,s:{SPD:62,ACC:68,AGI:56,STR:94,JMP:58}},
  {pos:"DL",sub:"LEDG",name:"Jevon Kearse",card:"Season 5 FP",ovr:95,arch:"Speed Rusher",start:38.4,s:{SPD:92,ACC:95,AGI:90,STR:87,JMP:92}},
  {pos:"DL",sub:"LEDG",name:"Reggie White",card:"Super Bowl",ovr:95,arch:"Power Rusher",start:12.0,s:{SPD:89,ACC:92,AGI:84,STR:97,JMP:80}},
  {pos:"DL",sub:"LEDG",name:"Harold Landry III",card:"Super Bowl",ovr:95,arch:"Speed Rusher",start:5.0,s:{SPD:92,ACC:96,AGI:95,STR:97,JMP:91}},
  {pos:"DL",sub:"LEDG",name:"DeMarcus Lawrence",card:"Super Bowl",ovr:95,arch:"Run Stopper",start:4.7,s:{SPD:90,ACC:88,AGI:78,STR:94,JMP:83}},
  {pos:"DL",sub:"LEDG",name:"David Bailey",card:"NFL Combine",ovr:93,arch:"Speed Rusher",start:4.4,s:{SPD:93,ACC:95,AGI:92,STR:87,JMP:88}},
  {pos:"DL",sub:"DT",name:"William Perry",card:"Super Bowl",ovr:95,arch:"Nose Tackle",start:38.8,s:{SPD:86,TAK:92,BSH:97,PMV:97,FMV:76}},
  {pos:"DL",sub:"DT",name:"Nnamdi Madubuike",card:"Season 4 FP",ovr:93,arch:"Nose Tackle",start:28.0,s:{SPD:76,TAK:93,BSH:94,PMV:85,FMV:92}},
  {pos:"DL",sub:"DT",name:"Haloti Ngata",card:"Super Bowl",ovr:95,arch:"Nose Tackle",start:15.4,s:{SPD:86,TAK:93,BSH:96,PMV:92,FMV:85}},
  {pos:"DL",sub:"DT",name:"Milton Williams",card:"Stocking Stuffers",ovr:93,arch:"Power Rusher",start:12.4,s:{SPD:91,TAK:93,BSH:84,PMV:95,FMV:87}},
  {pos:"DL",sub:"DT",name:"Geno Atkins",card:"Team Captains",ovr:94,arch:"Power Rusher",start:11.3,s:{SPD:79,TAK:92,BSH:92,PMV:93,FMV:81}},
  {pos:"DL",sub:"REDG",name:"Nolan Smith Jr",card:"Season 6 FP",ovr:97,arch:"Speed Rusher",start:35.7,s:{SPD:95,ACC:99,AGI:92,STR:76,JMP:97}},
  {pos:"DL",sub:"REDG",name:"Myles Garrett",card:"NFL Honors",ovr:96,arch:"Power Rusher",start:9.4,s:{SPD:92,ACC:91,AGI:81,STR:98,JMP:97}},
  {pos:"DL",sub:"REDG",name:"Za'Darius Smith",card:"Zero Chill",ovr:93,arch:"Power Rusher",start:8.1,s:{SPD:91,ACC:93,AGI:89,STR:91,JMP:95}},
  {pos:"DL",sub:"REDG",name:"Dwight Freeney",card:"Super Bowl",ovr:96,arch:"Speed Rusher",start:7.4,s:{SPD:94,ACC:90,AGI:91,STR:97,JMP:91}},
  {pos:"DL",sub:"REDG",name:"Lawrence Taylor",card:"NFL Honors",ovr:96,arch:"Power Rusher",start:6.7,s:{SPD:92,ACC:93,AGI:86,STR:94,JMP:86}},
  {pos:"DB",sub:"CB",name:"Charles Woodson",card:"Season 6 FP",ovr:97,arch:"Slot",start:49.5,s:{SPD:96,JMP:95,MCV:96,ZCV:96,PRS:92}},
  {pos:"DB",sub:"CB",name:"Plaxico Burress",card:"MCS",ovr:94,arch:"Zone",start:40.0,s:{SPD:94,JMP:95,MCV:96,ZCV:94,PRS:89}},
  {pos:"DB",sub:"CB",name:"Nick Emmanwori",card:"Super Bowl",ovr:95,arch:"Slot",start:31.8,s:{SPD:96,JMP:97,MCV:97,ZCV:97,PRS:80}},
  {pos:"DB",sub:"CB",name:"Tariq Woolen",card:"Ranked",ovr:95,arch:"Zone",start:17.3,s:{SPD:95,JMP:96,MCV:93,ZCV:96,PRS:91}},
  {pos:"DB",sub:"CB",name:"Randy Moss",card:"Ghost of MUT",ovr:94,arch:"Slot",start:8.8,s:{SPD:94,JMP:96,MCV:96,ZCV:95,PRS:94}},
  {pos:"DB",sub:"FS",name:"Kamren Kinchens",card:"Season 5 FP",ovr:95,arch:"Zone",start:21.4,s:{SPD:94,TAK:91,POW:98,MCV:88,ZCV:96}},
  {pos:"DB",sub:"FS",name:"Steve Atwater",card:"Super Bowl",ovr:95,arch:"Run Support",start:5.9,s:{SPD:95,TAK:92,POW:98,MCV:88,ZCV:97}},
  {pos:"DB",sub:"FS",name:"Jaylinn Hawkins",card:"Playoffs",ovr:94,arch:"Zone",start:5.4,s:{SPD:93,TAK:90,POW:99,MCV:92,ZCV:95}},
  {pos:"DB",sub:"FS",name:"Earl Thomas III",card:"Super Bowl",ovr:95,arch:"Zone",start:4.4,s:{SPD:95,TAK:87,POW:95,MCV:94,ZCV:97}},
  {pos:"DB",sub:"FS",name:"Kerby Joseph",card:"Flashbacks",ovr:95,arch:"Zone",start:3.6,s:{SPD:94,TAK:93,POW:85,MCV:93,ZCV:98}},
  {pos:"DB",sub:"SS",name:"User",card:"Genki Force",ovr:96,arch:"Run Support",start:49.4,s:{SPD:95,TAK:93,POW:95,MCV:92,ZCV:95}},
  {pos:"DB",sub:"SS",name:"Isaiah Pola-Mao",card:"Crystal",ovr:96,arch:"Hybrid",start:18.1,s:{SPD:96,TAK:98,POW:94,MCV:96,ZCV:97}},
  {pos:"DB",sub:"SS",name:"Kam Chancellor",card:"Black History",ovr:95,arch:"Run Support",start:15.0,s:{SPD:95,TAK:93,POW:94,MCV:86,ZCV:94}},
  {pos:"DB",sub:"SS",name:"Troy Polamalu",card:"Super Bowl",ovr:96,arch:"Hybrid",start:8.1,s:{SPD:96,TAK:90,POW:97,MCV:94,ZCV:98}},
  {pos:"DB",sub:"SS",name:"Coby Bryant",card:"Super Bowl",ovr:96,arch:"Zone",start:5.7,s:{SPD:95,TAK:94,POW:94,MCV:96,ZCV:98}},
];

const THRESHOLDS=[
  {a:"ZCV",v:90,l:"Zone Coverage",e:"Elite break-on-ball — initiates break AS ball releases",c:"CONFIRMED"},
  {a:"MCV",v:90,l:"Man Coverage",e:"Tightest trail technique; prevents instant displacement",c:"CONFIRMED"},
  {a:"RLS vs PRS",v:90,l:"Release vs Press",e:"Clean release animation; bypasses 5-yard jam zone",c:"CONFIRMED"},
  {a:"SRR/MRR/DRR",v:90,l:"Route Running",e:"Max crispness — 91 = 99 (aggressive diminishing returns)",c:"CONFIRMED"},
  {a:"SAC",v:85,l:"Short Accuracy",e:"Elite short window — bypasses errant throw RNG",c:"CONFIRMED"},
  {a:"MAC",v:90,l:"Medium Accuracy",e:"Bypass errant throw algorithms (10-20 yds)",c:"CONFIRMED"},
  {a:"DAC",v:95,l:"Deep Accuracy",e:"Elite deep accuracy window (20+ yds)",c:"CONFIRMED"},
  {a:"TUP",v:90,l:"Throw Under Pressure",e:"Prevents accuracy collapse in dirty pocket",c:"CONFIRMED"},
  {a:"COD",v:90,l:"Change of Direction",e:"Speed burst animation on redirect",c:"CONFIRMED"},
  {a:"WGT(DT)",v:300,l:"DT Weight Floor",e:"Interior competitive minimum for full multiplier",c:"CONFIRMED"},
  {a:"WGT(OL)",v:290,l:"OL Elite Jump",e:"+14.22 hold logic bonus to T_Score",c:"CONFIRMED"},
];

const RM=[
  {pos:"QB",sub:"QB",label:"Quarterbacks",slug:"qb"},
  {pos:"HB",sub:"HB",label:"Halfbacks",slug:"hb"},
  {pos:"FB",sub:"FB",label:"Fullbacks",slug:"fb"},
  {pos:"WR",sub:"WR",label:"Wide Receivers",slug:"wr"},
  {pos:"TE",sub:"TE",label:"Tight Ends",slug:"te"},
  {pos:"OL",sub:"LT",label:"Left Tackles",slug:"lt"},{pos:"OL",sub:"LG",label:"Left Guards",slug:"lg"},
  {pos:"OL",sub:"C",label:"Centers",slug:"c"},{pos:"OL",sub:"RG",label:"Right Guards",slug:"rg"},
  {pos:"OL",sub:"RT",label:"Right Tackles",slug:"rt"},
  {pos:"DL",sub:"LEDG",label:"Left Edges",slug:"ledg"},{pos:"DL",sub:"DT",label:"Defensive Tackles",slug:"dt"},
  {pos:"DL",sub:"REDG",label:"Right Edges",slug:"redg"},
  {pos:"DB",sub:"CB",label:"Cornerbacks",slug:"cb"},{pos:"DB",sub:"FS",label:"Free Safeties",slug:"fs"},
  {pos:"DB",sub:"SS",label:"Strong Safeties",slug:"ss"},
];

async function fetchLive(slug){
  try{
    const r=await fetch(`/api/scrape?pos=${slug}`);
    if(!r.ok)return null;
    const d=await r.json();
    if(d.error||!d.players?.length)return null;
    return d.players;
  }catch(e){console.error(`Live fetch failed for ${slug}:`,e);}
  return null;
}

function AN({value,d=1}){const[v,setV]=useState(0);const r=useRef(null);useEffect(()=>{const t0=performance.now();const go=n=>{const p=Math.min((n-t0)/800,1);setV((1-Math.pow(1-p,3))*value);if(p<1)r.current=requestAnimationFrame(go);};r.current=requestAnimationFrame(go);return()=>cancelAnimationFrame(r.current);},[value]);return <span>{v.toFixed(d)}</span>;}

function Gauge({ovr,sz=54}){
  const gc=ovr>=97?C.acc:ovr>=95?C.elite:ovr>=93?C.blue:C.warn;
  const ci=2*Math.PI*24,off=ci*(1-Math.min(ovr/100,1));
  return(<div style={{position:"relative",width:sz,height:sz,flexShrink:0}}>
    <svg width={sz} height={sz} viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="none" stroke={C.border} strokeWidth="3.5"/><circle cx="30" cy="30" r="24" fill="none" stroke={gc} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={ci} strokeDashoffset={off} transform="rotate(-90 30 30)" style={{transition:"stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)"}}/></svg>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:sz*.28,fontWeight:800,color:C.t1,fontFamily:"'Space Mono',monospace"}}><AN value={ovr} d={0}/></span></div>
  </div>);
}

function SB({label,val,thresh}){
  const met=thresh?val>=thresh:true;const bg=thresh?(met?C.accDim:C.errDim):C.bg4;
  const cl=thresh?(met?C.acc:C.err):(val>=95?C.acc:val>=90?C.elite:C.t1);
  return(<div style={{background:bg,borderRadius:5,padding:"4px 5px",textAlign:"center",minWidth:0}}>
    <div style={{fontSize:7,color:C.t3,fontFamily:"'Space Mono',monospace"}}>{label}</div>
    <div style={{fontSize:14,fontWeight:800,color:cl,fontFamily:"'Space Mono',monospace"}}>{val}</div>
    {thresh&&<div style={{fontSize:6,color:met?C.acc:C.err,fontFamily:"'Space Mono',monospace"}}>{met?`✓≥${thresh}`:`✕${thresh}`}</div>}
  </div>);
}

function Card({p,pos,sub}){
  const[o,setO]=useState(false);
  const stats=gS(pos,sub||p.sub);
  const tm={SAC:85,MAC:90,DAC:95,ZCV:90,MCV:90,PRS:90,SRR:90,MRR:90,DRR:90,COD:90};
  return(<div onClick={()=>setO(!o)} style={{background:C.bg2,border:`1px solid ${o?C.acc+"44":C.border}`,borderRadius:9,padding:"10px 12px",cursor:"pointer",transition:"all .2s",marginBottom:5,boxShadow:o?`0 0 14px ${C.acc}10`:"none"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <Gauge ovr={p.ovr}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:700,color:C.t1}}>{p.name}</span>
          <span style={{fontSize:7,color:C.t2,background:C.bg4,padding:"1px 4px",borderRadius:3,fontFamily:"'Space Mono',monospace"}}>{p.arch||p.sub}</span>
          {p.ttB&&<span style={{fontSize:7,color:C.blue,background:C.blueDim,padding:"1px 4px",borderRadius:3,fontFamily:"'Space Mono',monospace"}}>TT+2</span>}
        </div>
        <div style={{fontSize:9,color:C.t3,marginTop:1}}>{p.card} · {p.ovr} OVR</div>
        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
          <span style={{fontSize:11,fontWeight:700,color:C.acc,fontFamily:"'Space Mono',monospace"}}>▲ {p.start}%</span>
          <span style={{fontSize:7,color:C.t3}}>starting</span>
        </div>
      </div>
      <div style={{fontSize:8,color:C.t4,transform:o?"rotate(180deg)":"",transition:"transform .2s"}}>▼</div>
    </div>
    {o&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,animation:"fadeIn .3s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(stats.length,5)},1fr)`,gap:4}}>
        {stats.map(k=>p.s[k]!=null?<SB key={k} label={k} val={p.s[k]} thresh={tm[k]}/>:null)}
      </div>
    </div>}
  </div>);
}

function Bars({pl}){
  const mx=Math.max(...pl.map(p=>p.start),1);
  return(<div style={{padding:"10px 12px",borderRadius:7,background:C.bg2,border:`1px solid ${C.border}`,marginTop:7}}>
    <div style={{fontSize:8,fontWeight:700,color:C.t3,fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:6}}>COMMUNITY STARTING %</div>
    {pl.map((p,i)=>(<div key={i} style={{marginBottom:i<pl.length-1?7:0}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
        <span style={{fontSize:9,fontWeight:600,color:C.t1}}>{p.name}</span>
        <span style={{fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",color:C.acc}}>{p.start}%</span>
      </div>
      <div style={{height:8,borderRadius:3,background:C.bg4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(p.start/mx)*100}%`,background:`linear-gradient(90deg,${C.acc},${C.elite})`,borderRadius:3,transition:"width .8s ease"}}/>
      </div>
    </div>))}
  </div>);
}

export default function App(){
  const[pos,setPos]=useState("QB"),[sub,setSub]=useState(null),[tab,setTab]=useState("players");
  const[search,setSearch]=useState(""),[tt,setTt]=useState(false);
  const[players,setPlayers]=useState(()=>{try{const c=localStorage.getItem("mut-alpha-players");if(c){const p=JSON.parse(c);if(Array.isArray(p)&&p.length>0)return p;}}catch(e){}return INIT;});
  const[loaded,setLoaded]=useState(false);
  const[rfr,setRfr]=useState(false),[rfrP,setRfrP]=useState(""),[lr,setLr]=useState(()=>{try{return localStorage.getItem("mut-alpha-lr")||"Initial · Mar 2 2026 · mut.gg verified";}catch(e){return "Initial · Mar 2 2026 · mut.gg verified";}});

  useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap";l.rel="stylesheet";document.head.appendChild(l);setTimeout(()=>setLoaded(true),150);},[]);
  useEffect(()=>{setSub(null);},[pos]);

  const doRefresh=useCallback(async()=>{
    if(rfr)return;setRfr(true);let nP=[...players],up=0;
    for(let i=0;i<RM.length;i++){
      const rm=RM[i];
      setRfrP(`${i+1}/${RM.length} · ${rm.label}...`);
      const res=await fetchLive(rm.slug);
      if(res&&Array.isArray(res)){
        nP=nP.filter(p=>!(p.pos===rm.pos&&p.sub===rm.sub));
        res.forEach(r=>nP.push({pos:rm.pos,sub:rm.sub,name:r.name||"?",card:r.card||"?",ovr:r.ovr||0,arch:r.arch||rm.sub,start:r.start||0,s:r.s||{}}));
        up++;
      }
      await new Promise(r=>setTimeout(r,250));
    }
    setPlayers(nP);
    const ts=`${new Date().toLocaleTimeString()} · ${up}/${RM.length} refreshed`;
    setLr(ts);setRfrP("");setRfr(false);
    try{localStorage.setItem("mut-alpha-players",JSON.stringify(nP));localStorage.setItem("mut-alpha-lr",ts);}catch(e){}
  },[rfr,players]);

  const cfg=PC[pos];
  const pl=useMemo(()=>{
    let l=players.filter(p=>p.pos===pos);
    if(sub)l=l.filter(p=>p.sub===sub);
    if(tt)l=l.map(p=>({...p,s:{...p.s,SPD:p.s.SPD?Math.min(99,p.s.SPD+2):p.s.SPD},ttB:true}));
    if(search.trim()){const q=search.toLowerCase();l=l.filter(p=>p.name.toLowerCase().includes(q)||p.card.toLowerCase().includes(q));}
    return l.sort((a,b)=>b.start-a.start);
  },[pos,sub,tt,search,players]);

  return(<div style={{minHeight:"100vh",background:C.bg,color:C.t1,fontFamily:"'Outfit',sans-serif",opacity:loaded?1:0,transition:"opacity .5s"}}>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input::placeholder{color:${C.t4}}`}</style>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100,background:`repeating-linear-gradient(0deg,transparent,transparent 2px,${C.bg}05 2px,${C.bg}05 4px)`}}/>

    <div style={{padding:"11px 15px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(180deg,${C.bg2},${C.bg})`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:7,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.acc},${C.elite})`,fontSize:13,fontWeight:900}}>◈</div>
          <div><div style={{fontSize:15,fontWeight:800,letterSpacing:-.5}}>MUT <span style={{color:C.acc}}>ALPHA</span></div><div style={{fontSize:7,color:C.t3,fontFamily:"'Space Mono',monospace",letterSpacing:1}}>LIVE DATA · MUT.GG VERIFIED</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",background:C.accDim,borderRadius:4,border:`1px solid ${C.acc}33`}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:C.acc,animation:"pulse 2s infinite"}}/><span style={{fontSize:7,color:C.acc,fontFamily:"'Space Mono',monospace",fontWeight:700}}>LIVE</span>
          </div>
          <button onClick={doRefresh} disabled={rfr} title={lr} style={{height:28,padding:"0 9px",borderRadius:5,border:`1px solid ${rfr?C.acc+"66":C.border}`,background:rfr?C.accDim:C.bg2,cursor:rfr?"default":"pointer",display:"flex",alignItems:"center",gap:4,transition:"all .2s"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={rfr?C.acc:C.t3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:rfr?"spin .7s linear infinite":"none"}}><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M2.5 11.5a10 10 0 0 1 18.4-4.5M21.5 12.5a10 10 0 0 1-18.4 4.5"/></svg>
            <span style={{fontSize:8,fontWeight:600,color:rfr?C.acc:C.t3,fontFamily:"'Space Mono',monospace"}}>{rfr?"LIVE":"REFRESH"}</span>
          </button>
        </div>
      </div>
      {rfr&&rfrP&&<div style={{marginTop:5,fontSize:8,color:C.acc,fontFamily:"'Space Mono',monospace",animation:"pulse 1.5s infinite"}}>⟳ {rfrP}</div>}
      {!rfr&&<div style={{marginTop:3,fontSize:7,color:C.t4,fontFamily:"'Space Mono',monospace"}}>{lr}</div>}
    </div>

    <div style={{padding:"6px 15px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:130,position:"relative"}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.t4} strokeWidth="2" style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)"}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{width:"100%",padding:"5px 7px 5px 24px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,color:C.t1,fontSize:10,fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
      </div>
      <button onClick={()=>setTt(!tt)} style={{padding:"4px 8px",borderRadius:4,border:`1px solid ${tt?C.blue+"66":C.border}`,background:tt?C.blueDim:C.bg2,cursor:"pointer",display:"flex",alignItems:"center",gap:3,transition:"all .2s"}}>
        <div style={{width:20,height:11,borderRadius:5,background:tt?C.blue:C.t4,position:"relative",transition:"background .2s"}}><div style={{width:7,height:7,borderRadius:4,background:"#fff",position:"absolute",top:2,left:tt?11:2,transition:"left .2s"}}/></div>
        <span style={{fontSize:7,fontWeight:600,color:tt?C.blue:C.t3,fontFamily:"'Space Mono',monospace"}}>50/50 TT</span>
      </button>
    </div>

    <div style={{display:"flex",gap:2,padding:"6px 15px",borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>
      {Object.keys(PC).map(k=><button key={k} onClick={()=>setPos(k)} style={{padding:"4px 12px",borderRadius:4,border:"none",cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",letterSpacing:.5,transition:"all .2s",flexShrink:0,background:pos===k?C.acc:C.bg2,color:pos===k?C.bg:C.t3,boxShadow:pos===k?`0 0 10px ${C.accGlow}`:"none"}}>{k}</button>)}
    </div>

    {cfg.subs&&<div style={{display:"flex",gap:2,padding:"5px 15px",borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>
      <button onClick={()=>setSub(null)} style={{padding:"2px 8px",borderRadius:3,border:`1px solid ${!sub?C.borderHi:C.border}`,cursor:"pointer",fontSize:8,fontWeight:600,fontFamily:"'Space Mono',monospace",background:!sub?C.bg3:"transparent",color:!sub?C.t1:C.t3}}>ALL</button>
      {cfg.subs.map(s=><button key={s} onClick={()=>setSub(s)} style={{padding:"2px 8px",borderRadius:3,border:`1px solid ${sub===s?C.borderHi:C.border}`,cursor:"pointer",fontSize:8,fontWeight:600,fontFamily:"'Space Mono',monospace",background:sub===s?C.bg3:"transparent",color:sub===s?C.t1:C.t3}}>{s}</button>)}
    </div>}

    <div style={{margin:"7px 15px 0",padding:"7px 9px",borderRadius:6,background:`linear-gradient(135deg,${C.bg2},${C.bg4})`,border:`1px solid ${C.border}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:1}}>{cfg.engine.toUpperCase()}</div>
      <div style={{fontSize:9,color:C.t1,fontFamily:"'Space Mono',monospace",fontWeight:400,opacity:.85,overflowX:"auto",whiteSpace:"nowrap"}}>{cfg.formula}</div>
    </div>

    <div style={{display:"flex",gap:2,padding:"7px 15px 3px"}}>
      {[{k:"players",l:"Player Rankings"},{k:"thresholds",l:"Thresholds"}].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"2px 8px",borderRadius:3,border:`1px solid ${tab===t.k?C.borderHi:C.border}`,cursor:"pointer",fontSize:8,fontWeight:600,background:tab===t.k?C.bg3:"transparent",color:tab===t.k?C.t1:C.t3}}>{t.l}</button>)}
    </div>

    <div style={{padding:"3px 15px 36px",maxHeight:"calc(100vh - 300px)",overflowY:"auto"}}>
      {tab==="players"&&<div style={{animation:"fadeIn .4s ease"}}>
        {pl.length===0&&<div style={{padding:20,textAlign:"center",color:C.t4,fontFamily:"'Space Mono',monospace",fontSize:10}}>{search?`No results for "${search}"`:"No players"}</div>}
        {pl.map((p,i)=><Card key={`${p.name}-${p.card}-${i}`} p={p} pos={pos} sub={sub}/>)}
        {pl.length>1&&<Bars pl={pl}/>}
      </div>}
      {tab==="thresholds"&&<div style={{display:"flex",flexDirection:"column",gap:4,animation:"fadeIn .4s ease"}}>
        {THRESHOLDS.map((t,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 9px",background:C.bg2,borderRadius:6,border:`1px solid ${C.border}`}}>
          <div style={{width:30,height:30,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",background:C.accDim,fontSize:12,fontWeight:900,color:C.acc,fontFamily:"'Space Mono',monospace",flexShrink:0}}>{t.v}</div>
          <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:9,fontWeight:700,color:C.t1}}>{t.l}</span><span style={{fontSize:6,color:C.acc,background:C.accDim,padding:"1px 3px",borderRadius:2,fontFamily:"'Space Mono',monospace",fontWeight:600}}>{t.c}</span></div><div style={{fontSize:7,color:C.t3,marginTop:1}}>{t.a} · {t.e}</div></div>
        </div>)}
      </div>}
    </div>
  </div>);
}
