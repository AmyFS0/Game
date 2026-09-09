const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const endScreen = document.getElementById('endScreen');
const playBtn = document.getElementById('playBtn');
const restartBtn = document.getElementById('restartBtn');
const panel = document.getElementById('panel');
const closePanel = document.getElementById('closePanel');
const toast = document.getElementById('toast');
const crosshair = document.getElementById('crosshair');

let W = innerWidth, H = innerHeight;
function resize(){ W=canvas.width=innerWidth*devicePixelRatio; H=canvas.height=innerHeight*devicePixelRatio; canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); W=innerWidth; H=innerHeight; }
addEventListener('resize',resize); resize();

const keys = {};
const mouse = {x:W/2,y:H/2,down:false};
addEventListener('keydown',e=>{ keys[e.key.toLowerCase()]=true; if(e.code==='Space') e.preventDefault(); handleAbility(e); });
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
addEventListener('mousemove',e=>{ mouse.x=e.clientX; mouse.y=e.clientY; crosshair.style.left=mouse.x+'px'; crosshair.style.top=mouse.y+'px'; });
addEventListener('mousedown',()=>mouse.down=true); addEventListener('mouseup',()=>mouse.down=false);

const weapons = [
  {name:'PULSE BLASTER',rarity:'RARE',rate:210,speed:860,damage:18,color:'#22d3ee',spread:.02,count:1},
  {name:'PRISM CANNON',rarity:'EPIC',rate:520,speed:700,damage:34,color:'#a855f7',spread:.13,count:3},
  {name:'PHOTON SMG',rarity:'LEGENDARY',rate:90,speed:920,damage:10,color:'#ec4899',spread:.08,count:1}
];

let state='menu', last=performance.now(), score=0, cores=0, kills=0, wave=1, shake=0, flash=0;
let bullets=[], enemies=[], particles=[], pickups=[], stars=[], rings=[];
for(let i=0;i<120;i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random(),s:Math.random()*1.7+.2});

const player = {x:W*.35,y:H*.58,r:17,hp:100,energy:100,speed:255,weapon:0,lastShot:0,dashCd:0,shieldCd:0,overCd:0,shield:0,over:0,inv:0,angle:0};

function resetGame(){
  score=0;cores=0;kills=0;wave=1;bullets=[];enemies=[];particles=[];pickups=[];rings=[];
  Object.assign(player,{x:W*.35,y:H*.58,hp:100,energy:100,weapon:0,lastShot:0,dashCd:0,shieldCd:0,overCd:0,shield:0,over:0,inv:0});
  spawnWave(); updateHUD();
}
function startGame(){ state='play'; menu.classList.add('hidden'); endScreen.classList.add('hidden'); hud.classList.remove('hidden'); panel.classList.add('hidden'); resetGame(); showToast('RIFT GATE OPEN // WAVE 1'); }
playBtn.onclick=startGame; restartBtn.onclick=startGame;

function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1300); }

function spawnWave(){
  const count = 4 + wave*2;
  for(let i=0;i<count;i++) setTimeout(()=>spawnEnemy(i%3),i*180);
  if(wave===3) setTimeout(()=>spawnEnemy(3),count*180+300);
}
function spawnEnemy(type=0){
  let x,y,edge=Math.floor(Math.random()*4),m=70;
  if(edge===0){x=-m;y=Math.random()*H} if(edge===1){x=W+m;y=Math.random()*H} if(edge===2){x=Math.random()*W;y=-m} if(edge===3){x=Math.random()*W;y=H+m}
  const presets=[
    {type:'SCOUT',r:14,hp:34,speed:105,color:'#22d3ee',damage:11},
    {type:'GUARDIAN',r:23,hp:90,speed:55,color:'#a855f7',damage:17},
    {type:'SNIPER',r:17,hp:48,speed:72,color:'#ec4899',damage:14},
    {type:'RIFT WARDEN',r:42,hp:430,speed:42,color:'#f973ff',damage:24,boss:true}
  ];
  enemies.push({...presets[type],x,y,maxHp:presets[type].hp,phase:Math.random()*6.28,lastAttack:0});
}

