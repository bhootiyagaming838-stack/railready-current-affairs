(function(){
"use strict";
var ROOT=document.getElementById("app");
var A="./data/";
var FILES={ga:A+"general-awareness-bank.json",qr:A+"quant-reasoning-bank.json",lessons:A+"study-lessons.json",pyq:A+"pyq-source-index.json",news:A+"news.json"};
var PAGE_ITEMS=[["home","⌂","Home"],["learn","▤","Learn"],["practice","☑","Quiz"],["mock","◷","Mock"],["news","▣","News"],["review","☆","Progress"]];
var today=function(d){var x=d||new Date();return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};
var plusDays=function(day,offset){var t=day.split("-").map(Number);var d=new Date(t[0],t[1]-1,t[2]+offset);return today(d)};
var esc=function(value){return String(value==null?"":value).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})};
var href=function(url){return /^https:\/\//.test(String(url||""))?esc(url):"#"};
var store=function(key,def){try{var val=JSON.parse(localStorage.getItem(key)||"null");return val===null?def:val}catch{return def}};
var profile=store("rr_complete_progress_v1",null)||{version:1,history:[],bookmarks:{},mistakes:{},revisions:{},activity:{},topicStats:{},goal:15};
function normalizeProfile(p){
 if(!p||p.version!==1||!Array.isArray(p.history)||typeof p.bookmarks!=="object"||!p.bookmarks||typeof p.revisions!=="object"||!p.revisions)throw Error("Invalid RailReady progress file");
 return {version:1,history:p.history.slice(0,100),bookmarks:p.bookmarks||{},mistakes:p.mistakes||{},revisions:p.revisions||{},activity:p.activity||{},topicStats:p.topicStats||{},goal:([10,15,20,30].indexOf(Number(p.goal))>=0?Number(p.goal):15)}
}
try{profile=normalizeProfile(profile)}catch{profile={version:1,history:[],bookmarks:{},mistakes:{},revisions:{},activity:{},topicStats:{},goal:15}}
function save(){try{localStorage.setItem("rr_complete_progress_v1",JSON.stringify(profile))}catch(e){console.warn("Progress save unavailable",e)}}
var state={page:"home",lessonSection:"Mathematics",lessonId:null,practiceSection:"All",practiceSkill:"All",newsCategory:"All",newsLimit:12,ga:[],math:[],reason:[],lessons:[],pyq:[],news:[],newsDate:null,status:"Loading question banks…",issues:[],quiz:null,viewAnswers:false,loaded:false};
function allQuestions(){return state.ga.concat(state.math,state.reason)}
function shuffle(items){var a=items.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function validQ(q){return q&&typeof q.id==="string"&&typeof q.question==="string"&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options).size===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&typeof q.explanation==="string"}
function unique(items){var seen=new Set();return items.filter(function(q){if(!validQ(q))return false;var k=q.question.toLowerCase().replace(/[^a-z0-9]+/g,"");if(seen.has(k))return false;seen.add(k);return true})}
async function fetchJSON(label,path){
 var key="rr_complete_cache_"+label;try{
  var controller=new AbortController();var timer=setTimeout(function(){controller.abort()},15000);
  var r=await fetch(path+(path.indexOf("?")<0?"?":"&")+"t="+Date.now(),{cache:"no-store",signal:controller.signal});clearTimeout(timer);
  if(!r.ok)throw Error(label+" HTTP "+r.status);
  var value=await r.json();
  try{localStorage.setItem(key,JSON.stringify(value))}catch{}
  return value;
 }catch(err){
  state.issues.push(label+" could not refresh; "+(localStorage.getItem(key)?"using cached content":"no cache available")+".");
  var cached=store(key,null);return cached;
 }
}
async function loadAll(){
 state.issues=[];state.status="Checking the latest study content…";paint();
 var payload=await Promise.all([fetchJSON("ga",FILES.ga),fetchJSON("qr",FILES.qr),fetchJSON("lessons",FILES.lessons),fetchJSON("pyq",FILES.pyq),fetchJSON("news",FILES.news)]);
 state.ga=unique((payload[0]&&payload[0].questions||[]).map(function(q){return Object.assign({},q,{topic:"General Awareness"})}));
 state.math=unique((payload[1]&&payload[1].questions||[]).filter(function(q){return q.topic==="Mathematics"}));
 state.reason=unique((payload[1]&&payload[1].questions||[]).filter(function(q){return q.topic==="Reasoning"}));
 state.lessons=(payload[2]&&payload[2].lessons||[]).filter(function(l){return l&&l.id&&l.section&&l.title});
 state.pyq=(payload[3]&&payload[3].resources||[]).filter(function(s){return s&&s.url&&s.title});
 state.news=(payload[4]&&payload[4].notes||[]).filter(function(n){return n&&n.headline&&n.source&&n.topic&&n.topic!=="Assam & Northeast"});
 state.newsDate=payload[4]&&payload[4].updatedAt||null;
 state.status=(state.ga.length+state.math.length+state.reason.length)+" exam-style questions • "+state.news.length+" news headlines";
 state.loaded=true;
 if(state.quiz&&state.quiz.questions&&!state.quiz.finished){ // preserve an in-progress attempt after refresh
  state.quiz.questions=state.quiz.questions.filter(validQ);
  if(!state.quiz.questions.length)state.quiz=null;
 }
 paint();
}
function tag(text){return '<span class="pill">'+esc(text)+'</span>'}
function button(text,action,cls,attrs){
 return '<button class="btn '+(cls||"btnPrimary")+'" type="button" data-action="'+esc(action)+'" '+(attrs||"")+'>'+text+'</button>';
}
function top(){return '<header class="header"><div class="headerInner"><a href="#" data-action="go" data-page="home" class="brand"><span class="logo">R</span><span><strong>RailReady</strong><small>RRB NTPC · GRADUATE</small></span></a><span class="topTag"><i class="pulse"></i> FREE STUDY EDITION</span></div></header>'}
function nav(){return '<nav class="bottom" aria-label="Main navigation">'+PAGE_ITEMS.map(function(it){return '<button type="button" data-action="go" data-page="'+it[0]+'" class="'+((it[0]===state.page||(state.page==="lesson"&&it[0]==="learn")||(state.page==="quiz"&&(it[0]==="mock"&&state.quiz&&state.quiz.type==="mock"||it[0]==="practice"&&state.quiz&&state.quiz.type!=="mock")))?'on':'')+'"><span class="ico">'+it[1]+'</span><span>'+it[2]+'</span></button>'}).join("")+'</nav>'}
function sectionTitle(title,sub){return '<div class="sectionTitle"><h2>'+title+'</h2>'+(sub?'<span class="tiny">'+esc(sub)+'</span>':'')+'</div>'}
function countToday(){return Number(profile.activity[today()]||0)}
function streak(){
 var d=new Date(),s=0;if(!profile.activity[today(d)])d.setDate(d.getDate()-1);
 while(profile.activity[today(d)]){s++;d.setDate(d.getDate()-1);if(s>1000)break}return s;
}
function totalAttempted(){return (profile.history||[]).reduce(function(a,h){return a+(Number(h.attempted)||0)},0)}
function numberCard(value,label,symbol){return '<div class="stat"><div class="statIcon">'+symbol+'</div><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>'}
function home(){
 var total=allQuestions().length,answered=countToday(),goal=profile.goal,percent=Math.min(100,Math.round(answered/goal*100));
 return '<div class="eyebrow">YOUR COMPLETE RAILWAY EXAM COMPANION</div><h1>Study smarter.<br><em>Qualify stronger.</em></h1><p class="intro">General Awareness, Mathematics and Reasoning in one place—with CBT-1 mocks, concise lessons, current news and targeted revision.</p>'+
 '<section class="hero"><div><span class="caps">FULL SYLLABUS PRACTICE</span><h2>'+total+' questions<br>ready to solve</h2><p>'+state.ga.length+' GA · '+state.math.length+' Maths · '+state.reason.length+' Reasoning</p>'+button('Try a quick 5-question quiz →','quick','btnGold')+'</div><div class="heroOrb">R</div></section>'+
 '<div class="stats">'+numberCard(streak()+' days','Study streak','♨')+numberCard(answered+'/'+goal,'Today’s answers','◎')+numberCard(Object.keys(profile.bookmarks).length,'Saved questions','☆')+'</div>'+
 '<section class="card"><div class="metaRow"><span>YOUR DAILY MISSION</span><span>'+percent+'% COMPLETE</span></div><h2 style="font:600 26px Newsreader,serif">One session at a time.</h2><div class="progressBg"><div class="progressFill" style="width:'+percent+'%"></div></div><div class="chips">'+[10,15,20,30].map(function(x){return '<button class="chip '+(goal===x?"on":"")+'" data-action="goal" data-count="'+x+'">'+x+' questions</button>'}).join("")+'</div><p class="tiny">Your target and streak are saved on this device.</p></section>'+
 '<section class="card" style="background:#eaf3e8"><div class="caps">AUTOMATIC DAILY MCQs</div><h2 class="cardTitle">60 new questions every morning</h2><p>30 original Maths + 30 Reasoning problems generated for each day, with explanations and saved progress.</p><a class="btn btnPrimary" href="./daily.html">Open today’s MCQs →</a></section>'+
 '<section class="card" style="background:#e8f2eb;border-color:#b8d7c4"><div class="caps">NEW · WORLDWIDE GK · RRB NTPC PYQ-PATTERN</div><h2 class="cardTitle">World GK, firsts and lasts</h2><p>79 world/general GK questions, 58 international first/second/second-last/last questions across 20 series, and a balanced 40-question General Awareness drill. Based on the official syllabus and reviewed past-paper examples. Original MCQs, not copied PYQs.</p><a class="btn btnPrimary" href="./world-gk.html">Study World GK & RRB-pattern questions →</a></section>'+
 sectionTitle("Start learning","14 lessons in each subject")+
 '<div class="grid2">'+['Mathematics','Reasoning'].map(function(s){return '<div class="card"><div class="caps">'+esc(s)+'</div><div class="cardTitle">'+(s==="Mathematics"?"Calculate with confidence.":"Think logically.")+'</div><p>Rules, examples, shortcuts and topic quizzes.</p>'+button("Open lessons →","learn","btnOutline btnSmall",'data-section="'+esc(s)+'"')+'</div>'}).join("")+'</div>'+
 '<section class="card" style="background:#e8f0e9"><div class="caps">REAL EXAM FORMAT</div><h2 class="cardTitle">100-question CBT-1 mock</h2><p>40 General Awareness + 30 Mathematics + 30 Reasoning · 90 minutes · +1 / −⅓.</p>'+button("Open full mock →","go","btnPrimary",'data-page="mock"')+'</section>'+
 '<div class="btnRow">'+button("View today’s news →","go","btnSoft",'data-page="news"')+button("Revise due cards →","go","btnSoft",'data-page="review"')+'</div>'+
 (state.issues.length?'<div class="warn">'+esc(state.issues.join(" "))+'</div>':'');
}
function learn(){
 var section=state.lessonSection;
 var lessons=state.lessons.filter(function(l){return l.section===section});
 return '<span class="eyebrow">SHORT EXPLANATIONS · WORKED EXAMPLES</span><h1>Learn the<br><em>fundamentals.</em></h1><p class="intro">Read a lesson, remember the key rule, then immediately test it with topic-specific questions.</p>'+
 '<div class="chips">'+['Mathematics','Reasoning'].map(function(t){return '<button class="chip '+(section===t?"on":"")+'" data-action="learn" data-section="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+'</div>'+
 '<div class="notice">'+lessons.length+' lessons available · '+(section==="Mathematics"?state.math.length:state.reason.length)+' original practice questions</div>'+
 lessons.map(function(l,i){return '<article class="listCard"><div class="metaRow"><span>LESSON '+(i+1)+'</span><span>'+esc(section)+'</span></div><h2 class="heading">'+esc(l.title)+'</h2><p>'+esc(l.objective)+'</p>'+button('Read lesson →','open-lesson','btnOutline btnSmall','data-id="'+esc(l.id)+'"')+'</article>'}).join("");
}
function lesson(){
 var l=state.lessons.find(function(x){return x.id===state.lessonId});
 if(!l)return '<div class="warn">Lesson not found.</div>'+button("Back to lessons","go","btnOutline",'data-page="learn"');
 var related=(l.section==="Mathematics"?state.math:state.reason).filter(function(q){return q.skill.toLowerCase().indexOf(l.title.toLowerCase().split(" ")[0])>=0||l.title.toLowerCase().indexOf(q.skill.toLowerCase().split(" ")[0])>=0});
 return '<div class="eyebrow">'+esc(l.section)+' · STUDY NOTES</div><h1>'+esc(l.title)+'</h1><p class="intro">'+esc(l.objective)+'</p>'+
 '<section class="card"><div class="caps">KEY RULE / FORMULA</div><div class="rule">'+esc(l.keyRule)+'</div><div class="caps" style="margin-top:20px">WORKED EXAMPLE</div><div class="example">'+esc(l.example)+'</div><div class="caps" style="margin-top:20px">EXAM SHORTCUT</div><p class="tip">'+esc(l.tip)+'</p></section>'+
 '<div class="btnRow">'+button("Practice "+esc(l.section)+" →","practice-lesson","btnPrimary",'data-section="'+esc(l.section)+'" data-skill="'+esc(related.length?related[0].skill:"All")+'"')+
 button("All lessons","go","btnOutline",'data-page="learn"')+'</div><div class="tiny">'+related.length+' related practice questions matched to this lesson.</div>';
}
function practice(){
 var section=state.practiceSection;
 var source=section==="Mathematics"?state.math:section==="Reasoning"?state.reason:section==="General Awareness"?state.ga:allQuestions();
 var skills=["All"].concat(Array.from(new Set(source.map(function(q){return q.skill||"General"}))).sort());
 var skill=state.practiceSkill;
 if(skills.indexOf(skill)<0){skill="All";state.practiceSkill="All"}
 var available=source.filter(function(q){return skill==="All"||(q.skill||"General")===skill});
 return '<div class="eyebrow">BUILD SPEED AND ACCURACY</div><h1>Topic-wise<br><em>practice.</em></h1><p class="intro">Every question includes four options and an explanation. Original questions are labelled clearly; these are not verified PYQs.</p>'+
 '<div class="chips">'+["All","General Awareness","Mathematics","Reasoning"].map(function(t){return '<button class="chip '+(section===t?'on':'')+'" data-action="practice-section" data-section="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+'</div>'+
 '<section class="card"><div class="caps">SELECT A TOPIC</div><select class="field" id="skillSelect" aria-label="Practice topic">'+skills.map(function(k){return '<option value="'+esc(k)+'" '+(skill===k?'selected':'')+'>'+esc(k)+'</option>'}).join("")+'</select><p class="tiny">'+available.length+' questions available in this selection.</p><div class="btnRow">'+button('Start 20-question practice','start-practice','btnPrimary','data-size="20"')+button('Quick 5-question quiz','start-practice','btnOutline','data-size="5"')+'</div></section>'+
 sectionTitle('Choose a subject','Available banks')+
 '<div class="grid2">'+["General Awareness","Mathematics","Reasoning"].map(function(t){var count=(t==="Mathematics"?state.math:t==="Reasoning"?state.reason:state.ga).length;return '<article class="card"><div class="caps">'+esc(t)+'</div><strong style="font-size:30px">'+count+'</strong><p class="tiny">Original questions with explanations</p>'+button('Practice →','practice-section','btnSoft btnSmall','data-section="'+esc(t)+'"')+'</article>'}).join("")+'</div>';
}
function mockHome(){
 var ready=state.ga.length>=40&&state.math.length>=30&&state.reason.length>=30;
 var resume=(state.quiz&&state.quiz.type==="mock"&&!state.quiz.finished)?'<div class="notice">You have an active timed mock. Its clock continues while you navigate.</div>'+button("Resume active mock","resume-mock","btnOutline btnFull"): "";
 return resume+'<div class="eyebrow">COMPUTER-BASED EXAM SIMULATOR</div><h1>Test under<br><em>exam conditions.</em></h1><p class="intro">A full-length practice set following the published RRB NTPC Graduate CBT-1 pattern. Original practice questions; not an official RRB test.</p>'+
 '<div class="hero"><div><span class="caps">FULL CBT-1</span><h2>100 questions.<br>90 minutes.</h2><p>40 GA · 30 Maths · 30 Reasoning<br>+1 correct · −⅓ incorrect · 0 skipped</p>'+button(ready?'Start full mock →':'Question banks incomplete','start-mock','btnGold',ready?'':'disabled')+'</div><div class="heroOrb">90</div></div>'+
 '<div class="stats">'+numberCard('40','General Awareness','◎')+numberCard('30','Mathematics','∑')+numberCard('30','Reasoning','◇')+'</div>'+
 '<section class="card"><div class="caps">QUICKER PRACTICE</div><h2 class="cardTitle">30-question mini mock</h2><p>All three subjects, 27-minute countdown, the same marking pattern.</p>'+button('Start mini mock','start-mini','btnOutline')+'</section>'+
 '<div class="notice">The full CBT-1 mock uses the 100-question and 90-minute pattern of CEN 05/2024. Actual exam availability and notifications should be checked on official RRB sites.</div>';
}
function startQuiz(pool,mode,minutes){
 if(!pool.length){alert("No questions available for this selection.");return}
 var q={mode:mode||"practice",type:mode==="mock"?"mock":"practice",questions:shuffle(pool),index:0,answers:{},checked:{},marked:{},deadline:minutes?Date.now()+minutes*60000:null,startedAt:Date.now(),finished:false};
 state.quiz=q;state.viewAnswers=false;saveQuiz();state.page="quiz";paint(true);
}
function selectSet(count,mode){
 var bank=allQuestions();if(mode==="mock"){
  if(state.ga.length<40||state.math.length<30||state.reason.length<30){alert("A subject bank has fewer questions than the official CBT-1 allocation.");return}
  startQuiz(shuffle(state.ga).slice(0,40).concat(shuffle(state.math).slice(0,30),shuffle(state.reason).slice(0,30)),"mock",90);
 }else if(mode==="mini"){
  var pool=shuffle(state.ga).slice(0,12).concat(shuffle(state.math).slice(0,9),shuffle(state.reason).slice(0,9));
  startQuiz(pool,"mock",27);
 }else if(mode==="due"){
  var byId={};allQuestions().forEach(function(q){byId[q.id]=q});
  Object.keys(profile.bookmarks).forEach(function(k){if(!byId[k])byId[k]=profile.bookmarks[k]});
  Object.keys(profile.mistakes).forEach(function(k){if(!byId[k])byId[k]=profile.mistakes[k]});
  var due=Object.keys(profile.revisions).filter(function(k){return profile.revisions[k].dueDate<=today()}).map(function(k){return byId[k]}).filter(validQ);
  startQuiz(due.slice(0,20),"revision",0);
 }else if(mode==="bookmarked"){
  startQuiz(Object.values(profile.bookmarks).filter(validQ).slice(0,20),"bookmarks",0);
 }else if(mode==="mistakes"){
  startQuiz(Object.values(profile.mistakes).filter(validQ).slice(0,20),"mistakes",0);
 }else{startQuiz(shuffle(bank).slice(0,count||20),"practice",0)}
}
function qStatus(q){return Object.prototype.hasOwnProperty.call(q.answers,q.index)}
function timerText(q){var diff=Math.max(0,Math.ceil((q.deadline-Date.now())/1000));return String(Math.floor(diff/60)).padStart(2,"0")+":"+String(diff%60).padStart(2,"0")}
function quizView(){
 var s=state.quiz;
 if(!s){state.page="practice";return practice()}
 if(s.finished)return results();
 var q=s.questions[s.index],chosen=s.answers[s.index],answered=qStatus(s),checked=!!s.checked[s.index],isMock=s.type==="mock";
 var top='<div class="eyebrow">'+esc(isMock?"TIMED CBT SIMULATION":s.mode.toUpperCase())+'</div>'+
 '<div class="timerRow '+(isMock&&s.deadline-Date.now()<300000?'urgent':'')+'"><span>Question '+(s.index+1)+' of '+s.questions.length+'</span>'+ (isMock?'<span>Time left: <b id="timerDisplay">'+timerText(s)+'</b></span>':'<span>'+Object.keys(s.checked).length+' checked</span>')+'</div>'+
 '<div class="progressBg"><div class="progressFill" style="width:'+Math.round((s.index+1)/s.questions.length*100)+'%"></div></div>';
 var options=q.options.map(function(opt,i){var c=chosen===i?"selected":"";if(!isMock&&checked){if(i===q.answer)c+=" correct";else if(i===chosen)c+=" incorrect"}return '<button class="option '+c+'" data-action="answer" data-option="'+i+'" '+(!isMock&&checked?'disabled':'')+'><span class="letter">'+String.fromCharCode(65+i)+'</span>'+esc(opt)+'</button>'}).join("");
 var detail=(!isMock&&checked)?'<div class="explanation"><strong>'+(chosen===q.answer?'Correct answer!':'Learn from this question')+'</strong><p>'+esc(q.explanation)+'</p>'+(q.source?'<a href="'+href(q.source)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':'')+'</div>':'';
 var actions=isMock?'<div class="btnRow">'+button('← Previous','previous','btnOutline')+button('Save & next →','next','btnPrimary')+button('Mark for review','mark','btnSoft')+'</div>'+button('Submit mock','submit','btnDanger btnFull'):
 '<div class="btnRow">'+button(checked?'Next question →':'Check answer','check','btnPrimary',checked?'':' '+(!answered?'disabled':'')) +button('Skip →','next','btnOutline')+'</div>';
 var numbers=s.questions.map(function(x,i){var stateClass=i===s.index?"current":Object.prototype.hasOwnProperty.call(s.answers,i)?"answer":"";return '<button class="navNumber '+stateClass+'" type="button" data-action="jump" data-index="'+i+'" title="Question '+(i+1)+'">'+(i+1)+'</button>'}).join("");
 return top+'<section class="questionCard"><div class="questionTop"><span class="caps">'+esc(q.topic)+(q.skill?' · '+esc(q.skill):'')+'</span>'+button((profile.bookmarks[q.id]?'★ Saved':'☆ Save'),'bookmark','btnSoft btnSmall','data-id="'+esc(q.id)+'"')+'</div><h2>'+esc(q.question)+'</h2><div class="options">'+options+'</div>'+detail+'</section>'+actions+
 '<div class="card"><div class="sectionTitle"><h2>Question navigator</h2><span class="tiny">'+Object.keys(s.answers).length+' answered</span></div><div class="navigator">'+numbers+'</div><p class="tiny">Green: answered · Dark: current · Unfilled: unanswered. '+(isMock?'No answers are shown until you submit.':'Feedback appears after checking each answer.')+'</p></div>';
}
function markActivity(count){if(count<=0)return;var k=today();profile.activity[k]=(profile.activity[k]||0)+count}
function schedule(q,good){
 if(!q||!q.id)return;
 var old=profile.revisions[q.id],stage=good?Math.min(old?old.stage+1:0,4):0,days=[1,3,7,14,30];
 profile.revisions[q.id]={questionId:q.id,stage,dueDate:plusDays(today(),days[stage]),lastReviewed:today()};
}
function trackResults(results){
 results.forEach(function(x){
  var q=x.q;var p=profile.topicStats[q.topic]||{correct:0,wrong:0};
  p[x.correct?"correct":"wrong"]++;
  profile.topicStats[q.topic]=p;
  if(!x.correct){profile.mistakes[q.id]=q}
  if(x.correct&&profile.mistakes[q.id])delete profile.mistakes[q.id];
  if(!x.correct||profile.revisions[q.id]||profile.bookmarks[q.id])schedule(q,x.correct);
 });
 markActivity(results.length);save();
}
function advance(){
 var s=state.quiz;if(!s)return;
 if(s.index+1>=s.questions.length){if(s.type!=="mock")finish();else{s.index=0;saveQuiz();paint(true)}}
 else{s.index++;saveQuiz();paint(true)}
}
function finish(){
 var s=state.quiz;if(!s||s.finished)return;
 s.finished=true;state.page="quiz";var correct=0,wrong=0,skipped=0,tracked=[],sections={};
 s.questions.forEach(function(q,i){
  var picked=(s.type==="mock"||s.checked[i])?s.answers[i]:undefined,section=q.topic;
  var p=sections[section]||(sections[section]={correct:0,wrong:0,skipped:0});
  if(picked===undefined){skipped++;p.skipped++}
  else if(picked===q.answer){correct++;p.correct++;tracked.push({q:q,correct:true})}
  else{wrong++;p.wrong++;tracked.push({q:q,correct:false})}
 });
 var score=Number((correct-wrong/3).toFixed(2));
 s.result={correct,wrong,skipped,score,sections};
 profile.history.unshift({date:today(),label:s.mode,type:s.type,total:s.questions.length,attempted:correct+wrong,correct,wrong,skipped,score,finishedAt:new Date().toISOString()});
 profile.history=profile.history.slice(0,100);
 if(s.type==="mock")trackResults(tracked);else save();saveQuiz();state.viewAnswers=false;paint(true);
}
function results(){
 var s=state.quiz,r=s.result;if(!r)return '<div class="error">Results are unavailable.</div>';
 var sectionCards=Object.keys(r.sections).map(function(t){var v=r.sections[t];return '<div class="listCard"><div class="metaRow"><span>'+esc(t)+'</span><span>'+Math.max(0,v.correct-v.wrong/3).toFixed(2)+' marks</span></div><p>'+v.correct+' correct · '+v.wrong+' wrong · '+v.skipped+' skipped</p></div>'}).join("");
 var details=state.viewAnswers?s.questions.map(function(q,i){var pick=s.answers[i],label=pick===undefined?"Skipped":pick===q.answer?"Correct":"Incorrect";return '<article class="listCard"><div class="metaRow"><span>Q'+(i+1)+' · '+esc(q.topic)+'</span><span>'+label+'</span></div><h2 class="heading">'+esc(q.question)+'</h2><p>Your answer: <b>'+esc(pick===undefined?"Not answered":q.options[pick])+'</b></p><p>Correct answer: <b>'+esc(q.options[q.answer])+'</b></p><div class="rule">'+esc(q.explanation)+'</div><div class="btnRow">'+button((profile.bookmarks[q.id]?'★ Saved':'☆ Save for review'),'bookmark','btnSoft btnSmall','data-id="'+esc(q.id)+'"')+'</div></article>'}).join(""):"";
 return '<div class="eyebrow">SESSION COMPLETE</div><h1>'+esc(s.type==="mock"?"Mock results.":"Practice results.")+'</h1><div class="card"><span class="caps">'+esc(s.mode.toUpperCase())+'</span><div class="scoreBig">'+r.score+' / '+s.questions.length+'</div><p class="muted">+1 correct · −⅓ incorrect · 0 skipped</p><div class="scoreBreakdown"><div><strong>'+r.correct+'</strong><span>Correct</span></div><div><strong>'+r.wrong+'</strong><span>Incorrect</span></div><div><strong>'+r.skipped+'</strong><span>Unanswered</span></div></div></div>'+
 sectionTitle("Subject breakdown")+sectionCards+
 '<div class="btnRow">'+button(state.viewAnswers?'Hide solutions':'Review all solutions','toggle-review','btnPrimary')+button('Study another topic','go','btnOutline','data-page="practice"')+'</div>'+details;
}
function news(){
 var opts=["All"].concat(Array.from(new Set(state.news.map(function(n){return n.topic}))));
 var list=state.news.filter(function(n){return state.newsCategory==="All"||n.topic===state.newsCategory});
 return '<div class="eyebrow">CURRENT AFFAIRS READING</div><h1>What matters<br><em>this week.</em></h1><p class="intro">Automatically collected national news headlines with source links. Headlines are not independently fact-checked exam MCQs.</p>'+
 '<div class="notice">Latest GitHub feed: '+esc(state.newsDate?new Date(state.newsDate).toLocaleString("en-IN"):"Not yet published")+' · '+state.news.length+' headlines</div>'+
 '<div class="btnRow">'+button('↻ Refresh updates','refresh','btnOutline')+'</div>'+
 '<div class="chips">'+opts.map(function(t){return '<button class="chip '+(state.newsCategory===t?"on":"")+'" data-action="news-category" data-category="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+'</div>'+
 '<div class="tiny">Showing '+Math.min(state.newsLimit,list.length)+' of '+list.length+' headlines</div>'+
 list.slice(0,state.newsLimit).map(function(n){return '<article class="listCard"><div class="metaRow"><span>'+esc(n.topic)+'</span><span>'+esc(n.date)+'</span></div><h2 class="heading">'+esc(n.headline)+'</h2><p>Read the original publisher report before memorising facts.</p><a href="'+href(n.source)+'" target="_blank" rel="noopener noreferrer">Read original news ↗</a></article>'}).join("")+
 (state.newsLimit<list.length?button('Load 12 more headlines','news-more','btnOutline btnFull'):'')+
 '<div class="warn">The GitHub automation can be delayed. This page shows the last published news feed, not a guarantee of same-day fact-checked questions.</div>';
}
function revisionDue(){return Object.values(profile.revisions).filter(function(r){return r.dueDate<=today()})}
function review(){
 var due=revisionDue(),bookmarks=Object.values(profile.bookmarks),mistakes=Object.values(profile.mistakes);
 var week=Array.from({length:7},function(_,i){var d=new Date();d.setDate(d.getDate()-(6-i));return {day:today(d),name:d.toLocaleDateString("en-IN",{weekday:"short"}),count:profile.activity[today(d)]||0}});
 var stat=Object.entries(profile.topicStats).sort(function(a,b){var p=a[1],q=b[1];return q.wrong/(q.correct+q.wrong)-p.wrong/(p.correct+p.wrong)}).slice(0,8);
 return '<div class="eyebrow">TRACK · REVISE · IMPROVE</div><h1>Your learning<br><em>journey.</em></h1>'+
 '<div class="stats">'+numberCard(due.length,'Cards due today','◷')+numberCard(bookmarks.length,'Bookmarked','☆')+numberCard(streak()+' days','Current streak','♨')+'</div>'+
 '<section class="card"><div class="caps">SPACED REPETITION</div><h2 class="cardTitle">'+due.length+' cards to revise</h2><p>Remember facts over time: review after 1, 3, 7, 14 and 30 days. Wrong answers return sooner.</p>'+
 '<div class="btnRow">'+button('Review due cards','due','btnPrimary',due.length?'':'disabled')+button('Practice saved','bookmarked','btnOutline',bookmarks.length?'':'disabled')+button('Retry mistakes','mistakes','btnOutline',mistakes.length?'':'disabled')+'</div></section>'+
 sectionTitle("This week's consistency")+'<div class="card"><div class="week">'+week.map(function(d){var pct=Math.min(100,Math.round(d.count/profile.goal*100));return '<div class="weekItem"><strong>'+d.count+'</strong><div class="bar"><div class="fill" style="height:'+pct+'%"></div></div><span>'+esc(d.name)+'</span></div>'}).join("")+'</div><span class="tiny">Daily goal: '+profile.goal+' answers · Today: '+countToday()+'</span></div>'+
 sectionTitle('Topic accuracy','Practised topics')+
 (stat.length?stat.map(function(x){var t=x[0],v=x[1],pct=Math.round(100*v.correct/(v.correct+v.wrong));return '<div class="card" style="margin:9px 0"><div class="metaRow"><span>'+esc(t)+'</span><span>'+pct+'% correct · '+(v.correct+v.wrong)+' attempted</span></div><div class="topicBar"><span style="width:'+pct+'%"></span></div></div>'}).join(""):'<div class="notice">Complete a quiz to see weak subjects and accuracy here.</div>')+
 sectionTitle('Recent test results')+
 (profile.history.length?profile.history.slice(0,15).map(function(h){return '<div class="listCard"><div class="metaRow"><span>'+esc(h.date)+'</span><span>'+esc(h.label)+'</span></div><strong>'+Number(h.score||0).toFixed(2)+' / '+esc(h.total)+'</strong><p>'+esc(h.correct)+' correct · '+esc(h.wrong)+' incorrect · '+esc(h.skipped)+' skipped</p></div>'}).join(""):'<div class="notice">Your completed quiz and mock results will appear here.</div>')+
 sectionTitle('PYQ sources','Official links & paper collections')+pyqList()+
 sectionTitle('Progress backup','Keep your progress safe')+
 '<section class="card"><p>Export bookmarks, scores, revision cards and study activity as a JSON file. Import it on a new device. Nothing is uploaded to your public GitHub account.</p>'+button('Download progress backup','export','btnPrimary')+
 '<div class="separated"><label for="importBackup"><strong>Restore a backup</strong></label><p class="tiny">Choose your previously exported file. You will be asked before replacing data saved in this browser.</p><input id="importBackup" class="fileInput" type="file" accept=".json,application/json"></div></section>'+
 '<div class="notice">Progress is saved on this device. Your previous Floot app uses a different website address, so its browser data is not transferred automatically.</div>';
}
function pyqList(){
 return '<div class="warn">Verified, transcribed shift-specific PYQ questions available here: <strong>0</strong>. Original practice questions are not official PYQs. The sources below help locate authentic papers and answer keys.</div>'+
 state.pyq.map(function(x){return '<article class="listCard"><div class="metaRow"><span>'+esc(x.provider)+'</span><span>'+esc(x.year||"")+'</span></div><h3 class="heading">'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p>'+tag(x.type||"Source index")+' <a target="_blank" rel="noopener noreferrer" href="'+href(x.url)+'">Open source ↗</a></article>'}).join("");
}
function saveQuiz(){try{if(state.quiz&&!state.quiz.finished)sessionStorage.setItem("rr_complete_active_quiz",JSON.stringify(state.quiz));else sessionStorage.removeItem("rr_complete_active_quiz")}catch(e){console.warn(e)}}
function resumeQuiz(){try{var s=JSON.parse(sessionStorage.getItem("rr_complete_active_quiz")||"null");if(s&&Array.isArray(s.questions)&&s.questions.every(validQ)&&s.questions.length<=100&&s.index<s.questions.length){state.quiz=s;if(s.deadline&&Date.now()>=s.deadline)finish();else state.page="quiz"}}catch(e){console.warn(e)}}
function paint(scroll){
 var screens={home:home,learn:learn,lesson:lesson,practice:practice,mock:mockHome,quiz:quizView,news:news,review:review};
 var page=screens[state.page]||home;
 var content=page();
 ROOT.innerHTML=top()+'<main class="main">'+content+'<footer>RailReady independent study practice · Original questions are not verified RRB PYQs.<br><a href="https://railready-ntpc.floot.app" target="_blank" rel="noopener noreferrer">Earlier RailReady version</a></footer></main>'+nav();
 if(scroll)window.scrollTo({top:0,behavior:"instant"});
}
function go(page){state.page=page;if(page==="learn")state.lessonId=null;paint(true)}
function markQuestion(requestedId){
 var s=state.quiz;if(!s)return;var q=s.questions.find(function(x){return x.id===requestedId})||s.questions[s.index];
 if(profile.bookmarks[q.id]){delete profile.bookmarks[q.id]}else{profile.bookmarks[q.id]=q;if(!profile.revisions[q.id])profile.revisions[q.id]={questionId:q.id,stage:0,dueDate:plusDays(today(),1),lastReviewed:today()}}
 save();paint();
}
document.addEventListener("click",function(event){
 var el=event.target.closest("[data-action]");if(!el)return;
 var action=el.getAttribute("data-action");if(el.tagName==="A"&&action)event.preventDefault();
 if(action==="go"){go(el.getAttribute("data-page")||"home");return}
 if(action==="learn"){state.lessonSection=el.getAttribute("data-section")||"Mathematics";go("learn");return}
 if(action==="open-lesson"){state.lessonId=el.getAttribute("data-id");go("lesson");return}
 if(action==="practice-lesson"){state.practiceSection=el.getAttribute("data-section")||"All";state.practiceSkill=el.getAttribute("data-skill")||"All";go("practice");return}
 if(action==="goal"){profile.goal=Number(el.getAttribute("data-count"))||15;save();paint();return}
 if(action==="quick"){selectSet(5);return}
 if(action==="practice-section"){state.practiceSection=el.getAttribute("data-section")||"All";state.practiceSkill="All";go("practice");return}
 if(action==="start-practice"){
  var section=state.practiceSection,skill=state.practiceSkill;
  var pool=allQuestions().filter(function(q){return (section==="All"||q.topic===section)&&(skill==="All"||(q.skill||"General")===skill)});
  startQuiz(shuffle(pool).slice(0,Math.min(pool.length,Number(el.getAttribute("data-size"))||20)),"practice",0);return;
 }
 if(action==="resume-mock"){state.page="quiz";paint(true);return}
 if(action==="start-mock"){if(state.quiz&&!state.quiz.finished&&!window.confirm("An attempt is in progress. Discard it and start a new mock?"))return;selectSet(100,"mock");return}
 if(action==="start-mini"){if(state.quiz&&!state.quiz.finished&&!window.confirm("Discard your current attempt and start a mini mock?"))return;selectSet(30,"mini");return}
 if(action==="answer"){
  var s=state.quiz;if(!s||s.finished||(s.type!=="mock"&&s.checked[s.index]))return;
  s.answers[s.index]=Number(el.getAttribute("data-option"));saveQuiz();paint();return;
 }
 if(action==="check"){
  var s=state.quiz;if(!s)return;
  if(s.checked[s.index]){advance();return}
  if(!Object.prototype.hasOwnProperty.call(s.answers,s.index))return;
  s.checked[s.index]=true;var q=s.questions[s.index],ok=s.answers[s.index]===q.answer;
  trackResults([{q:q,correct:ok}]);saveQuiz();paint();return;
 }
 if(action==="next"){advance();return}
 if(action==="previous"){var s=state.quiz;if(!s)return;s.index=Math.max(0,s.index-1);saveQuiz();paint(true);return}
 if(action==="jump"){var s=state.quiz;if(!s)return;s.index=Number(el.getAttribute("data-index"));saveQuiz();paint(true);return}
 if(action==="mark"){var s=state.quiz;if(!s)return;s.marked[s.index]=!s.marked[s.index];saveQuiz();advance();return}
 if(action==="submit"){if(window.confirm("Submit your mock now? Unanswered questions will be counted as skipped."))finish();return}
 if(action==="bookmark"){markQuestion(el.getAttribute("data-id"));return}
 if(action==="toggle-review"){state.viewAnswers=!state.viewAnswers;paint();return}
 if(action==="news-category"){state.newsCategory=el.getAttribute("data-category")||"All";state.newsLimit=12;paint();return}
 if(action==="news-more"){state.newsLimit+=12;paint();return}
 if(action==="refresh"){void loadAll();return}
 if(action==="due"){selectSet(20,"due");return}
 if(action==="bookmarked"){selectSet(20,"bookmarked");return}
 if(action==="mistakes"){selectSet(20,"mistakes");return}
 if(action==="export"){
  var json=JSON.stringify({product:"RailReady",version:1,exportedAt:new Date().toISOString(),progress:profile},null,2);
  var blob=new Blob([json],{type:"application/json"}),url=URL.createObjectURL(blob);
  var link=document.createElement("a");link.href=url;link.download="railready-progress-"+today()+".json";document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);
 }
});
document.addEventListener("change",async function(event){
 var target=event.target;
 if(target&&target.id==="skillSelect"){state.practiceSkill=target.value;paint();return}
 if(target&&target.id==="importBackup"&&target.files&&target.files[0]){
  try{
   if(target.files[0].size>2000000)throw Error("Backup file is too large");
   var raw=await target.files[0].text(),parsed=JSON.parse(raw);
   if(!parsed||parsed.product!=="RailReady"||parsed.version!==1)throw Error("This is not a compatible RailReady backup");
   var restored=normalizeProfile(parsed.progress);
   if(Object.keys(restored.bookmarks).length>1000||Object.keys(restored.revisions).length>2000||restored.history.length>100)throw Error("Backup has invalid sizes");
   if(!window.confirm("Replace the current saved progress on this device with the imported backup?"))return;
   profile=restored;save();alert("Progress restored successfully.");paint();
  }catch(e){alert("Could not import backup: "+e.message)}
 }
});
setInterval(function(){
 var q=state.quiz;
 if(!q||q.finished||q.type!=="mock")return;
 if(q.deadline<=Date.now()){finish();return}
 var display=document.getElementById("timerDisplay");if(display)display.textContent=timerText(q);
},1000);
if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(function(e){console.warn("Offline registration failed",e)})})}
resumeQuiz();
paint();
loadAll();
})();
