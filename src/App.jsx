import { useState, useMemo, useRef, useEffect } from "react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const C={navy:"#0a1628",navyMid:"#0f2040",navyLight:"#162d52",blue:"#1e6fff",blueLight:"#4d8fff",bluePale:"#e8f0fe",blueFrost:"#f0f5ff",cyan:"#00c8e0",white:"#ffffff",sand:"#f4f7fc",sandDark:"#e8edf5",text:"#0a1628",muted:"#5a7099",border:"#d6e0f0",green:"#00b87a",greenPale:"#e0f7f0",red:"#e8365d",redPale:"#fde8ee",yellow:"#f5a623",gold:"#c9a84c"};
const CATS=["Cash","Épargne","Bourse","Immobilier","Crowdfunding","Crypto"];
const CAT_COLOR={Cash:C.blue,Épargne:C.cyan,Bourse:C.gold,Immobilier:C.green,Crowdfunding:"#8b5cf6",Crypto:C.yellow};
const PROFIL_COLORS=["#1e6fff","#00c8e0","#c9a84c","#e8365d","#00b87a","#8b5cf6","#f97316","#ec4899"];
const DEVISES=["EUR","CAD","USD","GBP","CHF"];
const ML=k=>{if(!k)return"";const[y,mo]=k.split("-");const M=["Jan","Fév","Mar","Avr","Mai","Jun","Juil","Aoû","Sep","Oct","Nov","Déc"];return`${M[parseInt(mo)-1]} ${y.slice(2)}`;};
const fmt=n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtR=n=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2}).format(n||0);
const fmtP=n=>`${n>=0?"+":""}${(n||0).toFixed(1)}%`;
const eur=(c,v,t)=>c.devise!=="EUR"?(v||0)*(t?.[c.devise]||1):(v||0);
const EMPTY={profils:[],comptes:[],entries:{},taux:{},objectif:{montant:0,date:""}};
const DEMO={
  profils:[{id:"yd",nom:"YD",couleur:"#1e6fff"},{id:"mc",nom:"MC",couleur:"#00c8e0"}],
  comptes:[
    {id:"c1",nom:"Boursobank CC",cat:"Cash",devise:"EUR",profilId:"yd",valInit:0},{id:"c2",nom:"Revolut",cat:"Cash",devise:"EUR",profilId:"yd",valInit:0},
    {id:"c3",nom:"Livret A",cat:"Épargne",devise:"EUR",profilId:"yd",valInit:22950},{id:"c4",nom:"CEL",cat:"Épargne",devise:"EUR",profilId:"yd",valInit:15300},
    {id:"c5",nom:"PEA",cat:"Bourse",devise:"EUR",profilId:"yd",valInit:7500},{id:"c6",nom:"Assurance Vie",cat:"Bourse",devise:"EUR",profilId:"yd",valInit:2000},
    {id:"c7",nom:"Bricks",cat:"Immobilier",devise:"EUR",profilId:"yd",valInit:9500},{id:"c8",nom:"Lita",cat:"Crowdfunding",devise:"EUR",profilId:"yd",valInit:500},
    {id:"c9",nom:"Crypto",cat:"Crypto",devise:"EUR",profilId:"yd",valInit:10000},{id:"c10",nom:"Desjardins CC",cat:"Cash",devise:"CAD",profilId:"yd",valInit:0},
    {id:"c11",nom:"Boursobank CC",cat:"Cash",devise:"EUR",profilId:"mc",valInit:0},{id:"c12",nom:"Livret A",cat:"Épargne",devise:"EUR",profilId:"mc",valInit:22950},
    {id:"c13",nom:"CEL",cat:"Épargne",devise:"EUR",profilId:"mc",valInit:15300},{id:"c14",nom:"Desjardins CC",cat:"Cash",devise:"CAD",profilId:"mc",valInit:0},
    {id:"c15",nom:"Desjardins Épargne",cat:"Épargne",devise:"CAD",profilId:"mc",valInit:0},
  ],
  entries:{
    "2025-12":{c1:20243,c2:501,c3:22950,c4:15300,c5:4824,c6:502,c7:7159,c8:500,c9:8313,c10:7420,c11:3197,c12:22950,c13:15300,c14:7420,c15:5},
    "2026-01":{c1:19771,c2:548,c3:22950,c4:15300,c5:4906,c6:793,c7:9758,c8:500,c9:7938,c10:7420,c11:3287,c12:22950,c13:15300,c14:7420,c15:5},
    "2026-02":{c1:20991,c2:513,c3:23160,c4:15317,c5:4837,c6:1600,c7:9799,c8:500,c9:6695,c10:7420,c11:4030,c12:22990,c13:15311,c14:7420,c15:5},
    "2026-03":{c1:20114,c2:408,c3:23160,c4:15317,c5:7491,c6:2048,c7:9842,c8:500,c9:6220,c10:7420,c11:4169,c12:22990,c13:15311,c14:7420,c15:5},
  },
  taux:{"2025-12":{CAD:0.617},"2026-01":{CAD:0.620},"2026-02":{CAD:0.617},"2026-03":{CAD:0.635}},
  objectif:{montant:250000,date:"2028-06-01"}
};

function mtotals(data,mk){const e=data.entries[mk]||{},t=data.taux[mk]||{};const byP={};data.profils.forEach(p=>{byP[p.id]=0;});const byCat={};let crypto=0,grand=0;data.comptes.forEach(c=>{const v=eur(c,e[c.id],t);if(byP[c.profilId]!==undefined)byP[c.profilId]+=v;byCat[c.cat]=(byCat[c.cat]||0)+v;if(c.cat==="Crypto")crypto+=v;grand+=v;});return{byP,byCat,crypto,grand,grandHC:grand-crypto};}
function evoSeries(data){return Object.keys(data.entries).sort().map(m=>{const t=mtotals(data,m);const r={m:ML(m),total:Math.round(t.grandHC),crypto:Math.round(t.crypto)};data.profils.forEach(p=>{r[p.id]=Math.round(t.byP[p.id]||0);});return r;});}

