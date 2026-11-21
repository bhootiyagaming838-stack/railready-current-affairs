/**
 * RailReady's next-stage standalone study utilities.
 * Source-ready module; not connected to the current published Floot app yet.
 */
export type ExamSection = "General Awareness" | "Mathematics" | "Reasoning";
export type ExamQuestion = {
  id:string;topic:string;skill?:string;question:string;
  options:string[];answer:number;explanation:string;kind?:string
};
export type Attempt = Record<string,number>;
export type RevisionCard={questionId:string;stage:number;dueDate:string;lastReviewed:string};
export type ProgressSnapshot={
 version:1;exportedAt:string;history:unknown[];bookmarks:ExamQuestion[];
 errors:ExamQuestion[];dailyActivity:Record<string,number>;
 dailyGoal:number;topicStats:Record<string,{correct:number;wrong:number}>;
 revision:RevisionCard[];
};
const SRS_DAYS=[1,3,7,14,30] as const;
const isoDate=(date:Date):string=>{
 const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,"0");
 return y+"-"+m+"-"+String(date.getDate()).padStart(2,"0");
};
const addLocalDays=(day:string,delta:number):string=>{
 const [y,m,d]=day.split("-").map(Number);
 if(!y||!m||!d)throw Error("Invalid date");
 const date=new Date(y,m-1,d+delta);
 return isoDate(date);
};
export function mixQuestions<T>(items:T[],seed=Date.now()):T[]{
 let s=seed>>>0;
 const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 const arr=[...items];
 for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
 return arr;
}
export function createCBT1Mock(
 general:ExamQuestion[],mathematics:ExamQuestion[],reasoning:ExamQuestion[],seed=Date.now()
):ExamQuestion[]{
 for(const [name,pool,min] of [["General Awareness",general,40],["Mathematics",mathematics,30],["Reasoning",reasoning,30]] as const){
  if(pool.length<min)throw Error("Not enough "+name+" questions; need "+min+".");
 }
 const all=[...mixQuestions(general,seed).slice(0,40),
            ...mixQuestions(mathematics,seed+1).slice(0,30),
            ...mixQuestions(reasoning,seed+2).slice(0,30)];
 if(new Set(all.map(x=>x.id)).size!==100)throw Error("Duplicate questions in mock");
 return mixQuestions(all,seed+3);
}
export function scoreCBT1(items:ExamQuestion[],answers:Attempt){
 let correct=0,wrong=0,skipped=0;
 const sections:Record<string,{correct:number;wrong:number;skipped:number}>={};
 for(const question of items){
  const group=question.topic==="Mathematics"?"Mathematics":question.topic==="Reasoning"?"Reasoning":"General Awareness";
  const x=sections[group]??={correct:0,wrong:0,skipped:0};
  const selection=answers[question.id];
  if(selection===undefined||selection===null){skipped++;x.skipped++;}
  else if(selection===question.answer){correct++;x.correct++;}
  else{wrong++;x.wrong++;}
 }
 const marks=Number((correct-wrong/3).toFixed(2));
 return {correct,wrong,skipped,marks,maxMarks:items.length,accuracy:(correct+wrong)?Number((100*correct/(correct+wrong)).toFixed(1)):0,sections};
}
export function reviewCard(card:RevisionCard|undefined,questionId:string,isCorrect:boolean,today=isoDate(new Date())):RevisionCard{
 if(!isCorrect)return {questionId,stage:0,lastReviewed:today,dueDate:addLocalDays(today,1)};
 const stage=Math.min((card?.stage??-1)+1,SRS_DAYS.length-1);
 return {questionId,stage,lastReviewed:today,dueDate:addLocalDays(today,SRS_DAYS[stage])};
}
export function dueQuestions(cards:RevisionCard[],today=isoDate(new Date())):RevisionCard[]{
 return cards.filter(c=>/^\d{4}-\d{2}-\d{2}$/.test(c.dueDate)&&c.dueDate<=today)
   .sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
}
export function exportProgress(storage:Storage):string{
 const parse=(key:string,fallback:unknown)=>{try{return JSON.parse(storage.getItem(key)||"null")??fallback}catch{return fallback}};
 const data:ProgressSnapshot={
  version:1,exportedAt:new Date().toISOString(),
  history:parse("rail-history",[]) as unknown[],
  bookmarks:parse("rr_bookmarks_v1",[]) as ExamQuestion[],
  errors:parse("rail-errors",[]) as ExamQuestion[],
  dailyActivity:parse("rr_daily_activity_v1",{}) as Record<string,number>,
  dailyGoal:Number(storage.getItem("rr_daily_goal_v1"))||15,
  topicStats:parse("rr_topic_stats_v1",{}) as Record<string,{correct:number;wrong:number}>,
  revision:parse("rr_revision_v1",[]) as RevisionCard[]
 };
 return JSON.stringify(data,null,2);
}
export function validateProgressImport(json:string):ProgressSnapshot{
 if(json.length>2_000_000)throw Error("Backup too large");
 const data=JSON.parse(json);
 if(!data||data.version!==1||!Array.isArray(data.history)||!Array.isArray(data.bookmarks)||
  !Array.isArray(data.errors)||!Array.isArray(data.revision)||
  !data.dailyActivity||typeof data.dailyActivity!=="object"||
  !data.topicStats||typeof data.topicStats!=="object"||
  !Number.isInteger(data.dailyGoal)||data.dailyGoal<1||data.dailyGoal>200)
  throw Error("Not a compatible RailReady progress backup");
 const validQuestion=(q:any)=>q&&typeof q.id==="string"&&q.id.length<200&&typeof q.question==="string"&&
    q.question.length<2000&&Array.isArray(q.options)&&q.options.length===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4;
 if(data.bookmarks.length>500||data.errors.length>500||data.history.length>500||
  !data.bookmarks.every(validQuestion)||!data.errors.every(validQuestion))throw Error("Invalid question backup");
 if(data.revision.length>1000||!data.revision.every((c:any)=>c&&typeof c.questionId==="string"&&
   Number.isInteger(c.stage)&&c.stage>=0&&c.stage<=4&&/^\d{4}-\d{2}-\d{2}$/.test(c.dueDate)))throw Error("Invalid revision backup");
 return data as ProgressSnapshot;
}
export function restoreProgress(storage:Storage,validated:ProgressSnapshot):void{
 storage.setItem("rail-history",JSON.stringify(validated.history));
 storage.setItem("rr_bookmarks_v1",JSON.stringify(validated.bookmarks));
 storage.setItem("rail-errors",JSON.stringify(validated.errors));
 storage.setItem("rr_daily_activity_v1",JSON.stringify(validated.dailyActivity));
 storage.setItem("rr_daily_goal_v1",String(validated.dailyGoal));
 storage.setItem("rr_topic_stats_v1",JSON.stringify(validated.topicStats));
 storage.setItem("rr_revision_v1",JSON.stringify(validated.revision));
}
