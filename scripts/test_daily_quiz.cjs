const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const dataset=JSON.parse(fs.readFileSync(path.join(root,'data/daily-mcqs.json'),'utf8'));
assert.equal(dataset.questions.length,60);
const events={};const memory=new Map();const view={innerHTML:''};
const localStorage={
 getItem:k=>memory.has(k)?memory.get(k):null,
 setItem:(k,v)=>memory.set(k,String(v))
};
const document={
 getElementById:id=>id==='app'?view:null,
 addEventListener:(event,fn)=>{events[event]=fn}
};
const win={scrollTo:()=>{},confirm:()=>true};
const fetch=async url=>{
 if(!String(url).startsWith('./data/daily-mcqs.json'))throw Error('Unexpected request '+url);
 return {ok:true,json:async()=>dataset};
};
const context={document,window:win,localStorage,fetch,AbortController,
 console,setTimeout,clearTimeout,Date,Math,Map,Set,JSON,Number,String};
const click=(action,attributes={})=>{
 assert.equal(typeof events.click,'function');
 events.click({target:{closest:()=>({disabled:false,dataset:{action,...attributes}})}});
};
(async()=>{
 vm.runInNewContext(fs.readFileSync(path.join(root,'daily.js'),'utf8'),context,{filename:'daily.js',timeout:3000});
 await new Promise(res=>setTimeout(res,20));
 assert.match(view.innerHTML,/New questions/);
 assert.match(view.innerHTML,/60 new|60<\/strong>/i);
 click('start',{mode:'All'});
 assert.match(view.innerHTML,/Question 1 \/ 60/);
 assert.match(view.innerHTML,/class="answerOption/);
 click('answer',{choice:'0'});
 click('check');
 assert.match(view.innerHTML,/Answer to remember|Correct!/);
 assert.match(view.innerHTML,/explain/);
 click('next');
 assert.match(view.innerHTML,/Question 2 \/ 60/);
 click('finish');
 assert.match(view.innerHTML,/Session/);
 assert.match(view.innerHTML,/Correct/);
 assert.match(view.innerHTML,/Incorrect/);
 assert.match(view.innerHTML,/Skipped/);
 const saved=JSON.parse(memory.get('railready_daily_quiz_session_v1'));
 assert.equal(saved.date,dataset.date);
 assert.equal(saved.finished,true);
 click('back');
 click('start',{mode:'Mathematics'});
 assert.match(view.innerHTML,/Question 1 \/ 30/);
 click('back');
 click('start',{mode:'Reasoning'});
 assert.match(view.innerHTML,/Question 1 \/ 30/);
 console.log('PASS: Daily 60 questions, Maths 30, Reasoning 30, answer explanations, navigation, scoring, saved session');
})().catch(e=>{console.error(e);process.exitCode=1});
