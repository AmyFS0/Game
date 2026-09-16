const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const menu=$('menu'),hud=$('hud'),endScreen=$('endScreen'),panel=$('panel'),toast=$('toast'),crosshair=$('crosshair'),brief=$('brief');
let W=innerWidth,H=innerHeight,DPR=devicePixelRatio||1;
function resize(){W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();

const keys={},mouse={x:W/2,y:H/2,down:false};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')e.preventDefault();if(e.key.toLowerCase()==='m')toggleMusic();ability(e)});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;crosshair.style.left=mouse.x+'px';crosshair.style.top=mouse.y+'px'});
addEventListener('mousedown',()=>{unlockAudio();mouse.down=true});addEventListener('mouseup',()=>mouse.down=false);
addEventListener('pointerdown',unlockAudio,{once:true});

const weapons=[
{name:'PULSE BLASTER',rarity:'RARE',rate:210,speed:860,damage:18,color:'#22d3ee',spread:.02,count:1},
{name:'PRISM CANNON',rarity:'EPIC',rate:520,speed:700,damage:32,color:'#a855f7',spread:.13,count:3},
{name:'PHOTON SMG',rarity:'LEGENDARY',rate:92,speed:930,damage:10,color:'#ec4899',spread:.08,count:1}
];

const worlds=[
{name:'ANILLO NEÓN',accent:'#22d3ee',bpm:118,levels:[
{name:'NEON CITY',accent:'#22d3ee',bg:'#050510',glow:'rgba(124,58,237,.18)',waves:2,story:'El último baluarte de la humanidad parpadea entre pancartas digitales rotas. Los Scout pululan entre las ruinas luminosas.',style:0},
{name:'CRYSTAL PLANET',accent:'#a855f7',bg:'#080414',glow:'rgba(168,85,247,.23)',waves:2,story:'Cristales que guardan recuerdos de un mundo anterior. Los Guardianes los protegen con furia mineral.',style:1},
{name:'CYBER JUNGLE',accent:'#34d399',bg:'#03100d',glow:'rgba(52,211,153,.18)',waves:3,story:'La flora digital devoró las ruinas. Algo sigue vivo entre los cables. La selva nunca duerme.',style:2},
{name:'FLOATING ISLES',accent:'#60a5fa',bg:'#050b19',glow:'rgba(96,165,250,.2)',waves:3,story:'Islas arrancadas de la gravedad custodian el eco del Rift. Los Snipers acechan en las cumbres.',style:3},
{name:'THE RIFT GATE',accent:'#f472b6',bg:'#0b0310',glow:'rgba(244,114,182,.24)',waves:3,boss:'WARDEN',story:'El Guardián de la Grieta vigila el paso hacia la nada. Para seguir avanzando, hay que romperlo.',style:4}
]},
{name:'EXPANSIÓN HUECA',accent:'#f43f5e',bpm:106,levels:[
{name:'ASHEN WASTES',accent:'#fb923c',bg:'#12070a',glow:'rgba(251,146,60,.18)',waves:3,story:'Cenizas de mil civilizaciones: el Vacío las devoró. Aquí la gravedad se olvidó de su trabajo.',style:5},
{name:'OBSIDIAN VAULT',accent:'#8b5cf6',bg:'#060313',glow:'rgba(139,92,246,.24)',waves:3,story:'Bóvedas de puro cristal negro, la prisión de los olvidados. Los Guardianes aquí son más oscuros.',style:6},
{name:'MIRROR MAZE',accent:'#22d3ee',bg:'#020a12',glow:'rgba(34,211,238,.2)',waves:4,story:'Los espejos mienten: cada reflejo es un depredador. Los Wraith atraviesan el cristal.',style:7},
{name:'STARLESS DEEP',accent:'#a3e635',bg:'#050803',glow:'rgba(163,230,53,.16)',waves:4,story:'La oscuridad total, donde los Wraith nacen y el silencio dispara primeros.',style:8},
{name:'THE HOLLOW CROWN',accent:'#f43f5e',bg:'#150309',glow:'rgba(244,63,94,.3)',waves:4,boss:'TYRANT',story:'El tirano que rompió los mundos espera aquí, en el corazón del Vacío, para cerrar su obra.',style:9}
]}
];
function worldOf(n){return Math.floor((n-1)/5)}
function cfgOf(n){return worlds[worldOf(n)].levels[(n-1)%5]}
function worldName(n){return worlds[worldOf(n)].name}

const enemyPresets=[
{type:'SCOUT',r:14,hp:34,speed:105,color:'#22d3ee',damage:10,shoot:false},
{type:'CARGADOR',r:14,hp:46,speed:72,color:'#38bdf8',damage:20,shoot:false},
{type:'GUARDIAN',r:23,hp:88,speed:58,color:'#a855f7',damage:16,shoot:false},
{type:'SNIPER',r:17,hp:50,speed:74,color:'#ec4899',damage:13,shoot:true},
{type:'WRAITH',r:15,hp:70,speed:165,color:'#a3e635',damage:12,shoot:false}
];
const bosses={
WARDEN:{name:'RIFT WARDEN',r:48,hp:2400,speed:46,damage:22,color:'#f472b6',burst:5,shoot:true},
TYRANT:{name:'RIFT TYRANT',r:62,hp:6800,speed:54,damage:30,color:'#f43f5e',burst:8,shoot:true}
};

let state='menu',last=performance.now(),score=0,kills=0,level=1,wave=1,shake=0,flash=0,lives=3;
const MAX_LIVES=3;
let bullets=[],enemies=[],particles=[],pickups=[],rings=[],stars=[],hazards=[];
let spawnRemaining=0,spawnCooldown=0,clearTimer=-1,bossSpawned=false,pickupTimer=5;
let fxTimer=0,fxType=null,timeEventT=0;
for(let i=0;i<125;i++)stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random(),s:Math.random()*1.7+.2});
const player={x:W*.35,y:H*.58,r:17,hp:100,energy:100,speed:255,weapon:0,lastShot:0,dashCd:0,shieldCd:0,overCd:0,shield:0,over:0,bulletShield:0,inv:0,angle:0,boostT:0};

