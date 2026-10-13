// Smoke test: start the backend separately, then run npm run test:smoke.
import assert from 'node:assert/strict';
const origin=process.env.TEST_API_URL||'http://localhost:3000';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let ready=false;
for(let attempt=0;attempt<30;attempt++){
  try {const r=await fetch(origin+'/api/health');if(r.ok){ready=true;break;}}catch{}
  await sleep(1000);
}
assert.ok(ready,'API health never responded OK');
async function call(path,{method='GET',body,token}={}){
 const res=await fetch(origin+'/api'+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=res.status===204?null:await res.json();
 return {status:res.status,data};
}
const key=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const a=await call('/auth/register',{method:'POST',body:{name:'Test A',email:`a-${key}@example.com`,password:'StrongTestPassword123'}});
const b=await call('/auth/register',{method:'POST',body:{name:'Test B',email:`b-${key}@example.com`,password:'StrongTestPassword123'}});
assert.equal(a.status,201);assert.equal(b.status,201);
const ta=a.data.data.token,tb=b.data.data.token;
assert.equal((await call('/me',{token:ta})).data.data.email,`a-${key}@example.com`);
assert.equal((await call('/posts')).status,401);
const made=await call('/posts',{method:'POST',token:ta,body:{content:'smoke post'}});
assert.equal(made.status,201);
const id=made.data.data.id;
assert.equal((await call('/posts/'+id,{method:'PATCH',token:tb,body:{content:'wrong owner'}})).status,404);
assert.equal((await call('/posts/'+id,{method:'PATCH',token:ta,body:{content:'updated post'}})).status,200);
assert.equal((await call('/posts/'+id+'/like',{method:'POST',token:tb})).status,200);
assert.equal((await call('/posts/'+id+'/comments',{method:'POST',token:tb,body:{content:'nice'}})).status,201);
const feed=await call('/posts',{token:ta});
assert.equal(feed.status,200);
const entry=feed.data.data.find(p=>p.id===id);
assert.ok(entry);assert.equal(entry.likeCount,1);assert.equal(entry.comments.length,1);
assert.equal((await call('/posts/'+id,{method:'DELETE',token:tb})).status,404);
assert.equal((await call('/posts/'+id,{method:'DELETE',token:ta})).status,204);
console.log('PASS: health, registration, identity, auth, post ownership, CRUD, like and comment');
