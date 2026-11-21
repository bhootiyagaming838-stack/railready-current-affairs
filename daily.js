(function(){
'use strict';
const root=document.getElementById('app');
const URL_DATA='./data/daily-mcqs.json';
const CACHE_KEY='railready_daily_question_cache_v1';
const SESSION_KEY='railready_daily_quiz_session_v1';
const state={data:null,session:null,error:'',loading:true,showResults:false};
const el=(text)=>String(text==null?'':text).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const today=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const read=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const write=(k,data)=>{try{localStorage.setItem(k,JSON.stringify(data))}catch(e){console.warn('Storage unavailable',e)}};
const btn=(value,action,theme,extra='')=>'<button type="button" class="btn '+(theme||'btnPrimary')+'" data-action="'+action+'" '+extra+'>'+value+'</button>';
const label=(q)=>'<span class="pill">'+el(q.topic||'Practice')+'</span>';
function checkData(d){return !!d&&typeof d.date==='string'&&Array.isArray(d.questions)&&d.questions.length>0&&d.questions.every(q=>q&&typeof q.id==='string'&&typeof q.question==='string'&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options).size===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4)}
async function refresh(){
 state.loading=true;state.error='';paint();
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  let res=await fetch(URL_DATA+'?refresh='+Date.now(),{cache:'no-store',signal:controller.signal});
  clearTimeout(timer);
  if(!res.ok)throw Error('Question feed unavailable ('+res.status+')');
  const data=await res.json();
  if(!checkData(data))throw Error('Invalid question data received');
  state.data=data;write(CACHE_KEY,data);
 }catch(e){
  state.error='Cannot reach the latest daily bank. Showing the last saved set if available.';
  state.data=read(CACHE_KEY);
 }
 state.loading=false;
 const session=read(SESSION_KEY);
 if(state.data&&session&&session.date===state.data.date&&Array.isArray(session.ids)&&session.ids.length>0){
  state.session=session;
 }else if(state.session&&state.data&&state.session.date!==state.data.date){state.session=null}
 paint();
}
function choose(mode){
 if(!state.data)return;
 let questions=state.data.questions.filter(q=>mode==='All'||q.topic===mode);
 if(!questions.length)return;
 state.session={date:state.data.date,mode,ids:questions.map(q=>q.id),index:0,selected:{},checked:{},finished:false};
 state.showResults=false;save();paint(true);
}
function save(){if(state.session)write(SESSION_KEY,state.session)}
function questions(){
 if(!state.data||!state.session)return [];
 const map=new Map(state.data.questions.map(q=>[q.id,q]));
 return state.session.ids.map(id=>map.get(id)).filter(Boolean);
}
function stats(){
 const s=state.session,qs=questions();
 if(!s)return {correct:0,wrong:0,skipped:0,score:0};
 let correct=0,wrong=0;
 for(let i=0;i<qs.length;i++){
  if(!s.checked[i])continue;
  if(s.selected[i]===qs[i].answer)correct++; else wrong++;
 }
 return {correct,wrong,skipped:qs.length-correct-wrong,score:Number((correct-wrong/3).toFixed(2))};
}
function home(){
 let data=state.data;
 if(!data)return '<div class="panel"><h2>Daily questions are unavailable</h2><p>The free GitHub workflow may not have published the first set. Try refreshing.</p>'+btn('↻ Refresh daily bank','refresh','btnPrimary')+'</div>';
 const n=data.questionCount||data.questions.length,math=data.questions.filter(x=>x.topic==='Mathematics').length,reason=data.questions.filter(x=>x.topic==='Reasoning').length;
 const outdated=data.date!==today();
 return '<section class="heroDaily"><span class="caps">RAILREADY DAILY STUDY</span><h1>New questions.<br>Every day.</h1><p>Freshly generated original Maths and Reasoning exam-style MCQs, with explanations and answer keys.</p><div class="dailyStats"><div><strong>'+n+'</strong><span>New MCQs</span></div><div><strong>'+math+'</strong><span>Mathematics</span></div><div><strong>'+reason+'</strong><span>Reasoning</span></div></div></section>'+
 '<div class="dailyHeader"><h2>Study set · '+el(data.date)+'</h2>'+btn('↻ Refresh','refresh','btnOutline btnSmall')+'</div>'+
 (outdated?'<div class="alert">The latest published set is from '+el(data.date)+'. GitHub scheduling can run late. Refresh after the next scheduled run.</div>':'')+
 (state.error?'<div class="alert">'+el(state.error)+'</div>':'')+
 '<div class="panel"><div class="caps">START TODAY’S QUIZ</div><h2>Choose what to practise</h2><p>Answers are saved on this device. You can switch between all questions or a single subject.</p><div class="dailyButtons">'+btn('All '+n+' questions →','start','btnPrimary','data-mode="All"')+btn(math+' Maths questions','start','btnOutline','data-mode="Mathematics"')+btn(reason+' Reasoning questions','start','btnOutline','data-mode="Reasoning"')+'</div>'+
 (state.session&&state.session.date===data.date?'<div class="dailyButtons" style="margin-top:12px">'+btn(state.session.finished?'See last score':'Resume your session','resume','btnSoft')+'</div>':'')+'</div>'+
 '<div class="notice"><b>About these MCQs:</b> They are newly parameterised original calculations and reasoning problems, <strong>not</strong> verified RRB previous-year questions or independently checked current-affairs facts. Your original Floot app remains available separately.</div>';
}
function quiz(){
 const s=state.session,qs=questions();
 if(!s||!qs.length)return home();
 if(s.finished||state.showResults)return results();
 const i=Math.min(Math.max(s.index,0),qs.length-1);s.index=i;
 const q=qs[i],selected=s.selected[i],checked=!!s.checked[i];
 const count=Object.keys(s.checked).length;
 const options=q.options.map((choice,index)=>{
  let klass='';
  if(selected===index)klass+=' selected';
  if(checked&&index===q.answer)klass+=' correct';
  if(checked&&index===selected&&selected!==q.answer)klass+=' wrong';
  return '<button class="answerOption'+klass+'" type="button" data-action="answer" data-choice="'+index+'" '+(checked?'disabled':'')+'><i>'+String.fromCharCode(65+index)+'</i><span>'+el(choice)+'</span></button>';
 }).join('');
 const explanation=checked?'<div class="explain"><b>'+(selected===q.answer?'Correct!':'Answer to remember')+'</b><div>'+el(q.explanation)+'</div></div>':'';
 const navigator=qs.map((question,index)=>'<button data-action="jump" data-index="'+index+'" type="button" class="'+(index===i?'active':s.checked[index]?'done':'')+'">'+(index+1)+'</button>').join('');
 return '<div class="dailyHeader"><h2>'+el(s.mode==='All'?'Daily mixed quiz':s.mode)+'</h2>'+btn('← All sets','back','btnOutline btnSmall')+'</div>'+
 '<div class="promptMeta"><span>Question '+(i+1)+' / '+qs.length+'</span><span>'+count+' checked</span></div>'+
 '<div class="progressTrack"><div style="width:'+((i+1)/qs.length*100).toFixed(1)+'%"></div></div>'+
 '<div class="panel"><div class="promptMeta">'+label(q)+'<span>'+el(q.skill||'')+'</span></div><h2 class="quizTitle">'+el(q.question)+'</h2>'+options+explanation+'</div>'+
 '<div class="dailyButtons">'+
 btn('← Previous','previous','btnOutline',''+(i===0?'disabled':''))+
 (checked?btn(i===qs.length-1?'See results →':'Next question →','next','btnPrimary'):btn('Check answer','check','btnPrimary',selected===undefined?'disabled':''))+
 btn('Skip →','skip','btnOutline')+'</div>'+
 '<div class="panel"><div class="dailyHeader"><h2>Question navigator</h2><span class="smallNote">'+count+' reviewed</span></div><div class="qIndex">'+navigator+'</div><p class="smallNote">Green: checked · Dark: selected question · White: not checked.</p>'+
 btn('Finish & show score','finish','btnSoft btnFull')+'</div>';
}
function results(){
 const s=state.session,qs=questions();if(!s||!qs.length)return home();
 const res=stats();
 return '<div class="eyebrow">DAILY PRACTICE RESULTS</div><h1>Session<br><em>complete.</em></h1><div class="panel"><span class="caps">'+el(s.mode)+' · '+el(s.date)+'</span><div class="bigScore">'+res.score+' / '+qs.length+'</div>'+
 '<div class="dailyStats" style="background:#176c55;border-radius:15px;padding:10px"><div><strong>'+res.correct+'</strong><span>Correct</span></div><div><strong>'+res.wrong+'</strong><span>Incorrect</span></div><div><strong>'+res.skipped+'</strong><span>Skipped</span></div></div>'+
 '<p>+1 correct · −⅓ wrong · 0 skipped. Scores and review remain saved in this browser.</p></div>'+
 '<div class="dailyButtons">'+btn('Review answers','review','btnPrimary')+btn('New set','back','btnOutline')+'</div>';
}
function review(){
 const qs=questions(),s=state.session;
 if(!s||!qs.length)return home();
 let wrong=qs.filter((q,i)=>s.checked[i]&&s.selected[i]!==q.answer);
 return '<div class="eyebrow">ANSWER EXPLANATIONS</div><h1>Learn from<br><em>your attempt.</em></h1>'+
 btn('← Back to score','results','btnOutline')+
 (wrong.length?'<p class="smallNote">Reviewing '+wrong.length+' incorrect answers.</p>':'<div class="notice">No incorrect checked answers. Excellent!</div>')+
 wrong.map(q=>'<article class="panel"><div class="caps">'+el(q.topic)+' · '+el(q.skill||'')+'</div><h2 class="quizTitle">'+el(q.question)+'</h2><p><b>Correct:</b> '+el(q.options[q.answer])+'</p><div class="explain">'+el(q.explanation)+'</div></article>').join('');
}
function paint(scroll=false){
 let body=state.loading&&!state.data?'<div class="panel">Loading today’s question bank…</div>':state.showResults===true&&state.session&&state.session.finished?review():state.session&&state.session.finished?results():state.session?quiz():home();
 root.innerHTML=body+'<div class="footerDaily">RailReady · Free daily original practice MCQs<br><a href="https://railready-ntpc.floot.app/" class="helpLink" target="_blank" rel="noopener noreferrer">Return to the Floot RailReady app</a></div>';
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function finish(){
 if(!state.session)return;
 state.session.finished=true;state.showResults=false;save();paint(true);
}
document.addEventListener('click',e=>{
 const button=e.target.closest('button[data-action]');if(!button||button.disabled)return;
 const s=state.session,action=button.dataset.action;
 if(action==='refresh'){refresh();return}
 if(action==='start'){choose(button.dataset.mode||'All');return}
 if(action==='resume'){state.showResults=false;paint(true);return}
 if(action==='back'){state.session=null;state.showResults=false;paint(true);return}
 if(!s)return;
 if(action==='answer'){
  if(!s.checked[s.index]){s.selected[s.index]=Number(button.dataset.choice);save();paint()}return;
 }
 if(action==='check'){
  if(s.selected[s.index]!==undefined&&!s.checked[s.index]){s.checked[s.index]=true;save();paint()}return;
 }
 if(action==='previous'){s.index=Math.max(0,s.index-1);save();paint(true);return}
 if(action==='next'||action==='skip'){
  if(s.index+1>=questions().length){if(window.confirm('End today’s quiz and see the score?'))finish()}
  else{s.index++;save();paint(true)}return;
 }
 if(action==='jump'){s.index=Number(button.dataset.index);save();paint(true);return}
 if(action==='finish'){if(window.confirm('Finish the quiz? Unchecked questions count as skipped.'))finish();return}
 if(action==='review'){state.showResults=true;paint(true);return}
 if(action==='results'){state.showResults=false;paint(true);return}
});
refresh();
})();