function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>toast.classList.remove('show'),1600)}
function burst(x,y,color,n=10,power=4){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*power+1;particles.push({x,y,vx:Math.cos(a)*s*60,vy:Math.sin(a)*s*60,life:.25+Math.random()*.45,max:.7,r:1+Math.random()*3,color})}}
function ring(x,y,color){rings.push({x,y,r:8,life:.6,color})}

/* ---------- AUDIO ---------- */
let audio=null,musicGain=null,sfxGain=null,musicOn=true,musicStep=0,schedT=0,musicInt=null,noiseBuf=null;
function initAudio(){if(audio)return;try{audio=new (window.AudioContext||window.webkitAudioContext)();musicGain=audio.createGain();musicGain.gain.value=.32;musicGain.connect(audio.destination);sfxGain=audio.createGain();sfxGain.gain.value=.22;sfxGain.connect(audio.destination);noiseBuf=audio.createBuffer(1,audio.sampleRate*.5,audio.sampleRate);for(let i=0;i<noiseBuf.length;i++)noiseBuf.getChannelData(0)[i]=Math.random()*2-1}catch(e){}}
function unlockAudio(){initAudio();if(audio&&audio.state==='suspended')audio.resume();startMusic()}
function playNote(freq,t,dur,vol,type='sine',dest=musicGain){if(!audio||!musicOn)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05)}
function playNoise(t,dur,vol,freq=400,q=1,dest=sfxGain){if(!audio)return;const s=audio.createBufferSource();s.buffer=noiseBuf;s.loop=true;const f=audio.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=audio.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.05)}
function sfx(k){if(!audio||!sfxGain)return;const t=audio.currentTime;switch(k){
case 'shoot':playNote(520+Math.random()*60,t,.06,.05,'square',sfxGain);break;
case 'hit':playNoise(t,.08,.07,900,1.4);playNote(220,t,.06,.04,'sawtooth',sfxGain);break;
case 'expl':playNoise(t,.4,.16,320,.8);playNote(80,t,.35,.14,'sine',sfxGain);break;
case 'pick':playNote(660,t,.08,.05,'square',sfxGain);playNote(990,t+.06,.09,.05,'square',sfxGain);break;
case 'shield':playNote(440,t,.12,.05,'triangle',sfxGain);playNote(880,t+.04,.14,.04,'triangle',sfxGain);break;
case 'dash':playNote(300,t,.12,.04,'sawtooth',sfxGain);break;
case 'hurt':playNote(140,t,.2,.08,'sawtooth',sfxGain);break;
case 'revive':[392,523,659,784].forEach((f,i)=>{
  playNote(f,t+i*.09,.14,.06,'triangle',sfxGain)
});break;
case 'boss':[65,55,70].forEach((f,i)=>{
  playNote(f*(i===2?1.2:1),t+i*.18,.6,.12,'sawtooth',sfxGain)
});playNoise(t,.8,.1,180,.6);break;
case 'win':[523,659,784,1046].forEach((f,i)=>{
  playNote(f,t+i*.11,.2,.07,'triangle',sfxGain)
});break;
}}
const scales=[[0,3,5,7,10,12,15]];
function scheduleStep(step,t){const w=worldOf(level),root=worlds[w].bpm>110?110:82.41,off=[0,3,5,7,10,12,15,10,7,5,3,0,-3,-5,3,7];const spb=60/(worlds[w].bpm)/2;if(step%4===0)playNote(root,t,spb*1.8,.22,'triangle');if(step%8===4)playNote(root*1.5,t,spb*1.4,.14,'triangle');if(step%2===1){const o=off[step%off.length];playNote(root*2*Math.pow(2,o/12),t,spb*.9,.06,'square')}if(step%16===8)playNote(root*4,t,spb*1.2,.04,'sine')}
function startMusic(){if(!audio||musicInt)return;musicStep=0;schedT=0;musicInt=setInterval(()=>{if(!musicOn||audio.state!=='running')return;const spb=60/(worlds[worldOf(level)].bpm)/2;while(schedT<audio.currentTime+.35){scheduleStep(musicStep,schedT);musicStep++;schedT+=spb}},75)}
function toggleMusic(){musicOn=!musicOn;notify(musicOn?'♪ MUSIC ON':'♪ MUSIC MUTED');$('musicBtn').textContent=musicOn?'♪ MUSIC':'♪ MUTED';if(!musicOn&&musicInt){clearInterval(musicInt);musicInt=null}if(musicOn)startMusic()}

/* ---------- FLOW ---------- */
function startGame(){unlockAudio();score=0;kills=0;level=1;wave=1;lives=MAX_LIVES;bullets=[];enemies=[];particles=[];pickups=[];rings=[];hazards=[];fxTimer=0;fxType=null;timeEventT=0;menu.classList.add('hidden');endScreen.classList.add('hidden');hud.classList.add('hidden');panel.classList.add('hidden');Object.assign(player,{x:W*.35,y:H*.58,hp:100,energy:100,weapon:0,lastShot:0,dashCd:0,shieldCd:0,overCd:0,shield:0,over:0,bulletShield:0,inv:0,boostT:0});showBrief(1)}
$('playBtn').onclick=startGame;$('restartBtn').onclick=startGame;

