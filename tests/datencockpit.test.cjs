const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHandler}=require('../netlify/functions/datencockpit-status');
const request={httpMethod:'GET',headers:{}};
test('database status confirms a real query and returns no connection details',async()=>{
  let queried=false;
  const handler=createHandler({connectionString:()=> 'private-connection',connect:url=>{
    assert.equal(url,'private-connection');
    return async strings=>{assert.match(strings[0],/SELECT 1/);queried=true;return [{ok:1}];};
  }});
  const result=await handler(request);
  assert.equal(result.statusCode,200);assert.equal(JSON.parse(result.body).connected,true);
  assert.ok(queried);assert.ok(!result.body.includes('private-connection'));
});
test('missing config and driver failures return actionable, redacted errors',async()=>{
  const missing=createHandler({connectionString:()=>undefined});
  assert.equal((await missing(request)).statusCode,503);
  const broken=createHandler({connectionString:()=> 'private-connection',connect:()=>async()=>{throw Error('password=private-connection');}});
  const result=await broken(request);
  assert.equal(result.statusCode,503);assert.ok(!result.body.includes('private-connection'));
});
test('status rejects untrusted origins and writes before accessing the database',async()=>{
  const handler=createHandler({connectionString:()=>assert.fail('must not connect')});
  assert.equal((await handler({...request,httpMethod:'POST'})).statusCode,405);
  assert.equal((await handler({...request,headers:{origin:'https://evil.example'}})).statusCode,403);
  const result=await handler({...request,httpMethod:'OPTIONS',headers:{origin:'https://mlinner-software.de'}});
  assert.equal(result.statusCode,204);assert.equal(result.headers['Access-Control-Allow-Origin'],'https://mlinner-software.de');
});
