const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W=innerWidth,H=innerHeight,DPR=devicePixelRatio||1;
function resize(){W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();

const $=id=>document.getElementById(id),keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.key.toLowerCase()==='p'&&state==='play')togglePause()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;keys[e.code]=false});

const pilots=[
{name:'NOVA',role:'BALANCED',color:'#22d3ee',speed:275,hp:100,fire:0.19,damage:18,desc:'Balanced rift runner'},
{name:'BYTE',role:'TECH',color:'#a855f7',speed:245,hp:120,fire:0.23,damage:22,desc:'Heavy shield specialist'},
{name:'FLUX',role:'SPEED',color:'#f472b6',speed:330,hp:82,fire:0.14,damage:14,desc:'Extreme mobility pilot'},
{name:'ECHO',role:'POWER',color:'#fbbf24',speed:225,hp:105,fire:0.31,damage:34,desc:'High-impact energy shots'}
];
const dimensions=[
{name:'NEON CITY',accent:'#22d3ee',bg1:'#040713',bg2:'#101044',hazard:'CYBER SWARM'},
{name:'CRYSTAL VOID',accent:'#a855f7',bg1:'#090316',bg2:'#31105a',hazard:'PRISM BROOD'},
{name:'CYBER JUNGLE',accent:'#34d399',bg1:'#02110e',bg2:'#123b2f',hazard:'BIO MACHINES'},
{name:'SOLAR GRAVE',accent:'#fb7185',bg1:'#170505',bg2:'#4b1620',hazard:'FIRE HIVE'},
{name:'THE RIFT',accent:'#60a5fa',bg1:'#030318',bg2:'#1b1760',hazard:'VOID ENTITY'}
];
const difficulty={cadet:{hp:.8,dmg:.7,spawn:.78,label:'CADET'},normal:{hp:1,dmg:1,spawn:1,label:'NORMAL'},rift:{hp:1.35,dmg:1.35,spawn:1.25,label:'RIFT'}};
const config={players:1,p1:0,p2:1,dimension:0,startLevel:1,difficulty:'normal',music:65,sfx:75};
let state='menu',paused=false,last=performance.now(),distance=0,score=0,kills=0,level=1,dimIndex=0,scrollSpeed=175,spawnTimer=0,portalAt=850,portal=null,boss=null,shake=0;
let ships=[],aliens=[],shots=[],enemyShots=[],particles=[],stars=[],nebulae=[];
for(let i=0;i<130;i++)stars.push({x:Math.random()*W,y:Math.random()*H,z:.2+Math.random()*.8,s:.5+Math.random()*1.8});
for(let i=0;i<9;i++)nebulae.push({x:Math.random()*W,y:Math.random()*H,r:90+Math.random()*170,a:.02+Math.random()*.05});

// ---------- MENU ----------
function buildMenu(){
  const renderChars=(id,player)=>{$(id).innerHTML=pilots.map((p,i)=>`<button class="character-card ${config[player]===i?'active':''}" style="--char:${p.color}" data-player="${player}" data-index="${i}"><div class="portrait"></div><b>${p.name}</b><small>${p.role}</small><p>${p.desc}</p></button>`).join('')};
  renderChars('p1Characters','p1');renderChars('p2Characters','p2');
  $('dimensionGrid').innerHTML=dimensions.map((d,i)=>`<button class="dimension-card ${config.dimension===i?'active':''}" data-dim="${i}" style="--accent:${d.accent};--d1:${d.bg1};--d2:${d.bg2}"><b>${d.name}</b><small>${d.hazard}</small></button>`).join('');
  document.querySelectorAll('.character-card').forEach(b=>b.onclick=()=>{config[b.dataset.player]=+b.dataset.index;buildMenu();updateLaunchSummary()});
  document.querySelectorAll('.dimension-card').forEach(b=>b.onclick=()=>{config.dimension=+b.dataset.dim;buildMenu();updateLaunchSummary()});
}
function updateLaunchSummary(){$('launchSummary').textContent=`${pilots[config.p1].name} · ${dimensions[config.dimension].name} · ${difficulty[config.difficulty].label}`}
buildMenu();updateLaunchSummary();
document.querySelectorAll('.mode-btn').forEach(b=>b.onclick=()=>{config.players=+b.dataset.mode;document.querySelectorAll('.mode-btn').forEach(x=>x.classList.toggle('active',x===b));$('p2Wrap').classList.toggle('hidden',config.players===1)});
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('tab-'+b.dataset.tab).classList.add('active')});
document.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{config.difficulty=b.dataset.difficulty;document.querySelectorAll('[data-difficulty]').forEach(x=>x.classList.toggle('active',x===b));updateLaunchSummary()});
$('levelRange').oninput=e=>{config.startLevel=+e.target.value;$('levelValue').textContent=config.startLevel};
$('musicVolume').oninput=e=>{config.music=+e.target.value;$('musicValue').textContent=config.music+'%';audio.setMusic(config.music/100)};
$('sfxVolume').oninput=e=>{config.sfx=+e.target.value;$('sfxValue').textContent=config.sfx+'%'};