function showBrief(n){level=n;state='brief';menu.classList.add('hidden');hud.classList.add('hidden');endScreen.classList.add('hidden');panel.classList.add('hidden');brief.classList.remove('hidden');hazards=[];bullets=[];const world=worldOf(n),cfg=cfgOf(n);$('briefTag').textContent=`WORLD ${world+1} // ${worlds[world].name}`;$('briefTitle').innerHTML=`LEVEL ${String(n).padStart(2,'0')}<br><em>${cfg.name}</em>`;$('briefStory').textContent=cfg.story;$('briefWaves').textContent=cfg.waves;$('briefDiff').textContent=String(n).padStart(2,'0');$('briefTarget').textContent=cfg.boss?`DEFEAT ${bosses[cfg.boss].name}`:'CLEAR WAVES';sfx('boss')}
$('briefBtn').onclick=()=>{brief.classList.add('hidden');hud.classList.remove('hidden');state='play';beginLevel(level)};

function beginLevel(n){level=n;wave=1;player.energy=100;if(n>1)player.hp=Math.min(100,player.hp+15);spawnHazards();startWave();updateHUD()}
function startWave(){const cfg=cfgOf(level);spawnRemaining=Math.min(30,4+level*2+wave*3);spawnCooldown=Math.max(.18,.8-level*.055);clearTimer=-1;bossSpawned=false;pickupTimer=4+Math.random()*3;if(level>=3&&Math.random()<.4)triggerFx();else fxTimer=0;notify(`${worlds[worldOf(level)].name} // ${cfg.name} // WAVE ${wave}`)}
function advance(){const cfg=cfgOf(level);if(wave<cfg.waves){wave++;startWave()}else if(level<10){showBrief(level+1)}else finish(true)}
function triggerFx(){const r=Math.random();fxType=r<.5?'slow':'fast';fxTimer=4+Math.random()*2;fxType==='slow'?notify('⏳ TIME FRACTURE // SLOW-MO'):notify('⚡ RIFT SURGE // ENEMIES OVERDRIVE')}

/* ---------- SPAWN ---------- */
function spawnEnemy(kind=null){let x,y,edge=Math.floor(Math.random()*4),m=70;
if(edge===0){x=-m;y=100+Math.random()*(H-160)}
if(edge===1){x=W+m;y=100+Math.random()*(H-160)}
if(edge===2){x=Math.random()*W;y=70}
if(edge===3){x=Math.random()*W;y=H+m}
const cfg=cfgOf(level);
if(kind==='WARDEN'||kind==='TYRANT'){const b=bosses[kind];const k=n=>n*Math.min(3.4,(1+(level-1)*.24));const hp=k(b.hp);enemies.push({type:b.name,x:W+90,y:H*.45,r:b.r,hp,maxHp:hp,speed:b.speed,damage:b.damage,color:b.color,shoot:true,boss:true,lastAttack:0,phase:0,burst:b.burst});notify('⚠ BOSS // '+b.name);sfx('boss');return}
const maxType=Math.min(4,Math.floor(level/2));
const p=enemyPresets[kind===null?Math.floor(Math.random()*(maxType+1)):kind];
const hpScale=1+(level-1)*.22,speedScale=1+(level-1)*.09,damageScale=1+(level-1)*.13;
enemies.push({...p,x,y,hp:p.hp*hpScale,maxHp:p.hp*hpScale,speed:p.speed*speedScale,damage:p.damage*damageScale,shoot:p.shoot||(level>=4&&p.type==='GUARDIAN'),lastAttack:0,phase:Math.random()*6.28});
}
function spawnHazards(){hazards=[];if(level<=1)return;const n=Math.min(5,1+Math.floor(level/2));for(let i=0;i<n;i++){
let x,y,ok=false,guard=0;
while(!ok&&guard++<40){x=60+Math.random()*(W-120);y=110+Math.random()*(H-170);ok=Math.hypot(x-player.x,y-player.y)>260}
const r=Math.random(),type=r<.35?'spike':(r<.7||level<4?'mine':'laser');
if(type==='spike')hazards.push({type,x,y,r:18,t:Math.random()*6,cd:0});
else if(type==='mine')hazards.push({type,x,y,r:13,t:0,armed:false,armT:1.2+Math.random()});
else hazards.push({type,x,y,ang:Math.random()*6.28,spd:(Math.random()<.5?1:-1)*(.5+level*.06),len:200+Math.random()*120,on:true,t:Math.random()*2});
}
}
function spawnPickup(type=null,x=null,y=null){type=type||(['health','shield','energy','boost','time'][Math.floor(Math.random()*5)]);pickups.push({type,x:x??(70+Math.random()*(W-140)),y:y??(115+Math.random()*(H-190)),r:12,t:0,life:12,dead:false})}
function collect(p){const t=audio?audio.currentTime:0;switch(p.type){
case 'shield':player.bulletShield=8;ring(p.x,p.y,'#facc15');burst(p.x,p.y,'#facc15',22,5);notify('★ PROTECTION ORB // 8s');break;
case 'health':player.hp=Math.min(100,player.hp+30);ring(p.x,p.y,'#38bdf8');burst(p.x,p.y,'#38bdf8',22,5);notify('★ HEALTH ORB // +30 HP');break;
case 'energy':player.energy=Math.min(100,player.energy+40);ring(p.x,p.y,'#4ade80');burst(p.x,p.y,'#4ade80',20,5);notify('★ ENERGY ORB // +40 EN');break;
case 'boost':player.boostT=7;ring(p.x,p.y,'#f9a8d4');burst(p.x,p.y,'#f9a8d4',24,5);notify('★ BOOST ORB // RAGE 7s');break;
case 'time':fxType='slow';fxTimer=5;ring(p.x,p.y,'#a3e635');burst(p.x,p.y,'#a3e635',24,5);notify('★ TIME ORB // SLOW-MO 5s');break;
}p.dead=true;score+=150;sfx('pick')}

