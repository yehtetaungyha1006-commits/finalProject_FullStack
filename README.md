# Pulse Social — Final Project

โปรเจกต์ Social Media Website แบบ Full-stack ตามโจทย์ Final Project

**Stack:** Vue 3 (Vite) + Express 5 + Drizzle ORM + Turso (libSQL/SQLite) + Vercel

## ฟีเจอร์

- สมัครสมาชิก / เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- JWT authentication (อายุ token 7 วัน) และรหัสผ่านถูก hash ด้วย bcrypt
- โปรไฟล์ส่วนตัว: ชื่อ, bio, จำนวนโพสต์, จำนวน Like
- สร้าง / แสดง / แก้ไข / ลบโพสต์ (เจ้าของโพสต์เท่านั้น)
- Like/Unlike และแสดงความคิดเห็น (ลบความคิดเห็นของตัวเองได้)
- Feed รวม / โพสต์ของฉัน / ค้นหาโพสต์
- Responsive UI สำหรับ PC และมือถือ
- ผู้ใช้แต่ละคนมีข้อมูลแยกตาม userId ในฐานข้อมูลจริง

## สิ่งที่ต้องมี

- Node.js 22.12 ขึ้นไป (แนะนำ Node 24)
- npm
- บัญชี Turso เพื่อเก็บข้อมูลบน Vercel
- บัญชี GitHub และ Vercel หากต้องการ Public URL

## 1. รันบนคอมพิวเตอร์

```bash
npm install
cp .env.example .env
```

**Windows PowerShell** ถ้าไม่มี `cp`: `Copy-Item .env.example .env`

เปิด `.env` แล้วเปลี่ยน `JWT_SECRET` ให้เป็นข้อความสุ่มยาวอย่างน้อย 32 ตัวอักษร เช่นสร้างด้วย:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

ค่า `TURSO_DATABASE_URL=file:./local.db` ใช้ SQLite ในเครื่องสำหรับพัฒนาท้องถิ่น (สร้างไฟล์อัตโนมัติ)

เริ่มระบบ:

```bash
npm run dev
```

เปิด http://localhost:5173 และตรวจ Backend: http://localhost:3000/api/health

หากต้องการเปิดเฉพาะ backend: `npm run dev:api` หรือ frontend: `npm run dev:web`

## 2. ตั้งค่าฐานข้อมูล Turso

1. ไปที่ https://turso.tech แล้วสร้างฐานข้อมูลใหม่ เช่น `pulse-social` ผ่าน dashboard
2. เปิดหน้า Database URL และ Create Token จาก dashboard
3. คัดลอกค่าลงใน `.env` ภายในเครื่อง:

```dotenv
TURSO_DATABASE_URL=libsql://YOUR-DATABASE-YOUR-ORG.turso.io
TURSO_AUTH_TOKEN=YOUR-TURSO-TOKEN
JWT_SECRET=YOUR-RANDOM-SECRET-AT-LEAST-32-CHARS
```

Backend จะสร้างตาราง `users`, `posts`, `likes`, `comments` และ indexes ด้วย `CREATE TABLE IF NOT EXISTS` เมื่อมีการเรียก API ครั้งแรก (สำหรับโครงสร้างเวอร์ชันนี้ ไม่ใช่ระบบ migration สำหรับ production ระยะยาว)

**ห้าม commit `.env` ไปที่ GitHub**; ไฟล์นี้ถูก ignore ไว้แล้ว

## 3. Deploy ขึ้น Vercel

1. Push โปรเจกต์โฟลเดอร์นี้ขึ้น GitHub (อย่าใส่ `node_modules`, `.env`, `.db`)
2. ไป https://vercel.com/new แล้ว Import repository
3. เลือก Framework Preset = `Vite` (หรือใช้การตรวจจับอัตโนมัติ) และ root directory เป็นโฟลเดอร์โปรเจกต์นี้
4. ตั้งค่า Build Command = `npm run build`; Output Directory = `dist`
5. เพิ่ม Environment Variables (เลือก Production และ Preview ตามที่ใช้):
   - `TURSO_DATABASE_URL` = URL จริงที่ขึ้นต้น `libsql://`
   - `TURSO_AUTH_TOKEN` = token จาก Turso
   - `JWT_SECRET` = secret สุ่มที่ยาวอย่างน้อย 32 ตัวอักษร
6. กด Deploy และนำ URL `https://<your-project>.vercel.app` ไปทดสอบ
7. เปิด `https://<your-project>.vercel.app/api/health` ควรได้ `{"status":"ok","database":"connected"}`
8. สมัครบัญชี 2 บัญชี ลองสร้างโพสต์ กด Like แสดงความคิดเห็น จากนั้น refresh และทดสอบในโหมดไม่ระบุตัวตน (Incognito)

> `vercel.json` ส่ง `/api/*` ไปยัง serverless function `api/index.js` และส่งเส้นทางหน้าเว็บที่เหลือไปที่ Vue SPA. หากเปลี่ยนการตั้งค่า Build/Routes บน Vercel ควรตรวจผลการ routing ใหม่อีกครั้ง.

### สิ่งที่ห้ามทำ