function shoot(now){
  const w=weapons[player.weapon]; if(now-player.lastShot<w.rate/(player.over?1.8:1))return;
  player.lastShot=now; const base=Math.atan2(mouse.y-player.y,mouse.x-player.x); player.angle=base;
  for(let i=0;i<w.count;i++){
    const off=(i-(w.count-1)/2)*w.spread+(Math.random()-.5)*w.spread*.35;
    bullets.push({x:player.x+Math.cos(base)*24,y:player.y+Math.sin(base)*24,vx:Math.cos(base+off)*w.speed,vy:Math.sin(base+off)*w.speed,r:4,life:1.25,damage:w.damage*(player.over?1.5:1),color:w.color,enemy:false});
  }
  burst(player.x+Math.cos(base)*25,player.y+Math.sin(base)*25,w.color,5,2.5); shake=Math.max(shake,2);
}
function enemyShoot(e,now){
  if(now-e.lastAttack < (e.boss?620:e.type==='SNIPER'?1200:1600)) return; e.lastAttack=now;
  const a=Math.atan2(player.y-e.y,player.x-e.x), n=e.boss?5:1;
  for(let i=0;i<n;i++){const off=(i-(n-1)/2)*.16;bullets.push({x:e.x,y:e.y,vx:Math.cos(a+off)*(e.boss?360:300),vy:Math.sin(a+off)*(e.boss?360:300),r:e.boss?6:4,life:3,damage:e.damage,color:e.color,enemy:true});}
}
function burst(x,y,color,n=10,power=4){ for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*power+1;particles.push({x,y,vx:Math.cos(a)*s*60,vy:Math.sin(a)*s*60,life:Math.random()*.45+.25,max:.7,r:Math.random()*3+1,color});}}
function ring(x,y,color){rings.push({x,y,r:8,life:.6,color});}

function handleAbility(e){ if(state!=='play')return;
  if(['1','2','3'].includes(e.key)){player.weapon=+e.key-1;updateHUD();showToast(weapons[player.weapon].name);}
  if(e.code==='Space'&&player.dashCd<=0&&player.energy>=18){let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);if(!dx&&!dy){const a=Math.atan2(mouse.y-player.y,mouse.x-player.x);dx=Math.cos(a);dy=Math.sin(a);} const l=Math.hypot(dx,dy)||1;player.x+=dx/l*130;player.y+=dy/l*130;player.energy-=18;player.dashCd=1.3;player.inv=.25;ring(player.x,player.y,'#22d3ee');burst(player.x,player.y,'#22d3ee',18,5);}
  if(e.key.toLowerCase()==='q'&&player.shieldCd<=0&&player.energy>=30){player.energy-=30;player.shield=3.5;player.shieldCd=8;ring(player.x,player.y,'#7c3aed');showToast('ENERGY SHIELD ONLINE');}
  if(e.key.toLowerCase()==='e'&&player.overCd<=0&&player.energy>=35){player.energy-=35;player.over=4;player.overCd=10;showToast('OVERCHARGE // 150%');}
}