/* ---------- COMBAT ---------- */
function shoot(now){const w=weapons[player.weapon];const mult=player.boostT>0?1.5:1;const oMult=player.over?1.8:1;if(now-player.lastShot<w.rate/(oMult)/(player.boostT>0?1.3:1))return;player.lastShot=now;const base=Math.atan2(mouse.y-player.y,mouse.x-player.x);player.angle=base;for(let i=0;i<w.count;i++){const off=(i-(w.count-1)/2)*w.spread+(Math.random()-.5)*w.spread*.35;bullets.push({x:player.x+Math.cos(base)*24,y:player.y+Math.sin(base)*24,vx:Math.cos(base+off)*w.speed,vy:Math.sin(base+off)*w.speed,r:4,life:1.35,damage:w.damage*mult*(player.over?1.5:1),color:w.color,enemy:false})}burst(player.x+Math.cos(base)*25,player.y+Math.sin(base)*25,w.color,5,2.5);shake=Math.max(shake,2);sfx('shoot')}
function enemyShoot(e,now){const baseRate=e.boss?480:e.type==='SNIPER'?1050:1350,rate=baseRate*Math.max(.5,1-(level-1)*.05);if(now-e.lastAttack<rate)return;e.lastAttack=now;const a=Math.atan2(player.y-e.y,player.x-e.x),n=e.boss?e.burst:(level===10&&e.type==='SNIPER'?4:1);for(let i=0;i<n;i++){const off=(i-(n-1)/2)*(e.boss?.12:.11);const speed=e.boss?400:305+(level-1)*10;bullets.push({x:e.x,y:e.y,vx:Math.cos(a+off)*speed,vy:Math.sin(a+off)*speed,r:e.boss?6:4,life:3.5,damage:e.damage,color:e.color,enemy:true})}}

function damagePlayer(d,bullet=false){if(player.inv>0)return;if(player.shield>0){burst(player.x,player.y,'#7c3aed',8,3);return}if(bullet&&player.bulletShield>0){burst(player.x,player.y,'#facc15',9,3);ring(player.x,player.y,'#facc15');return}player.hp-=d;shake=8;flash=.15;burst(player.x,player.y,'#fb7185',12,4);sfx('hurt');if(player.hp<=0)die()}
function die(){lives--;burst(player.x,player.y,'#fb7185',40,9);ring(player.x,player.y,'#fb7185');sfx('revive');if(lives<=0){player.hp=0;finish(false);return}player.hp=100;player.energy=100;player.inv=3;for(const b of bullets.slice()){if(b.enemy&&Math.hypot(b.x-player.x,b.y-player.y)<130)bullets.splice(bullets.indexOf(b),1)}enemies.forEach(e=>{e.x=e.x>player.x?e.x+60:e.x-60;e.y=e.y>player.y?e.y+50:e.y-50});notify(`⚡ REVIVED // ${lives===1?'1 LIFE LEFT':lives+' LIVES LEFT'}`)}
function killEnemy(e,index){enemies.splice(index,1);kills++;score+=e.boss?3500:100+level*25;shake=e.boss?14:4;ring(e.x,e.y,e.color);burst(e.x,e.y,e.color,e.boss?60:16,e.boss?9:4);sfx(e.boss?'expl':'hit');if(!e.boss&&Math.random()<.22)spawnPickup(null,e.x,e.y);if(e.boss){notify(e.type+' DEFEATED');if(level>=10&&score>0)sfx('win')}}

/* ---------- UPDATE ---------- */
function update(dt,now){if(state!=='play')return;
const ts=fxType==='slow'?0.55:(fxType==='fast'?1.4:1);
let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0),len=Math.hypot(dx,dy)||1,sp=player.speed*(keys.shift?1.28:1)*(player.over?1.15:1)*(player.boostT>0?1.25:1);
player.x+=dx/len*sp*dt;player.y+=dy/len*sp*dt;player.x=Math.max(25,Math.min(W-25,player.x));player.y=Math.max(95,Math.min(H-25,player.y));player.angle=Math.atan2(mouse.y-player.y,mouse.x-player.x);if(mouse.down)shoot(now);
player.energy=Math.min(100,player.energy+8*dt);player.dashCd-=dt;player.shieldCd-=dt;player.overCd-=dt;player.shield-=dt;player.over-=dt;player.bulletShield-=dt;player.inv-=dt;player.boostT-=dt;
if(fxTimer>0){fxTimer-=dt*ts;if(fxTimer<=0){fxType=null}}

if(spawnRemaining>0){spawnCooldown-=dt*(fxType==='fast'?1.3:1);if(spawnCooldown<=0){spawnEnemy();spawnRemaining--;spawnCooldown=Math.max(.12,spawnCooldown*.95)}}
const cfg=cfgOf(level),bossName=cfg.boss;
if(bossName&&wave===cfg.waves&&spawnRemaining===0&&!bossSpawned&&enemies.length===0){bossSpawned=true;spawnEnemy(bossName)}

