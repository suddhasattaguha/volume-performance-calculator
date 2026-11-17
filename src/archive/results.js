/* ================= results ================= */
let expB=null;
const ZL={F:"Fit",A:"Adapt",B:"Beyond",N:"Not applicable",I:"Info"};
function compRow(x,x3,id){
 const params=x.params.filter((k,i,a)=>k&&k in SD&&a.indexOf(k)===i);
 return `<div class="crow${x.z==="N"?" na":""}"><div class="ch"><span class="zc ${x.z}">${ZL[x.z]}</span>${x3&&x3.z!==x.z&&"FAB".includes(x3.z)?`<span class="zc ${x3.z}" title="in 3 years">3y: ${ZL[x3.z]}</span>`:""}<span class="cn">${esc(x.comp)}</span><span class="cm">${x.metric?x.metric+" · ":""}${x.why}</span>${x.z!=="N"?`<button class="whyBtn" data-fx="${id}">Why</button>`:""}</div>
 ${fxOpen[id]&&x.z!=="N"?`<div class="fxBody"><span class="f">${x.formula}</span>${params.length?`<table>${params.map(k=>`<tr class="${k in OV?"ov":""}"><td>${SM[k].l}</td><td style="text-align:right"><input type="number" step="any" data-ov="${k}" value="${P[k]}"></td><td class="note">${SM[k].u}</td><td class="conf">${SM[k].c}</td></tr>`).join("")}</table><div class="note" style="margin-top:4px">Confidence: A official doc · B vendor KBA · C secondary · E empirical, to calibrate. Changes apply to this run only.</div>`:""}</div>`:""}</div>`;}