// ---------- PROCEDURAL GALACTIC AUDIO ----------
const audio={ctx:null,master:null,musicGain:null,enabled:true,timer:null,step:0,drones:[],
 init(){if(this.ctx)return;this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.musicGain=this.ctx.createGain();this.master.gain.value=.7;this.musicGain.gain.value=config.music/100*.45;this.musicGain.connect(this.master);this.master.connect(this.ctx.destination);this.startDrones();this.timer=setInterval(()=>this.tick(),330)},
 resume(){this.init();if(this.ctx.state==='suspended')this.ctx.resume()},
 setMusic(v){if(this.musicGain)this.musicGain.gain.setTargetAtTime(this.enabled?v*.45:0,this.ctx.currentTime,.08)},
 toggle(){this.enabled=!this.enabled;this.resume();this.setMusic(config.music/100);$('musicToggle').textContent=this.enabled?'♫ MUSIC ON':'♫ MUSIC OFF'},
 startDrones(){const now=this.ctx.currentTime;[55,82.41,110].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();o.type=i===1?'triangle':'sine';o.frequency.value=f;filter.type='lowpass';filter.frequency.value=420;g.gain.value=[.04,.025,.018][i];o.connect(filter);filter.connect(g);g.connect(this.musicGain);o.start(now);this.drones.push(o)})},
 tick(){if(!this.ctx||!this.enabled)return;const scale=[220,246.94,293.66,329.63,369.99,440,493.88,587.33],f=scale[this.step%scale.length]*(state==='play'?(1+Math.min(level,8)*.01):.5);this.note(f,.18,.055,'sine');if(this.step%4===0)this.note(f/2,.65,.035,'triangle');if(this.step%8===6)this.note(f*1.5,.12,.025,'sine');this.step++},
 note(freq,dur,vol,type='sine'){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain(),pan=this.ctx.createStereoPanner?this.ctx.createStereoPanner():null;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.997,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);if(pan){pan.pan.value=(Math.random()-.5)*.7;g.connect(pan);pan.connect(this.musicGain)}else g.connect(this.musicGain);o.start(t);o.stop(t+dur+.03)},
 sfx(freq=440,dur=.08,type='square',vol=.055){if(!this.ctx||config.sfx<=0)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.55),t+dur);g.gain.setValueAtTime(vol*(config.sfx/100),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur)}};
$('musicToggle').onclick=()=>audio.toggle();

// ---------- GAME ----------
function makeShip(slot,pilotIndex){const p=pilots[pilotIndex];return{slot,pilot:p.name,color:p.color,x:slot===1?150:210,y:H*(slot===1?.46:.62),r:18,hp:p.hp,maxHp:p.hp,speed:p.speed,fireRate:p.fire,damage:p.damage,lastShot:0,pulse:100,alive:true,inv:0}}
function resetGame(){
 level=config.startLevel;dimIndex=config.dimension;distance=(level-1)*850;portalAt=distance+850;score=0;kills=0;scrollSpeed=175+(level-1)*7;aliens=[];shots=[];enemyShots=[];particles=[];portal=null;boss=null;spawnTimer=.8;ships=[makeShip(1,config.p1)];if(config.players===2)ships.push(makeShip(2,config.p2));updateHUD();
}
function launch(){audio.resume();state='play';paused=false;$('menu').classList.add('hidden');$('gameOver').classList.add('hidden');$('pauseScreen').classList.add('hidden');$('hud').classList.remove('hidden');$('pauseBtn').classList.remove('hidden');resetGame();toast(`ENTERING ${dimensions[dimIndex].name}`)}
$('launchBtn').onclick=launch;$('retryBtn').onclick=launch;
function toHangar(){state='menu';paused=false;$('menu').classList.remove('hidden');$('hud').classList.add('hidden');$('pauseScreen').classList.add('hidden');$('gameOver').classList.add('hidden');$('pauseBtn').classList.add('hidden');audio.setMusic(config.music/100)}
$('hangarBtn').onclick=toHangar;$('hangarBtn2').onclick=toHangar;
function togglePause(){if(state!=='play')return;paused=!paused;$('pauseScreen').classList.toggle('hidden',!paused)}
$('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=togglePause;
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.remove('show'),1500)}