for(const b of bullets){const f=b.enemy?ts:1;b.x+=b.vx*dt*f;b.y+=b.vy*dt*f;b.life-=dt}
for(let ei=enemies.length-1;ei>=0;ei--){const e=enemies[ei],a=Math.atan2(player.y-e.y,player.x-e.x),dist=Math.hypot(player.x-e.x,player.y-e.y);e.phase+=dt*3;e.vx=e.vx||0;e.vy=e.vy||0;e.lunge=e.lunge||0;e.lunge-=dt;if(e.type==='WRAITH'&&e.phase%2<0.02&&dist>230){e.vx=Math.cos(a)*e.speed*6;e.vy=Math.sin(a)*e.speed*6}if(e.type==='CARGADOR'&&dist<330&&e.lunge<=0){e.lunge=2;e.vx=Math.cos(a)*e.speed*8;e.vy=Math.sin(a)*e.speed*8;burst(e.x,e.y,'#38bdf8',8,5)}if(e.type==='SNIPER'&&dist<360){e.x-=Math.cos(a)*e.speed*dt*ts;e.y-=Math.sin(a)*e.speed*dt*ts}else if(e.boss){if(dist>330){e.x+=Math.cos(a)*e.speed*dt*ts;e.y+=Math.sin(a)*e.speed*dt*ts}}else if(dist>e.r+player.r-14){e.x+=Math.cos(a)*e.speed*dt*ts+e.vx*dt;e.y+=Math.sin(a)*e.speed*dt*ts+e.vy*dt}e.vx*=.9;e.vy*=.9;if(e.shoot||e.boss)enemyShoot(e,now);if(dist<e.r+player.r&&player.inv<=0){damagePlayer(e.damage,false);player.inv=.65;e.x-=Math.cos(a)*30;e.y-=Math.sin(a)*30}for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];if(b.enemy)continue;if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=b.damage;bullets.splice(bi,1);burst(b.x,b.y,b.color,5,2);sfx('hit');if(e.hp<=0){killEnemy(e,ei);break}}}}
for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];if(b.enemy&&Math.hypot(b.x-player.x,b.y-player.y)<b.r+player.r){bullets.splice(bi,1);if(player.inv<=0){damagePlayer(b.damage,true);player.inv=.24}}else if(b.life<=0||b.x<-80||b.x>W+80||b.y<-80||b.y>H+80)bullets.splice(bi,1)}

pickupTimer-=dt;if(pickupTimer<=0){spawnPickup();pickupTimer=8+Math.random()*6}for(const p of pickups){p.t+=dt;p.life-=dt;if(Math.hypot(p.x-player.x,p.y-player.y)<p.r+player.r+5)collect(p)}pickups=pickups.filter(p=>!p.dead&&p.life>0);

updateHazards(dt);
particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt});particles=particles.filter(p=>p.life>0);rings.forEach(r=>{r.r+=120*dt;r.life-=dt});rings=rings.filter(r=>r.life>0);
const cleared=spawnRemaining===0&&enemies.length===0&&(!bossName||bossSpawned);if(cleared&&clearTimer<0)clearTimer=1.25;if(clearTimer>=0){clearTimer-=dt;if(clearTimer<=0)advance()}updateHUD()}

function updateHazards(dt){for(let i=hazards.length-1;i>=0;i--){const h=hazards[i],dist=Math.hypot(h.x-player.x,h.y-player.y);
if(h.type==='spike'){h.t+=dt;if(h.cd>0)h.cd-=dt;if(dist<h.r+player.r+2&&h.cd<=0&&player.inv<=0){damagePlayer(10,false);h.cd=1;burst(h.x,h.y,'#f43f5e',10,3)}}
else if(h.type==='mine'){h.t+=dt;if(!h.armed){if(h.t>h.armT)h.armed=true;continue}if(dist<h.r+player.r+10&&player.inv<=0){damagePlayer(18,false);burst(h.x,h.y,'#f43f5e',26,7);ring(h.x,h.y,'#f43f5e');sfx('expl');hazards.splice(i,1)}}
else if(h.type==='laser'){h.t+=dt;h.ang+=h.spd*dt;const cos=Math.cos(h.ang),sin=Math.sin(h.ang),px=player.x-h.x,py=player.y-h.y;const along=px*cos+py*sin;const dist0=Math.abs(-px*sin+py*cos);if(along>0&&along<h.len&&dist0<player.r+7&&player.inv<=0){damagePlayer(12,false);player.inv=.6;burst(player.x,player.y,'#facc15',8,3)}}}}

/* ---------- HUD ---------- */
function finish(win){state='end';hud.classList.add('hidden');brief.classList.add('hidden');endScreen.classList.remove('hidden');stopMusic();const cfg=cfgOf(level);if(win){$('endEyebrow').textContent='THE RIFT IS SEALED';$('endTitle').innerHTML='WORLDS<br>RESPIRING';$('endText').textContent='Nova selló la Grieta. Diez dimensiones respiran de nuevo — hasta el próximo resquicio.'}else{$('endEyebrow').textContent='SIGNAL LOST';$('endTitle').innerHTML='NOVA<br>MISSING';$('endText').textContent='La Grieta engulló una vida más. Vuelve a descender, corredora.'}$('finalScore').textContent=score.toLocaleString();$('finalLevel').textContent=Math.min(level,10)+'/10';$('finalKills').textContent=kills}
function stopMusic(){if(musicInt){clearInterval(musicInt);musicInt=null}}