const G=`
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Outfit',sans-serif;background:#f4f7fc;color:#0a1628;}
.sf{font-family:'DM Serif Display',serif;}
input,select{font-family:'Outfit',sans-serif;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#4d8fff;border-radius:2px;}
.card{background:white;border:1.5px solid #d6e0f0;border-radius:16px;padding:24px;}
.kpi{background:white;border:1.5px solid #d6e0f0;border-radius:14px;padding:20px;transition:all .18s;}
.kpi:hover{box-shadow:0 6px 24px rgba(30,111,255,.1);transform:translateY(-2px);}
.si{padding:10px 14px;border-radius:12px;cursor:pointer;display:flex;align-items:center;gap:11px;font-size:14px;font-weight:500;color:#5a7099;transition:all .15s;}
.si:hover{background:#162d52;color:white;}
.si.act{background:#1e6fff;color:white;box-shadow:0 4px 12px rgba(30,111,255,.35);}
.inp{border:1.5px solid #d6e0f0;border-radius:10px;padding:9px 13px;font-size:14px;width:100%;color:#0a1628;background:#f4f7fc;outline:none;transition:border .15s;}
.inp:focus{border-color:#1e6fff;background:white;}
.bp{background:#1e6fff;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s;}
.bp:hover{background:#4d8fff;}
.bg{background:transparent;color:#5a7099;border:1.5px solid #d6e0f0;border-radius:10px;padding:9px 18px;font-size:14px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s;}
.bg:hover{border-color:#1e6fff;color:#1e6fff;}
.bd{background:#fde8ee;color:#e8365d;border:none;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:'Outfit',sans-serif;}
.bd:hover{background:#e8365d;color:white;}
.bsm{background:#f0f5ff;color:#1e6fff;border:none;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;}
.bsm:hover{background:#1e6fff;color:white;}
.badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;}
.bb{background:#e8f0fe;color:#1e6fff;}
.bm{background:#e8edf5;color:#5a7099;}
.tbl{width:100%;border-collapse:collapse;font-size:13px;}
.tbl th{background:#0a1628;color:white;padding:10px 16px;text-align:left;font-weight:500;font-size:11px;letter-spacing:.05em;text-transform:uppercase;}
.tbl td{padding:10px 16px;border-bottom:1px solid #d6e0f0;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr:hover td{background:#f0f5ff;}
.overlay{position:fixed;inset:0;background:rgba(10,22,40,.65);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;}
.mbox{background:white;border-radius:22px;padding:32px;width:min(520px,92vw);max-height:88vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.25);}
.anim{animation:fu .3s ease both;}
@keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.pbar{height:6px;background:#e8edf5;border-radius:3px;overflow:hidden;}
.pfill{height:100%;border-radius:3px;background:linear-gradient(90deg,#1e6fff,#00c8e0);transition:width .4s;}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.ptab{border-radius:12px;padding:9px 20px;cursor:pointer;transition:all .18s;border:2px solid;font-size:13px;font-weight:600;font-family:'Outfit',sans-serif;}
`;

