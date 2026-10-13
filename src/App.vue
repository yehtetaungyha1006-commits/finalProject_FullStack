<script setup>
import { ref, computed, onMounted } from 'vue';
import { Home, Compass, Bookmark, Settings, Bell, Search, Heart, MessageCircle, Send, MoreHorizontal, Plus, Sparkles, LogOut, Menu, X, PenLine, Trash2, Check, ArrowRight, LoaderCircle, UserRound, Pencil } from 'lucide-vue-next';
import AppLogo from './components/AppLogo.vue';
import {request,getToken,setToken} from './api.js';

const me=ref(null),posts=ref([]),loading=ref(false),busy=ref(false),error=ref(''),notice=ref('');
const authMode=ref('login'),form=ref({name:'',email:'',password:''}),authBusy=ref(false);
const newPost=ref(''),query=ref(''),activeTab=ref('feed'),showMenu=ref(false);
const editingId=ref(null),editText=ref(''),commentTexts=ref({}),expanded=ref({});
const profileName=ref(''),profileBio=ref(''),profileEditing=ref(false);
const dateFormat=v=>new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const initials=name=>(name||'?').trim().slice(0,1).toUpperCase();
const getColor=id=>['linear-gradient(135deg,#38bdf8,#6366f1)','linear-gradient(135deg,#10b981,#06b6d4)','linear-gradient(135deg,#f43f5e,#fb923c)','linear-gradient(135deg,#8b5cf6,#ec4899)','linear-gradient(135deg,#eab308,#f97316)','linear-gradient(135deg,#06b6d4,#3b82f6)'][Math.abs(id||0)%6];
const filtered=computed(()=>posts.value.filter(p=>(activeTab.value!=='mine'||p.userId===me.value?.id)&&`${p.content} ${p.authorName}`.toLowerCase().includes(query.value.toLowerCase())));
const totalLikes=computed(()=>posts.value.filter(p=>p.userId===me.value?.id).reduce((n,p)=>n+p.likeCount,0));
const mineCount=computed(()=>posts.value.filter(p=>p.userId===me.value?.id).length);
function alertError(e){error.value=e.message||'An unexpected error occurred';setTimeout(()=>error.value='',7000);}
function flash(s){notice.value=s;setTimeout(()=>notice.value='',3500);}
async function refresh(){loading.value=true;try{posts.value=await request('/posts');}catch(e){alertError(e);}finally{loading.value=false;}}
async function init(){if(!getToken())return;try{me.value=await request('/me');profileName.value=me.value.name;profileBio.value=me.value.bio;await refresh();}catch(e){setToken(null);me.value=null;alertError(e);}}
async function auth(){if(authBusy.value)return;authBusy.value=true;error.value='';try{const data=await request(`/auth/${authMode.value}`,{method:'POST',body:form.value});setToken(data.token);me.value=data.user;profileName.value=me.value.name;profileBio.value=me.value.bio;form.value={name:'',email:'',password:''};await refresh();}catch(e){alertError(e);}finally{authBusy.value=false;}}
function logout(){setToken(null);me.value=null;posts.value=[];activeTab.value='feed';showMenu.value=false;}
async function publish(){if(!newPost.value.trim()||busy.value)return;busy.value=true;try{await request('/posts',{method:'POST',body:{content:newPost.value}});newPost.value='';await refresh();flash('Post published successfully!');}catch(e){alertError(e);}finally{busy.value=false;}}
async function toggleLike(p){if(busy.value)return;busy.value=true;try{await request(`/posts/${p.id}/like`,{method:p.liked?'DELETE':'POST'});p.liked=!p.liked;p.likeCount+=p.liked?1:-1;}catch(e){alertError(e);}finally{busy.value=false;}}
async function addComment(p){const content=commentTexts.value[p.id]?.trim();if(!content)return;try{await request(`/posts/${p.id}/comments`,{method:'POST',body:{content}});commentTexts.value[p.id]='';await refresh();expanded.value[p.id]=true;}catch(e){alertError(e);}}
function startEdit(p){editingId.value=p.id;editText.value=p.content;}
async function saveEdit(p){try{await request(`/posts/${p.id}`,{method:'PATCH',body:{content:editText.value}});editingId.value=null;await refresh();flash('Post updated successfully');}catch(e){alertError(e);}}
async function deletePost(p){if(!confirm('Are you sure you want to delete this post?'))return;try{await request(`/posts/${p.id}`,{method:'DELETE'});await refresh();flash('Post deleted');}catch(e){alertError(e);}}
async function deleteComment(c){if(!confirm('Delete this comment?'))return;try{await request(`/comments/${c.id}`,{method:'DELETE'});await refresh();}catch(e){alertError(e);}}
async function saveProfile(){try{me.value=await request('/me',{method:'PATCH',body:{name:profileName.value,bio:profileBio.value}});profileEditing.value=false;await refresh();flash('Profile updated successfully');}catch(e){alertError(e);}}
onMounted(init);
</script>

