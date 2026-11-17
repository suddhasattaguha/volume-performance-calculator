function estBox(key,label,valTxt,setByYou,fxId,ovUnit){
 const acc=I.acc&&I.acc[key],ovOpen=estOv[key];
 return `<div class="estW"><div class="estTop"><span class="estLbl">${setByYou?"Set by you":"Estimated"}</span><b>${label}: ${valTxt}</b>${acc&&!setByYou?'<span class="accd">✓ accepted</span>':""}</div>
 <div class="estAct">${!setByYou?`<button class="ea" data-acc="${key}">✓ Accept</button>`:""}<button class="ea" data-ovr="${key}">✎ ${setByYou?"Change":"Override"}</button>${setByYou?`<button class="ea" data-ovclr="${key}">↺ Use estimate</button>`:""}<button class="ea" data-fx="${fxId}">ƒ Formula</button></div>
 ${ovOpen?`<div class="numrow" style="margin-top:6px"><label>Your value</label><span><input type="number" min="0" step="any" data-ovin="${key}" value="${I[key]||""}"> ${ovUnit}</span></div>`:""}</div>`;}
let estOv={};
function cardBody(k){
 const c=calc(false);
 if(k==="src")return `<p class="why">The scope of the whole interface: who creates the data, where, and for how many users.</p>
  ${info("srcName","Source system","e.g. CRM, web shop")}
  ${chips("who","Who creates the data?",[["human","Human"],["app","Application or process"],["jobs","Scheduled jobs"]])}
  ${num("countries","How many countries at full rollout?","")}
  <div id="grpBox" ${multi()?"":"hidden"}><div class="fld"><div class="lab"><span>How many of them are…</span></div>
   <table class="grpTbl"><tr><td>Large</td><td><input type="number" min="0" data-num="nL" value="${I.nL}"></td><td>Medium</td><td><input type="number" min="0" data-num="nM" value="${I.nM}"></td><td>Small</td><td><input type="number" min="0" data-num="nS" value="${I.nS}"></td></tr></table><div class="warnTxt" id="grpWarn"></div></div>
   <div class="fld"><div class="lab"><span>Which regions?</span><span class="sm">pick one, two or all</span></div><div class="chips">${REG.map(([r,l])=>`<button class="chip${I.regs[r]?" on":""}" data-reg="${r}">${l}</button>`).join("")}</div></div></div>
  ${chips("usersKnown","Business users or customers in scope",[["yes","I know the total"],["no","Calculate from reference countries"]])}
  <div id="uYes" ${I.usersKnown==="yes"?"":"hidden"}>${num("users","Total users or customers","")}</div>
  <div id="uNo" ${I.usersKnown==="no"?"":"hidden"}><div class="refs">${(I.refs||[]).map((r,i)=>`<div class="refRow"><input type="text" data-ref="${i}" data-f="name" value="${esc(r.name)}" placeholder="Country (optional)"><select data-ref="${i}" data-f="size">${[["L","Large"],["M","Medium"],["S","Small"]].map(o=>`<option value="${o[0]}"${r.size===o[0]?" selected":""}>${o[1]}</option>`).join("")}</select><input type="number" min="0" data-ref="${i}" data-f="users" value="${r.users}" placeholder="users"><button class="rm" data-rmref="${i}" title="Remove">×</button></div>`).join("")}</div><button class="btn mini2" id="addRef">+ Add reference</button></div>
  ${chips("growth","Growth in 3 years?",[[1,"Same"],[2,"Doubles"],[3,"×3"],[5,"×5 or more"]])}
  <div id="massQ" ${I.who==="human"?"hidden":""}>${chips("mass","Any mass loads?",[["no","No"],["yes","Yes"]],"mass updates, initial loads")}
  <div id="massBox" ${I.mass==="yes"?"":"hidden"}>${num("massRec","Records in one mass load","records")}${num("massWin","Must finish within","hours")}</div></div>
  <div class="calcBox" id="cardCalc"></div>`;
 if(k==="msg"){const sb=sizeBands().map((l,i)=>[i,l]);return `<p class="why">How big one message gets. Only sizes that matter to a platform are on the scale.</p>
  ${info("objName","Business object","e.g. Sales order")}
  ${infoChips("content","Content",[["trans","Transaction data"],["master","Master data"],["doc","Document"]])}
  ${chips("sizeMode","Size",[["known","Pick on the scale"],["calc","Calculate it"]])}
  <div id="szKnown" ${I.sizeMode==="known"?"":"hidden"}>${chips("normBand","Normal message",sb)}${chips("bigBand","Biggest message",sb)}</div>
  <div id="szCalc" ${I.sizeMode==="calc"?"":"hidden"}>
   ${chips("fmtType","Format",[["json","JSON"],["xml","XML"],["csv","CSV"],["idoc","IDoc"]])}
   ${chips("struct","Structure",[["flat","One flat record"],["hdr","Header + lines"]])}
   ${num("hdrFields",I.struct==="hdr"?"Fields in the header":"Fields in the record","")}
   <div id="lineBox" ${I.struct==="hdr"?"":"hidden"}>${num("lineFields","Fields per line","")}${num("linesT","Lines, normal","")}${num("linesM","Lines, biggest","")}</div></div>
  ${check("att","Has an attachment")}<div id="attBox" ${I.att?"":"hidden"}>${chips("attBand","Attachment size",sb)}</div>
  ${check("multi","Several records per message")}<div id="multiBox" ${I.multi?"":"hidden"}>${num("rpm","Records per message","")}</div>
  <div class="calcBox" id="cardCalc"></div>`;}
 if(k==="inf"){const vb=volBands(c.msgB).map((l,i)=>[i,l]),unit=I.traffic==="batch"?"per run":"per "+I.per;
  return `<p class="why">How many messages arrive, and when. The scale adapts to your message size: bigger messages matter sooner.</p>
  ${chips("traffic","What kind of traffic?",[["cont","Continuous, as it happens"],["batch","Scheduled batch"]])}
  <div id="freqBox" ${I.traffic==="batch"?"":"hidden"}>${chips("freq","How often does it run?",[["month","Monthly"],["week","Weekly"],["day","Daily"],["day4","4× a day"],["hour","Hourly"],["min15","Every 15 min"]])}</div>
  <div id="perBox" ${I.traffic==="cont"?"":"hidden"}>${chips("per","Count messages per",[["hour","Hour"],["day","Day"],["week","Week"],["month","Month"]])}</div>
  <div id="gkQ" ${multi()?"":"hidden"}>${chips("globalKnown","Do you know the volume for all countries?",[["yes","Yes"],["no","No: use one typical country"]])}</div>
  <div id="typBox" ${multi()&&I.globalKnown==="no"?"":"hidden"}>${chips("typSize","Typical country size",[["L","Large"],["M","Medium"],["S","Small"]])}</div>
  ${chips("busyBand",`Busiest: messages ${unit}`,vb)}${num("busyExact","Or the exact number","")}
  ${chips("avgBand",`Average: messages ${unit}`,[[-1,"Not known"]].concat(vb))}${num("avgExact","Or the exact number","")}
  <div id="dayFBox" ${I.traffic==="cont"&&(I.per==="week"||I.per==="month")?"":"hidden"}>${chips("dayF","How much bigger is the busiest day?",[[1,"Normal"],[1.5,"×1.5"],[2,"×2"],[5,"×5"],[10,"×10"],[50,"×50"]],"month-end, campaigns")}</div>
  <div class="calcBox" id="cardCalc"></div>`;}
 if(k==="mid")return `<p class="why">How complex the processing is on the way.</p>
  ${info("midName","Flow name","e.g. Order enrichment")}
  ${chips("work","Complexity",[["w1","Simple","map and pass on"],["w2","Medium","transformation, lookups"],["w3","Complex","orchestration across systems"]])}
  <div class="calcBox" id="cardCalc"></div>`;
 if(k==="del")return `<p class="why">How data is handed to the target.</p>
  ${chips("send","Handed over as",[["one","One record per call"],["small","Small batches"],["bulk","Bulk or file"]])}
  <div class="calcBox" id="cardCalc"></div>`;
 if(k==="tgt")return `<p class="why">How much the target absorbs at once, and the end-to-end expectation.</p>
  ${info("tgtName","Target system","e.g. S/4HANA")}
  ${chips("absorb","How many calls can it handle at the same time?",[["one","One at a time"],["few","A few"],["dozens","Dozens"],["hundreds","Hundreds"]])}
  ${chips("sla","End-to-end SLA: how fast must a message arrive?",[["sec","Within seconds"],["min","Within minutes"],["hour","Within the hour"],["none","Doesn't matter"]])}
  <div class="calcBox" id="cardCalc"></div>`;
}
function cardCalc(k,c){
 const tg=tagFor(k,c),head=`<div class="tagBox ${tg.t}" style="margin-top:0"><span class="tg ${tg.t}">${TG[tg.t]}</span>${tg.w}</div>`;
 const tbl=rows=>`<table class="nums" style="margin-top:6px">${rows.map(r=>`<tr><td>${r[0]}<br><span class="note">${r[1]}</span></td><td>${typeof r[2]==="number"?fmt(r[2]):r[2]}</td></tr>`).join("")}</table>`;
 let body="",f="",params=tg.params;
 if(k==="src"){const u=usersFinal();if(I.usersKnown==="no")body=estBox("ovUsers","Users in scope",fmt(u.u),u.set,"card_src","users")+(fxOpen.card_src?tbl(u.how):"");
  f=`users in scope = ${I.usersKnown==="yes"?"entered":"per size group: average of its references, or (average per medium equivalent × size factor) when it has none"}\ncountry weight = large × ${P.fL} + medium × ${P.fM} + small × ${P.fS}${c.massRate?`\nmass rate = ${fmt(+I.massRec)} ÷ ${+I.massWin} h = ${fmt(c.massRate)}/h → Critical above ${fmt(P.ownRoad)}/h`:""}`;}
 if(k==="msg"){body=estBox("ovBig","Biggest message",`${fmtB(c.msgB)} · ${sizeBands()[sizeBandOf(c.msgB/1024)]}`,c.bigSet,"card_msg","MB");
  if(fxOpen.card_msg){if(I.sizeMode==="calc"){const d=sizeCalc();body+=tbl([["Envelope + "+(d.lines?"header":"record"),d.note,fmtB(d.env+d.hB)]].concat(d.lines?[["Per line","fields per line × per field",fmtB(d.lB)]]:[]).concat([["Normal message",d.lines?`${fmt(I.linesT)} lines`:"",fmtB(c.typ)],["Biggest message",d.lines?`${fmt(I.linesM)} lines`:"",fmtB(c.big)]]));params=params.concat(["valLen","nameLen","envB"].concat(I.fmtType==="idoc"?["idocSeg","idocCtl","idocFps"]:[]).concat(I.att?["b64"]:[]));}
   else body+=tbl([["Normal message","middle of the chosen band"+(I.att?" + attachment":""),fmtB(c.typ)],["Biggest message","middle of the chosen band"+(I.att?" + attachment":""),fmtB(c.big)]]);
   if(c.rpm>1)body+=tbl([["Grouped message",`(${fmt(c.rpm)} − 1) × normal + biggest`,fmtB(c.msgB)]]);}
  f=`biggest message = ${fmtB(c.msgB)} → Standard ≤ ${P.sizeW} MB · Needs attention ≤ ${P.sizeC} MB · Critical above\nrecords per message = ${fmt(c.rpm)} → Needs attention above ${fmt(P.recW)} · Critical above ${fmt(P.recC)}`;}
 if(k==="inf"){body=estBox("ovBusy","Busiest hour",`${fmt(c.msgs)} messages`,I.ovBusy!==""&&+I.ovBusy>0,"card_inf","messages/h")+(fxOpen.card_inf?tbl(c.how):"");
  const e=c.edges;f=`scale edges (per hour) = min(throughput limit ÷ biggest message ${fmtB(c.msgB)}, count limit)\n= ${fmt(niceN(e[0]))} · ${fmt(niceN(e[1]))} · ${fmt(niceN(e[2]))} messages per hour\nbusiest hour ${fmt(c.msgs)} → Standard ≤ ${fmt(niceN(e[1]))} · Needs attention ≤ ${fmt(niceN(e[2]))} · Critical above`;params=params.concat(["fL","fM","fS","oAM","oEM","oAP"]);}
 if(k==="mid"){f=`in process at once = busiest hour ${fmt(c.msgs)} ÷ 3600 × ${fmtS(c.secs)} = ${fmt(c.inproc)}\nStandard ≤ ${P.inprocW} · Needs attention ≤ ${P.inprocC} · Critical above`;}
 if(k==="del"){const d=delFit(c);f=d.formula;}
 if(k==="tgt"){const x=tgtCheck(c);f=x.formula;}
 return head+body+fxHTML("card_"+k,f,params);
}
function openCard(k,el){
 open=k;I.touched[k]=1;saveIn();
 document.querySelectorAll(".pop").forEach(p=>p.remove());
 const pop=document.createElement("div");pop.className="pop"+(k==="msg"||k==="inf"||k==="src"?" wide":"");pop.id="pop";
 pop.innerHTML=`<button class="x" aria-label="Close">×</button><h3>${ST[k].name}</h3>${cardBody(k)}`;
 const stage=document.getElementById("stage");stage.appendChild(pop);
 const sr=stage.getBoundingClientRect(),er=el.getBoundingClientRect(),w=pop.offsetWidth;
 let left=er.left-sr.left+er.width/2-w/2;left=Math.max(8,Math.min(left,sr.width-w-8));
 pop.style.left=left+"px";pop.style.top=(er.bottom-sr.top+6)+"px";
 pop.addEventListener("click",e=>e.stopPropagation());pop.querySelector(".x").onclick=closeCard;
 const show=(i,c)=>{const e=document.getElementById(i);if(e)e.hidden=!c};
 pop.querySelectorAll("[data-num]").forEach(r=>r.addEventListener("input",()=>{const v=parseFloat(r.value),id=r.dataset.num;const opt=id==="busyExact"||id==="avgExact";I[id]=isFinite(v)&&v>=0?v:(opt?"":0);if(opt&&I[id]!==""){pop.querySelectorAll(`[data-chip="${id==="busyExact"?"busyBand":"avgBand"}"]`).forEach(x=>x.classList.remove("on"));}if(id==="countries"){show("grpBox",multi());show("gkQ",multi());}update();}));
 pop.querySelectorAll("[data-txt]").forEach(r=>r.addEventListener("input",()=>{I[r.dataset.txt]=r.value;update();}));
 pop.querySelectorAll("[data-chk]").forEach(r=>r.addEventListener("change",()=>{I[r.dataset.chk]=r.checked;show("attBox",I.att);show("multiBox",I.multi);update();}));
 pop.querySelectorAll("[data-reg]").forEach(b=>b.onclick=()=>{const r=b.dataset.reg;I.regs[r]=!I.regs[r];if(!REG.some(([x])=>I.regs[x]))I.regs[r]=true;b.classList.toggle("on",I.regs[r]);update();});
 pop.querySelectorAll("[data-ref]").forEach(inp=>inp.addEventListener(inp.tagName==="SELECT"?"change":"input",()=>{const i=+inp.dataset.ref,f=inp.dataset.f;I.refs[i][f]=f==="users"?(parseFloat(inp.value)||0):inp.value;update();}));
 pop.querySelectorAll("[data-rmref]").forEach(b=>b.onclick=()=>{I.refs.splice(+b.dataset.rmref,1);if(!I.refs.length)I.refs.push({name:"",size:"M",users:0});reopen();});
 const ar=document.getElementById("addRef");if(ar)ar.onclick=()=>{I.refs.push({name:"",size:"M",users:0});reopen();};
 pop.querySelectorAll("[data-chip]").forEach(b=>b.onclick=()=>{const id=b.dataset.chip;I[id]=b.dataset.n?+b.dataset.v:b.dataset.v;
  pop.querySelectorAll(`[data-chip="${id}"]`).forEach(x=>x.classList.toggle("on",x===b));
  if(id==="busyBand"){I.busyExact="";const x=document.getElementById("n_busyExact");if(x)x.value="";}
  if(id==="avgBand"){I.avgExact="";const x=document.getElementById("n_avgExact");if(x)x.value="";}
  if(id==="who")show("massQ",I.who!=="human");
  if(id==="mass")show("massBox",I.mass==="yes");
  if(id==="usersKnown"){show("uYes",I.usersKnown==="yes");show("uNo",I.usersKnown==="no");}
  if(id==="sizeMode"){show("szKnown",I.sizeMode==="known");show("szCalc",I.sizeMode==="calc");}
  if(id==="struct"){show("lineBox",I.struct==="hdr");document.getElementById("lab_hdrFields").textContent=I.struct==="hdr"?"Fields in the header":"Fields in the record";}
  if(["traffic","per","freq","globalKnown","typSize"].includes(id)){reopen();return;}
  update();});
 update();
}
function reopen(){const k=open;closeCard();draw();const el=document.querySelector(`.hit[data-k="${k}"]`);if(el)openCard(k,el);}