function spawnAlien(forceBoss=false){
 const d=difficulty[config.difficulty],bossNow=forceBoss;
 const types=[
 {name:'SKITTER',r:14,hp:34,speed:105,damage:11,color:'#7cf7ff',shoot:false},
 {name:'MANTA',r:22,hp:65,speed:78,damage:15,color:'#b56dff',shoot:true},
 {name:'EYE',r:17,hp:48,speed:68,damage:18,color:'#ff75bd',shoot:true},
 {name:'BRUTE',r:29,hp:130,speed:52,damage:24,color:'#ff946b',shoot:false}
 ];
 let base=bossNow?{name:'RIFT BEHEMOTH',r:52,hp:620,speed:34,damage:30,color:'#ff477e',shoot:true,boss:true}:types[Math.min(types.length-1,Math.floor(Math.random()*(2+Math.min(2,Math.floor(level/3)))))];
 const scale=1+(level-1)*.12,e={...base,x:W+80,y:110+Math.random()*(H-200),hp:base.hp*scale*d.hp,maxHp:base.hp*scale*d.hp,speed:base.speed+level*1.7,damage:base.damage*d.dmg,lastShot:0,phase:Math.random()*6.2,dead:false};aliens.push(e);if(e.boss){boss=e;toast('⚠ RIFT BEHEMOTH DETECTED');audio.sfx(95,.45,'sawtooth',.09)}}