function updateHUD(){const cfg=cfgOf(level),world=worldOf(level);
$('healthBar').style.width=Math.max(0,player.hp)+'%';$('healthText').textContent=Math.max(0,Math.ceil(player.hp));
$('energyBar').style.width=player.energy+'%';$('energyText').textContent=Math.ceil(player.energy);
$('score').textContent=String(score).padStart(6,'0');$('killsHud').textContent=kills;
$('levelBadge').textContent='LV.'+String(level).padStart(2,'0');
$('livesHud').innerHTML='♥'.repeat(Math.max(0,lives))+'<span class="empty">'+'♥'.repeat(Math.max(0,MAX_LIVES-lives))+'</span>';
$('waveText').textContent=`WORLD ${world+1} // LEVEL ${String(level).padStart(2,'0')}/10 · WAVE ${wave}/${cfg.waves}`;
$('objective').textContent=cfg.boss&&wave===cfg.waves?'DEFEAT '+bosses[cfg.boss].name:'CLEAR THE WAVES';
$('dimensionLabel').textContent=worlds[world].name+' // LV.'+String(level).padStart(2,'0');
const w=weapons[player.weapon];$('weaponName').textContent=w.name;$('weaponRarity').textContent=w.rarity;$('weaponSlot').textContent='0'+(player.weapon+1);
$('dashStatus').textContent=player.dashCd>0?player.dashCd.toFixed(1)+'s':'READY';$('shieldStatus').textContent=player.shield>0?'ACTIVE':player.shieldCd>0?player.shieldCd.toFixed(1)+'s':'READY';$('overchargeStatus').textContent=player.over>0?'ACTIVE':player.overCd>0?player.overCd.toFixed(1)+'s':'READY';
const o=$('orbStatus');o.classList.toggle('active',player.bulletShield>0);o.textContent=player.bulletShield>0?'● BULLET SHIELD '+Math.max(0,player.bulletShield).toFixed(1)+'s':'NO BULLET SHIELD';
const fx=[];if(fxType==='slow')fx.push('TIME SLOW');if(fxType==='fast')fx.push('RIFT SURGE');if(player.boostT>0)fx.push('RAGE');$('fxStatus').textContent=fx.length?('◈ '+fx.join(' · ')):'–'}

