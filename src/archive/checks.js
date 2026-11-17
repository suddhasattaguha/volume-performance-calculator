/* ================= component checks ================= */
const CK=(comp,z,metric,why,formula,params,lens)=>({comp,z,metric,why,formula,params,lens:lens||"size"});
const NA=(comp,why,lens)=>CK(comp,"N","",why,"",[],lens);
function sizeCk(comp,b,soft,hard,kS,kH,hA,hB){const m=b/MB,z=m<=soft?"F":m<=hard?"A":"B";
 return CK(comp,z,`${fmtB(b)} biggest message vs ${soft} MB comfort / ${hard} MB cap`,z==="F"?"fits its size limit":z==="A"?hA:hB,`biggest message = ${fmtB(b)}\nFit ≤ ${soft} MB · Adapt ≤ ${hard} MB · Beyond above`,[kS,kH],"size");}
function capCk(comp,c,t,cap,kT,kC,hint,unit){const u=unit||"messages",inf=c.R/3600*t,drain=cap/t*3600;let z,why,clear=0;
 if(inf<=cap*P.comfort/100){z="F";why="has headroom at peak";}
 else if(inf<=cap){z="A";why="close to its limit at peak";}
 else if(c.avg<=drain){z="A";const back=(c.R-drain)*P.peakDur;clear=back/Math.max(1,drain-c.avg)*60;why=`can't keep up at peak; a queue holds ~${fmt(back)} ${u} and clears in ~${fmt(clear)} min`;}
 else{z="B";why="can't keep up even with the average: "+hint;}
 return Object.assign(CK(comp,z,`${fmt(inf)} in process at once vs capacity ${fmt(cap)} · handles ~${fmt(drain)} ${u}/h`,why,
  `in process at once = busiest hour ${fmt(c.R)} ${u} ÷ 3600 × ${fmtS(t)} = ${fmt(inf)}\nit can handle = ${fmt(cap)} ÷ ${fmtS(t)} × 3600 = ${fmt(drain)} ${u} per hour\nFit ≤ ${P.comfort}% of capacity · Adapt ≤ capacity, or the average ${fmt(c.avg)}/h ≤ what it handles · Beyond otherwise`,[kT,kC,"comfort","peakDur"].filter(Boolean),"volume"),{clear,drain});}
function delFit(c){const n=c.rpm,s=I.send;let z="F",why=`${({one:"One record per call",small:"Small batches",bulk:"Bulk or file"})[s]} matches ${fmt(n)} record${n>1?"s":""} per message`;
 if(n>P.massMax&&s!=="bulk"){z="B";why=`${fmt(n)} records per message need a bulk or file interface`;}
 else if(n>1&&s==="one"){z=n>P.batchMax?"B":"A";why=`${fmt(n)} records per message must be split again for one-per-call`;}
 else if(n>P.batchMax&&s==="small"){z="A";why=`${fmt(n)} records is more than one batch call (${fmt(P.batchMax)})`;}
 return CK("Delivery fit",z,`${fmt(n)} record${n>1?"s":""} per message, handed over as ${({one:"one per call",small:"small batches",bulk:"bulk or file"})[s]}`,why,`records per message = ${fmt(n)}\none per call: 1 · small batch: up to ${fmt(P.batchMax)} · bulk/file: any (practical OData limit ${fmt(P.massMax)})`,["batchMax","massMax"],"size");}
function tgtCheck(c){const f=I.send==="small"?P.smallF:I.send==="bulk"?P.bulkF:1,cap=P["cap_"+I.absorb];
 return capCk("Target capacity",{R:c.recs,avg:c.avg*c.rpm},P.tgtT/f,cap,"tgtT","cap_"+I.absorb,"agree more capacity, or hand over in batches","records");}
function slaCk(c,clearMin,batch){const lim={sec:0.1,min:P.slaMin,hour:P.slaHour,none:Infinity}[I.sla],lbl={sec:"within seconds",min:"within minutes",hour:"within the hour",none:"doesn't matter"}[I.sla];
 if(I.sla==="none")return NA("End-to-end SLA","no SLA set","volume");
 if(batch){const z=I.sla==="sec"?"B":I.sla==="min"?"A":"F";return CK("End-to-end SLA",z,lbl,z==="F"?"a scheduled run meets it":"batch runs can't deliver that fast","batch path: runs on a schedule, so delivery waits for the next run",["slaMin","slaHour"],"volume");}
 let z="F",why="met";if(clearMin>lim){z=clearMin>lim*4?"B":"A";why=`at peak, messages wait ~${fmt(clearMin)} min in a queue`;}else if(I.sla==="sec"&&c.ratio>4){z="A";why="peaks will queue for longer than seconds";}
 return CK("End-to-end SLA",z,lbl+(clearMin?` · queue clears in ~${fmt(clearMin)} min`:""),why,`SLA limit = ${fmt(lim)} min\nlongest queue clear time = ${fmt(clearMin)} min (from the capacity checks)`,["slaMin","slaHour"],"volume");}
