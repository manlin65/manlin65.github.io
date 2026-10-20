const {test}=require('node:test');
const assert=require('node:assert/strict');
const {score,top}=require('../wochenende/interests.js');
const dates=['2026-10-23','2026-10-24'];
const event=(id,name,category='Music',classifications=[])=>({id,name,category,classifications,date:dates[0],time:'19:00'});
test('party and dance use actual labels and classification metadata',()=>{
 assert.equal(score(event('a','Rockabend'),['party']),0);
 assert.equal(score(event('b','Clubnacht'),['party']),1);
 assert.equal(score(event('c','DJ Set','Music',['Dance/Electronic']),['dance']),1);
 assert.equal(score(event('d','Salsa Tanzabend'),['dance']),1);
 assert.equal(score(event('e','A House of Stories','Arts & Theatre'),['party']),0);
});
test('multiple interests form a union, rank overlap first and cap each destination at three',()=>{
 const items=[event('1','Konzert'),event('2','Party','Other'),event('3','Party Konzert'),event('4','Rockabend'),event('5','Theater','Arts & Theatre')];
 assert.deepEqual(top(items,dates,['music','party']).map(item=>item.id),['3','1','2']);
 assert.equal(top(items,dates,['culture'])[0].id,'5');
 assert.equal(top(items,dates,['fair']).length,0);
 assert.equal(top(items,dates,[]).length,3);
});
test('top results exclude duplicates, unselected dates and cancelled events',()=>{
 const item=event('1','Party');
 assert.equal(top([item,item,{...item,id:'2',date:'2026-11-01'},{...item,id:'3',status:'cancelled'}],dates,['party']).length,1);
});