function shootShip(s,now){if(!s.alive||now-s.lastShot<s.fireRate*1000)return;s.lastShot=now;shots.push({x:s.x+25,y:s.y,vx:720+s.damage*2,vy:0,r:4,damage:s.damage,color:s.color,owner:s.slot});audio.sfx(520+s.slot*120,.055,'square',.035)}
function pulseShip(s){if(!s.alive||s.pulse<100)return;s.pulse=0;shake=8;for(let i=0;i<42;i++)particle(s.x,s.y,s.color,7);aliens.forEach(a=>{const d=Math.hypot(a.x-s.x,a.y-s.y);if(d<350)a.hp-=70*(1-d/500)});enemyShots=enemyShots.filter(b=>Math.hypot(b.x-s.x,b.y-s.y)>330);audio.sfx(120,.55,'sawtooth',.12);toast(`${s.pilot} // RIFT PULSE`)}
let pulseLocks={g:false,ShiftRight:false};
function controls(s,dt,now){let dx=0,dy=0,fire=false,pulseKey=false;if(s.slot===1){dx=(keys.d?1:0)-(keys.a?1:0);dy=(keys.s?1:0)-(keys.w?1:0);fire=keys.f;pulseKey=keys.g;if(pulseKey&&!pulseLocks.g){pulseShip(s);pulseLocks.g=true}if(!pulseKey)pulseLocks.g=false}else{dx=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0);dy=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0);fire=keys.Enter;pulseKey=keys.ShiftRight||keys.ShiftLeft;if(pulseKey&&!pulseLocks.ShiftRight){pulseShip(s);pulseLocks.ShiftRight=true}if(!pulseKey)pulseLocks.ShiftRight=false}const l=Math.hypot(dx,dy)||1;s.x+=dx/l*s.speed*dt;s.y+=dy/l*s.speed*dt;s.x=Math.max(70,Math.min(W*.48,s.x));s.y=Math.max(95,Math.min(H-65,s.y));if(fire)shootShip(s,now);s.inv=Math.max(0,s.inv-dt);s.pulse=Math.min(100,s.pulse+6*dt)}
function enemyFire(a,now){if(!a.shoot)return;const cooldown=a.boss?700:1300;if(now-a.lastShot<cooldown)return;a.lastShot=now;const live=ships.filter(s=>s.alive);if(!live.length)return;const t=live[Math.floor(Math.random()*live.length)],ang=Math.atan2(t.y-a.y,t.x-a.x),n=a.boss?5:1;for(let i=0;i<n;i++){const off=(i-(n-1)/2)*.13;enemyShots.push({x:a.x-a.r,y:a.y,vx:Math.cos(ang+off)*(a.boss?310:245),vy:Math.sin(ang+off)*(a.boss?310:245),r:a.boss?6:4,damage:a.damage,color:a.color})}}
function hurtShip(s,dmg){if(!s.alive||s.inv>0)return;s.hp-=dmg;s.inv=.55;shake=6;for(let i=0;i<12;i++)particle(s.x,s.y,'#fb7185',5);audio.sfx(105,.2,'sawtooth',.08);if(s.hp<=0)destroyShip(s)}
function destroyShip(s){s.hp=0;s.alive=false;for(let i=0;i<38;i++)particle(s.x,s.y,i%2?s.color:'#ffffff',8);audio.sfx(65,.6,'sawtooth',.12);toast(`${s.pilot} // SHIP DESTROYED`);if(!ships.some(x=>x.alive))endGame()}
function reviveAtPortal(){if(config.players<2)return;ships.filter(s=>!s.alive).forEach(s=>{s.alive=true;s.hp=s.maxHp*.55;s.x=170;s.y=H*(s.slot===1?.46:.62);for(let i=0;i<20;i++)particle(s.x,s.y,s.color,5);toast(`${s.pilot} RECONSTRUCTED`)})}
function particle(x,y,color,power=4){const a=Math.random()*Math.PI*2,v=(1+Math.random()*power)*55;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:1+Math.random()*3,life:.3+Math.random()*.55,max:.85,color})}
function alienSplatter(a){for(let i=0;i<(a.boss?55:18);i++){const ang=Math.PI+(Math.random()-.5)*2.5,v=60+Math.random()*240;particles.push({x:a.x,y:a.y,vx:Math.cos(ang)*v,vy:Math.sin(ang)*v,r:2+Math.random()*5,life:.45+Math.random()*.8,max:1.3,color:i%3?dimensions[dimIndex].accent:a.color})}}
function killAlien(a){a.dead=true;kills++;score+=a.boss?1800:100+level*12;ships.forEach(s=>s.pulse=Math.min(100,s.pulse+(a.boss?35:7)));alienSplatter(a);audio.sfx(a.boss?75:170,a.boss?.5:.14,'sawtooth',a.boss?.1:.05);if(a.boss)boss=null}
function spawnPortal(){portal={x:W+150,y:H*.5,r:95,spin:0};toast('MULTIDIMENSIONAL PORTAL INBOUND')}
function crossPortal(){portal=null;level++;dimIndex=(dimIndex+1)%dimensions.length;portalAt=distance+850+level*18;scrollSpeed=Math.min(330,175+(level-1)*8);reviveAtPortal();ships.forEach(s=>{if(s.alive)s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.18)});for(let i=0;i<50;i++)particle(W*.35,H*.5,dimensions[dimIndex].accent,8);audio.sfx(180,.8,'sine',.11);toast(`LEVEL ${level} // ${dimensions[dimIndex].name}`);if(level%5===0)setTimeout(()=>state==='play'&&!paused&&spawnAlien(true),850)}
function endGame(){state='over';$('hud').classList.add('hidden');$('gameOver').classList.remove('hidden');$('pauseBtn').classList.add('hidden');$('finalDistance').textContent=Math.floor(distance)+'m';$('finalScore').textContent=score.toLocaleString();$('finalLevel').textContent=level;$('finalLine').textContent=`Reached ${dimensions[dimIndex].name} · ${kills} alien${kills===1?'':'s'} eliminated.`}