function update(dt,now){
  if(state!=='play')return;
  let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0),l=Math.hypot(dx,dy)||1;
  const sp=player.speed*(keys.shift?1.28:1)*(player.over?1.15:1); player.x+=dx/l*sp*dt;player.y+=dy/l*sp*dt;
  player.x=Math.max(25,Math.min(W-25,player.x));player.y=Math.max(95,Math.min(H-25,player.y));
  player.angle=Math.atan2(mouse.y-player.y,mouse.x-player.x); if(mouse.down)shoot(now);
  player.energy=Math.min(100,player.energy+8*dt); player.dashCd-=dt;player.shieldCd-=dt;player.overCd-=dt;player.shield-=dt;player.over-=dt;player.inv-=dt;
  bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;});
  for(let ei=enemies.length-1;ei>=0;ei--){const e=enemies[ei],a=Math.atan2(player.y-e.y,player.x-e.x),dist=Math.hypot(player.x-e.x,player.y-e.y);e.phase+=dt*3;
    if(e.type==='SNIPER'&&dist<360){e.x-=Math.cos(a)*e.speed*dt;e.y-=Math.sin(a)*e.speed*dt}else if(dist>e.r+player.r+12){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;}
    if(e.type==='SNIPER'||e.boss) enemyShoot(e,now);
    if(dist<e.r+player.r&&player.inv<=0){damagePlayer(e.damage);player.inv=.65;e.x-=Math.cos(a)*30;e.y-=Math.sin(a)*30;}
    for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];if(b.enemy)continue;if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=b.damage;bullets.splice(bi,1);burst(b.x,b.y,b.color,5,2);if(e.hp<=0){killEnemy(e,ei);break;}}}
  }
  for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];if(b.enemy&&Math.hypot(b.x-player.x,b.y-player.y)<b.r+player.r){bullets.splice(bi,1);if(player.inv<=0){damagePlayer(b.damage);player.inv=.35;}} else if(b.life<=0||b.x<-80||b.x>W+80||b.y<-80||b.y>H+80)bullets.splice(bi,1);}
  pickups.forEach(p=>{p.t+=dt;p.y+=Math.sin(p.t*3)*.1;if(Math.hypot(p.x-player.x,p.y-player.y)<30){cores++;score+=500;ring(p.x,p.y,'#22d3ee');burst(p.x,p.y,'#22d3ee',25,5);p.dead=true;showToast('RIFT CORE RECOVERED');}}); pickups=pickups.filter(p=>!p.dead);
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt;});particles=particles.filter(p=>p.life>0);
  rings.forEach(r=>{r.r+=120*dt;r.life-=dt});rings=rings.filter(r=>r.life>0);
  if(enemies.length===0&&wave<3){wave++;spawnWave();showToast('WAVE '+wave+' INBOUND');}
  if(cores>=3&&wave>=3&&enemies.length===0) finish(true);
  updateHUD();
}
function damagePlayer(d){if(player.shield>0){burst(player.x,player.y,'#7c3aed',8,3);return;}player.hp-=d;shake=8;flash=.16;burst(player.x,player.y,'#fb7185',12,4);if(player.hp<=0)finish(false);}
function killEnemy(e,index){enemies.splice(index,1);kills++;score+=e.boss?1200:100;shake=e.boss?10:4;ring(e.x,e.y,e.color);burst(e.x,e.y,e.color,e.boss?45:16,e.boss?7:4);if((kills===4||kills===9||e.boss)&&cores<3)pickups.push({x:e.x,y:e.y,t:0});}
function finish(win){state='end';hud.classList.add('hidden');endScreen.classList.remove('hidden');document.getElementById('endEyebrow').textContent=win?'MISSION COMPLETE':'RIFT COLLAPSE';document.getElementById('endTitle').innerHTML=win?'RIFT<br>STABILIZED':'SIGNAL<br>LOST';document.getElementById('endText').textContent=win?'The Neon City core is safe — for now.':'Nova was forced out of the fracture. Re-enter the Rift.';document.getElementById('finalScore').textContent=score.toLocaleString();document.getElementById('finalCores').textContent=cores+'/3';document.getElementById('finalKills').textContent=kills;}

function updateHUD(){
  document.getElementById('healthBar').style.width=Math.max(0,player.hp)+'%';document.getElementById('healthText').textContent=Math.max(0,Math.ceil(player.hp));
  document.getElementById('energyBar').style.width=player.energy+'%';document.getElementById('energyText').textContent=Math.ceil(player.energy);
  document.getElementById('score').textContent=String(score).padStart(6,'0');document.getElementById('cores').textContent=cores+' / 3';document.getElementById('waveText').textContent='WAVE '+wave;
  const w=weapons[player.weapon];document.getElementById('weaponName').textContent=w.name;document.getElementById('weaponRarity').textContent=w.rarity;document.getElementById('weaponSlot').textContent='0'+(player.weapon+1);
  document.getElementById('dashStatus').textContent=player.dashCd>0?player.dashCd.toFixed(1)+'s':'READY';document.getElementById('shieldStatus').textContent=player.shield>0?'ACTIVE':player.shieldCd>0?player.shieldCd.toFixed(1)+'s':'READY';document.getElementById('overchargeStatus').textContent=player.over>0?'ACTIVE':player.overCd>0?player.overCd.toFixed(1)+'s':'READY';
}

