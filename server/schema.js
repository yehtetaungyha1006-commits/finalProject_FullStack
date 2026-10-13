import { sqliteTable, integer, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  bio: text('bio').notNull().default(''),
  createdAt: text('created_at').notNull().default('')
}, t => [uniqueIndex('users_email_unique').on(t.email)]);
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({autoIncrement:true}),
  userId: integer('user_id').notNull().references(()=>users.id, {onDelete:'cascade'}),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull()
}, t => [index('posts_user_idx').on(t.userId)]);
export const likes = sqliteTable('likes', {
  userId: integer('user_id').notNull().references(()=>users.id, {onDelete:'cascade'}),
  postId: integer('post_id').notNull().references(()=>posts.id, {onDelete:'cascade'})
}, t => [uniqueIndex('likes_unique').on(t.userId,t.postId)]);
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({autoIncrement:true}),
  postId: integer('post_id').notNull().references(()=>posts.id,{onDelete:'cascade'}),
  userId: integer('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
  content: text('content').notNull(), createdAt: text('created_at').notNull()
}, t => [index('comments_post_idx').on(t.postId)]);
