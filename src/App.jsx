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
  QB:{subs:null},
  HB:{subs:["Elusive","Power"]},
  WR:{subs:null},
  OL:{subs:["LT","LG","C","RG","RT"]},
  DL:{subs:["LEDG","DT","REDG"]},
  DB:{subs:["CB","FS","SS"]},
};

const ENGINES={
  QB:{engine:"QB META SCORE V2",formula:"QMS_V2 = [(AP_Score×.50)+(SPD_Adj×.20)+(THP×.30)]×REL_mult"},
  HB_Elusive:{engine:"ELUSIVE BACK ENGINE",formula:"E-RBVS = [(SPD×.35)+(COD×.30)+(REC×.20)+(ELU×.15)]×ACC_mult"},
  HB_Power:{engine:"POWER BACK ENGINE",formula:"P-RBVS = [(BTK×.30)+(SPD×.25)+(SFA×.25)+(TRK×.20)]×WGT_mult"},
  HB:{engine:"RB DUAL ENGINE",formula:"Select Elusive or Power to see formula"},
  WR:{engine:"WR EVAL ENGINE V2",formula:"WREE = (BEV×.35)+(RLS×.10)+(REC×.10)+(PDM×.15)+(AEQ×.30)"},
  OL:{engine:"OL DUAL BLOCKING ENGINE",formula:"P-TBS = [(PBK×.50)+(AWR×.30)+(STR×.20)]×WGT | R-TBS = [(RBK×.40)+(IBL×.30)+(STR×.30)]×SPD"},
  DL_LEDG:{engine:"EDGE RUSHER SCORE",formula:"E-MVS = [(BestRush×.40)+(ACC×.30)+(SPD×.30)]×Trait_gate"},
  DL_DT:{engine:"INTERIOR PRESSURE SCORE",formula:"I-MVS = [(BSH×.40)+(STR×.30)+(PMV×.30)]×WGT_mult"},
  DL_REDG:{engine:"EDGE RUSHER SCORE",formula:"E-MVS = [(BestRush×.40)+(ACC×.30)+(SPD×.30)]×Trait_gate"},
  DL:{engine:"DL SHED ENGINE V2",formula:"E-MVS (Edges) / I-MVS (Interior)"},
  DB:{engine:"TRUE COVERAGE SCORE V2",formula:"TCS_V2 = [(COV_avg×.30)+(SPD×.30)+(PRS×.15)+(AP_Val×.25)]×DNA_mult"},
};
function getEng(pos,sub){return ENGINES[sub?`${pos}_${sub}`:pos]||ENGINES[pos]||{engine:"—",formula:"—"};}

const QB_S=["SPD","AGI","THP","SAC","MAC","DAC"];
const HB_EL_S=["SPD","ACC","COD","REC","ELU"];
const HB_PW_S=["SPD","BTK","SFA","TRK"];
const HB_ALL_S=["SPD","ACC","COD","BTK","TRK"];
const WR_S=["SPD","CTH","SRR","MRR","DRR"];
const OL_S=["PBK","RBK","AWR","STR","IBL"];
const DL_EDGE_S=["SPD","ACC","PMV","FMV","STR"];
const DT_S=["BSH","PMV","STR","TAK","SPD"];
const CB_S=["SPD","MCV","ZCV","PRS","JMP"];
const FS_S=["SPD","MCV","ZCV","TAK","POW"];
const SS_S=["SPD","MCV","ZCV","TAK","POW"];
function gS(p,s){
  if(p==="QB")return QB_S;
  if(p==="HB"){if(s==="Elusive")return HB_EL_S;if(s==="Power")return HB_PW_S;return HB_ALL_S;}
  if(p==="WR")return WR_S;
  if(p==="OL")return OL_S;
  if(p==="DL")return s==="DT"?DT_S:DL_EDGE_S;
  if(p==="DB"){if(s==="CB")return CB_S;if(s==="FS")return FS_S;return SS_S;}
  return[];
}

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
  {pos:"QB",sub:"QB",label:"Quarterbacks"},
  {pos:"HB",sub:"Elusive",label:"Elusive Backs"},
  {pos:"HB",sub:"Power",label:"Power Backs"},
  {pos:"WR",sub:"WR",label:"Wide Receivers"},
  {pos:"OL",sub:"LT",label:"Left Tackles"},{pos:"OL",sub:"LG",label:"Left Guards"},
  {pos:"OL",sub:"C",label:"Centers"},{pos:"OL",sub:"RG",label:"Right Guards"},
  {pos:"OL",sub:"RT",label:"Right Tackles"},
  {pos:"DL",sub:"LEDG",label:"Left Edges"},{pos:"DL",sub:"DT",label:"Defensive Tackles"},
  {pos:"DL",sub:"REDG",label:"Right Edges"},
  {pos:"DB",sub:"CB",label:"Cornerbacks"},{pos:"DB",sub:"FS",label:"Free Safeties"},
  {pos:"DB",sub:"SS",label:"Strong Safeties"},
];

