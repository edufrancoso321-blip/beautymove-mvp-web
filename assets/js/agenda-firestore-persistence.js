/* BeautyMove Agenda persistence bridge — Firestore first, local cache second. */
(function () {
  'use strict';
  const STATE_KEY='beautymove.mvp.state';
  const HOURS_KEY='beautymove.mvp.agenda.hours';
  const HYDRATED_KEY='beautymove.agenda.firestore.hydrated';
  const COLLECTIONS=['appointments','opportunities','transactions'];
  const EMPTY_STATE={appointments:[],opportunities:[],transactions:[]};
  const FIREBASE_VERSION='12.17.0';
  const nativeGetItem=Storage.prototype.getItem;
  const nativeSetItem=Storage.prototype.setItem;
  let cacheState=null, cacheHours=null, syncing=false, ready=false, pendingState=null;

  function readNative(key,fallback){try{const raw=nativeGetItem.call(localStorage,key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
  function writeNative(key,value){nativeSetItem.call(localStorage,key,JSON.stringify(value));}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function currentUid(){const u=window.BeautyMoveFirebase?.auth?.currentUser;return u?.uid||null;}
  function backend(){const v=window.BeautyMoveFirebase;return v?.enabled&&v.db?v:null;}
  function normalizeState(value){const s=value&&typeof value==='object'?value:{};return {appointments:Array.isArray(s.appointments)?s.appointments:[],opportunities:Array.isArray(s.opportunities)?s.opportunities:[],transactions:Array.isArray(s.transactions)?s.transactions:[]};}
  function normalizeHours(value){const f={open:'08:00',close:'18:00'};return Array.isArray(value)&&value.length===7?value.map(x=>({open:x?.open||f.open,close:x?.close||f.close})):Array.from({length:7},()=>({...f}));}
  function withId(item,prefix){const v={...(item||{})};if(!v.id)v.id=`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return v;}
  function firestoreData(item,uid){const v={...item,salonOwnerId:uid,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};if(!v.createdAt)v.createdAt= firebase.firestore.FieldValue.serverTimestamp();return v;}
  function cacheSafeDoc(data){const v={...(data||{})};delete v.createdAt;delete v.updatedAt;return v;}
  async function loadScript(src){if([...document.scripts].some(s=>s.src===src))return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error(`Não foi possível carregar ${src}.`));document.head.appendChild(s);});}
  async function ensureFirebase(){if(backend())return true;try{await loadScript('assets/js/firebase-config.js');await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`);await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`);await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`);await loadScript('assets/js/firebase-client-v2.js');await loadScript('assets/js/auth.js');return Boolean(backend());}catch(e){console.error('[BeautyMove] Firebase Agenda bootstrap failed:',e);return false;}}
  async function waitForFirebaseUser(timeoutMs=15000){const s=backend();if(!s?.auth)return null;if(s.auth.currentUser?.uid)return s.auth.currentUser.uid;return new Promise(resolve=>{let done=false,unsub=null;const finish=(uid)=>{if(done)return;done=true;clearTimeout(timer);unsub?.();resolve(uid||null);};const timer=setTimeout(()=>finish(null),timeoutMs);unsub=s.auth.onAuthStateChanged(user=>finish(user?.uid||null));});}
  async function readCollection(db,name,uid){try{const snap=await db.collection(name).where('salonOwnerId','==',uid).get();return {items:snap.docs.map(d=>({id:d.id,...cacheSafeDoc(d.data())})),error:null};}catch(error){console.error(`[BeautyMove] Firestore read failed for ${name}:`,error);return {items:[],error};}}
  async function loadRemoteState(db,uid){const results=await Promise.all(COLLECTIONS.map(async name=>[name,await readCollection(db,name,uid)]));const state={};const errors=[];for(const [name,result] of results){state[name]=result.items;if(result.error)errors.push({name,error:result.error});}return {state,errors};}
  async function saveCollection(db,name,items,uid){const normalized=items.map(i=>withId(i,name.slice(0,-1)));const remote=await db.collection(name).where('salonOwnerId','==',uid).get();const ids=new Set(normalized.map(i=>i.id));const batch=db.batch();remote.docs.forEach(d=>{if(!ids.has(d.id))batch.delete(d.ref);});normalized.forEach(item=>batch.set(db.collection(name).doc(item.id),firestoreData(item,uid),{merge:true}));await batch.commit();return normalized;}
  async function persistState(state){
    pendingState=normalizeState(state);
    if(syncing)return;
    const service=backend(),uid=currentUid();
    if(!service||!uid)return;
    syncing=true;
    try{
      while(pendingState){
        const snapshot=normalizeState(pendingState);
        pendingState=null;
        const saved={...snapshot};
        for(const name of COLLECTIONS){
          try{saved[name]=await saveCollection(service.db,name,snapshot[name],uid);}catch(error){console.error(`[BeautyMove] Agenda Firestore persistence failed for ${name}:`,error);}
        }
        if(!pendingState){cacheState=normalizeState(saved);writeNative(STATE_KEY,cacheState);}
      }
    }catch(e){console.error('[BeautyMove] Agenda Firestore persistence failed:',e);window.dispatchEvent(new CustomEvent('beautymove:agenda-persistence-error',{detail:e}));}
    finally{syncing=false;}
  }
  function mergeRemoteFirst(remote,local){
    const map=new Map((remote||[]).map(i=>[i.id,i]));
    for(const item of (local||[])){
      const v=withId(item,'item');
      if(!map.has(v.id))map.set(v.id,v);
    }
    return [...map.values()];
  }
  async function hydrate(){
    await ensureFirebase();
    const uid=await waitForFirebaseUser();
    const service=backend();
    const initialLocal=normalizeState(readNative(STATE_KEY,EMPTY_STATE));
    cacheHours=normalizeHours(readNative(HOURS_KEY,null));
    if(!service||!uid){cacheState=initialLocal;ready=true;window.dispatchEvent(new CustomEvent('beautymove:agenda-hydrated'));return;}
    try{
      const remoteResult=await loadRemoteState(service.db,uid);
      const remote=remoteResult.state;
      if(remoteResult.errors.length)console.warn('[BeautyMove] Some Firestore collections could not be hydrated:',remoteResult.errors.map(x=>x.name));
      const latestLocal=normalizeState(readNative(STATE_KEY,EMPTY_STATE));
      const merged={};
      for(const name of COLLECTIONS)merged[name]=mergeRemoteFirst(remote[name],latestLocal[name]);
      cacheState=normalizeState(merged);
      writeNative(STATE_KEY,cacheState);
      ready=true;
      const localHasData=COLLECTIONS.some(name=>(latestLocal[name]||[]).length>0);
      if(localHasData)await persistState(cacheState);
      writeNative(HOURS_KEY,cacheHours);
      nativeSetItem.call(sessionStorage,HYDRATED_KEY,'1');
      window.dispatchEvent(new CustomEvent('beautymove:agenda-hydrated'));
    }catch(e){
      console.error('[BeautyMove] Agenda Firestore hydration failed:',e);
      cacheState=normalizeState(readNative(STATE_KEY,initialLocal));
      ready=true;
      window.dispatchEvent(new CustomEvent('beautymove:agenda-persistence-error',{detail:e}));
    }
  }
  function patchStorage(){
    Storage.prototype.getItem=function(key){if(this===localStorage&&key===STATE_KEY&&cacheState)return JSON.stringify(cacheState);if(this===localStorage&&key===HOURS_KEY&&cacheHours)return JSON.stringify(cacheHours);return nativeGetItem.call(this,key);};
    Storage.prototype.setItem=function(key,value){
      if(this===localStorage&&key===STATE_KEY){try{const next=normalizeState(JSON.parse(value));cacheState=next;nativeSetItem.call(this,key,JSON.stringify(next));void persistState(next);return;}catch{}}
      if(this===localStorage&&key===HOURS_KEY){try{cacheHours=normalizeHours(JSON.parse(value));nativeSetItem.call(this,key,JSON.stringify(cacheHours));return;}catch{}}
      return nativeSetItem.call(this,key,value);
    };
  }
  window.BeautyMoveAgendaPersistence={hydrate,isReady:()=>ready,getState:()=>clone(cacheState||normalizeState(readNative(STATE_KEY,EMPTY_STATE))),getHours:()=>clone(cacheHours||normalizeHours(readNative(HOURS_KEY,null))),syncNow:()=>persistState(cacheState||normalizeState(readNative(STATE_KEY,EMPTY_STATE)))};
  patchStorage();void hydrate();
})();
