import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { db, initializeDatabase } from './db.js';
import { users,posts,likes,comments } from './schema.js';
import { authenticate,issueToken } from './auth.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'30kb'}));
if (process.env.CORS_ORIGIN) app.use(cors({origin:process.env.CORS_ORIGIN.split(',').map(s=>s.trim())}));
app.use('/api',async (req,res,next)=>{try{await initializeDatabase();next();}catch(e){next(e);}});
const safeUser = u => ({id:u.id,name:u.name,email:u.email,bio:u.bio,createdAt:u.createdAt});
const idOf = raw => {const id = Number(raw); return Number.isSafeInteger(id) && id > 0 && String(id) === String(raw) ? id : null;};
const now = () => new Date().toISOString();
const sqlHealth = sql`SELECT 1`;
const clean = (v,limit) => typeof v === 'string' ? v.trim().slice(0,limit+1) : '';
const bad = (res,msg)=>res.status(400).json({error:msg});
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

app.get('/api/health',asyncRoute(async(req,res)=>{
 await db().run(sqlHealth);
 res.json({status:'ok',database:'connected'});
}));
app.post('/api/auth/register',asyncRoute(async(req,res)=>{
  const name=clean(req.body?.name,60), email=clean(req.body?.email,254).toLowerCase(),password=req.body?.password;
  if(name.length<2||name.length>60) return bad(res,'ชื่อควรยาว 2–60 ตัวอักษร');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) return bad(res,'รูปแบบอีเมลไม่ถูกต้อง');
  if(typeof password!=='string'||password.length<8||password.length>128) return bad(res,'รหัสผ่านต้องมี 8–128 ตัวอักษร');
  const existing=await db().select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);
  if(existing.length) return res.status(409).json({error:'อีเมลนี้ถูกใช้งานแล้ว'});
  const passwordHash=await bcrypt.hash(password,12);
  try {
    const [u]=await db().insert(users).values({name,email,passwordHash,createdAt:now()}).returning();
    res.status(201).json({data:{user:safeUser(u),token:await issueToken(u.id)}});
  } catch(e) {
    if (/UNIQUE constraint failed: users.email|SQLITE_CONSTRAINT_UNIQUE/i.test(String(e.message))) return res.status(409).json({error:'อีเมลนี้ถูกใช้งานแล้ว'});
    throw e;
  }
}));
app.post('/api/auth/login',asyncRoute(async(req,res)=>{
  const email=clean(req.body?.email,254).toLowerCase(), password=req.body?.password;
  if(!email || typeof password!=='string') return bad(res,'กรุณากรอกอีเมลและรหัสผ่าน');
  const [u]=await db().select().from(users).where(eq(users.email,email)).limit(1);
  if(!u || !(await bcrypt.compare(password,u.passwordHash))) return res.status(401).json({error:'อีเมลหรือรหัสผ่านไม่ถูกต้อง'});
  res.json({data:{user:safeUser(u),token:await issueToken(u.id)}});
}));
app.get('/api/me',authenticate,asyncRoute(async(req,res)=>{
 const [u]=await db().select().from(users).where(eq(users.id,req.userId));
 if(!u)return res.status(401).json({error:'ไม่พบผู้ใช้งาน'});
 res.json({data:safeUser(u)});
}));
app.patch('/api/me',authenticate,asyncRoute(async(req,res)=>{
 const name=clean(req.body?.name,60),bio=clean(req.body?.bio,160);
 if(name.length<2||name.length>60||bio.length>160)return bad(res,'ชื่อหรือคำอธิบายโปรไฟล์ไม่ถูกต้อง');
 const [u]=await db().update(users).set({name,bio}).where(eq(users.id,req.userId)).returning();
 if(!u)return res.status(404).json({error:'ไม่พบผู้ใช้'});
 res.json({data:safeUser(u)});
}));
app.get('/api/posts',authenticate,asyncRoute(async(req,res)=>{
 const feed=await db().select({id:posts.id,userId:posts.userId,content:posts.content,createdAt:posts.createdAt,authorName:users.name})
   .from(posts).innerJoin(users,eq(posts.userId,users.id)).orderBy(desc(posts.id)).limit(100);
 if(!feed.length)return res.json({data:[]});
 const ids=feed.map(p=>p.id);
 const listLikes=await db().select({postId:likes.postId,userId:likes.userId}).from(likes).where(inArray(likes.postId,ids));
 const listComments=await db().select({id:comments.id,postId:comments.postId,userId:comments.userId,content:comments.content,createdAt:comments.createdAt,authorName:users.name})
   .from(comments).innerJoin(users,eq(comments.userId,users.id)).where(inArray(comments.postId,ids)).orderBy(comments.id);
 res.json({data:feed.map(p=>({...p,likeCount:listLikes.filter(l=>l.postId===p.id).length,liked:listLikes.some(l=>l.postId===p.id&&l.userId===req.userId),comments:listComments.filter(c=>c.postId===p.id)}))});
}));
app.post('/api/posts',authenticate,asyncRoute(async(req,res)=>{
 const content=clean(req.body?.content,1000);
 if(!content||content.length>1000)return bad(res,'โพสต์ต้องมีข้อความ 1–1000 ตัวอักษร');
 const [p]=await db().insert(posts).values({userId:req.userId,content,createdAt:now()}).returning();
 res.status(201).json({data:p});
}));
app.patch('/api/posts/:id',authenticate,asyncRoute(async(req,res)=>{
 const id=idOf(req.params.id),content=clean(req.body?.content,1000);
 if(!id||!content||content.length>1000)return bad(res,'ข้อมูลโพสต์ไม่ถูกต้อง');
 const [p]=await db().update(posts).set({content}).where(and(eq(posts.id,id),eq(posts.userId,req.userId))).returning();
 if(!p)return res.status(404).json({error:'ไม่พบโพสต์ของคุณ'});
 res.json({data:p});
}));
app.delete('/api/posts/:id',authenticate,asyncRoute(async(req,res)=>{
 const id=idOf(req.params.id);if(!id)return bad(res,'รหัสโพสต์ไม่ถูกต้อง');
 const result=await db().delete(posts).where(and(eq(posts.id,id),eq(posts.userId,req.userId))).returning({id:posts.id});
 if(!result.length)return res.status(404).json({error:'ไม่พบโพสต์ของคุณ'});
 res.status(204).end();
}));
app.post('/api/posts/:id/like',authenticate,asyncRoute(async(req,res)=>{
 const id=idOf(req.params.id);if(!id)return bad(res,'รหัสโพสต์ไม่ถูกต้อง');
 const [p]=await db().select({id:posts.id}).from(posts).where(eq(posts.id,id));
 if(!p)return res.status(404).json({error:'ไม่พบโพสต์'});
 await db().insert(likes).values({postId:id,userId:req.userId}).onConflictDoNothing();
 res.json({data:{liked:true}});
}));
app.delete('/api/posts/:id/like',authenticate,asyncRoute(async(req,res)=>{
 const id=idOf(req.params.id);if(!id)return bad(res,'รหัสโพสต์ไม่ถูกต้อง');
 await db().delete(likes).where(and(eq(likes.postId,id),eq(likes.userId,req.userId)));
 res.status(204).end();
}));
app.post('/api/posts/:id/comments',authenticate,asyncRoute(async(req,res)=>{
 const postId=idOf(req.params.id),content=clean(req.body?.content,400);
 if(!postId||!content||content.length>400)return bad(res,'ความคิดเห็นต้องมีข้อความ 1–400 ตัวอักษร');
 const [p]=await db().select({id:posts.id}).from(posts).where(eq(posts.id,postId));
 if(!p)return res.status(404).json({error:'ไม่พบโพสต์'});
 const [c]=await db().insert(comments).values({postId,userId:req.userId,content,createdAt:now()}).returning();
 res.status(201).json({data:c});
}));
app.delete('/api/comments/:id',authenticate,asyncRoute(async(req,res)=>{
 const id=idOf(req.params.id);if(!id)return bad(res,'รหัสความคิดเห็นไม่ถูกต้อง');
 const deleted=await db().delete(comments).where(and(eq(comments.id,id),eq(comments.userId,req.userId))).returning({id:comments.id});
 if(!deleted.length)return res.status(404).json({error:'ไม่พบความคิดเห็นของคุณ'});
 res.status(204).end();
}));
app.use('/api',(req,res)=>res.status(404).json({error:'ไม่พบ API endpoint'}));
app.use((err,req,res,next)=>{console.error('API error:',err);res.status(500).json({error:'ระบบขัดข้อง กรุณาลองอีกครั้ง'});});
export default app;
