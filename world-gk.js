(function(){
"use strict";
const dataURL="./data/world-gk.json";
const indiaURL="./data/general-awareness-bank.json";
const STORAGE="railready_world_gk_progress_v1";
const CACHE="railready_world_gk_data_v1";
const root=document.querySelector("main");
const byId=id=>document.getElementById(id);
const esc=v=>String(v===undefined||v===null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const url=v=>/^https:\/\//.test(String(v||""))?esc(v):"#";
const pickRandom=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const validQ=q=>q&&typeof q.id==="string"&&typeof q.question==="string"&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options).size===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&typeof q.explanation==="string";
const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}};
const saveJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.warn("Unable to persist progress",e)}};
const state={tab:"orders",pos:"All",category:"All",bankCategory:"All",search:"",limit:18,data:null,india:[],session:null,history:(readJSON(STORAGE)||{sessions:[]}).sessions||[]};
function btn(text,action,extra="",cl="btn"){return '<button type="button" class="'+cl+'" data-action="'+action+'" '+extra+'>'+text+'</button>'}
async function load(){
 try{
  const response=await fetch(dataURL+"?t="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw Error("GK feed "+response.status);
  const data=await response.json();
  if(!Array.isArray(data.series)||!Array.isArray(data.questions))throw Error("Invalid world GK data");
  const invalid=data.questions.filter(q=>!validQ(q));
  if(invalid.length)throw Error("Invalid GK questions: "+invalid.length);
  state.data=data;
  saveJSON(CACHE,data);
 }catch(error){
  const cached=readJSON(CACHE);
  if(cached&&Array.isArray(cached.series)&&Array.isArray(cached.questions)){state.data=cached}
  else {byId("loadStatus").textContent="Unable to load the GK bank. Check your internet connection and reload.";byId("loadStatus").className="info warn";return}
 }
 try{
  const response=await fetch(indiaURL+"?t="+Date.now(),{cache:"no-store"});
  if(response.ok){const j=await response.json();state.india=Array.isArray(j.questions)?j.questions.filter(validQ):[]}
 }catch(error){console.warn("Indian GA bank optional",error)}
 byId("loadStatus").innerHTML="<b>Ready:</b> "+state.data.questions.length+" new world/international questions + "+state.india.length+" Indian General Awareness questions. Every question is original practice, not a copied PYQ.";
 byId("heroCount").textContent=state.data.series.length+" topics";
 initFilters();renderOrders();renderLibrary();renderStudyTab();
}
function setTab(tab){
 state.tab=tab;
 document.querySelectorAll("[data-tab]").forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle("active",active);el.setAttribute("aria-selected",String(active))});
 ["orders","library","quiz","drill"].forEach(k=>byId("view"+k[0].toUpperCase()+k.slice(1))?.classList.toggle("hidden",k!==tab));
 if(tab==="quiz"||tab==="drill")renderStudyTab();
 document.getElementById("loadStatus")?.scrollIntoView?.({behavior:"auto",block:"nearest"});
}
function initFilters(){
 const d=state.data;
 byId("orderFilters").innerHTML=["All","First","Second","Current","Second-last","Last"].map(p=>'<button class="pill '+(p===state.pos?"active":"")+'" data-pos="'+esc(p)+'">'+esc(p==="All"?"All positions":p)+'</button>').join("");
 byId("orderCategoryFilters").innerHTML=["All",...new Set([...d.series.map(s=>s.category),...(d.currentHighlights||[]).map(s=>s.category)])].map(c=>'<button class="pill '+(c===state.category?"active":"")+'" data-ordercat="'+esc(c)+'">'+esc(c)+'</button>').join("");
 const cats=["All",...new Set(d.questions.filter(q=>q.topic!=="First & Last GK").map(q=>q.skill))];
 byId("bankFilters").innerHTML=cats.map(c=>'<button class="pill '+(c===state.bankCategory?"active":"")+'" data-bankcat="'+esc(c)+'">'+esc(c)+'</button>').join("");
}
function renderOrders(){
 if(!state.data)return;
 const series=state.data.series.filter(s=>(state.category==="All"||s.category===state.category)&&(state.pos==="Current"?!!s.current:state.pos==="All"||s.entries.some(e=>e.position===state.pos)));
 byId("orderCount").textContent=series.length+" series";
 byId("seriesList").innerHTML=series.map(s=>'<article class="card"><div class="row"><div><span class="category">'+esc(s.category)+'</span><h2>'+esc(s.title)+'</h2></div><span class="count">'+s.entries.length+' facts</span></div><p>'+esc(s.scope)+'</p><div class="factGrid">'+s.entries.filter(e=>state.pos==="All"||e.position===state.pos).map(e=>'<div class="fact"><span class="position">'+esc(e.position)+'</span><strong>'+esc(e.value)+'</strong><p>'+esc(e.note)+'</p></div>').join("")+(s.current&&(state.pos==="All"||state.pos==="Current")?'<div class="fact currentFact"><span class="position">'+(s.current.kind==="latest-event"?"Latest completed":"Current")+" · "+esc(s.current.asOf)+'</span><strong>'+esc(s.current.value)+'</strong><p>'+esc(s.current.detail)+'</p><a href="'+url(s.current.source)+'" target="_blank" rel="noopener noreferrer">Official source ↗</a></div>':"")+'</div><div class="hint"><b>Memory tip:</b> '+esc(s.tip)+'</div><div class="cardFooter"><a href="'+url(s.source)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>'+btn("Quiz on this topic →","series",'data-series="'+esc(s.id)+'"')+'</div></article>').join("");
 const currentRoot=byId("currentHighlights");
 if(currentRoot){
  const shown=(state.data.currentHighlights||[]).filter(x=>state.category==="All"||x.category===state.category);
  currentRoot.classList.toggle("hidden",!(state.pos==="All"||state.pos==="Current")||shown.length===0);
  const slot=byId("currentHighlightsList");
  if(slot)slot.innerHTML=shown.map(x=>'<article class="fact currentFact"><span class="position">Current · '+esc(x.asOf)+'</span><h3>'+esc(x.role)+'</h3><strong>'+esc(x.value)+'</strong><p>'+esc(x.detail)+'</p><a href="'+url(x.source)+'" target="_blank" rel="noopener noreferrer">Official source ↗</a></article>').join("");
 }
 byId("orderFilters").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.pos===state.pos));
 byId("orderCategoryFilters").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.ordercat===state.category));
}
function renderLibrary(){
 if(!state.data)return;
 let items=state.data.questions.filter(q=>q.topic!=="First & Last GK");
 items=items.filter(q=>state.bankCategory==="All"||q.skill===state.bankCategory);
 const word=state.search.trim().toLowerCase();
 if(word)items=items.filter(q=>(q.question+" "+q.explanation+" "+q.skill).toLowerCase().includes(word));
 byId("bankSummary").textContent="Showing "+Math.min(state.limit,items.length)+" of "+items.length+" original global GK questions. Answers and explanations open when you click a question.";
 byId("bankList").innerHTML=items.slice(0,state.limit).map((q,i)=>'<div class="card"><div class="category">'+esc(q.skill)+'</div><h3>'+esc(q.question)+'</h3><details><summary style="font-weight:800;color:var(--green);cursor:pointer">Reveal answer & explanation</summary><p><b>Answer:</b> '+esc(q.options[q.answer])+'</p><p>'+esc(q.explanation)+'</p></details></div>').join("");
 byId("showMore").classList.toggle("hidden",items.length<=state.limit);
 byId("bankFilters").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.bankcat===state.bankCategory));
}
function selectBalanced(data,india){
 const world=data.questions.filter(q=>q.topic!=="First & Last GK");
 const seq=data.questions.filter(q=>q.topic==="First & Last GK");
 const plan=[
  [india.filter(q=>q.skill==="Polity"||q.skill==="History"),12],
  [world.filter(q=>q.skill==="World Science"),8],
  [india.filter(q=>q.skill==="Geography"),4],
  [world.filter(q=>q.skill==="World Geography"),2],
  [world.filter(q=>q.skill==="Computers"),3],
  [india.filter(q=>q.skill==="Economy"),3],
  [world.filter(q=>q.skill==="World Organisations"),2],
  [world.filter(q=>q.skill==="World History"),1],
  [world.filter(q=>q.skill==="World Sports"),1],
  [world.filter(q=>q.skill==="Environment"),2],
  [seq,2]
 ];
 const ids=new Set(),result=[];
 for(const [pool,n] of plan){let added=0;for(const q of pickRandom(pool)){if(added>=n)break;if(ids.has(q.id))continue;result.push(q);ids.add(q.id);added++}}
 for(const q of pickRandom([...world,...seq,...india])){if(result.length>=40)break;if(!ids.has(q.id)){result.push(q);ids.add(q.id)}}
 return pickRandom(result).slice(0,40);
}
function start(mode,seriesId){
 if(!state.data)return;
 let items;
 if(seriesId){items=state.data.questions.filter(q=>q.seriesId===seriesId)}
 else if(mode==="drill"){items=selectBalanced(state.data,state.india)}
 else {items=pickRandom([...state.data.questions,...state.india]).slice(0,20)}
 if(!items.length)return;
 state.session={mode,seriesId:seriesId||"",items,index:0,selected:null,checked:false,correct:0,wrong:0,skipped:0,completed:false,answerLog:[],startedAt:Date.now(),deadline:mode==="drill"?Date.now()+36*60*1000:null};
 setTab(mode==="drill"?"drill":"quiz");
 renderStudyTab();
}
function complete(){
 const s=state.session;if(!s||s.completed)return;
 s.completed=true;
 const record={date:new Date().toLocaleString("en-IN"),mode:s.mode,count:s.items.length,correct:s.correct,wrong:s.wrong,skipped:s.skipped,score:Number((s.correct-s.wrong/3).toFixed(2))};
 state.history=[record,...state.history].slice(0,50);
 saveJSON(STORAGE,{sessions:state.history});
 renderStudyTab();
}
function choose(index){const s=state.session;if(!s||s.checked||s.completed)return;s.selected=index;renderStudyTab()}
function check(){
 const s=state.session;if(!s||s.checked||s.selected===null||s.completed)return;
 const q=s.items[s.index];s.checked=true;
 const correct=q.answer===s.selected;
 if(correct)s.correct++;else s.wrong++;
 s.answerLog.push({question:q.question,chosen:q.options[s.selected],answer:q.options[q.answer],explanation:q.explanation,correct});
 renderStudyTab();
}
function next(skip){
 const s=state.session;if(!s||s.completed)return;
 if(skip&&!s.checked){s.skipped++;const q=s.items[s.index];s.answerLog.push({question:q.question,chosen:"Skipped",answer:q.options[q.answer],explanation:q.explanation,correct:null})}
 else if(!s.checked)return;
 if(s.index+1>=s.items.length){complete();return}
 s.index++;s.selected=null;s.checked=false;renderStudyTab();
}
function clock(){
 const s=state.session;
 if(!s||s.mode!=="drill"||s.completed)return;
 const left=Math.max(0,Math.ceil((s.deadline-Date.now())/1000));
 if(left===0){s.skipped+=s.items.length-s.index-(s.checked?1:0);complete();return}
 const el=byId("timer");if(el){el.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0")}
}
function renderStudyTab(){
 const inDrill=state.tab==="drill",area=byId(inDrill?"drillArea":"quizArea");if(!area)return;
 const s=state.session;
 if(!s|| (inDrill&&s.mode!=="drill") || (!inDrill&&s.mode==="drill")){
  area.innerHTML='<div class="card"><div class="caps">'+(inDrill?"RRB CBT-1 GA SECTION":"20-QUESTION MIXED PRACTICE")+'</div><h2>'+(inDrill?"40-question RRB-inspired static General Awareness drill":"Practice India + World GK together")+'</h2><p>'+(inDrill?"A static-GA selection weighting Indian history/polity, Class 10 science, geography, computers, economy, environment and a smaller international/firsts component. This excludes current affairs, which must be revised separately. The 36-minute timer is for practice; RRB has not assigned this time limit to the GA section.":"Original four-option exam-style questions with clear explanations and −⅓ for incorrect answers.")+'</p><p class="note">Your scores stay on this device. Not actual RRB PYQ text.</p>'+btn("Start "+(inDrill?"40-question timed drill":"20-question quiz")+" →","start",'data-mode="'+(inDrill?"drill":"quiz")+'"')+'</div>'+recentHistory();
  return;
 }
 if(s.completed){
  const score=(s.correct-s.wrong/3).toFixed(2);
  area.innerHTML='<div class="card final"><div class="caps">SESSION COMPLETE</div><h2>Results & explanations</h2><strong>'+score+' / '+s.items.length+'</strong><p>'+s.correct+' correct · '+s.wrong+' incorrect · '+s.skipped+' skipped · ⅓ negative marking</p>'+btn("Start another set →","start",'data-mode="'+s.mode+'"')+'</div><div class="card"><h2>Answer review</h2>'+s.answerLog.map((x,i)=>'<details style="border-bottom:1px solid var(--line);padding:11px 0"><summary style="cursor:pointer">'+(i+1)+'. '+esc(x.question)+' '+(x.correct===true?"✓":x.correct===false?"✗":"–")+'</summary><p><b>Your answer:</b> '+esc(x.chosen)+'</p><p><b>Correct:</b> '+esc(x.answer)+'</p><p>'+esc(x.explanation)+'</p></details>').join("")+'</div>';
  return;
 }
 const q=s.items[s.index];
 const status=s.checked?(s.selected===q.answer?"Correct!":"Not quite"):"Choose one option and check your answer.";
 const label=s.mode==="drill"?"RRB GA PATTERN DRILL":"GK PRACTICE";
 area.innerHTML='<div class="quizTop"><span>'+label+' · '+esc(q.skill||"First & Last GK")+'</span><span>Question '+(s.index+1)+' of '+s.items.length+'</span>'+(s.mode==="drill"?'<span>Time left: <b id="timer"></b></span>':"")+'</div><div class="progress"><div style="width:'+Math.round((s.index+1)/s.items.length*100)+'%"></div></div><div class="card"><div class="category">'+esc(q.skill||"World GK")+'</div><h2>'+esc(q.question)+'</h2><div class="choices">'+q.options.map((o,i)=>'<button type="button" data-answer="'+i+'" class="choice '+(s.selected===i?"sel ":"")+(s.checked&&i===q.answer?"right ":"")+(s.checked&&i===s.selected&&i!==q.answer?"wrong ":"")+'" '+(s.checked?"disabled":"")+'><span>'+String.fromCharCode(65+i)+'</span>'+esc(o)+'</button>').join("")+'</div>'+(s.checked?'<div class="explanation"><strong>'+status+'</strong><div>Correct answer: '+esc(q.options[q.answer])+'</div><p>'+esc(q.explanation)+'</p>'+(q.source?'<a href="'+url(q.source)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':"")+'</div>':'<p class="note">'+status+'</p>')+'</div><div class="controls">'+(s.checked?btn(s.index===s.items.length-1?"Finish & view score →":"Next question →","next"):btn("Check answer","check",s.selected===null?"disabled":""))+btn("Skip →","skip","","btn secondary")+'</div>';
 clock();
}
function recentHistory(){
 if(!state.history.length)return "";
 return '<div class="card"><h2>Recent sessions</h2>'+state.history.slice(0,3).map(x=>'<p>'+esc(x.date)+' · '+x.count+' questions · score '+x.score+'</p>').join("")+'</div>';
}
root.addEventListener("click",event=>{
 const el=event.target.closest("button");if(!el)return;
 if(el.dataset.tab){setTab(el.dataset.tab);return}
 if(el.dataset.pos){state.pos=el.dataset.pos;renderOrders();return}
 if(el.dataset.ordercat){state.category=el.dataset.ordercat;renderOrders();return}
 if(el.dataset.bankcat){state.bankCategory=el.dataset.bankcat;state.limit=18;renderLibrary();return}
 if(el.dataset.answer!==undefined){choose(Number(el.dataset.answer));return}
 switch(el.dataset.action){
 case "series":start("quiz",el.dataset.series);break;
 case "start":start(el.dataset.mode||"quiz");break;
 case "check":check();break;
 case "next":next(false);break;
 case "skip":next(true);break;
 }
 if(el.id==="showMore"){state.limit+=18;renderLibrary()}
});
byId("search").addEventListener("input",event=>{state.search=event.target.value;state.limit=18;renderLibrary()});
setInterval(clock,1000);
load();
})();