async function fetchLive(label,pos,sub){
  try{
    const r=await fetch("/api/proxy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({label,pos,sub})});
    if(!r.ok){console.error(`Proxy HTTP error for ${label}: ${r.status}`);return null;}
    const d=await r.json();
    const t=d.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n")||"";
    const c=t.replace(/```json|```/g,"").trim();
    const p=JSON.parse(c);
    if(Array.isArray(p)&&p.length>0&&p[0].name)return p;
  }catch(e){console.error(`Live fetch failed for ${label}:`,e);}
  return null;
}

function fPrice(p){if(!p||p<=0)return null;if(p>=1000000)return(p/1000000).toFixed(2).replace(/\.?0+$/,"")+"M";if(p>=1000)return Math.round(p/1000)+"K";return p.toLocaleString();}

function getRelTier(rel){
  const r=(rel||"").toLowerCase().replace(/[\s_-]/g,"");
  if(!r)return null;
  if(["slinger1","traditional4","generic1"].some(x=>r.includes(x)))return{tier:"S",mult:1.15,color:C.acc,label:"S-Tier"};
  if(["traditional5","slinger4"].some(x=>r.includes(x)))return{tier:"F",mult:0.85,color:C.err,label:"F-Tier"};
  if(["slinger3","generic3"].some(x=>r.includes(x)))return{tier:"A",mult:1.0,color:C.blue,label:"A-Tier"};
  return{tier:"?",mult:1.0,color:C.t4,label:"Unknown"};
}

function calcQMS(p){
  if(!p||p.pos!=="QB")return null;
  const abs=Array.isArray(p.abilities)?p.abilities:[];
  let apScore=0;
  for(const a of abs){
    const n=(a.name||"").toLowerCase();
    const ap=typeof a.ap==="number"?a.ap:99;
    if((n.includes("set feet lead")||n.includes("pass lead elite"))&&ap<=1)apScore=Math.max(apScore,50);
    else if(n.includes("gunslinger")&&ap===0)apScore=Math.max(apScore,30);
    else if((n.includes("hot route master")||n.includes("master tactician"))&&ap<=1)apScore=Math.max(apScore,20);
  }
  const spd=p.s?.SPD||0,agi=p.s?.AGI||0;
  const spdAdj=agi>0?(spd+agi)/2:spd;
  const thp=p.s?.THP||0;
  const rt=getRelTier(p.rel);
  const relMult=rt&&rt.tier!=="?"?rt.mult:1.0;
  return Math.round(((apScore*0.50)+(spdAdj*0.20)+(thp*0.30))*relMult*10)/10;
}

// E-RBVS: Elusive Back Value Score
function calcERBVS(p){
  if(!p||p.sub!=="Elusive")return null;
  const spd=p.s?.SPD||0,cod=p.s?.COD||0,rec=p.s?.REC||0,elu=p.s?.ELU||0,acc=p.s?.ACC||0;
  const base=(spd*0.35)+(cod*0.30)+(rec*0.20)+(elu*0.15);
  const accMult=acc>=97?1.05:1.0;
  return Math.round(base*accMult*10)/10;
}

// P-RBVS: Power Back Value Score
function calcPRBVS(p){
  if(!p||p.sub!=="Power")return null;
  const btk=p.s?.BTK||0,spd=p.s?.SPD||0,sfa=p.s?.SFA||0,trk=p.s?.TRK||0;
  const wgt=p.wgt||220;
  const base=(btk*0.30)+(spd*0.25)+(sfa*0.25)+(trk*0.20);
  const wgtMult=wgt>=245?1.15:wgt>=230?1.10:wgt<225?0.85:1.0;
  return Math.round(base*wgtMult*10)/10;
}

// P-TBS: Pass Blocking Score (OL)
function calcPTBS(p){
  if(!p||p.pos!=="OL")return null;
  const pbk=p.s?.PBK||0,awr=p.s?.AWR||0,str=p.s?.STR||0;
  const wgt=p.wgt||300;
  const base=(pbk*0.50)+(awr*0.30)+(str*0.20);
  const wgtMult=wgt>=330?1.15:wgt>=300?1.0:0.80;
  return Math.round(base*wgtMult*10)/10;
}

// R-TBS: Run Blocking Score (OL)
function calcRTBS(p){
  if(!p||p.pos!=="OL")return null;
  const rbk=p.s?.RBK||0,ibl=p.s?.IBL||0,str=p.s?.STR||0,spd=p.s?.SPD||0;
  const base=(rbk*0.40)+(ibl*0.30)+(str*0.30);
  const isInterior=["LG","C","RG"].includes(p.sub);
  const spdAdj=isInterior&&spd<75?0.90:1.0;
  return Math.round(base*spdAdj*10)/10;
}

// E-MVS: Edge Rusher Move Score (DL LEDG/REDG)
function calcEMVS(p){
  if(!p||!["LEDG","REDG"].includes(p.sub))return null;
  const pmv=p.s?.PMV||0,fmv=p.s?.FMV||0,acc=p.s?.ACC||0,spd=p.s?.SPD||0;
  const bestRush=Math.max(pmv,fmv);
  const base=(bestRush*0.40)+(acc*0.30)+(spd*0.30);
  const traits=p.traits||{};
  const hasBull=!!traits.bullRush,hasSwimSpin=!!(traits.swim||traits.spin);
  const traitMult=hasBull&&hasSwimSpin?1.10:hasBull||hasSwimSpin?1.0:0.50;
  return Math.round(base*traitMult*10)/10;
}

// I-MVS: Interior Move Score (DL DT)
function calcIMVS(p){
  if(!p||p.sub!=="DT")return null;
  const bsh=p.s?.BSH||0,str=p.s?.STR||0,pmv=p.s?.PMV||0;
  const wgt=p.wgt||310;
  const base=(bsh*0.40)+(str*0.30)+(pmv*0.30);
  const wgtMult=wgt>=340?1.15:wgt>=310?1.05:wgt<300?0.85:1.0;
  return Math.round(base*wgtMult*10)/10;
}

// TCS_V2: True Coverage Score V2 (DB)
function calcTCSV2(p){
  if(!p||p.pos!=="DB")return null;
  const mcv=p.s?.MCV||0,zcv=p.s?.ZCV||0,spd=p.s?.SPD||0,prs=p.s?.PRS||0;
  const covAvg=(mcv+zcv)/2;
  const abs=Array.isArray(p.abilities)?p.abilities:[];
  let apVal=0;
  for(const a of abs){
    const n=(a.name||"").toLowerCase();
    const ap=typeof a.ap==="number"?a.ap:99;
    if(ap===0&&(n.includes("deep out zone ko")||n.includes("one step ahead")))apVal=Math.max(apVal,100);
    else if(ap<=1&&(n.includes("pick artist")||n.includes("lurk artist")))apVal=Math.max(apVal,50);
  }
  const base=(covAvg*0.30)+(spd*0.30)+(prs*0.15)+(apVal*0.25);
  const dna=(p.dna||"").toLowerCase();
  const dnaMult=dna.includes("glitchy")?1.10:dna.includes("heavy")?0.85:1.0;
  return Math.round(base*dnaMult*10)/10;
}

// Dispatcher — get meta score for any position
function getMetaScore(p){
  if(!p)return null;
  if(p.pos==="QB")return calcQMS(p);
  if(p.pos==="HB"&&p.sub==="Elusive")return calcERBVS(p);
  if(p.pos==="HB"&&p.sub==="Power")return calcPRBVS(p);
  if(p.pos==="OL")return{ptbs:calcPTBS(p),rtbs:calcRTBS(p)};
  if(p.pos==="DL"&&["LEDG","REDG"].includes(p.sub))return calcEMVS(p);
  if(p.pos==="DL"&&p.sub==="DT")return calcIMVS(p);
  if(p.pos==="DB")return calcTCSV2(p);
  return null;
}
function getMetaNum(p){
  const m=getMetaScore(p);
  if(m===null)return 0;
  if(typeof m==="number")return m;
  if(m&&typeof m==="object"&&m.ptbs!=null)return(m.ptbs+m.rtbs)/2;
  return 0;
}

function QMSBreakdown({p}){
  const abs=Array.isArray(p.abilities)?p.abilities:[];
  const rt=getRelTier(p.rel);
  const qms=calcQMS(p);
  let apScore=0,bestAb=null;
  for(const a of abs){
    const n=(a.name||"").toLowerCase();
    const ap=typeof a.ap==="number"?a.ap:99;
    let pts=0;
    if((n.includes("set feet lead")||n.includes("pass lead elite"))&&ap<=1)pts=50;
    else if(n.includes("gunslinger")&&ap===0)pts=30;
    else if((n.includes("hot route master")||n.includes("master tactician"))&&ap<=1)pts=20;
    if(pts>apScore){apScore=pts;bestAb=a;}
  }
  const spd=p.s?.SPD||0,agi=p.s?.AGI||0,thp=p.s?.THP||0;
  const spdAdj=agi>0?((spd+agi)/2).toFixed(1):spd;
  const apColor=apScore>=50?C.acc:apScore>=30?C.elite:apScore>0?C.blue:C.t4;
  const qmsColor=qms>=80?C.acc:qms>=70?C.blue:qms>=60?C.warn:C.err;
  return(<div style={{marginTop:6,padding:"7px 8px",borderRadius:5,background:C.bg3,border:`1px solid ${C.borderHi}`}}>
    <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:5}}>QMS V2 BREAKDOWN</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3,marginBottom:4}}>
      <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:`1px solid ${apColor}22`}}>
        <div style={{fontSize:6,color:C.t3,fontFamily:"'Space Mono',monospace",marginBottom:1}}>AP SCORE ×0.50</div>
        <div style={{fontSize:13,fontWeight:800,color:apColor,fontFamily:"'Space Mono',monospace"}}>{apScore}<span style={{fontSize:7,color:C.t4}}>/50</span></div>
        <div style={{fontSize:6,color:C.t3,marginTop:1}}>{bestAb?`${bestAb.name} (${bestAb.ap}AP)`:"No elite abilities"}</div>
      </div>
      <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3}}>
        <div style={{fontSize:6,color:C.t3,fontFamily:"'Space Mono',monospace",marginBottom:1}}>SPD_ADJ ×0.20</div>
        <div style={{fontSize:13,fontWeight:800,color:C.t1,fontFamily:"'Space Mono',monospace"}}>{spdAdj}</div>
        <div style={{fontSize:6,color:C.t3,marginTop:1}}>({spd}+{agi})÷2</div>
      </div>
      <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3}}>
        <div style={{fontSize:6,color:C.t3,fontFamily:"'Space Mono',monospace",marginBottom:1}}>THP ×0.30</div>
        <div style={{fontSize:13,fontWeight:800,color:thp>=97?C.acc:thp>=94?C.elite:C.t1,fontFamily:"'Space Mono',monospace"}}>{thp}</div>
      </div>
      <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:rt?`1px solid ${rt.color}33`:"none"}}>
        <div style={{fontSize:6,color:C.t3,fontFamily:"'Space Mono',monospace",marginBottom:1}}>REL MULT</div>
        <div style={{fontSize:13,fontWeight:800,color:rt?rt.color:C.t4,fontFamily:"'Space Mono',monospace"}}>{rt?`×${rt.mult}`:"×1.00"}</div>
        <div style={{fontSize:6,color:rt?rt.color:C.t4,marginTop:1}}>{rt?`${rt.label} · ${p.rel}`:"no release data"}</div>
      </div>
    </div>
    <div style={{padding:"5px 8px",borderRadius:3,background:qms>0?`${qmsColor}18`:C.bg4,border:`1px solid ${qms>0?qmsColor+"44":C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:"'Space Mono',monospace",letterSpacing:1}}>FINAL QMS SCORE</span>
      <span style={{fontSize:18,fontWeight:900,color:qms>0?qmsColor:C.t4,fontFamily:"'Space Mono',monospace"}}>{qms>0?qms:"—"}</span>
    </div>
  </div>);
}

function ScoreBreakdown({p,pos,sub}){
  const mono="'Space Mono',monospace";
  const cell=(label,val,extra)=>(<div style={{padding:"4px 6px",background:C.bg4,borderRadius:3}}>
    <div style={{fontSize:6,color:C.t3,fontFamily:mono,marginBottom:1}}>{label}</div>
    <div style={{fontSize:13,fontWeight:800,color:val>=95?C.acc:val>=85?C.elite:C.t1,fontFamily:mono}}>{typeof val==="number"?val.toFixed(1):val}</div>
    {extra&&<div style={{fontSize:6,color:C.t3,marginTop:1}}>{extra}</div>}
  </div>);

  if(p.pos==="HB"&&p.sub==="Elusive"){
    const spd=p.s?.SPD||0,cod=p.s?.COD||0,rec=p.s?.REC||0,elu=p.s?.ELU||0,acc=p.s?.ACC||0;
    const accM=acc>=97?1.05:1.0;const score=calcERBVS(p);const sc=score>=90?C.acc:score>=80?C.blue:C.warn;
    return(<div style={{marginTop:6,padding:"7px 8px",borderRadius:5,background:C.bg3,border:`1px solid ${C.borderHi}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:mono,letterSpacing:1,marginBottom:5}}>E-RBVS BREAKDOWN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3,marginBottom:4}}>
        {cell(`SPD ×0.35`,spd)}{cell(`COD ×0.30`,cod)}{cell(`REC ×0.20`,rec)}{cell(`ELU ×0.15`,elu)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:`1px solid ${accM>1?C.acc+"33":"transparent"}`}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>ACC MULT</div>
          <div style={{fontSize:13,fontWeight:800,color:accM>1?C.acc:C.t1,fontFamily:mono}}>×{accM.toFixed(2)}</div>
          <div style={{fontSize:6,color:C.t3}}>ACC {acc} {accM>1?"≥97 bonus":""}</div>
        </div>
        <div style={{padding:"5px 8px",borderRadius:3,background:`${sc}18`,border:`1px solid ${sc}44`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:mono}}>E-RBVS</div>
          <div style={{fontSize:18,fontWeight:900,color:sc,fontFamily:mono}}>{score||"—"}</div>
        </div>
      </div>
    </div>);
  }

  if(p.pos==="HB"&&p.sub==="Power"){
    const btk=p.s?.BTK||0,spd=p.s?.SPD||0,sfa=p.s?.SFA||0,trk=p.s?.TRK||0,wgt=p.wgt||220;
    const wM=wgt>=245?1.15:wgt>=230?1.10:wgt<225?0.85:1.0;const score=calcPRBVS(p);const sc=score>=90?C.acc:score>=80?C.blue:C.warn;
    return(<div style={{marginTop:6,padding:"7px 8px",borderRadius:5,background:C.bg3,border:`1px solid ${C.borderHi}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:mono,letterSpacing:1,marginBottom:5}}>P-RBVS BREAKDOWN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3,marginBottom:4}}>
        {cell(`BTK ×0.30`,btk)}{cell(`SPD ×0.25`,spd)}{cell(`SFA ×0.25`,sfa)}{cell(`TRK ×0.20`,trk)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:`1px solid ${wM!==1?C.acc+"33":"transparent"}`}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>WGT MULT</div>
          <div style={{fontSize:13,fontWeight:800,color:wM>=1.1?C.acc:wM<1?C.err:C.t1,fontFamily:mono}}>×{wM.toFixed(2)}</div>
          <div style={{fontSize:6,color:C.t3}}>{wgt} lbs</div>
        </div>
        <div style={{padding:"5px 8px",borderRadius:3,background:`${sc}18`,border:`1px solid ${sc}44`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:mono}}>P-RBVS</div>
          <div style={{fontSize:18,fontWeight:900,color:sc,fontFamily:mono}}>{score||"—"}</div>
        </div>
      </div>
    </div>);
  }

  if(p.pos==="OL"){
    const pbk=p.s?.PBK||0,rbk=p.s?.RBK||0,awr=p.s?.AWR||0,str=p.s?.STR||0,ibl=p.s?.IBL||0,spd=p.s?.SPD||0,wgt=p.wgt||300;
    const ptbs=calcPTBS(p),rtbs=calcRTBS(p);
    const wM=wgt>=330?1.15:wgt>=300?1.0:0.80;const isInt=["LG","C","RG"].includes(p.sub);const sM=isInt&&spd<75?0.90:1.0;
    const psc=ptbs>=90?C.acc:ptbs>=80?C.blue:C.warn;const rsc=rtbs>=90?C.acc:rtbs>=80?C.blue:C.warn;
    return(<div style={{marginTop:6,padding:"7px 8px",borderRadius:5,background:C.bg3,border:`1px solid ${C.borderHi}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:mono,letterSpacing:1,marginBottom:5}}>OL DUAL BLOCKING BREAKDOWN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3,marginBottom:4}}>
        {cell(`PBK`,pbk)}{cell(`RBK`,rbk)}{cell(`AWR`,awr)}{cell(`STR`,str)}{cell(`IBL`,ibl)}{cell(`SPD`,spd)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,marginBottom:3}}>
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>WGT MULT (Pass)</div>
          <div style={{fontSize:11,fontWeight:800,color:wM>=1.1?C.acc:wM<1?C.err:C.t1,fontFamily:mono}}>×{wM.toFixed(2)} <span style={{fontSize:7,color:C.t3}}>{wgt}lbs</span></div>
        </div>
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>SPD ADJ (Run)</div>
          <div style={{fontSize:11,fontWeight:800,color:sM<1?C.err:C.t1,fontFamily:mono}}>×{sM.toFixed(2)} <span style={{fontSize:7,color:C.t3}}>{isInt?"G/C":"Tackle"}</span></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
        <div style={{padding:"5px 8px",borderRadius:3,background:`${psc}18`,border:`1px solid ${psc}44`,textAlign:"center"}}>
          <div style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:mono}}>P-TBS</div>
          <div style={{fontSize:16,fontWeight:900,color:psc,fontFamily:mono}}>{ptbs||"—"}</div>
        </div>
        <div style={{padding:"5px 8px",borderRadius:3,background:`${rsc}18`,border:`1px solid ${rsc}44`,textAlign:"center"}}>
          <div style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:mono}}>R-TBS</div>
          <div style={{fontSize:16,fontWeight:900,color:rsc,fontFamily:mono}}>{rtbs||"—"}</div>
        </div>
      </div>
    </div>);
  }

  if(p.pos==="DL"&&["LEDG","REDG"].includes(p.sub)){
    const pmv=p.s?.PMV||0,fmv=p.s?.FMV||0,acc=p.s?.ACC||0,spd=p.s?.SPD||0;
    const bestRush=Math.max(pmv,fmv);const traits=p.traits||{};
    const hasBull=!!traits.bullRush,hasSS=!!(traits.swim||traits.spin);
    const tM=hasBull&&hasSS?1.10:hasBull||hasSS?1.0:0.50;
    const score=calcEMVS(p);const sc=score>=90?C.acc:score>=80?C.blue:C.warn;
    return(<div style={{marginTop:6,padding:"7px 8px",borderRadius:5,background:C.bg3,border:`1px solid ${C.borderHi}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:mono,letterSpacing:1,marginBottom:5}}>E-MVS BREAKDOWN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3,marginBottom:4}}>
        {cell(`BEST RUSH ×0.40`,bestRush,`PMV ${pmv} / FMV ${fmv}`)}{cell(`ACC ×0.30`,acc)}{cell(`SPD ×0.30`,spd)}
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:`1px solid ${tM>=1.1?C.acc+"33":tM<1?C.err+"33":"transparent"}`}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>TRAIT GATE</div>
          <div style={{fontSize:13,fontWeight:800,color:tM>=1.1?C.acc:tM<1?C.err:C.t1,fontFamily:mono}}>×{tM.toFixed(2)}</div>
          <div style={{fontSize:6,color:C.t3}}>{hasBull?"Bull✓":"Bull✕"} {hasSS?"Swim/Spin✓":"Swim/Spin✕"}</div>
        </div>
      </div>
      <div style={{padding:"5px 8px",borderRadius:3,background:`${sc}18`,border:`1px solid ${sc}44`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:mono}}>E-MVS</span>
        <span style={{fontSize:18,fontWeight:900,color:sc,fontFamily:mono}}>{score||"—"}</span>
      </div>
    </div>);
  }

  if(p.pos==="DL"&&p.sub==="DT"){
    const bsh=p.s?.BSH||0,str=p.s?.STR||0,pmv=p.s?.PMV||0,wgt=p.wgt||310;
    const wM=wgt>=340?1.15:wgt>=310?1.05:wgt<300?0.85:1.0;
    const score=calcIMVS(p);const sc=score>=90?C.acc:score>=80?C.blue:C.warn;
    return(<div style={{marginTop:6,padding:"7px 8px",borderRadius:5,background:C.bg3,border:`1px solid ${C.borderHi}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:mono,letterSpacing:1,marginBottom:5}}>I-MVS BREAKDOWN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3,marginBottom:4}}>
        {cell(`BSH ×0.40`,bsh)}{cell(`STR ×0.30`,str)}{cell(`PMV ×0.30`,pmv)}
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:`1px solid ${wM!==1?C.acc+"33":"transparent"}`}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>WGT MULT</div>
          <div style={{fontSize:13,fontWeight:800,color:wM>=1.1?C.acc:wM<1?C.err:C.t1,fontFamily:mono}}>×{wM.toFixed(2)}</div>
          <div style={{fontSize:6,color:C.t3}}>{wgt} lbs</div>
        </div>
      </div>
      <div style={{padding:"5px 8px",borderRadius:3,background:`${sc}18`,border:`1px solid ${sc}44`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:mono}}>I-MVS</span>
        <span style={{fontSize:18,fontWeight:900,color:sc,fontFamily:mono}}>{score||"—"}</span>
      </div>
    </div>);
  }

  if(p.pos==="DB"){
    const mcv=p.s?.MCV||0,zcv=p.s?.ZCV||0,spd=p.s?.SPD||0,prs=p.s?.PRS||0;
    const covAvg=((mcv+zcv)/2).toFixed(1);
    const abs=Array.isArray(p.abilities)?p.abilities:[];
    let apVal=0,bestAb=null;
    for(const a of abs){const n=(a.name||"").toLowerCase();const ap=typeof a.ap==="number"?a.ap:99;
      if(ap===0&&(n.includes("deep out zone ko")||n.includes("one step ahead"))){if(100>apVal){apVal=100;bestAb=a;}}
      else if(ap<=1&&(n.includes("pick artist")||n.includes("lurk artist"))){if(50>apVal){apVal=50;bestAb=a;}}
    }
    const dna=(p.dna||"").toLowerCase();const dM=dna.includes("glitchy")?1.10:dna.includes("heavy")?0.85:1.0;
    const score=calcTCSV2(p);const sc=score>=90?C.acc:score>=80?C.blue:C.warn;
    return(<div style={{marginTop:6,padding:"7px 8px",borderRadius:5,background:C.bg3,border:`1px solid ${C.borderHi}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:mono,letterSpacing:1,marginBottom:5}}>TCS V2 BREAKDOWN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3,marginBottom:4}}>
        {cell(`COV_AVG ×0.30`,parseFloat(covAvg),`MCV ${mcv} + ZCV ${zcv}`)}
        {cell(`SPD ×0.30`,spd)}{cell(`PRS ×0.15`,prs)}
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:`1px solid ${apVal>0?C.acc+"33":"transparent"}`}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>AP VALUE ×0.25</div>
          <div style={{fontSize:13,fontWeight:800,color:apVal>=100?C.acc:apVal>0?C.blue:C.t4,fontFamily:mono}}>{apVal}</div>
          <div style={{fontSize:6,color:C.t3}}>{bestAb?`${bestAb.name} (${bestAb.ap}AP)`:"No key abilities"}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
        <div style={{padding:"4px 6px",background:C.bg4,borderRadius:3,border:`1px solid ${dM!==1?(dM>1?C.acc:C.err)+"33":"transparent"}`}}>
          <div style={{fontSize:6,color:C.t3,fontFamily:mono}}>DNA MULT</div>
          <div style={{fontSize:13,fontWeight:800,color:dM>1?C.acc:dM<1?C.err:C.t1,fontFamily:mono}}>×{dM.toFixed(2)}</div>
          <div style={{fontSize:6,color:C.t3}}>{p.dna||"Standard"}</div>
        </div>
        <div style={{padding:"5px 8px",borderRadius:3,background:`${sc}18`,border:`1px solid ${sc}44`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:7,fontWeight:700,color:C.t2,fontFamily:mono}}>TCS V2</div>
          <div style={{fontSize:18,fontWeight:900,color:sc,fontFamily:mono}}>{score||"—"}</div>
        </div>
      </div>
    </div>);
  }

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
          {pos==="QB"&&getRelTier(p.rel)&&getRelTier(p.rel).tier!=="?"&&(()=>{const rt=getRelTier(p.rel);return<span style={{fontSize:7,color:rt.color,background:`${rt.color}18`,padding:"1px 4px",borderRadius:3,fontFamily:"'Space Mono',monospace",border:`1px solid ${rt.color}33`}}>{rt.label}</span>;})()}
          {p.ttB&&<span style={{fontSize:7,color:C.blue,background:C.blueDim,padding:"1px 4px",borderRadius:3,fontFamily:"'Space Mono',monospace"}}>TT+2</span>}
        </div>
        <div style={{fontSize:9,color:C.t3,marginTop:1}}>{p.card} · {p.ovr} OVR</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2,flexWrap:"wrap"}}>
          <span style={{display:"flex",alignItems:"center",gap:3}}>
            <span style={{fontSize:11,fontWeight:700,color:C.acc,fontFamily:"'Space Mono',monospace"}}>▲ {p.start}%</span>
            <span style={{fontSize:7,color:C.t3}}>starting</span>
          </span>
          {(()=>{const mn=getMetaNum(p);if(!mn||mn<=0)return null;const sc=mn>=90?C.acc:mn>=80?C.blue:mn>=70?C.warn:C.err;const eng=getEng(p.pos,p.sub);const lbl=p.pos==="QB"?"QMS":p.pos==="OL"?"TBS":p.pos==="DL"?(["LEDG","REDG"].includes(p.sub)?"E-MVS":"I-MVS"):p.pos==="DB"?"TCS":p.sub==="Elusive"?"E-RBVS":"P-RBVS";return<span style={{display:"flex",alignItems:"center",gap:2,padding:"1px 5px",borderRadius:3,background:`${sc}18`,border:`1px solid ${sc}33`}}><span style={{fontSize:7,color:sc,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{lbl}</span><span style={{fontSize:10,fontWeight:800,color:sc,fontFamily:"'Space Mono',monospace"}}>{mn.toFixed(1)}</span></span>;})()}
          {fPrice(p.price)&&<span style={{display:"flex",alignItems:"center",gap:2,padding:"1px 5px",borderRadius:3,background:C.warnDim,border:`1px solid ${C.warn}33`}}>
            <span style={{fontSize:9,color:C.coin}}>🪙</span>
            <span style={{fontSize:9,fontWeight:700,color:C.warn,fontFamily:"'Space Mono',monospace"}}>{fPrice(p.price)}</span>
          </span>}
        </div>
      </div>
      <div style={{fontSize:8,color:C.t4,transform:o?"rotate(180deg)":"",transition:"transform .2s"}}>▼</div>
    </div>
    {o&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,animation:"fadeIn .3s ease"}}>
      {pos==="QB"?<QMSBreakdown p={p}/>:<ScoreBreakdown p={p} pos={pos} sub={sub}/>}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(stats.length,5)},1fr)`,gap:4,marginTop:6}}>
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
  const[players,setPlayers]=useState(INIT),[loaded,setLoaded]=useState(false);
  const[rfr,setRfr]=useState(false),[rfrP,setRfrP]=useState(""),[lr,setLr]=useState("Initial · Mar 2 2026 · mut.gg verified");
  const[rLog,setRLog]=useState([]),[showLog,setShowLog]=useState(false),[rCount,setRCount]=useState(0);

  useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap";l.rel="stylesheet";document.head.appendChild(l);setTimeout(()=>setLoaded(true),150);},[]);
  useEffect(()=>{setSub(null);},[pos]);

  const doRefresh=useCallback(async()=>{
    if(rfr)return;
    setRfr(true);
    const sessionId=Date.now();
    const initLog=RM.map(rm=>({label:rm.label,pos:rm.pos,sub:rm.sub,status:"pending",ts:"",count:0,sessionId}));
    setRLog(initLog);setShowLog(true);
    let nP=[...players],up=0;
    for(let i=0;i<RM.length;i++){
      const rm=RM[i];
      setRfrP(`${rm.label}...`);
      setRLog(prev=>prev.map((e,idx)=>idx===i?{...e,status:"running",ts:new Date().toLocaleTimeString("en",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"})}:e));
      const res=await fetchLive(rm.label,rm.pos,rm.sub);
      if(res&&Array.isArray(res)){
        nP=nP.filter(p=>!(p.pos===rm.pos&&p.sub===rm.sub));
        res.forEach(r=>nP.push({pos:rm.pos,sub:rm.sub,name:r.name||"?",card:r.card||"?",ovr:r.ovr||0,arch:r.arch||rm.sub,start:r.start||0,price:r.price||0,wgt:r.wgt||0,rel:r.rel||"",abilities:Array.isArray(r.abilities)?r.abilities:[],traits:r.traits||{},dna:r.dna||"",s:r.s||{}}));
        up++;
        setRLog(prev=>prev.map((e,idx)=>idx===i?{...e,status:"ok",count:res.length}:e));
      } else {
        setRLog(prev=>prev.map((e,idx)=>idx===i?{...e,status:"fail"}:e));
      }
      await new Promise(r=>setTimeout(r,250));
    }
    setPlayers(nP);setRCount(c=>c+1);setLr(`${new Date().toLocaleTimeString()} · ${up}/${RM.length} refreshed`);setRfrP("");setRfr(false);
  },[rfr,players]);

  const cfg=PC[pos];
  const pl=useMemo(()=>{
    let l=players.filter(p=>p.pos===pos);
    if(sub)l=l.filter(p=>p.sub===sub);
    if(tt)l=l.map(p=>({...p,s:{...p.s,SPD:p.s.SPD?Math.min(99,p.s.SPD+2):p.s.SPD},ttB:true}));
    if(search.trim()){const q=search.toLowerCase();l=l.filter(p=>p.name.toLowerCase().includes(q)||p.card.toLowerCase().includes(q));}
    return l.sort((a,b)=>{
      const ma=getMetaNum(a),mb=getMetaNum(b);
      if(ma!==mb)return mb-ma;
      return b.start-a.start;
    });
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

    {rLog.length>0&&<div style={{borderBottom:`1px solid ${C.border}`,background:C.bg2}}>
      <button onClick={()=>setShowLog(v=>!v)} style={{width:"100%",padding:"5px 15px",display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:7,fontWeight:700,color:C.t3,fontFamily:"'Space Mono',monospace",letterSpacing:1}}>REFRESH LOG</span>
        {rCount>0&&<span style={{fontSize:6,color:C.t4,fontFamily:"'Space Mono',monospace"}}>#{rCount}</span>}
        <div style={{display:"flex",gap:2,flex:1,flexWrap:"wrap"}}>
          {rLog.map((e,i)=>{
            const dot=e.status==="ok"?C.acc:e.status==="fail"?C.err:e.status==="running"?C.warn:C.t4;
            return<div key={i} title={`${e.label}: ${e.status}${e.status==="ok"?` (${e.count} players)`:""}`} style={{width:6,height:6,borderRadius:"50%",background:dot,flexShrink:0,animation:e.status==="running"?"pulse .8s infinite":"none"}}/>;
          })}
        </div>
        {rfr?<span style={{fontSize:6,color:C.warn,fontFamily:"'Space Mono',monospace",animation:"pulse 1s infinite"}}>RUNNING</span>:
          rLog.every(e=>e.status==="ok")?<span style={{fontSize:6,color:C.acc,fontFamily:"'Space Mono',monospace"}}>✓ ALL OK</span>:
          rLog.filter(e=>e.status==="fail").length===rLog.length&&rLog.every(e=>["ok","fail"].includes(e.status))?<span style={{fontSize:6,color:C.err,fontFamily:"'Space Mono',monospace"}}>⚠ ALL FAILED</span>:
          rLog.every(e=>["ok","fail"].includes(e.status))?<span style={{fontSize:6,color:C.warn,fontFamily:"'Space Mono',monospace"}}>{rLog.filter(e=>e.status==="ok").length}/{rLog.length} OK</span>:null}
        <span style={{fontSize:7,color:C.t4,transform:showLog?"rotate(180deg)":"",transition:"transform .2s",display:"inline-block"}}>▼</span>
      </button>
      {showLog&&<div style={{padding:"5px 15px 8px",animation:"fadeIn .2s ease"}}>
        {rLog.every(e=>e.status==="fail")&&<div style={{padding:"5px 8px",marginBottom:6,borderRadius:4,background:C.errDim,border:`1px solid ${C.err}33`,fontSize:7,color:C.err,fontFamily:"'Space Mono',monospace"}}>
          ⚠ ALL POSITIONS FAILED — This is likely a CORS block. Browsers prevent direct calls to the Anthropic API from a webpage for security. The refresh animation runs but no live data is fetched. A backend proxy is needed to fix this.
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3}}>
          {rLog.map((e,i)=>{
            const sc=e.status==="ok"?C.acc:e.status==="fail"?C.err:e.status==="running"?C.warn:C.t4;
            const bg=e.status==="ok"?C.accDim:e.status==="fail"?C.errDim:e.status==="running"?C.warnDim:C.bg3;
            const ic=e.status==="ok"?"✓":e.status==="fail"?"✕":e.status==="running"?"⟳":"·";
            return<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 6px",borderRadius:3,background:bg,border:`1px solid ${sc}22`}}>
              <span style={{fontSize:8,color:sc,fontFamily:"'Space Mono',monospace",width:8,textAlign:"center",animation:e.status==="running"?"spin .7s linear infinite":"none",display:"inline-block"}}>{ic}</span>
              <span style={{fontSize:7,color:C.t2,fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.label}</span>
              {e.status==="ok"&&<span style={{fontSize:6,color:C.t3,fontFamily:"'Space Mono',monospace"}}>{e.count}p</span>}
              {e.ts&&<span style={{fontSize:6,color:C.t4,fontFamily:"'Space Mono',monospace"}}>{e.ts}</span>}
            </div>;
          })}
        </div>
      </div>}
    </div>}

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

    {(()=>{const eng=getEng(pos,sub);return<div style={{margin:"7px 15px 0",padding:"7px 9px",borderRadius:6,background:`linear-gradient(135deg,${C.bg2},${C.bg4})`,border:`1px solid ${C.border}`}}>
      <div style={{fontSize:7,color:C.acc,fontWeight:700,fontFamily:"'Space Mono',monospace",letterSpacing:1,marginBottom:1}}>{eng.engine.toUpperCase()}</div>
      <div style={{fontSize:9,color:C.t1,fontFamily:"'Space Mono',monospace",fontWeight:400,opacity:.85,overflowX:"auto",whiteSpace:"nowrap"}}>{eng.formula}</div>
    </div>;})()}

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