function renderResults(c){
 const any=Object.keys(I.touched).length,g3=(+I.growth||1)>1,c3=g3?calc(true):null;
 const PL=platforms(c),PL3=g3?platforms(c3):null;
 document.getElementById("platNote").textContent=any?`Each platform is checked twice: does the biggest message fit (size), and does the busiest hour fit (volume)?${g3?" A second chip shows the result in 3 years.":""} Tap “Why” for the facts and the calculation, and to change limits for this run.`:"Answer the parts of the flow above; the platform checks appear here.";
 const PV={F:"Fits",A:"Fits with changes",B:"Doesn't fit everywhere"};
 document.getElementById("plats").innerHTML=!any?"":PL.map((p,i)=>{
  const sec=(lens,title)=>{const rows=p.ch.map((x,j)=>[x,j]).filter(([x])=>x.lens===lens);if(!rows.length)return "";return `<div class="lensH">${title}</div>`+rows.map(([x,j])=>compRow(x,g3?PL3[i].ch[j]:null,`p${i}c${j}`)).join("");};
  const volLine=p.cap?`Busiest hour <b>${fmt(c.msgs)}</b> messages · ${esc(p.capTxt)} handles ~<b>${fmt(p.cap)}</b> per hour (${fmt(c.msgs/p.cap*100)}% used)`:`Busiest hour <b>${fmt(c.msgs)}</b> messages · ${esc(p.capTxt)}`;
  return `<div class="pcard"><h3>${esc(p.n)} <span class="zc ${p.v}">${PV[p.v]}</span></h3><div class="psub">${p.sub}</div>
  <div class="lensRow"><span>Size <span class="zc ${p.lens.size}">${ZL[p.lens.size]}</span></span><span>Volume <span class="zc ${p.lens.volume}">${ZL[p.lens.volume]}</span></span></div>
  <div class="volLine">${volLine}</div>${sec("size","Size: does the biggest message fit?")}${sec("volume","Volume: does the busiest hour fit?")}</div>`;}).join("");
 const pl=document.getElementById("plats");
 pl.querySelectorAll("[data-fx]").forEach(b=>b.onclick=e=>{e.stopPropagation();fxOpen[b.dataset.fx]=!fxOpen[b.dataset.fx];renderResults(calc(false));});
 pl.querySelectorAll("[data-ov]").forEach(inp=>{inp.onclick=e=>e.stopPropagation();inp.addEventListener("change",()=>{const v=parseFloat(inp.value),k=inp.dataset.ov;if(isFinite(v)){if(v===SAVED[k])delete OV[k];else OV[k]=v;update();}});});
 /* profile */
 const t=c,y=c3||c,h=t.how.map(x=>`${x[0]}: ${x[1]} = <b>${typeof x[2]==="number"?fmt(x[2]):x[2]}</b>`).join("<br>");
 const rows=[["Busiest hour (messages)","L3",fmt(t.msgs),fmt(y.msgs),t.msgs,y.msgs,h],["Peak vs average","L4","×"+fmt(t.ratio),"×"+fmt(y.ratio),t.ratio,y.ratio,`busiest ${fmt(t.msgs)} ÷ average ${fmt(t.avg)}`],
  ["Biggest message","L1",fmtB(t.msgB),fmtB(y.msgB),t.msgB,y.msgB,"From the Message card."],["Records per message","C1",fmt(t.rpm),fmt(y.rpm),t.rpm,y.rpm,I.multi?"Set on the Message.":"One per message."],
  ["Complexity","P1",CPX[I.work],"",0,0,`${CPX[I.work]} ≈ ${fmtS(t.secs)} per message (settings)`],
  ["In process at once","",fmt(t.inproc),fmt(y.inproc),null,null,`busiest hour ÷ 3600 × ${fmtS(t.secs)} (Little's law)`],
  ["End-to-end SLA","D1",({sec:"seconds",min:"minutes",hour:"the hour",none:"none"})[I.sla],"",0,0,"Set on the Target."],["Growth","D3","×"+(+I.growth||1),"",+I.growth||1,+I.growth||1,"Set on the Source."]];
 document.getElementById("prof").innerHTML=`<tr><th>Measure</th><th style="text-align:right">Today</th>${g3?'<th style="text-align:right">3 years</th>':""}<th>Band</th></tr>`+rows.map((r,i)=>{const B=r[1]?BANDS[r[1]]:null,bi=B?B.i(r[4]):null,by=B?B.i(r[5]):null;
  return `<tr><td>${r[0]}</td><td class="v">${r[2]}</td>${g3?`<td class="v">${r[3]}</td>`:""}<td>${B?`<span class="bd" data-b="${i}">${r[1]} ${B.s[bi][0]}</span>${g3&&by!==bi?` → <span class="bd" data-b="${i}">${B.s[by][0]}</span>`:""}`:`<span class="bd" data-b="${i}">how</span>`}</td></tr>`+
  (expB===i?`<tr class="expl"><td colspan="${g3?4:3}">${B?`<b>${r[1]} · ${B.n}</b><div class="scale">${B.s.map((s,j)=>`<span class="${j===bi?"on":""}">${s[0]} ${s[1]}</span>`).join("")}</div>`:""}<span class="f">${r[6]}</span>${B?`<span class="note">${B.why}</span>`:""}</td></tr>`:"");}).join("");
 document.querySelectorAll("#prof .bd").forEach(b=>b.onclick=e=>{e.stopPropagation();const i=+b.dataset.b;expB=expB===i?null:i;renderResults(calc(false));});
 window._sum=()=>{const L=[`Interface: ${I.objName||"(unnamed)"} · Source: ${I.srcName||"–"} · Flow: ${I.midName||"–"} · Target: ${I.tgtName||"–"}`];
  ORDER.filter(k=>I.touched[k]).forEach(k=>{const tg=tagFor(k,c);L.push(`${ST[k].name}: ${TG[tg.t]} — ${tg.w}`);});
  L.push("Platforms:");PL.forEach(p=>{L.push(`- ${p.n}: ${PV[p.v]} (size ${ZL[p.lens.size]}, volume ${ZL[p.lens.volume]})`);p.ch.filter(x=>x.z==="A"||x.z==="B").forEach(x=>L.push(`   · ${x.comp}: ${ZL[x.z]} (${x.why})`));});
  if(Object.keys(OV).length)L.push("Changed for this run: "+Object.keys(OV).map(k=>`${SM[k].l} = ${OV[k]}`).join("; "));return L.join("\n");};
}
document.getElementById("copy").onclick=async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(window._sum());document.getElementById("copied").textContent="Copied";}catch(err){document.getElementById("copied").textContent="Copy not allowed here";}};
document.getElementById("runNote").onclick=e=>{e.stopPropagation();Object.keys(OV).forEach(k=>delete OV[k]);update();};