<template>
 <div v-if="!me" class="auth-screen">
  <div class="auth-decor deco-one"></div><div class="auth-decor deco-two"></div>
  <div class="auth-intro">
    <div class="brand brand-light"><AppLogo :size="40"/> <span class="brand-text">ONE PLUS ONE EQUALS THREE<span>.</span></span></div>
    <div class="auth-intro-body">
      <div class="eyebrow light-eyebrow">✳ A LITTLE SPACE FOR BIG IDEAS</div>
      <h1>Where ideas connect<br>and <span>create synergy.</span></h1>
      <p>Connect with people, share daily thoughts, and create something greater than the sum of its parts.</p>
      <div class="auth-quote">
        <div class="quote-avatars"><span>A</span><span>J</span><span>S</span></div>
        <span>Every story deserves to be heard.</span>
      </div>
    </div>
    <div class="auth-footer">ONE PLUS ONE EQUALS THREE © 2026</div>
  </div>
  <div class="auth-panel">
    <div class="auth-box">
      <div class="mini-pill">✦ YOUR NEW FAVORITE CORNER</div>
      <h2>{{authMode==='login'?'Welcome back':'Join ONE PLUS ONE EQUALS THREE'}}</h2>
      <p class="muted">{{authMode==='login'?'Sign in to catch up with stories from the community':'Create a free account and start sharing your moments today'}}</p>
      <div class="auth-switch">
        <button :class="{selected:authMode==='login'}" @click="authMode='login'">Sign In</button>
        <button :class="{selected:authMode==='register'}" @click="authMode='register'">Create Account</button>
      </div>
      <form @submit.prevent="auth" class="auth-form">
        <label v-if="authMode==='register'">Display Name<input v-model="form.name" autocomplete="name" maxlength="60" placeholder="Your name or handle" required/></label>
        <label>Email Address<input v-model="form.email" type="email" autocomplete="email" placeholder="hello@example.com" required/></label>
        <label>Password<input v-model="form.password" type="password" :autocomplete="authMode==='login'?'current-password':'new-password'" placeholder="At least 8 characters" :minlength="authMode==='register'?8:1" required/></label>
        <button class="primary big" :disabled="authBusy">
          <LoaderCircle v-if="authBusy" :size="18" class="spin"/>
          <span>{{authMode==='login'?'Sign In':'Get Started'}}</span>
          <ArrowRight :size="18"/>
        </button>
      </form>
      <p class="auth-hint">By continuing, you're joining a community of storytellers <span>✳</span></p>
    </div>
  </div>
 </div>

 <div v-else class="app-shell">
  <aside class="sidebar">
    <div class="brand"><AppLogo :size="36"/> <span class="brand-text">ONE PLUS ONE EQUALS THREE<span>.</span></span></div>
    <p class="side-label">MENU</p>
    <nav class="nav-list">
      <button :class="['nav-item',{active:activeTab==='feed'}]" @click="activeTab='feed';showMenu=false"><Home :size="20"/>Home Feed<span v-if="activeTab==='feed'" class="nav-indicator"></span></button>
      <button :class="['nav-item',{active:activeTab==='mine'}]" @click="activeTab='mine';showMenu=false"><UserRound :size="20"/>My Posts</button>
      <button :class="['nav-item',{active:activeTab==='profile'}]" @click="activeTab='profile';showMenu=false"><Settings :size="20"/>Profile</button>
    </nav>
    <div class="side-bottom">
      <div class="sidebar-tip">
        <div class="tip-icon">✳</div>
        <strong>Community Corner</strong>
        <p>Every perspective has value. Share your genuine voice today.</p>
      </div>
      <button class="side-user" @click="activeTab='profile'">
        <span class="avatar sm" :style="{background:getColor(me.id)}">{{initials(me.name)}}</span>
        <span class="side-user-name"><strong>{{me.name}}</strong><small>My account</small></span>
        <MoreHorizontal :size="20"/>
      </button>
    </div>
  </aside>

  <div class="mobile-top">
    <button class="icon-btn" @click="showMenu=!showMenu"><X v-if="showMenu"/><Menu v-else/></button>
    <div class="brand"><AppLogo :size="28"/> <span class="brand-text">ONE PLUS ONE EQUALS THREE<span>.</span></span></div>
    <button class="avatar sm" :style="{background:getColor(me.id)}" @click="activeTab='profile'">{{initials(me.name)}}</button>
  </div>

  <div v-if="showMenu" class="mobile-menu">
    <button @click="activeTab='feed';showMenu=false">Home Feed</button>
    <button @click="activeTab='mine';showMenu=false">My Posts</button>
    <button @click="activeTab='profile';showMenu=false">Profile</button>
    <button @click="logout">Sign Out</button>
  </div>

  <main class="main">
    <header class="topbar">
      <div class="breadcrumb">COMMUNITY <span>/</span> {{activeTab==='profile'?'PROFILE':activeTab==='mine'?'MY POSTS':'HOME FEED'}}</div>
      <div class="top-actions">
        <span class="today">{{dateFormat(new Date())}}</span>
        <button class="circle-btn" title="Sign out" @click="logout"><LogOut :size="18"/></button>
        <span class="avatar sm" :style="{background:getColor(me.id)}">{{initials(me.name)}}</span>
      </div>
    </header>

    <div class="content-grid">
      <section class="center-column">
        <div v-if="activeTab==='profile'" class="profile-section">
          <div class="section-eyebrow">YOUR CORNER ✳</div>
          <h1>My Profile<span class="dot">.</span></h1>
          <p class="page-subtitle">Manage your profile details and let others get to know you</p>
          <div class="profile-card">
            <div class="profile-hero">
              <div class="avatar xl" :style="{background:getColor(me.id)}">{{initials(me.name)}}</div>
              <div>
                <h2>{{me.name}}</h2>
                <p>{{me.email}}</p>
                <span class="profile-tag">✳ ONE PLUS ONE EQUALS THREE MEMBER</span>
              </div>
            </div>
            <template v-if="profileEditing">
              <label class="field-label">Display Name<input v-model="profileName" maxlength="60"/></label>
              <label class="field-label">About Me<textarea v-model="profileBio" maxlength="160" rows="3" placeholder="Tell the community about yourself..."></textarea></label>
              <div class="actions">
                <button class="primary" @click="saveProfile"><Check :size="16"/>Save Changes</button>
                <button class="quiet" @click="profileEditing=false">Cancel</button>
              </div>
            </template>
            <template v-else>
              <div class="bio-box">{{me.bio||'No bio added yet. Share a little about what inspires you ✨'}}</div>
              <button class="outline" @click="profileEditing=true"><Pencil :size="16"/>Edit Profile</button>
            </template>
          </div>
        </div>

        <template v-else>
          <div class="welcome">
            <div class="section-eyebrow">THE SOCIAL SPACE FOR EVERYONE ✳</div>
            <h1>{{activeTab==='mine'?'My Stories':'Share Today'}}<span class="dot">.</span></h1>
            <p class="page-subtitle">{{activeTab==='mine'?'A timeline of all your shared moments and insights.':'Welcome back, '+me.name+'! What story would you like to share today?'}}</p>
          </div>

          <div v-if="activeTab==='feed'" class="composer">
            <div class="composer-top">
              <span class="avatar" :style="{background:getColor(me.id)}">{{initials(me.name)}}</span>
              <textarea v-model="newPost" maxlength="1000" placeholder="What's on your mind? Share your story..." rows="3"></textarea>
            </div>
            <div class="composer-bottom">
              <span>✦ Every thought matters <span class="counter">{{newPost.length}}/1000</span></span>
              <button class="primary" :disabled="!newPost.trim()||busy" @click="publish"><Send :size="16"/>Publish</button>
            </div>
          </div>

          <div class="feed-heading">
            <div>
              <span class="pulse-dot"></span>
              <strong>{{activeTab==='mine'?'My stories':'Community feed'}}</strong>
              <small>{{filtered.length}} POSTS</small>
            </div>
            <div class="searchbox">
              <Search :size="16"/>
              <input v-model="query" placeholder="Search posts..." aria-label="Search posts"/>
            </div>
          </div>

          <div v-if="loading" class="empty">
            <LoaderCircle :size="25" class="spin"/>Loading posts...
          </div>
          <div v-else-if="!filtered.length" class="empty">
            <div class="empty-emoji">✍️</div>
            <h3>No posts found</h3>
            <p>Be the first to share a thought, or try a different search keyword.</p>
          </div>

          <article v-for="p in filtered" :key="p.id" class="post-card">
            <div class="post-head">
              <span class="avatar" :style="{background:getColor(p.userId)}">{{initials(p.authorName)}}</span>
              <div class="post-author">
                <strong>{{p.authorName}} <span v-if="p.userId===me.id" class="you-chip">YOU</span></strong>
                <small>{{dateFormat(p.createdAt)}} · Public</small>
              </div>
              <div v-if="p.userId===me.id" class="post-tools">
                <button title="Edit post" @click="startEdit(p)"><Pencil :size="16"/></button>
                <button title="Delete post" @click="deletePost(p)"><Trash2 :size="16"/></button>
              </div>
              <MoreHorizontal v-else class="post-more" :size="20"/>
            </div>

            <template v-if="editingId===p.id">
              <textarea class="edit-area" v-model="editText" maxlength="1000" rows="3"></textarea>
              <div class="actions">
                <button class="primary small" @click="saveEdit(p)">Save</button>
                <button class="quiet" @click="editingId=null">Cancel</button>
              </div>
            </template>
            <p v-else class="post-content">{{p.content}}</p>

            <div class="post-stats">
              <span><Heart :size="14"/> {{p.likeCount}} likes</span>
              <span>{{p.comments.length}} comments</span>
            </div>

            <div class="post-actions">
              <button :class="{liked:p.liked}" @click="toggleLike(p)">
                <Heart :size="19" :fill="p.liked?'currentColor':'none'"/>{{p.liked?'Liked':'Like'}}
              </button>
              <button @click="expanded[p.id]=!expanded[p.id]">
                <MessageCircle :size="19"/>Comment
              </button>
            </div>

            <div v-if="expanded[p.id]" class="comments">
              <div v-for="c in p.comments" :key="c.id" class="comment">
                <span class="avatar xs" :style="{background:getColor(c.userId)}">{{initials(c.authorName)}}</span>
                <div class="comment-bubble">
                  <strong>{{c.authorName}}</strong>
                  <p>{{c.content}}</p>
                </div>
                <button v-if="c.userId===me.id" class="delete-comment" @click="deleteComment(c)" title="Delete comment"><X :size="14"/></button>
              </div>
              <form @submit.prevent="addComment(p)" class="comment-form">
                <span class="avatar xs" :style="{background:getColor(me.id)}">{{initials(me.name)}}</span>
                <input v-model="commentTexts[p.id]" maxlength="400" placeholder="Write a comment..." required/>
                <button class="send-comment" title="Send comment" :disabled="!commentTexts[p.id]?.trim()"><Send :size="17"/></button>
              </form>
            </div>
          </article>
        </template>
      </section>

      <aside class="right-column">
        <div class="right-welcome">
          <div class="sun-icon">✳</div>
          <span>GOOD TO SEE YOU HERE</span>
          <strong>Make today<br/>a good story.</strong>
          <p>Every single day brings moments and ideas worth telling.</p>
          <div class="rainbow-shape"></div>
        </div>

        <div class="right-widget">
          <h3>Your activity <span>✦</span></h3>
          <div class="activity-grid">
            <div><strong>{{mineCount}}</strong><small>Posts</small></div>
            <div><strong>{{totalLikes}}</strong><small>Likes</small></div>
          </div>
          <button class="widget-link" @click="activeTab='mine'">View all posts <ArrowRight :size="15"/></button>
        </div>

        <div class="guideline">
          <span>✳ COMMUNITY NOTE</span>
          <h3>Be kind. Be real.<br/>Be yourself.</h3>
          <p>Share with respect and help foster an inspiring space for everyone.</p>
        </div>

        <div class="footer-links">
          About · Community · Privacy<br/>
          © 2026 ONE PLUS ONE EQUALS THREE
        </div>
      </aside>
    </div>
  </main>
 </div>

 <div v-if="error" class="toast err"><button @click="error=''">×</button>{{error}}</div>
 <div v-if="notice" class="toast ok">✓ {{notice}}</div>
</template>
