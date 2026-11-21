const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const eventListeners={};
const memory=new Map();
const localStorage={
 getItem:(key)=>memory.has(key)?memory.get(key):null,
 setItem:(key,value)=>memory.set(key,String(value)),
 removeItem:(key)=>memory.delete(key)
};
const appRoot={innerHTML:''};
const document={
 getElementById:(id)=>id==='app'?appRoot:null,
 addEventListener:(name,callback)=>{eventListeners[name]=callback}
};
const window={scrollTo:()=>{},confirm:()=>true,alert:()=>{},addEventListener:()=>{}};
const navigator={};
const fetch=async(url)=>{
 const p=String(url).split('?')[0].replace(/^\.\//,'');
 const file=path.join(root,p);
 if(!file.startsWith(root)||!fs.existsSync(file))return {ok:false,status:404,json:async()=>null};
 return {ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))};
};
const ctx={document,window,navigator,fetch,localStorage,sessionStorage:localStorage,console,setTimeout,clearTimeout,Date,Math,Set,Array,Object,Number,String,JSON,Error,AbortController,Promise,URL,setInterval:()=>1,alert:()=>{}};
function click(action,attrs={}){
 const el={tagName:'BUTTON',getAttribute:(k)=>k==='data-action'?action:attrs[k]??null};
 eventListeners.click({target:{closest:()=>el},preventDefault:()=>{}});
}
const sleep=()=>new Promise(resolve=>setTimeout(resolve,15));
(async()=>{
 const ga=JSON.parse(fs.readFileSync(path.join(root,'data/general-awareness-bank.json'))).questions;
 const qr=JSON.parse(fs.readFileSync(path.join(root,'data/quant-reasoning-bank.json'))).questions;
 const lessons=JSON.parse(fs.readFileSync(path.join(root,'data/study-lessons.json'))).lessons;
 assert(ga.length>=40&&qr.filter(q=>q.topic==='Mathematics').length>=30&&qr.filter(q=>q.topic==='Reasoning').length>=30);
 assert.equal(lessons.length,28);
 [...ga,...qr].forEach(q=>{assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert(q.answer>=0&&q.answer<=3)});
 vm.runInNewContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),ctx,{filename:'app.js',timeout:5000});
 await sleep();
 assert.match(appRoot.innerHTML,/Study smarter/);
 assert.match(appRoot.innerHTML,/questions/);
 // Lessons and worked examples
 click('go',{'data-page':'learn'});assert.match(appRoot.innerHTML,/Learn the/);
 click('open-lesson',{'data-id':'math-01'});assert.match(appRoot.innerHTML,/WORKED EXAMPLE/);
 // Full CBT1 section allocation and 90-minute timer
 click('go',{'data-page':'mock'});assert.match(appRoot.innerHTML,/100 questions/);
 click('start-mock');assert.match(appRoot.innerHTML,/Question 1 of 100/);
 assert.equal((appRoot.innerHTML.match(/class="navNumber /g)||[]).length,100);
 const mock=JSON.parse(memory.get('rr_complete_active_quiz'));
 const bySubject=mock.questions.reduce((o,q)=>(o[q.topic]=(o[q.topic]||0)+1,o),{});
 assert.deepEqual(Object.fromEntries(Object.entries(bySubject).sort()),{'General Awareness':40,'Mathematics':30,'Reasoning':30});
 assert.equal(mock.questions.length,100);
 assert.equal(Math.round((mock.deadline-mock.startedAt)/60000),90);
 assert.match(appRoot.innerHTML,/90:00|89:59/);
 click('answer',{'data-option':'0'});click('submit');
 assert.match(appRoot.innerHTML,/Mock results/);
 assert.match(appRoot.innerHTML,/99<\/strong><span>Unanswered/);
 // A quick practice question and saved bookmarks
 click('go',{'data-page':'home'});
 click('quick');
 assert.match(appRoot.innerHTML,/Question 1 of 5/);
 click('bookmark');
 click('answer',{'data-option':'0'});
 click('check');
 assert.match(appRoot.innerHTML,/Learn from this question|Correct answer!/);
 const progress=JSON.parse(memory.get('rr_complete_progress_v1'));
 assert.equal(Object.keys(progress.bookmarks).length,1);
 assert(progress.activity[Object.keys(progress.activity)[0]]>=1);
 click('go',{'data-page':'review'});
 assert.match(appRoot.innerHTML,/SPACED REPETITION/);
 assert.match(appRoot.innerHTML,/PYQ sources/);
 assert.match(appRoot.innerHTML,/Progress backup/);
 // News is in the same repository and should be present
 click('go',{'data-page':'news'});
 assert.match(appRoot.innerHTML,/CURRENT AFFAIRS READING/);
 assert.match(appRoot.innerHTML,/Read original news/);
 console.log('PASS: Full CBT-1 (100 Q), lessons, timed mock, quiz, bookmarking, revision, backup and news render');
})().catch(error=>{console.error(error);process.exitCode=1});