/* ---------- DRAW ---------- */
function drawBackground(t){const cfg=cfgOf(level);ctx.fillStyle=cfg.bg;ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W*.72,H*.48,20,W*.72,H*.48,W*.62);g.addColorStop(0,cfg.glow);g.addColorStop(.46,'rgba(34,211,238,.035)');g.addColorStop(1,'rgba(5,5,16,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(let i=0;i<stars.length;i++){const s=stars[i];s.x-=(.1+s.z*.26)*(fxType==='slow'?.4:fxType==='fast'?1.6:1);if(s.x<0)s.x=W;ctx.globalAlpha=.18+s.z*.62;ctx.fillStyle=i%6===0?cfg.accent:'#dff8ff';ctx.fillRect(s.x,s.y,s.s,s.s)}ctx.globalAlpha=1;const horizon=H*.72;ctx.strokeStyle=cfg.accent+'18';for(let y=horizon;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}for(let x=-W;x<W*2;x+=70){ctx.beginPath();ctx.moveTo(W/2+(x-W/2)*.12,horizon);ctx.lineTo(x,H);ctx.stroke()}
const style=cfg.style;
if(style===0){for(let i=0;i<8;i++){const x=(i*173+80)%W,h=70+(i%4)*38;ctx.fillStyle='rgba(8,13,30,.85)';ctx.fillRect(x,horizon-h,78,h)}}
else if(style===1){for(let i=0;i<10;i++){const x=(i*137+60)%W,y=140+(i%4)*95;ctx.fillStyle=cfg.accent+'22';ctx.strokeStyle=cfg.accent+'66';ctx.beginPath();ctx.moveTo(x,y-34);ctx.lineTo(x+18,y);ctx.lineTo(x,y+38);ctx.lineTo(x-18,y);ctx.closePath();ctx.fill();ctx.stroke()}}
else if(style===2){for(let i=0;i<9;i++){const x=(i*181+40)%W;ctx.strokeStyle='rgba(52,211,153,.18)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,H);ctx.quadraticCurveTo(x+60,H*.55,x+20,90);ctx.stroke()}}
else if(style===3){for(let i=0;i<6;i++){const x=(i*220+90)%W,y=180+(i%2)*160;ctx.fillStyle='rgba(96,165,250,.1)';ctx.beginPath();ctx.ellipse(x,y,80,20,0,0,Math.PI*2);ctx.fill()}}
else if(style===4){ctx.save();ctx.translate(W*.75,H*.38);ctx.rotate(t*.00012);ctx.strokeStyle=cfg.accent+'66';for(let r=70;r<155;r+=19){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*1.6);ctx.stroke()}ctx.restore()}
else if(style===5){for(let i=0;i<10;i++){const x=(i*127+30)%W,y=horizon+((i*53)%70),w2=90+(i%5)*30;ctx.fillStyle='rgba(120,60,40,'+(0.05+(i%3)*.03)+')';ctx.beginPath();ctx.moveTo(x,horizon);ctx.quadraticCurveTo(x+w2/2,y,x+w2,horizon);ctx.closePath();ctx.fill()}}
else if(style===6){for(let i=0;i<7;i++){const x=(i*213+50)%W;ctx.fillStyle='rgba(139,92,246,.14)';ctx.fillRect(x,horizon-130-(i%3)*60,34,160)}}
else if(style===7){ctx.strokeStyle=cfg.accent+'2a';ctx.lineWidth=1;for(let i=0;i<9;i++){const kx=i*W/9;ctx.beginPath();ctx.moveTo(kx,90);ctx.lineTo(kx,H);ctx.stroke()}for(let i=0;i<10;i++){const ky=90+i*(H-90)/10;ctx.beginPath();ctx.moveTo(0,ky);ctx.lineTo(W,ky);ctx.stroke()}}
else if(style===8){ctx.fillStyle=cfg.accent+'26';for(let i=0;i<40;i++){const sx=(i*97+Math.sin(t*.0003+i)*40)%W,sy=(i*61+Math.cos(t*.0002+i)*30)%H;ctx.fillRect(sx,sy,2,2)}}
else{ctx.save();ctx.translate(W*.72,H*.42);ctx.rotate(t*.0003);ctx.strokeStyle=cfg.accent+'55';for(let r=60;r<220;r+=26){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke()}ctx.fillStyle='rgba(244,63,94,.16)';ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fill();ctx.restore()}}
function drawPlayer(){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);if(player.inv>0&&Math.floor(player.inv*16)%2===0)ctx.globalAlpha=.4;ctx.lineJoin='round';
const flick=8+Math.sin(performance.now()*.03)*4;ctx.shadowBlur=22;ctx.shadowColor='#22d3ee';
ctx.fillStyle=player.boostT>0?'#f9a8d4':'#22d3ee';ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-18-flick,-6);ctx.lineTo(-18,6);ctx.closePath();ctx.fill();
ctx.fillStyle='#eaf4ff';ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(-4,-10);ctx.lineTo(-16,-5);ctx.lineTo(-16,5);ctx.lineTo(-4,10);ctx.closePath();ctx.fill();
ctx.fillStyle='#a855f7';ctx.beginPath();ctx.moveTo(6,-6);ctx.lineTo(-22,-20);ctx.lineTo(-27,-13);ctx.lineTo(-4,-7);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(6,6);ctx.lineTo(-22,20);ctx.lineTo(-27,13);ctx.lineTo(-4,7);ctx.closePath();ctx.fill();
ctx.shadowBlur=12;ctx.shadowColor='#22d3ee';ctx.fillStyle='#22d3ee';ctx.fillRect(-29,-15,4,6);ctx.fillRect(-29,9,4,6);
ctx.shadowColor='#7c3aed';ctx.fillStyle='#131a3a';ctx.beginPath();ctx.ellipse(12,0,7,4.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a855f7';ctx.beginPath();ctx.ellipse(12,0,3.4,2,0,0,Math.PI*2);ctx.fill();
ctx.restore();if(player.shield>0||player.bulletShield>0){ctx.save();ctx.strokeStyle=player.bulletShield>0?'#facc15':'#7c3aed';ctx.lineWidth=2;ctx.globalAlpha=.65+.2*Math.sin(performance.now()*.01);ctx.shadowBlur=18;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.arc(player.x,player.y,32,0,Math.PI*2);ctx.stroke();ctx.restore()}if(player.boostT>0){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(performance.now()*.02);ctx.strokeStyle='#f9a8d4';ctx.lineWidth=1.5;ctx.globalAlpha=.7;for(let i=0;i<2;i++){ctx.rotate(Math.PI);ctx.beginPath();ctx.arc(0,0,36,0,Math.PI*.9);ctx.stroke()}ctx.restore()}}
function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);ctx.shadowBlur=e.boss?30:15;ctx.shadowColor=e.color;ctx.strokeStyle=e.color;ctx.fillStyle=e.color+'44';ctx.lineWidth=e.boss?3:2;if(e.boss){ctx.rotate(e.phase*.08);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(60,-8);ctx.lineTo(52,10);ctx.closePath();ctx.fill();ctx.stroke()}ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8,-4,8,0,Math.PI*2);ctx.fill()}else if(e.type==='GUARDIAN'){ctx.rotate(e.phase*.08);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?e.r*.72:e.r;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.stroke()}else if(e.type==='SNIPER'){ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(5,0,6,0,Math.PI*2);ctx.fill()}else if(e.type==='WRAITH'){ctx.rotate(e.phase*2);ctx.fillStyle=e.color+'55';for(let i=0;i<4;i++){ctx.fillRect(-2,-e.r-8,4,17);ctx.rotate(Math.PI/2)}ctx.strokeStyle=e.color;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill()}else if(e.type==='CARGADOR'){const pulse=1+Math.sin(e.phase*4)*.14;ctx.strokeStyle=e.color;ctx.fillStyle=e.color+'33';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,e.r*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(-e.phase*3);for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.fillStyle=i===2?'#fb7185':'#7dd3fc';ctx.beginPath();ctx.arc(0,e.r+6,3,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#0c1526';ctx.beginPath();ctx.arc(0,0,e.r*.55,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7dd3fc';ctx.beginPath();ctx.arc(0,0,e.r*.3,0,Math.PI*2);ctx.fill()}else{ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r)}ctx.closePath();ctx.fill();ctx.stroke()}ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-e.r,-e.r-10,e.r*2,3);ctx.fillStyle=e.color;ctx.fillRect(-e.r,-e.r-10,e.r*2*Math.max(0,e.hp/e.maxHp),3);ctx.restore()}
function drawPickup(p){const colors={shield:'#facc15',health:'#38bdf8',energy:'#4ade80',boost:'#f9a8d4',time:'#a3e635'};const color=colors[p.type];ctx.save();ctx.translate(p.x,p.y);ctx.shadowBlur=25;ctx.shadowColor=color;const pulse=1+Math.sin(p.t*5)*.1;ctx.scale(pulse,pulse);ctx.fillStyle=color+'45';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.rotate(p.t);ctx.strokeStyle='#fff';ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*1.25);ctx.stroke();ctx.restore()}
function drawTraps(){for(const h of hazards){ctx.save();if(h.type==='spike'){ctx.translate(h.x,h.y);ctx.rotate(performance.now()*.004);ctx.strokeStyle='#f43f5e';ctx.fillStyle='#f43f5e33';ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor='#f43f5e';for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,-h.r-6);ctx.lineTo(5,-3);ctx.lineTo(-5,-3);ctx.closePath();ctx.fill();ctx.stroke()}ctx.beginPath();ctx.arc(0,0,h.r*.55,0,Math.PI*2);ctx.fill();ctx.stroke()}else if(h.type==='mine'){ctx.translate(h.x,h.y);const blink=h.armed?Math.sin(performance.now()*.02)>0:Math.sin(performance.now()*.08)>0;ctx.strokeStyle=h.armed?'#fb7185':'#64748b';ctx.fillStyle=`rgba(244,63,94,${h.armed?0.25+Math.sin(performance.now()*.02)*.15:0.08})`;ctx.shadowBlur=h.armed?18:4;ctx.shadowColor=h.armed?'#fb7185':'#64748b';ctx.beginPath();ctx.arc(0,0,h.r+4,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=blink?(h.armed?'#ffe4e6':'#94a3b8'):'#fb7185';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill()}else if(h.type==='laser'){ctx.translate(h.x,h.y);ctx.rotate(h.ang);ctx.strokeStyle=h.on?'#facc15':'#475569';ctx.shadowBlur=h.on?16:0;ctx.shadowColor='#facc15';ctx.lineWidth=h.on?4:2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(h.len,0);ctx.stroke();ctx.fillStyle=h.on?'#facc15':'#94a3b8';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill()}ctx.restore()}}
function drawBullets(){for(const b of bullets){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.restore()}}
function drawEffects(){for(const p of particles){ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowBlur=8;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore()}for(const r of rings){ctx.save();ctx.globalAlpha=Math.max(0,r.life/.6);ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.restore()}}
function draw(t){ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake=Math.max(0,shake-.45)}drawBackground(t);if(state==='play'||state==='brief'||state==='end'){hazards.forEach(drawTraps);pickups.forEach(drawPickup);enemies.forEach(drawEnemy);drawBullets();drawPlayer();drawEffects()}ctx.restore();if(flash>0){ctx.fillStyle=`rgba(251,113,133,${flash})`;ctx.fillRect(0,0,W,H);flash=Math.max(0,flash-.015)}if(fxType==='slow'){ctx.fillStyle='rgba(56,189,248,.06)';ctx.fillRect(0,0,W,H)}if(fxType==='fast'){ctx.fillStyle='rgba(244,63,94,.05)';ctx.fillRect(0,0,W,H)}}