function massCk(c,separate){
 if(!c.massRate)return NA("Mass loads","no mass loads","volume");
 if(separate)return CK("Mass loads","F",`${fmt(+I.massRec)} records in ${I.massWin} h`,"a good separate road for mass loads","bulk copy scales with data integration units",[],"volume");
 const z=c.massRate>P.ownRoad?"B":"A";return CK("Mass loads",z,`${fmt(c.massRate)} per hour on the event road`,z==="B"?"too much for the daily road: use a separate bulk road":"can share the road if run off-peak",`mass rate = ${fmt(+I.massRec||0)} ÷ ${+I.massWin||1} h = ${fmt(c.massRate)}/h\nBeyond above ${fmt(P.ownRoad)}/h`,["ownRoad"],"volume");}
function backlogCk(comp,bytes,capGB,kCap,note){
 if(bytes<=0)return NA(comp,"no backlog expected at peak","volume");
 const cap=capGB*1073741824,z=bytes<=cap*P.comfort/100?"F":bytes<=cap?"A":"B";
 return CK(comp,z,`peak backlog ≈ ${fmtB(bytes)} vs ${capGB} GB`,z==="F"?note:z==="A"?"backlog close to its storage limit":"backlog larger than its storage",`backlog = (busiest hour − what the iFlow handles) × ${P.peakDur} h × ${fmtB(c_msgT)} per message`,[kCap,"ciCap","peakDur"],"volume");}