function update(dt,now){if(state!=='play'||paused)return;distance+=scrollSpeed*dt*.055;spawnTimer-=dt;const d=difficulty[config.difficulty];if(spawnTimer<=0&&!boss){spawnAlien(false);spawnTimer=Math.max(.32,1.28/(d.spawn+level*.045))*(.75+Math.random()*.6)}if(!portal&&distance>=portalAt)spawnPortal();ships.forEach(s=>controls(s,dt,now));
 shots.forEach(b=>{b.x+=b.vx*dt});enemyShots.forEach(b=>{b.x+=(b.vx-scrollSpeed*.22)*dt;b.y+=b.vy*dt});
 aliens.forEach(a=>{a.phase+=dt*2.8;a.x-=(scrollSpeed*.55+a.speed)*dt;a.y+=Math.sin(a.phase)*15*dt;enemyFire(a,now);const live=ships.filter(s=>s.alive);if(live.length){const nearest=live.reduce((m,s)=>Math.abs(s.y-a.y)<Math.abs(m.y-a.y)?s:m,live[0]);if(!a.shoot&&a.x<W*.68){const ang=Math.atan2(nearest.y-a.y,nearest.x-a.x);a.x+=Math.cos(ang)*a.speed*.35*dt;a.y+=Math.sin(ang)*a.speed*.35*dt}}});
 for(const b of shots)for(const a of aliens){if(!a.dead&&Math.hypot(b.x-a.x,b.y-a.y)<b.r+a.r){a.hp-=b.damage;b.dead=true;for(let i=0;i<5;i++)particle(b.x,b.y,b.color,2);if(a.hp<=0)killAlien(a);break}}
 for(const b of enemyShots)for(const s of ships){if(s.alive&&Math.hypot(b.x-s.x,b.y-s.y)<b.r+s.r){b.dead=true;hurtShip(s,b.damage);break}}
 for(const a of aliens)for(const s of ships){if(!a.dead&&s.alive&&Math.hypot(a.x-s.x,a.y-s.y)<a.r+s.r){hurtShip(s,a.damage);a.hp-=28;a.x+=45;if(a.hp<=0)killAlien(a)}}
 shots=shots.filter(b=>!b.dead&&b.x<W+80);enemyShots=enemyShots.filter(b=>!b.dead&&b.x>-70&&b.x<W+70&&b.y>-70&&b.y<H+70);aliens=aliens.filter(a=>!a.dead&&a.x>-120);
 if(portal){portal.spin+=dt;portal.x-=scrollSpeed*dt;if(portal.x<W*.34)crossPortal()}
 particles.forEach(p=>{p.x+=p.vx*dt-scrollSpeed*.08*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.life-=dt});particles=particles.filter(p=>p.life>0);shake=Math.max(0,shake-22*dt);updateHUD()}

function updateHUD(){const d=dimensions[dimIndex];$('dimensionName').textContent=d.name;$('dimensionLevel').textContent='LEVEL '+String(level).padStart(2,'0');$('distance').textContent=String(Math.floor(distance)).padStart(4,'0')+'m';$('score').textContent=String(score).padStart(6,'0');$('kills').textContent=kills;const prev=portalAt-(850+level*18),prog=Math.max(0,Math.min(1,(distance-prev)/(portalAt-prev)));$('portalProgress').style.width=(prog*100)+'%';ships.forEach(s=>{const prefix='p'+s.slot;$(prefix+'Name').textContent=s.pilot;$(prefix+'hp').style.width=(Math.max(0,s.hp)/s.maxHp*100)+'%';$(prefix+'hpText').textContent=s.alive?Math.ceil(s.hp):'DOWN'});$('p2Hud').classList.toggle('hidden',config.players===1);$('bossBar').classList.toggle('hidden',!boss);if(boss)$('bossHp').style.width=(boss.hp/boss.maxHp*100)+'%'}