- ห้ามใช้ `file:./local.db` บน Vercel เพราะ storage ของ serverless ไม่ใช่พื้นที่เก็บข้อมูลถาวร
- ห้ามใส่ Turso token หรือ JWT_SECRET ในไฟล์ Vue, ตัวแปร VITE_*, หรือ repository
- ตั้ง `CORS_ORIGIN` เฉพาะกรณีที่ frontend และ backend อยู่คนละ origin; โครงการนี้ใช้ domain เดียวกัน จึงไม่จำเป็นต้องตั้ง

## 4. API Endpoints

| Method | Path | Login | Description |
| --- | --- | --- | --- |
| GET | /api/health | ไม่ต้อง | ตรวจ API/DB |
| POST | /api/auth/register | ไม่ต้อง | สมัครสมาชิก |
| POST | /api/auth/login | ไม่ต้อง | เข้าสู่ระบบ |
| GET | /api/me | ต้อง | ข้อมูลตัวเอง |
| PATCH | /api/me | ต้อง | แก้ชื่อและ bio |
| GET | /api/posts | ต้อง | ดู feed |
| POST | /api/posts | ต้อง | สร้างโพสต์ |
| PATCH | /api/posts/:id | ต้อง | แก้โพสต์ของตัวเอง |
| DELETE | /api/posts/:id | ต้อง | ลบโพสต์ของตัวเอง |
| POST | /api/posts/:id/like | ต้อง | กด Like |
| DELETE | /api/posts/:id/like | ต้อง | ยกเลิก Like |
| POST | /api/posts/:id/comments | ต้อง | แสดงความคิดเห็น |
| DELETE | /api/comments/:id | ต้อง | ลบความเห็นตัวเอง |

ตัวอย่าง POST `/api/posts`:

```json
{"content":"สวัสดี Pulse!"}
```

ทุก endpoint ที่ต้อง Login ส่ง `Authorization: Bearer <JWT>` ใน header

## 5. โครงสร้างไฟล์

```text
social-final-project/
├── api/index.js          # Express handler for Vercel
├── server/
│   ├── app.js            # REST API, CRUD, authorization
│   ├── auth.js           # JWT verification/issuance
│   ├── bootstrap.js      # environment loading
│   ├── db.js             # Turso client, Drizzle and schema initialization
│   ├── local.js          # development server
│   └── schema.js         # Drizzle ORM tables
├── src/
│   ├── App.vue           # Vue UI and frontend actions
│   ├── api.js            # fetch wrapper
│   ├── main.js           # Vue entry
│   └── style.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

## 6. ตรวจงานก่อนส่ง

- [ ] `npm install` สำเร็จ
- [ ] `npm run check` และ `npm run build` สำเร็จ
- [ ] สมัครสมาชิก A และ B แล้วไม่เห็นข้อมูลโปรไฟล์ของกันและกัน
- [ ] A โพสต์, แก้ไข, ลบได้ / B ไม่มีสิทธิ์แก้ไขโพสต์ A
- [ ] B สามารถกด Like และ Comment โพสต์ A
- [ ] Refresh หน้าแล้วข้อมูลไม่หาย
- [ ] เปิด URL บนมือถือและ Incognito ได้จริง
- [ ] ไม่มี secret/token ใน browser source หรือ GitHub
- [ ] ส่ง Public URL + GitHub repository ให้อาจารย์

## หมายเหตุสำคัญด้านความปลอดภัย

ตัวอย่างสำหรับการเรียน: ใช้ JWT เก็บใน localStorage เพื่อทำงานได้ง่าย แต่ระบบ production ที่มีผู้ใช้จริงควรย้าย session ไปเป็น HttpOnly, Secure, SameSite cookie พร้อม CSRF protection ตามรูปแบบที่ใช้ รวมถึงเพิ่ม rate limiting, reset password, email verification, content moderation, audit logging และ automated integration tests. ระหว่างรันในเครื่องและ Vercel ใช้ HTTPS เมื่อออนไลน์เสมอ.

## สถานะการทดสอบ

ไฟล์นี้เป็นซอร์สโค้ดที่สร้างขึ้นสำหรับโจทย์งาน **ยังไม่ใช่หลักฐานว่า deploy แล้ว**. ต้องรัน `npm install`, `npm run build`, ทดสอบ API ด้วย Turso จริง และ Deploy ในบัญชีของผู้ส่งงานก่อน จึงจะถือว่าผ่านเกณฑ์ Public URL.

## 7. Automated checks (เพิ่มก่อนส่ง Final Project)

```bash
npm install
npm run check
npm run build
```

หลังเปิด backend ด้วย `npm run dev:api` (และตั้ง `.env` ให้ถูกต้อง):

```bash
npm run test:smoke
```

Smoke test สร้างบัญชีทดสอบ 2 บัญชี ตรวจ Login/permission, Create/Edit/Delete post, Like, Comment และ health. ใช้ฐานข้อมูลสำหรับทดสอบเท่านั้น เพราะจะมีข้อมูลทดสอบถูกบันทึก. GitHub Actions ใน `.github/workflows/verify.yml` จะรัน check, build และ smoke test บนฐานข้อมูล SQLite แยกต่างหาก

**หมายเหตุ:** ก่อนยืนยันพร้อมส่ง ต้องตรวจให้ GitHub Actions เป็นสีเขียวและทดสอบ Vercel + Turso จริงอีกครั้ง. หากคุณติดตั้ง npm ได้ ให้ commit `package-lock.json` ที่ `npm install` สร้างมาเพื่อให้ทีมติดตั้งชุด dependency ตรงกัน