/* ---------- PANELS ---------- */
const panelData={characters:{title:'CHARACTER',html:'<div class="grid-cards"><div class="mini-card"><small>RIFT RUNNER</small><b>NOVA</b><p>Última corredora dimensional. Porta dash, escudo y sobrecarga. Si cae, revive hasta 3 veces por misión.</p></div></div>'},loadout:{title:'LOADOUT',html:weapons.map((w,i)=>`<div class="mini-card"><small>${w.rarity}</small><b>0${i+1} · ${w.name}</b><p>Damage ${w.damage} · Spread ${Math.round(w.spread*100)}%</p></div>`).join('')},
missions:{title:'WORLDS & LEVELS',html:worlds.map((wd,wi)=>`<div class="world-group"><small>WORLD ${wi+1}</small><b>${wd.name}</b></div><div class="grid-cards">${wd.levels.map((l,i)=>`<div class="mini-card"><small>LEVEL ${wo2(wi,i)}${l.boss?' · ★ BOSS':''}</small><b>${l.name}</b><p>${l.waves} waves</p></div>`).join('')}</div>`).join('')},
help:{title:'SURVIVAL GUIDE',html:'<div class="grid-cards"><div class="mini-card"><small>ORBS</small><b>6 RESOURCES</b><p>Protection, Health, Energy, Boost, Speed y Time reinan el encuentro.</p></div><div class="mini-card"><small>HAZARDS</small><b>TRAMPA</b><p class="hazard-tag">SPIKES/MINES/LASERS dañan al contacto. Los mines parpadean antes de armarse.</p></div><div class="mini-card"><small>TIME</small><b>FRACTURAS</b><p>Eventos aleatorios: lentitud (Time) o sobrecarga enemiga (Rift Surge).</p></div><div class="mini-card"><small>ENEMIES</small><b>AZULES CARGADORES</b><p class="hazard-tag">El CARGADOR (azul cielo) embiste y resta mucha vida cuando te acercas. Mantén la distancia.</p></div><div class="mini-card"><small>CONTROLS</small><b>WASD + MOUSE</b><p>Click fire · 1/2/3 weapons · Space dash · Q shield · E overcharge · M music.</p></div></div>'},
story:{title:'LA HISTORIA',html:`<div class="grid-cards"><div class="mini-card" style="grid-column:1/-1"><p>Hace un siglo el experimento conocido como <b>El Gran Resquicio</b> partió la realidad en diez fragmentos. Dos mundos quedaron cosidos por una Grieta viva: el <b>ANILLO NEÓN</b>, vestigio luminoso de la humanidad, y la <b>EXPANSIÓN HUECA</b>, el vacío que sueña con devorar lo que queda.</p><p>Cada nivel es una dimensión que tiembla. Cada oleada acerca a <b>NOVA</b>, la última corredora del Rift, al corazón de la fractura. Cruzar las diez dimensiones es descender hacia el silencio — y enfrentar al tirano que abrió la Grieta para siempre.</p></div></div>`}};
function wo2(w,li){return String(w*5+li+1).padStart(2,'0')}
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{const d=panelData[b.dataset.panel];$('panelTitle').textContent=d.title;$('panelContent').innerHTML=d.html;panel.classList.remove('hidden')});$('closePanel').onclick=()=>panel.classList.add('hidden');$('musicBtn').onclick=toggleMusic;
function loop(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt,now);draw(now);requestAnimationFrame(loop)}requestAnimationFrame(loop);