function Modal({title,onClose,children,width=520}){
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[]);
  return <div className="overlay" onClick={onClose}><div className="mbox" style={{width:`min(${width}px,92vw)`}} onClick={e=>e.stopPropagation()}>{title&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div className="sf" style={{fontSize:21,color:C.navy}}>{title}</div><button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted}}>✕</button></div>}{children}</div></div>;
}
function Field({label,children,hint}){return <div><label style={{display:"block",fontSize:11,fontWeight:600,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>{children}{hint&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{hint}</div>}</div>;}
function KPI({label,value,sub,trend,color,icon}){return <div className="kpi" style={{borderTop:`3px solid ${color}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase"}}>{label}</div><span style={{fontSize:18}}>{icon}</span></div><div className="sf" style={{fontSize:26,color:C.navy,lineHeight:1}}>{value}</div>{(sub||trend!==undefined)&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>{trend!==undefined&&<span style={{fontSize:11,fontWeight:700,color:trend>=0?C.green:C.red}}>{trend>=0?"▲":"▼"} {fmt(Math.abs(trend))}</span>}<span style={{fontSize:11,color:C.muted}}>{sub}</span></div>}</div>;}
function Empty({icon,title,desc,action}){return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 40px",textAlign:"center",gap:14}}><div style={{fontSize:44}}>{icon}</div><div className="sf" style={{fontSize:22,color:C.navy}}>{title}</div><div style={{fontSize:14,color:C.muted,maxWidth:340,lineHeight:1.6}}>{desc}</div>{action}</div>;}

function normalizeImport(d){
  if(d.tauxCad&&!d.taux){const taux={};Object.entries(d.tauxCad).forEach(([m,v])=>{taux[m]={CAD:v};});d={...d,taux};}
  return {profils:[],comptes:[],entries:{},taux:{},...d,objectif:d.objectif||{montant:0,date:""}};
}

function Onboarding({onStart,onImport}){
  const [step,setStep]=useState(0);
  const ref=useRef();
  const steps=[
    {icon:"🏦",title:"Bienvenue sur Money",desc:"Suis l'évolution de ton patrimoine mois par mois — seul ou à plusieurs.",
      body:<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["📊","Graphiques","Visualise l'évolution, répartition et rentabilité"],["✏️","Données","Saisis tes soldes chaque début de mois"],["⚙️","Paramétrage","Configure tes profils, comptes et objectifs"]].map(([ic,t,d])=>(
          <div key={t} style={{display:"flex",gap:14,alignItems:"flex-start",background:C.blueFrost,borderRadius:12,padding:"13px 16px"}}>
            <span style={{fontSize:20,flexShrink:0}}>{ic}</span>
            <div><div style={{fontWeight:600,color:C.navy,fontSize:14,marginBottom:2}}>{t}</div><div style={{fontSize:13,color:C.muted}}>{d}</div></div>
          </div>
        ))}
      </div>
    },
    {icon:"🚀",title:"Comment démarrer ?",desc:"Importe un fichier existant ou commence avec une page blanche.",
      body:<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button className="bp" style={{width:"100%",fontSize:15,padding:"14px"}} onClick={onStart}>✨ Démarrer de zéro</button>
        <div style={{textAlign:"center",fontSize:12,color:C.muted}}>— ou —</div>
        <button className="bg" style={{width:"100%",fontSize:15,padding:"14px"}} onClick={()=>ref.current.click()}>📂 Importer un money.json</button>
        <input ref={ref} type="file" accept=".json" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{onImport(normalizeImport(JSON.parse(ev.target.result)));}catch(err){alert("Fichier invalide : "+err.message);}};r.readAsText(f);}} />
        <div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:4,lineHeight:1.5}}>Le JSON est ta sauvegarde — télécharge-le après chaque saisie.</div>
      </div>
    }
  ];
  const s=steps[step];
  return <div className="overlay"><div className="mbox" style={{textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:14}}>{s.icon}</div>
    <div className="sf" style={{fontSize:26,color:C.navy,marginBottom:8}}>{s.title}</div>
    <div style={{fontSize:14,color:C.muted,marginBottom:24,lineHeight:1.6}}>{s.desc}</div>
    <div style={{textAlign:"left",marginBottom:24}}>{s.body}</div>
    <div style={{display:"flex",justifyContent:"center",gap:8}}>{steps.map((_,i)=><div key={i} style={{width:i===step?22:7,height:7,borderRadius:4,background:i===step?C.blue:C.border,transition:"all .2s"}}/>)}</div>
    {step<steps.length-1&&<button className="bp" style={{marginTop:18,width:"100%"}} onClick={()=>setStep(s=>s+1)}>Continuer →</button>}
  </div></div>;
}

function Sidebar({tab,setTab,data,setData}){
  const lastM=Object.keys(data.entries).sort().pop();
  const t=lastM?mtotals(data,lastM):null;
  return <div style={{width:210,background:C.navy,height:"100vh",position:"sticky",top:0,display:"flex",flexDirection:"column",padding:"24px 12px",gap:4,flexShrink:0}}>
    <div style={{padding:"0 6px 22px"}}>
      <div className="sf" style={{fontSize:21,color:C.white,letterSpacing:"-.02em"}}>Mo<span style={{color:C.cyan}}>ney</span></div>
      <div style={{fontSize:10,color:C.muted,marginTop:2,letterSpacing:".1em",textTransform:"uppercase"}}>Wealth tracker</div>
    </div>
    {[["graphique","📊","Graphiques"],["donnees","✏️","Données"],["parametrage","⚙️","Paramétrage"]].map(([id,ic,l])=><div key={id} className={`si${tab===id?" act":""}`} onClick={()=>setTab(id)}><span style={{fontSize:15}}>{ic}</span>{l}</div>)}
    {t&&data.profils.length>0&&<div style={{margin:"10px 0",background:C.navyLight,borderRadius:12,padding:"12px 14px"}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{ML(lastM)}</div><div className="sf" style={{fontSize:19,color:C.white}}>{fmt(t.grandHC)}</div>{t.crypto>0&&<div style={{fontSize:11,color:C.cyan,marginTop:2}}>+ {fmt(t.crypto)} crypto</div>}</div>}
    <div style={{marginTop:"auto",borderTop:`1px solid ${C.navyLight}`,paddingTop:14,display:"flex",flexDirection:"column",gap:8}}>
      <button className="bp" style={{width:"100%",fontSize:13,padding:"9px"}} onClick={()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="money.json";a.click();}}>⬇️ Exporter JSON</button>
      <label style={{width:"100%",fontSize:13,padding:"9px",background:C.navyLight,color:C.white,border:`1px solid ${C.navyLight}`,borderRadius:8,textAlign:"center",cursor:"pointer",display:"block"}}>
        📂 Importer JSON
        <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=normalizeImport(JSON.parse(ev.target.result));setData(d);e.target.value="";}catch{alert("Fichier invalide");}};r.readAsText(f);}} />
      </label>
    </div>
  </div>;
}

function ParametrageTab({data,setData}){
  const [selP,setSelP]=useState(null);
  const [pm,setPm]=useState(null);const [cm,setCm]=useState(null);
  const [form,setForm]=useState({});
  const upd=p=>setForm(f=>({...f,...p}));
  const sel=data.profils.find(p=>p.id===selP);
  const cs=sel?data.comptes.filter(c=>c.profilId===selP):[];
  const devises=[...new Set(data.comptes.map(c=>c.devise).filter(d=>d!=="EUR"))];
  const lastM=Object.keys(data.entries).sort().pop();
  const t=lastM?mtotals(data,lastM):null;
  const pct=data.objectif?.montant>0?Math.min(100,(t?.grandHC||0)/data.objectif.montant*100):0;
  const saveProfil=()=>{if(!form.nom?.trim())return;if(pm==="add"){const id="p_"+Date.now();setData(d=>({...d,profils:[...d.profils,{id,nom:form.nom.trim(),couleur:form.couleur||PROFIL_COLORS[d.profils.length%8]}]}));}else setData(d=>({...d,profils:d.profils.map(p=>p.id===form.id?{...p,...form}:p)}));setPm(null);};
  const delP=id=>{if(!confirm("Supprimer ?"))return;setData(d=>({...d,profils:d.profils.filter(p=>p.id!==id),comptes:d.comptes.filter(c=>c.profilId!==id)}));if(selP===id)setSelP(null);};
  const saveCompte=()=>{if(!form.nom?.trim())return;if(cm==="add"){const id="c_"+Date.now();setData(d=>({...d,comptes:[...d.comptes,{id,nom:form.nom.trim(),cat:form.cat||"Cash",devise:form.devise||"EUR",profilId:selP,valInit:parseFloat(form.valInit)||0}]}));}else setData(d=>({...d,comptes:d.comptes.map(c=>c.id===form.id?{...c,...form,valInit:parseFloat(form.valInit)||0}:c)}));setCm(null);};
  const delC=id=>{if(!confirm("Supprimer ?"))return;setData(d=>({...d,comptes:d.comptes.filter(c=>c.id!==id)}));};

  return <div className="anim" style={{padding:"28px 32px",maxWidth:840,overflowY:"auto"}}>
    <div style={{marginBottom:24}}><div className="sf" style={{fontSize:30,color:C.navy}}>Paramétrage</div><div style={{fontSize:14,color:C.muted,marginTop:4}}>Profils, comptes et objectifs</div></div>
    <div className="card" style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div className="sf" style={{fontSize:18,color:C.navy}}>Profils</div>
        <button className="bp" onClick={()=>{setForm({nom:"",couleur:PROFIL_COLORS[data.profils.length%8]});setPm("add");}}>+ Ajouter</button>
      </div>
      {data.profils.length===0?<Empty icon="👤" title="Aucun profil" desc="Crée ton premier profil."/>:
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
          {data.profils.map(p=>(
            <div key={p.id} onClick={()=>setSelP(selP===p.id?null:p.id)} style={{borderRadius:14,padding:"14px 16px",cursor:"pointer",border:`2px solid ${selP===p.id?p.couleur:C.border}`,background:selP===p.id?`${p.couleur}10`:C.sand,boxShadow:selP===p.id?`0 4px 18px ${p.couleur}30`:"none",transform:selP===p.id?"translateY(-1px)":"none",transition:"all .18s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:p.couleur,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:13,flexShrink:0}}>{p.nom.substring(0,2).toUpperCase()}</div>
                <div><div style={{fontWeight:600,color:C.navy,fontSize:14}}>{p.nom}</div><div style={{fontSize:12,color:C.muted}}>{data.comptes.filter(c=>c.profilId===p.id).length} comptes</div></div>
              </div>
              {t&&<div className="sf" style={{fontSize:14,color:p.couleur}}>{fmt(t.byP[p.id]||0)}</div>}
              <div style={{display:"flex",gap:6,marginTop:8}} onClick={e=>e.stopPropagation()}>
                <button className="bsm" onClick={()=>{setForm({...p});setPm("edit");}}>✏️</button>
                <button className="bd" onClick={()=>delP(p.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      }
      {sel&&<div style={{marginTop:20,borderTop:`2px solid ${sel.couleur}30`,paddingTop:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div className="dot" style={{width:10,height:10,background:sel.couleur}}/><span style={{fontWeight:600,fontSize:14,color:C.navy}}>Comptes de {sel.nom}</span></div>
          <button className="bp" onClick={()=>{setForm({nom:"",cat:"Cash",devise:"EUR",valInit:0});setCm("add");}}>+ Ajouter un compte</button>
        </div>
        {cs.length===0?<div style={{textAlign:"center",padding:16,color:C.muted,fontSize:13}}>Aucun compte encore.</div>:
          CATS.filter(cat=>cs.some(c=>c.cat===cat)).map(cat=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:9,background:`${CAT_COLOR[cat]}10`,marginBottom:6}}>
                <div className="dot" style={{background:CAT_COLOR[cat]}}/><span style={{fontWeight:700,fontSize:12,color:CAT_COLOR[cat]}}>{cat}</span>
              </div>
              {cs.filter(c=>c.cat===cat).map((c,i)=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,background:i%2===0?C.sand:"white",marginBottom:2}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:13,fontWeight:500,color:C.navy}}>{c.nom}</span><span className="badge bm" style={{fontSize:9}}>{c.devise}</span>{c.valInit>0&&<span style={{fontSize:11,color:C.muted}}>Init: {fmtR(c.valInit)}</span>}</div>
                  <div style={{display:"flex",gap:6}}><button className="bsm" onClick={()=>{setForm({...c});setCm("edit");}}>✏️</button><button className="bd" onClick={()=>delC(c.id)}>✕</button></div>
                </div>
              ))}
            </div>
          ))
        }
      </div>}
      {!sel&&data.profils.length>0&&<div style={{marginTop:12,textAlign:"center",padding:12,background:C.blueFrost,borderRadius:10,fontSize:13,color:C.muted}}>👆 Clique sur un profil pour gérer ses comptes</div>}
    </div>
    <div className="card" style={{marginBottom:16}}>
      <div className="sf" style={{fontSize:18,color:C.navy,marginBottom:16}}>Objectif patrimonial</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <Field label="Montant cible (€)"><input className="inp" type="number" value={data.objectif?.montant||""} onChange={e=>setData(d=>({...d,objectif:{...d.objectif,montant:parseFloat(e.target.value)||0}}))} placeholder="250 000"/></Field>
        <Field label="Date visée"><input className="inp" type="date" value={data.objectif?.date||""} onChange={e=>setData(d=>({...d,objectif:{...d.objectif,date:e.target.value}}))} /></Field>
      </div>
      {data.objectif?.montant>0&&<><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.muted}}>Progression</span><span style={{fontSize:13,fontWeight:700,color:C.blue}}>{pct.toFixed(1)}%</span></div><div className="pbar"><div className="pfill" style={{width:`${pct}%`}}/></div></>}
    </div>
    <div className="card">
      <div className="sf" style={{fontSize:18,color:C.navy,marginBottom:4}}>Taux de change</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Auto-généré selon les devises de tes comptes.</div>
      {devises.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:14}}>Aucun compte en devise étrangère.</div>:
        devises.map(d=>{const recent=Object.keys(data.taux||{}).sort().slice(-3);return <div key={d} style={{background:C.sand,borderRadius:10,padding:"11px 14px",marginBottom:8}}><div style={{fontWeight:600,color:C.navy,marginBottom:7,fontSize:13}}>€ / {d}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{recent.map(m=><div key={m} style={{display:"flex",gap:6,alignItems:"center",background:"white",borderRadius:7,padding:"5px 10px",border:`1px solid ${C.border}`}}><span style={{fontSize:11,color:C.muted}}>{ML(m)}</span><span style={{fontSize:13,fontWeight:600,color:C.navy}}>{data.taux[m]?.[d]||"—"}</span></div>)}{recent.length===0&&<span style={{fontSize:12,color:C.muted}}>Aucune saisie encore</span>}</div></div>;})
      }
    </div>
    {pm&&<Modal title={pm==="add"?"Ajouter un profil":"Modifier"} onClose={()=>setPm(null)} width={380}>
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <Field label="Nom"><input className="inp" value={form.nom||""} onChange={e=>upd({nom:e.target.value})} autoFocus/></Field>
        <Field label="Couleur"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{PROFIL_COLORS.map(col=><div key={col} onClick={()=>upd({couleur:col})} style={{width:28,height:28,borderRadius:"50%",background:col,cursor:"pointer",border:`3px solid ${form.couleur===col?C.navy:"transparent"}`}}/>)}</div></Field>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="bg" onClick={()=>setPm(null)}>Annuler</button><button className="bp" onClick={saveProfil}>OK</button></div>
      </div>
    </Modal>}
    {cm&&<Modal title={cm==="add"?"Ajouter un compte":"Modifier"} onClose={()=>setCm(null)} width={420}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label="Nom"><input className="inp" value={form.nom||""} onChange={e=>upd({nom:e.target.value})} autoFocus/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Catégorie"><select className="inp" value={form.cat||"Cash"} onChange={e=>upd({cat:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></Field>
          <Field label="Devise"><select className="inp" value={form.devise||"EUR"} onChange={e=>upd({devise:e.target.value})}>{DEVISES.map(d=><option key={d}>{d}</option>)}</select></Field>
        </div>
        <Field label="Valeur initiale" hint="Pour le calcul ROI. 0 si non applicable."><input className="inp" type="number" value={form.valInit||0} onChange={e=>upd({valInit:e.target.value})}/></Field>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="bg" onClick={()=>setCm(null)}>Annuler</button><button className="bp" onClick={saveCompte}>OK</button></div>
      </div>
    </Modal>}
  </div>;
}

function DonneesTab({data,setData}){
  const months=Object.keys(data.entries).sort();
  const [mode,setMode]=useState("saisie");
  const [selP,setSelP]=useState(null);
  const [selM,setSelM]=useState(months[months.length-1]||"");
  const [draft,setDraft]=useState({});
  const [draftT,setDraftT]=useState({});
  const [saved,setSaved]=useState(false);
  const [nmModal,setNmModal]=useState(false);
  const [newM,setNewM]=useState({year:"2026",month:"04"});
  const [histM,setHistM]=useState(months[months.length-1]||"");
  const devises=[...new Set(data.comptes.map(c=>c.devise).filter(d=>d!=="EUR"))];
  useEffect(()=>{if(!selM)return;const e=data.entries[selM]||{};const init={};data.comptes.forEach(c=>{init[c.id]=e[c.id]!==undefined?String(e[c.id]):"";});setDraft(init);setDraftT(data.taux?.[selM]||{});setSaved(false);},[selM,data.comptes]);
  const prevM=months[months.indexOf(selM)-1];
  const prevE=prevM?(data.entries[prevM]||{}):null;
  const csF=selP?data.comptes.filter(c=>c.profilId===selP):data.comptes;
  const filled=csF.filter(c=>parseFloat(draft[c.id])>0).length;
  const save=()=>{const ne={};data.comptes.forEach(c=>{const v=parseFloat(String(draft[c.id]||"").replace(",","."));if(!isNaN(v)&&v>0)ne[c.id]=v;});setData(d=>({...d,entries:{...d.entries,[selM]:ne},taux:{...d.taux,[selM]:draftT}}));setSaved(true);};
  const prefill=()=>{if(!prevE)return;const nd={...draft};data.comptes.forEach(c=>{if(prevE[c.id]!==undefined)nd[c.id]=String(prevE[c.id]);});setDraft(nd);setDraftT(data.taux?.[prevM]||{});setSaved(false);};
  const addMois=()=>{const k=`${newM.year}-${newM.month.padStart(2,"0")}`;if(data.entries[k]){alert("Existe déjà.");return;}setData(d=>({...d,entries:{...d.entries,[k]:{}}}));setSelM(k);setNmModal(false);};
  const draftByP={};data.profils.forEach(p=>{draftByP[p.id]=data.comptes.filter(c=>c.profilId===p.id).reduce((s,c)=>{const v=parseFloat(String(draft[c.id]||"").replace(",","."))||0;return s+eur(c,v,draftT);},0);});
  const draftHC=data.comptes.filter(c=>c.cat!=="Crypto").reduce((s,c)=>{const v=parseFloat(String(draft[c.id]||"").replace(",","."))||0;return s+eur(c,v,draftT);},0);
  const draftGrand=data.comptes.reduce((s,c)=>{const v=parseFloat(String(draft[c.id]||"").replace(",","."))||0;return s+eur(c,v,draftT);},0);
  const prevTot=prevM?mtotals(data,prevM).grand:null;
  if(data.profils.length===0)return <div className="anim" style={{padding:"32px 36px"}}><Empty icon="⚙️" title="Aucun profil" desc="Configure d'abord tes profils dans Paramétrage."/></div>;
  return <div className="anim" style={{padding:"28px 32px",maxWidth:1040}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <div><div className="sf" style={{fontSize:30,color:C.navy}}>Données</div><div style={{fontSize:14,color:C.muted,marginTop:4}}>{mode==="saisie"?"Saisie mensuelle":"Historique"}</div></div>
      <div style={{display:"flex",background:C.sandDark,borderRadius:13,padding:4,gap:2}}>
        {[["saisie","✏️ Saisie"],["historique","📊 Historique"]].map(([v,l])=><button key={v} onClick={()=>setMode(v)} style={{padding:"7px 16px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:600,background:mode===v?C.white:"transparent",color:mode===v?C.navy:C.muted,boxShadow:mode===v?"0 2px 8px rgba(0,0,0,.08)":"none"}}>{l}</button>)}
      </div>
    </div>
    {mode==="saisie"&&<>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <select className="inp" style={{width:"auto"}} value={selM} onChange={e=>setSelM(e.target.value)}>{months.map(m=><option key={m} value={m}>{ML(m)}</option>)}</select>
        <button className="bg" onClick={()=>setNmModal(true)}>+ Nouveau mois</button>
        {prevM&&<button className="bg" onClick={prefill}>↩ Préfill M-1</button>}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:C.muted}}>{filled}/{csF.length}</span><div style={{width:55,height:5,background:C.sandDark,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${csF.length>0?filled/csF.length*100:0}%`,background:`linear-gradient(90deg,${C.blue},${C.cyan})`,borderRadius:3}}/></div></div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:7,textTransform:"uppercase",letterSpacing:".05em"}}>Filtrer par personne</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {data.profils.map(p=><button key={p.id} className="ptab" onClick={()=>setSelP(selP===p.id?null:p.id)} style={{borderColor:selP===p.id?p.couleur:C.border,background:selP===p.id?p.couleur:"white",color:selP===p.id?"white":C.muted,boxShadow:selP===p.id?`0 4px 14px ${p.couleur}40`:"none"}}>{p.nom}</button>)}
          {selP&&<button className="ptab" onClick={()=>setSelP(null)} style={{borderColor:C.border,background:"white",color:C.muted,fontSize:12}}>Tous ✕</button>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:12}}>
        {data.profils.filter(p=>!selP||p.id===selP).map(p=><div key={p.id} style={{background:"white",border:`1.5px solid ${C.border}`,borderLeft:`4px solid ${p.couleur}`,borderRadius:10,padding:"10px 13px"}}><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{p.nom}</div><div className="sf" style={{fontSize:16,color:C.navy}}>{fmt(draftByP[p.id]||0)}</div></div>)}
        <div style={{background:"white",border:`2px solid ${C.blue}`,borderRadius:10,padding:"10px 13px"}}><div style={{fontSize:10,color:C.blue,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Hors crypto</div><div className="sf" style={{fontSize:16,color:C.navy}}>{fmt(draftHC)}</div>{prevTot!==null&&<div style={{fontSize:11,fontWeight:600,marginTop:2,color:draftGrand>=prevTot?C.green:C.red}}>{draftGrand>=prevTot?"▲":"▼"} {fmt(Math.abs(draftGrand-prevTot))}</div>}</div>
      </div>
      {devises.length>0&&<div style={{background:"white",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 16px",marginBottom:12,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:600,color:C.navy}}>Taux</span>
        {devises.map(d=><div key={d} style={{display:"flex",gap:7,alignItems:"center"}}><span style={{fontSize:13,color:C.muted}}>1 {d} =</span><input style={{width:70,padding:"5px 9px",border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:13,outline:"none",fontFamily:"Outfit,sans-serif"}} type="number" step="0.0001" value={draftT[d]||""} onChange={e=>setDraftT(t=>({...t,[d]:parseFloat(e.target.value)||0}))} placeholder="0.0000"/><span style={{fontSize:13,color:C.muted}}>€</span></div>)}
      </div>}
      {CATS.filter(cat=>csF.some(c=>c.cat===cat)).map(cat=>{
        const csCat=csF.filter(c=>c.cat===cat);
        return <div key={cat} style={{background:"white",border:`1.5px solid ${C.border}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}>
          <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,background:`${CAT_COLOR[cat]}08`,display:"flex",gap:8,alignItems:"center"}}><div className="dot" style={{width:10,height:10,background:CAT_COLOR[cat]}}/><span style={{fontWeight:700,fontSize:13,color:CAT_COLOR[cat]}}>{cat}</span></div>
          <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:9}}>
            {csCat.map(c=>{
              const profil=data.profils.find(p=>p.id===c.profilId);
              const prev=prevE?.[c.id];const cur=parseFloat(String(draft[c.id]||"").replace(",","."))||0;const delta=prev!==undefined?cur-prev:null;
              return <div key={c.id} style={{background:C.sand,borderRadius:9,padding:"10px 12px",border:cur>0?`1.5px solid ${profil?.couleur||C.blue}30`:`1.5px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div><div style={{fontSize:13,fontWeight:600,color:C.navy}}>{c.nom}</div><div style={{display:"flex",gap:4,marginTop:2,alignItems:"center"}}>{profil&&<><div className="dot" style={{width:6,height:6,background:profil.couleur}}/><span style={{fontSize:11,color:C.muted}}>{profil.nom}</span></>}{c.devise!=="EUR"&&<span className="badge bm" style={{fontSize:9}}>{c.devise}</span>}</div></div>
                  {prev!==undefined&&prev>0&&<div style={{textAlign:"right"}}><div style={{fontSize:10,color:C.muted}}>M-1</div><div style={{fontSize:11,fontWeight:600,color:C.muted}}>{fmtR(prev)}</div></div>}
                </div>
                <input className="inp" style={{padding:"7px 10px",fontSize:13,fontWeight:600,background:"white"}} type="number" step="0.01" min="0" value={draft[c.id]||""} onChange={e=>{setDraft(d=>({...d,[c.id]:e.target.value}));setSaved(false);}} placeholder={prev!==undefined?String(prev):"0"}/>
                {delta!==null&&cur>0&&delta!==0&&<div style={{fontSize:11,fontWeight:600,marginTop:3,color:delta>0?C.green:C.red}}>{delta>0?"▲":"▼"} {Math.abs(delta).toFixed(2)} vs M-1</div>}
              </div>;
            })}
          </div>
        </div>;
      })}
      <div style={{position:"sticky",bottom:0,background:`linear-gradient(transparent,${C.sand} 30%)`,padding:"14px 0 4px",display:"flex",gap:12,alignItems:"center"}}>
        <button className="bp" style={{fontSize:14,padding:"11px 26px"}} onClick={save}>{saved?"✅ Enregistré !":"💾 Enregistrer"}</button>
        {saved&&<span style={{fontSize:13,color:C.green,fontWeight:600}}>Pense à exporter le JSON !</span>}
      </div>
    </>}
    {mode==="historique"&&<>
      <div style={{marginBottom:18}}><select className="inp" style={{width:"auto"}} value={histM} onChange={e=>setHistM(e.target.value)}>{[...months].reverse().map(m=><option key={m} value={m}>{ML(m)}</option>)}</select></div>
      {(()=>{const hE=data.entries[histM]||{};const hT=data.taux?.[histM]||{};const hPM=months[months.indexOf(histM)-1];const hPE=hPM?(data.entries[hPM]||{}):null;const hTot=mtotals(data,histM);
        return <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
            {data.profils.map(p=><div key={p.id} style={{background:"white",border:`1.5px solid ${C.border}`,borderLeft:`4px solid ${p.couleur}`,borderRadius:10,padding:"10px 13px"}}><div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{p.nom}</div><div className="sf" style={{fontSize:16,color:C.navy}}>{fmt(hTot.byP[p.id]||0)}</div></div>)}
            <div style={{background:"white",border:`2px solid ${C.blue}`,borderRadius:10,padding:"10px 13px"}}><div style={{fontSize:10,color:C.blue,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Total</div><div className="sf" style={{fontSize:16,color:C.navy}}>{fmt(hTot.grand)}</div></div>
          </div>
          {data.profils.map(profil=>{const cs=data.comptes.filter(c=>c.profilId===profil.id);return <div key={profil.id} style={{background:"white",border:`1.5px solid ${C.border}`,borderRadius:13,marginBottom:10,overflow:"hidden"}}>
            <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,background:C.blueFrost,display:"flex",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div className="dot" style={{width:9,height:9,background:profil.couleur}}/><span style={{fontWeight:600,color:C.navy}}>{profil.nom}</span></div><span className="sf" style={{fontSize:14,color:C.navy}}>{fmt(hTot.byP[profil.id]||0)}</span></div>
            <div style={{overflowX:"auto"}}><table className="tbl"><thead><tr><th>Compte</th><th>Catégorie</th><th>Solde</th><th>En €</th><th>vs M-1</th><th>ROI</th></tr></thead>
            <tbody>{CATS.filter(cat=>cs.some(c=>c.cat===cat)).map(cat=>[
              <tr key={`h_${cat}`}><td colSpan={6} style={{background:`${CAT_COLOR[cat]}08`,padding:"5px 14px"}}><span style={{fontSize:11,fontWeight:700,color:CAT_COLOR[cat]}}>{cat}</span></td></tr>,
              ...cs.filter(c=>c.cat===cat).map(c=>{const raw=hE[c.id]||0;const ev=eur(c,raw,hT);const initE=eur(c,c.valInit,hT);const perf=initE>0?(ev-initE)/initE*100:null;const prev=hPE?.[c.id]||0;const delta=raw-prev;
                return <tr key={c.id}><td style={{fontWeight:500,color:C.navy}}>{c.nom}</td><td><span className="badge bb" style={{fontSize:9}}>{c.cat}</span></td><td>{raw>0?(c.devise!=="EUR"?`${fmtR(raw)} ${c.devise}`:fmt(raw)):"—"}</td><td>{ev>0?fmt(ev):"—"}</td><td>{raw>0&&delta!==0&&hPE?<span style={{fontSize:12,fontWeight:700,color:delta>0?C.green:C.red}}>{delta>0?"▲":"▼"} {Math.abs(delta).toFixed(0)}</span>:"—"}</td><td>{perf!==null?<span style={{fontSize:12,fontWeight:700,color:perf>=0?C.green:C.red}}>{fmtP(perf)}</span>:"—"}</td></tr>;
              })
            ])}</tbody></table></div>
          </div>;})}
        </>;
      })()}
    </>}
    {nmModal&&<Modal title="Nouveau mois" onClose={()=>setNmModal(false)} width={320}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Année"><select className="inp" value={newM.year} onChange={e=>setNewM(p=>({...p,year:e.target.value}))}>{["2025","2026","2027","2028"].map(y=><option key={y}>{y}</option>)}</select></Field>
          <Field label="Mois"><select className="inp" value={newM.month} onChange={e=>setNewM(p=>({...p,month:e.target.value}))}>{["01","02","03","04","05","06","07","08","09","10","11","12"].map(m=><option key={m}>{m}</option>)}</select></Field>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="bg" onClick={()=>setNmModal(false)}>Annuler</button><button className="bp" onClick={addMois}>Créer</button></div>
      </div>
    </Modal>}
  </div>;
}

function GraphiqueTab({data,setTab}){
  const [vue,setVue]=useState("collective");
  const [selP,setSelP]=useState(null);
  const months=Object.keys(data.entries).sort();
  const lastM=months[months.length-1];
  const series=useMemo(()=>evoSeries(data),[data]);
  useEffect(()=>{if(data.profils.length>0&&!selP)setSelP(data.profils[0].id);},[data.profils]);
  if(data.profils.length===0||months.length===0)return <div className="anim" style={{padding:"32px 36px"}}><Empty icon="📊" title="Pas encore de données" desc="Configure tes profils et saisis tes premiers soldes." action={<button className="bp" onClick={()=>setTab("parametrage")}>Aller au Paramétrage →</button>}/></div>;
  const t=mtotals(data,lastM);const prevM=months[months.length-2];const tp=prevM?mtotals(data,prevM):null;
  const pA=data.profils.find(p=>p.id===selP);
  const csA=pA?data.comptes.filter(c=>c.profilId===selP):[];
  const eL=data.entries[lastM]||{};const tL=data.taux?.[lastM]||{};
  const totA=csA.reduce((s,c)=>s+eur(c,eL[c.id],tL),0);
  const prevTotA=prevM?csA.reduce((s,c)=>s+eur(c,(data.entries[prevM]||{})[c.id],data.taux?.[prevM]||{}),0):null;
  const initA=csA.reduce((s,c)=>s+eur(c,c.valInit,tL),0);
  const perfA=initA>0?(totA-initA)/initA*100:0;
  const byCatA={};csA.forEach(c=>{const v=eur(c,eL[c.id],tL);byCatA[c.cat]=(byCatA[c.cat]||0)+v;});
  const repA=Object.entries(byCatA).filter(([,v])=>v>0).map(([cat,val])=>({name:cat,value:Math.round(val),color:CAT_COLOR[cat]||C.muted}));
  const pSeries=series.map(r=>({m:r.m,total:r[selP]||0}));
  return <div className="anim" style={{padding:"28px 32px",maxWidth:1160}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
      <div><div className="sf" style={{fontSize:30,color:C.navy}}>Graphiques</div><div style={{fontSize:14,color:C.muted,marginTop:4}}>{ML(lastM)} · {data.profils.map(p=>p.nom).join(" + ")}</div></div>
      <div style={{display:"flex",background:C.sandDark,borderRadius:13,padding:4,gap:2}}>
        {[["collective","🌐 Collective"],["individuelle","👤 Individuelle"]].map(([v,l])=><button key={v} onClick={()=>setVue(v)} style={{padding:"7px 16px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:600,background:vue===v?C.white:"transparent",color:vue===v?C.navy:C.muted,boxShadow:vue===v?"0 2px 8px rgba(0,0,0,.08)":"none"}}>{l}</button>)}
      </div>
    </div>
    {vue==="collective"&&<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:18}}>
        <KPI label="Patrimoine total" value={fmt(t.grandHC)} sub="vs mois préc." trend={tp?t.grandHC-tp.grandHC:undefined} color={C.blue} icon="🏦"/>
        <KPI label="Crypto" value={fmt(t.crypto)} trend={tp?t.crypto-tp.crypto:undefined} color={C.yellow} icon="₿"/>
        {data.profils.map(p=><KPI key={p.id} label={p.nom} value={fmt(t.byP[p.id]||0)} color={p.couleur} icon="👤"/>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 240px",gap:14}}>
        <div className="card"><div className="sf" style={{fontSize:17,color:C.navy,marginBottom:12}}>Évolution consolidée</div>
          <ResponsiveContainer width="100%" height={195}><AreaChart data={series}><defs><linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={.18}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient><linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.yellow} stopOpacity={.22}/><stop offset="95%" stopColor={C.yellow} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="m" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`} width={34}/><Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:10,border:`1px solid ${C.border}`,fontFamily:"Outfit,sans-serif",fontSize:12}}/><Area type="monotone" dataKey="total" stroke={C.blue} strokeWidth={2.5} fill="url(#gT)" name="Hors crypto"/><Area type="monotone" dataKey="crypto" stroke={C.yellow} strokeWidth={2} fill="url(#gC)" name="Crypto"/></AreaChart></ResponsiveContainer>
        </div>
        <div className="card" style={{display:"flex",flexDirection:"column"}}><div className="sf" style={{fontSize:17,color:C.navy,marginBottom:12}}>Répartition</div>
          <ResponsiveContainer width="100%" height={115}><PieChart><Pie data={Object.entries(t.byCat).filter(([,v])=>v>0).map(([cat,val])=>({name:cat,value:Math.round(val),color:CAT_COLOR[cat]||C.muted}))} cx="50%" cy="50%" innerRadius={36} outerRadius={54} dataKey="value" strokeWidth={2} stroke="white">{Object.entries(t.byCat).filter(([,v])=>v>0).map(([cat],i)=><Cell key={i} fill={CAT_COLOR[cat]||C.muted}/>)}</Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:10,fontFamily:"Outfit,sans-serif",fontSize:11}}/></PieChart></ResponsiveContainer>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>{Object.entries(t.byCat).filter(([,v])=>v>0).map(([cat,val],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div className="dot" style={{background:CAT_COLOR[cat]||C.muted}}/><span style={{fontSize:11,color:C.muted}}>{cat}</span></div><span style={{fontSize:11,fontWeight:600,color:C.navy}}>{fmt(val)}</span></div>)}</div>
        </div>
      </div>
    </>}
    {vue==="individuelle"&&<>
      <div style={{marginBottom:18}}><div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:9,textTransform:"uppercase",letterSpacing:".05em"}}>Sélectionner une personne</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{data.profils.map(p=><button key={p.id} className="ptab" onClick={()=>setSelP(p.id)} style={{borderColor:selP===p.id?p.couleur:C.border,background:selP===p.id?p.couleur:"white",color:selP===p.id?"white":C.muted,boxShadow:selP===p.id?`0 4px 14px ${p.couleur}40`:"none",fontSize:14,padding:"11px 26px"}}>{p.nom}</button>)}</div>
      </div>
      {pA&&<>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:pA.couleur,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:15}}>{pA.nom.substring(0,2).toUpperCase()}</div>
          <div><div className="sf" style={{fontSize:21,color:C.navy}}>{pA.nom}</div><div style={{fontSize:13,color:C.muted}}>{csA.length} comptes · {ML(lastM)}</div></div>
          <div className="sf" style={{marginLeft:"auto",fontSize:24,color:C.navy}}>{fmt(totA)}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:16}}>
          <KPI label="Patrimoine" value={fmt(totA)} sub="vs mois préc." trend={prevTotA!==null?totA-prevTotA:undefined} color={pA.couleur} icon="🏦"/>
          <KPI label="Performance" value={fmtP(perfA)} sub={`sur ${fmt(initA)}`} trend={totA-initA} color={perfA>=0?C.green:C.red} icon="📈"/>
          <KPI label="Crypto" value={fmt(csA.filter(c=>c.cat==="Crypto").reduce((s,c)=>s+eur(c,eL[c.id],tL),0))} color={C.yellow} icon="₿"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 240px",gap:14}}>
          <div className="card"><div className="sf" style={{fontSize:17,color:C.navy,marginBottom:12}}>Évolution de {pA.nom}</div>
            <ResponsiveContainer width="100%" height={175}><AreaChart data={pSeries}><defs><linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={pA.couleur} stopOpacity={.2}/><stop offset="95%" stopColor={pA.couleur} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="m" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`} width={34}/><Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:10,border:`1px solid ${C.border}`,fontFamily:"Outfit,sans-serif",fontSize:12}}/><Area type="monotone" dataKey="total" stroke={pA.couleur} strokeWidth={2.5} fill="url(#gP)" name={pA.nom}/></AreaChart></ResponsiveContainer>
          </div>
          <div className="card" style={{display:"flex",flexDirection:"column"}}><div className="sf" style={{fontSize:17,color:C.navy,marginBottom:12}}>Répartition</div>
            <ResponsiveContainer width="100%" height={110}><PieChart><Pie data={repA} cx="50%" cy="50%" innerRadius={33} outerRadius={50} dataKey="value" strokeWidth={2} stroke="white">{repA.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:10,fontFamily:"Outfit,sans-serif",fontSize:11}}/></PieChart></ResponsiveContainer>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>{repA.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div className="dot" style={{background:d.color}}/><span style={{fontSize:11,color:C.muted}}>{d.name}</span></div><span style={{fontSize:11,fontWeight:600,color:C.navy}}>{fmt(d.value)}</span></div>)}</div>
          </div>
        </div>
      </>}
    </>}
  </div>;
}

export default function App(){
  const [data,setData]=useState(null);
  const [tab,setTab]=useState("parametrage");
  return <div style={{display:"flex",minHeight:"100vh",background:C.sand}}>
    <style>{G}</style>
    {!data&&<Onboarding onStart={()=>{setData(EMPTY);setTab("parametrage");}} onImport={d=>{setData(d);setTab("graphique");}}/>}
    {data&&<>
      <Sidebar tab={tab} setTab={setTab} data={data} setData={setData}/>
      <main style={{flex:1,overflowY:"auto",minHeight:"100vh"}}>
        {tab==="graphique"&&<GraphiqueTab data={data} setTab={setTab}/>}
        {tab==="donnees"&&<DonneesTab data={data} setData={setData}/>}
        {tab==="parametrage"&&<ParametrageTab data={data} setData={setData}/>}
      </main>
    </>}
  </div>;
}