let c_msgT=0;
function platforms(c){
 c_msgT=c.msgT;const PL=[];
 /* SAP BTP */
 const ci=capCk("Cloud Integration iFlow (doing the work)",c,c.secs,P.ciCap,"t_"+I.work,"ciCap","move the work upstream to a scalable platform");
 const ciThin=capCk("Cloud Integration iFlow (thin step only)",c,P.tThin,P.ciCap,"tThin","ciCap","group records before BTP");
 const w=Math.ceil(c.msgT/(P.slice*1024)),wb=Math.ceil(c.msgB/(P.slice*1024)),monthly=c.daily*P.workDays*w;
 const backlog=Math.max(0,(c.R-ci.drain)*P.peakDur)*c.msgT;
 PL.push({n:"SAP BTP Integration Suite",sub:"One shared tenant; the iFlow can't scale out for one interface.",cap:ci.drain,capTxt:"the iFlow doing the work",ch:[
  sizeCk("API Management",c.msgB,P.sapApimMB*0.5,P.sapApimMB,"sapApimMB","sapApimMB","enable streaming for large requests","above the non-streamed limit: streaming or claim check"),
  sizeCk("Cloud Integration iFlow (size)",c.msgB,P.ciSoftMB,P.ciGuardMB,"ciSoftMB","ciGuardMB","streaming design, avoid multicast and DOM parsing","above the sender guard: claim check or file path"),
  CK("Metering (per message)",w<=P.meterRatio?"F":"A",`each message billed as ${w} (biggest ${wb})`,w<=P.meterRatio?"normal cost per message":"cost per message rises: pass only what the target needs",`weight = ceil(message ${fmtB(c.msgT)} ÷ ${P.slice} KB) = ${w}\nFit ≤ ${P.meterRatio}`,["slice","meterRatio"],"size"),
  ci,ciThin,
  P.quota>0?CK("Metering (per month)",monthly<=P.quota?"F":"B",`≈ ${fmt(monthly)} billed messages per month vs budget ${fmt(P.quota)}`,monthly<=P.quota?"within budget":"over the monthly budget",`per month = average day ${fmt(c.daily)} × ${P.workDays} days × weight ${w}`,["quota","workDays"],"volume"):CK("Metering (per month)","I",`≈ ${fmt(monthly)} billed messages per month`,"for information (set a budget in settings to check it)",`per month = average day ${fmt(c.daily)} × ${P.workDays} days × weight ${w}`,["quota","workDays"],"volume"),
  backlogCk("JMS queues",backlog,P.jmsGB,"jmsGB","holds the iFlow backlog at peak")]});
 /* Azure */
 const rps=c.msgs/3600,azFn=capCk("Function App",c,c.secs,P.fnCap,"t_"+I.work,"fnCap","scale out the plan");
 const laSl=(()=>{const x=capCk("Logic App stateless",c,c.secs,P.laSlCap,"t_"+I.work,"laSlCap","scale out the plan");if(c.secs>P.laSlMax){x.z="B";x.why=`a run takes ${fmtS(c.secs)}, above the ${fmtS(P.laSlMax)} stateless limit: use stateful`;x.params.push("laSlMax");}else x.why+="; needs a durable queue in front";return x;})();
 PL.push({n:"Azure Integration Services (Premium)",sub:"Scales per interface: own plans and messaging units.",cap:Math.max(azFn.drain,laSl.drain),capTxt:"Function or stateless Logic App",ch:[
  sizeCk("Service Bus Premium (size)",c.msgB,P.sbEntMB,P.sbMaxMB,"sbEntMB","sbMaxMB","raise the entity's max message size","above the hard max: claim check"),
  sizeCk("Logic App (size)",c.msgB,P.laSoftMB,P.laMaxMB,"laSoftMB","laMaxMB","use chunking","above the action cap: blob + reference"),
  CK("API Management",rps<=P.apimRps*P.apimUnits*P.comfort/100?"F":rps<=P.apimRps*P.apimUnits?"A":"B",`${fmt(rps)} requests/s at peak vs ${fmt(P.apimRps*P.apimUnits)}`,"size not capped on Premium; rate checked per unit",`requests/s = ${fmt(c.msgs)} ÷ 3600\ncapacity = ${P.apimRps} × ${P.apimUnits} unit(s) (indicative)`,["apimRps","apimUnits","comfort"],"volume"),
  CK("Service Bus Premium (rate)",rps<=P.sbRate*P.sbMU*P.comfort/100?"F":rps<=P.sbRate*P.sbMU?"A":"B",`${fmt(rps)} msg/s vs ${fmt(P.sbRate*P.sbMU)}`,rps<=P.sbRate*P.sbMU?"within messaging-unit throughput":"add messaging units",`msg/s = ${fmt(c.msgs)} ÷ 3600\ncapacity = ${P.sbRate} × ${P.sbMU} MU (indicative; large messages lower it)`,["sbRate","sbMU","comfort"],"volume"),
  capCk("Logic App stateful",c,c.secs,P.laSfCap,"t_"+I.work,"laSfCap","scale out the plan, or use stateless for short runs"),
  laSl,azFn]});
 /* Solace */
 PL.push({n:"Solace / Advanced Event Mesh",sub:"Event broker; levels load in front of slower consumers.",cap:null,capTxt:"absorbs; drains at the consumer's pace",ch:[
  sizeCk("Message size",c.msgB,P.solSoftMB,P.solMaxMB,"solSoftMB","solMaxMB","close to the guaranteed message cap","above the cap: claim check"),
  backlogCk("Message spool",backlog,P.solSpoolGB,"solSpoolGB","absorbs the backlog in front of BTP"),
  massCk(c,false)]});
 /* ADF */
 const adfZ=I.who==="jobs"||I.traffic==="batch"?"F":(I.sla==="hour"||I.sla==="none")?"A":"B";
 PL.push({n:"Azure Data Factory",sub:"Batch and data path: scheduled runs, bulk loads.",cap:null,capTxt:"bulk; scales with data integration units",ch:[
  CK("Fit for this traffic",adfZ,I.traffic==="batch"?"scheduled batch":WHO[I.who],adfZ==="F"?"batch traffic suits a data path":adfZ==="A"?"continuous traffic must be collected into runs":"continuous traffic with a tight SLA is the wrong fit","ADF runs on schedules or triggers; it is not built for single messages",[],"volume"),
  slaCk(c,0,true),massCk(c,true)]});
 /* Target */
 const t=tgtCheck(c),clear=Math.max(ci.clear||0,t.clear||0);
 PL.push({n:"Target"+(I.tgtName?" — "+I.tgtName:""),sub:"The final speed limit.",cap:t.drain/Math.max(1,c.rpm),capTxt:"the target",ch:[delFit(c),t,slaCk(c,clear,false)]});
 PL.forEach(p=>{const real=p.ch.filter(x=>x.z==="F"||x.z==="A"||x.z==="B"),nb=real.filter(x=>x.z==="B").length,na=real.filter(x=>x.z==="A").length;p.v=nb?"B":na?"A":"F";
  p.lens={size:worstZ(p.ch.filter(x=>x.lens==="size")),volume:worstZ(p.ch.filter(x=>x.lens==="volume"))};});
 return PL;
}
function worstZ(a){const r=a.filter(x=>"FAB".includes(x.z));if(!r.length)return "N";return r.some(x=>x.z==="B")?"B":r.some(x=>x.z==="A")?"A":"F";}

