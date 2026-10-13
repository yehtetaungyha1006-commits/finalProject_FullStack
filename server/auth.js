import { SignJWT, jwtVerify } from 'jose';
const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('Set JWT_SECRET to 32+ characters');
  return new TextEncoder().encode(s);
};
export async function issueToken(userId) {
  return new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject(String(userId)).setIssuedAt().setExpirationTime('7d').sign(secret());
}
export async function authenticate(req,res,next) {
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')?.[1];
  if (!token) return res.status(401).json({error:'กรุณาเข้าสู่ระบบ'});
  try {
    const {payload} = await jwtVerify(token,secret(),{algorithms:['HS256']});
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid user');
    req.userId=id;
    next();
  } catch { res.status(401).json({error:'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'}); }
}