function drawBackground(t){const d=dimensions[dimIndex],g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,d.bg1);g.addColorStop(1,d.bg2);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);nebulae.forEach((n,i)=>{n.x-=scrollSpeed*(.01+i%3*.008);if(n.x<-n.r)n.x=W+n.r;const rg=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);rg.addColorStop(0,d.accent+'22');rg.addColorStop(1,'transparent');ctx.fillStyle=rg;ctx.fillRect(n.x-n.r,n.y-n.r,n.r*2,n.r*2)});stars.forEach((s,i)=>{s.x-=scrollSpeed*dtGlobal*(.08+s.z*.32);if(s.x<0){s.x=W;s.y=Math.random()*H}ctx.globalAlpha=.25+s.z*.65;ctx.fillStyle=i%9===0?d.accent:'#eaf7ff';ctx.fillRect(s.x,s.y,s.s,s.s)});ctx.globalAlpha=1;ctx.strokeStyle=d.accent+'16';ctx.lineWidth=1;const off=(distance*8)%72;for(let x=-off;x<W;x+=72){ctx.beginPath();ctx.moveTo(x,H*.78);ctx.lineTo(x+90,H);ctx.stroke()}ctx.beginPath();ctx.moveTo(0,H*.78);ctx.lineTo(W,H*.78);ctx.stroke()}
function drawShip(s){if(!s.alive)return;ctx.save();ctx.translate(s.x,s.y);if(s.inv>0&&Math.floor(performance.now()/60)%2)ctx.globalAlpha=.35;ctx.shadowBlur=22;ctx.shadowColor=s.color;ctx.fillStyle=s.color;ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(-15,-13);ctx.lineTo(-7,0);ctx.lineTo(-15,13);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#e8f8ff';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-9,-7);ctx.lineTo(-3,0);ctx.lineTo(-9,7);ctx.closePath();ctx.fill();ctx.fillStyle='#0c1022';ctx.fillRect(2,-3,11,6);ctx.fillStyle=s.color;ctx.shadowBlur=14;ctx.shadowColor=s.color;ctx.fillRect(-21,-5,10,3);ctx.fillRect(-21,2,10,3);ctx.restore()}
function drawAlien(a){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.sin(a.phase)*.15);ctx.shadowBlur=a.boss?30:18;ctx.shadowColor=a.color;ctx.fillStyle='#121428';ctx.strokeStyle=a.color;ctx.lineWidth=a.boss?4:2;ctx.beginPath();if(a.name==='MANTA'){ctx.moveTo(-a.r,0);ctx.lineTo(0,-a.r*.7);ctx.lineTo(a.r,0);ctx.lineTo(0,a.r*.7)}else{ctx.arc(0,0,a.r,0,Math.PI*2)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=a.color;for(let i=0;i<(a.boss?5:2);i++){const yy=(i-(a.boss?2:.5))*7;ctx.fillRect(-5,yy,10,3)}ctx.shadowBlur=0;const w=a.r*1.6;ctx.fillStyle='rgba(255,255,255,.09)';ctx.fillRect(-w/2,a.r+7,w,3);ctx.fillStyle=a.color;ctx.fillRect(-w/2,a.r+7,w*(a.hp/a.maxHp),3);ctx.restore()}
function drawPortal(){if(!portal)return;const d=dimensions[(dimIndex+1)%dimensions.length];ctx.save();ctx.translate(portal.x,portal.y);ctx.rotate(portal.spin);ctx.globalCompositeOperation='screen';for(let i=0;i<5;i++){ctx.strokeStyle=i%2?d.accent:dimensions[dimIndex].accent;ctx.globalAlpha=.18+i*.12;ctx.lineWidth=3+i*.7;ctx.beginPath();ctx.arc(0,0,portal.r-i*11,i*.7,Math.PI*1.55+i*.7);ctx.stroke()}ctx.globalAlpha=.5;ctx.fillStyle=d.accent+'44';ctx.beginPath();ctx.arc(0,0,38+Math.sin(portal.spin*4)*7,0,Math.PI*2);ctx.fill();ctx.restore();ctx.globalCompositeOperation='source-over'}
function drawProjectiles(){shots.forEach(b=>{ctx.fillStyle=b.color;ctx.shadowBlur=12;ctx.shadowColor=b.color;ctx.fillRect(b.x-9,b.y-2,18,4)});enemyShots.forEach(b=>{ctx.fillStyle=b.color;ctx.shadowBlur=15;ctx.shadowColor=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill()});ctx.shadowBlur=0}
function drawParticles(){particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1}
let dtGlobal=.016;
function render(t){ctx.save();if(shake){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake)}drawBackground(t);drawPortal();drawParticles();aliens.forEach(drawAlien);drawProjectiles();ships.forEach(drawShip);ctx.restore()}
function loop(now){dtGlobal=Math.min(.033,(now-last)/1000||.016);last=now;update(dtGlobal,now);render(now);requestAnimationFrame(loop)}requestAnimationFrame(loop);