function drawBackground(t){
  ctx.fillStyle='#050510';ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(W*.72,H*.48,20,W*.72,H*.48,W*.6);g.addColorStop(0,'rgba(124,58,237,.18)');g.addColorStop(.35,'rgba(34,211,238,.04)');g.addColorStop(1,'rgba(5,5,16,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  stars.forEach((s,i)=>{s.x-=(.15+s.z*.35);if(s.x<0)s.x=W;ctx.globalAlpha=.18+s.z*.6;ctx.fillStyle=i%6===0?'#a855f7':'#dff8ff';ctx.fillRect(s.x,s.y,s.s,s.s)});ctx.globalAlpha=1;
  const horizon=H*.72;ctx.strokeStyle='rgba(34,211,238,.08)';ctx.lineWidth=1;for(let y=horizon;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}for(let x=-W;x<W*2;x+=70){ctx.beginPath();ctx.moveTo(W/2+(x-W/2)*.12,horizon);ctx.lineTo(x,H);ctx.stroke()}
  for(let i=0;i<8;i++){const x=(i*173+80)%W,h=70+(i%4)*38;ctx.fillStyle='rgba(8,13,30,.85)';ctx.fillRect(x,horizon-h,78,h);ctx.fillStyle=i%2?'rgba(124,58,237,.22)':'rgba(34,211,238,.16)';for(let yy=horizon-h+12;yy<horizon-10;yy+=16)ctx.fillRect(x+10,yy,4,4)}
  ctx.save();ctx.translate(W*.78,H*.34);ctx.rotate(t*.00008);ctx.strokeStyle='rgba(168,85,247,.22)';ctx.lineWidth=2;for(let r=90;r<140;r+=16){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*1.45);ctx.stroke()}ctx.restore();
}
function drawPlayer(){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);if(player.shield>0){ctx.strokeStyle='#7c3aed';ctx.lineWidth=3;ctx.shadowBlur=18;ctx.shadowColor='#7c3aed';ctx.beginPath();ctx.arc(0,0,31+Math.sin(performance.now()*.01)*2,0,Math.PI*2);ctx.stroke();}ctx.shadowBlur=18;ctx.shadowColor=player.over?'#ec4899':'#22d3ee';ctx.fillStyle='#dce7f7';ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-10,-14);ctx.lineTo(-17,-8);ctx.lineTo(-17,8);ctx.lineTo(-10,14);ctx.closePath();ctx.fill();ctx.fillStyle='#15172f';ctx.fillRect(-9,-8,18,16);ctx.fillStyle=player.over?'#ec4899':'#22d3ee';ctx.fillRect(2,-3,12,6);ctx.restore();}
function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.phase*.08);ctx.shadowBlur=e.boss?30:15;ctx.shadowColor=e.color;ctx.strokeStyle=e.color;ctx.fillStyle='rgba(14,15,37,.92)';ctx.lineWidth=e.boss?4:2;ctx.beginPath();const sides=e.boss?8:e.type==='GUARDIAN'?6:4;for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,r=e.r*(i%2?1:.78);const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(0,0,e.boss?10:5,0,Math.PI*2);ctx.fill();ctx.restore();if(e.hp<e.maxHp){ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(e.x-e.r,e.y-e.r-11,e.r*2,3);ctx.fillStyle=e.color;ctx.fillRect(e.x-e.r,e.y-e.r-11,e.r*2*(e.hp/e.maxHp),3)}}
function draw(){const t=performance.now();ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.86;if(shake<.2)shake=0;}drawBackground(t);pickups.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*.002);ctx.shadowBlur=25;ctx.shadowColor='#22d3ee';ctx.strokeStyle='#22d3ee';ctx.fillStyle='rgba(34,211,238,.18)';ctx.beginPath();for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,x=Math.cos(a)*14,y=Math.sin(a)*14;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()});rings.forEach(r=>{ctx.globalAlpha=r.life/.6;ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1});bullets.forEach(b=>{ctx.shadowBlur=15;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill()});ctx.shadowBlur=0;enemies.forEach(drawEnemy);if(state==='play')drawPlayer();particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.r,p.r)});ctx.globalAlpha=1;ctx.restore();if(flash>0){ctx.fillStyle='rgba(251,113,133,'+flash+')';ctx.fillRect(0,0,W,H);flash*=.82;}}
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt,now);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

const panelData={
  characters:{title:'CHARACTERS',items:[['NOVA','ACTIVE','Dimensional explorer with superior mobility.'],['BYTE','LOCKED','Tech specialist with autonomous drone systems.'],['ECHO','LOCKED','Manipulates holographic energy fields.']]},
  loadout:{title:'LOADOUT',items:weapons.map((w,i)=>[w.name,w.rarity,`Damage ${w.damage} · Fire rate ${Math.round(1000/w.rate*60)} RPM`])},
  missions:{title:'MISSIONS',items:[['CORE HUNTER','ACTIVE','Recover 3 Rift Cores in Neon City.'],['DRONE BREAKER','CHALLENGE','Destroy 20 hostile drones.'],['ZERO DAMAGE','CHALLENGE','Clear a wave without taking damage.']]},
  settings:{title:'SETTINGS',items:[['CONTROLS','WASD + MOUSE','Move, aim and fire.'],['ABILITIES','Q / E / SPACE','Shield, Overcharge and Quantum Dash.'],['GRAPHICS','NEON HIGH','Dynamic particles and glow effects enabled.']]}
};
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{const d=panelData[b.dataset.panel];document.getElementById('panelTitle').textContent=d.title;document.getElementById('panelContent').innerHTML='<div class="grid-cards">'+d.items.map(i=>`<div class="mini-card"><small>${i[1]}</small><b>${i[0]}</b><p>${i[2]}</p></div>`).join('')+'</div>';panel.classList.remove('hidden')});
closePanel.onclick=()=>panel.classList.add('hidden');
