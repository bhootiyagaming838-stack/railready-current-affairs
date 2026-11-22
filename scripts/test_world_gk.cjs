const fs=require('node:fs');
const assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync('data/world-gk.json','utf8'));
assert.equal(data.version,1);
assert(data.series.length>=10,'expected worldwide series');
assert(data.questions.length>=100,'expected at least 100 exam-style questions');
const ids=new Set();
for(const q of data.questions){
 assert(q.id&&!ids.has(q.id),'duplicate/missing id '+q.id);ids.add(q.id);
 assert.equal(q.options.length,4,'options '+q.id);
 assert.equal(new Set(q.options).size,4,'unique options '+q.id);
 assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,'answer '+q.id);
 assert(typeof q.explanation==='string'&&q.explanation.length>15,'explanation '+q.id);
 assert(typeof q.question==='string'&&q.question.endsWith('?'),'question mark '+q.id);
}
for(const s of data.series){
 assert(s.source.startsWith('https://'),'source '+s.id);
 const positions=s.entries.map(e=>e.position);
 assert(positions.includes('First')&&positions.includes('Second'),'missing start positions '+s.id);
 if(positions.includes('Last'))assert(positions.includes('Second-last'),'missing penultimate '+s.id);
 else assert(!positions.includes('Second-last'),'ongoing should not claim last '+s.id);
 for(const e of s.entries){
  const q=data.questions.find(q=>q.seriesId===s.id&&q.position===e.position);
  assert(q,'no question for '+s.id+' '+e.position);
  assert.equal(q.options[q.answer],e.value,'incorrect answer '+q.id);
 }
}
const html=fs.readFileSync('world-gk.html','utf8');
assert(html.includes('world-gk.js')&&html.includes('viewOrders'),'world GK page missing study elements');
const categories=[...new Set(data.questions.filter(q=>q.topic!=='First & Last GK').map(q=>q.skill))];
assert(categories.includes('World Geography')&&categories.includes('World Organisations')&&categories.includes('World Science'));
console.log('World GK validated: '+data.series.length+' series, '+data.questions.length+' questions, '+categories.length+' topic areas.');
