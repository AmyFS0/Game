const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const menu=document.getElementById('menu');
const hud=document.getElementById('hud');
const endScreen=document.getElementById('endScreen');
const panel=document.getElementById('panel');
const toast=document.getElementById('toast');
const crosshair=document.getElementById('crosshair');

let W=innerWidth,H=innerHeight,DPR=devicePixelRatio||1;
function resize(){W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();

const keys={};
const mouse={x:W/2,y:H/2,down:false};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')e.preventDefault();handleAbility(e)});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;crosshair.style.left=mouse.x+'px';crosshair.style.top=mouse.y+'px'});
addEventListener('mousedown',()=>mouse.down=true);addEventListener('mouseup',()=>mouse.down=false);

const weapons=[
 {name:'PULSE BLASTER',rarity:'RARE',rate:210,speed:860,damage:18,color:'#22d3ee',spread:.02,count:1},
 {name:'PRISM CANNON',rarity:'EPIC',rate:520,speed:700,damage:32,color:'#a855f7',spread:.13,count:3},
 {name:'PHOTON SMG',rarity:'LEGENDARY',rate:92,speed:930,damage:10,color:'#ec4899',spread:.08,count:1}
];
const levels=[
 {name:'NEON CITY',accent:'#22d3ee',bg:'#050510',glow:'rgba(124,58,237,.18)',waves:2},
 {name:'CRYSTAL PLANET',accent:'#a855f7',bg:'#080414',glow:'rgba(168,85,247,.23)',waves:2},
 {name:'CYBER JUNGLE',accent:'#34d399',bg:'#03100d',glow:'rgba(52,211,153,.18)',waves:2},
 {name:'FLOATING ISLANDS',accent:'#60a5fa',bg:'#050b19',glow:'rgba(96,165,250,.2)',waves:3},
 {name:'THE RIFT',accent:'#f472b6',bg:'#0b0310',glow:'rgba(244,114,182,.24)',waves:3,final:true}
];

let state='menu',last=performance.now(),score=0,kills=0,level=1,wave=1,shake=0,flash=0;
let bullets=[],enemies=[],particles=[],pickups=[],stars=[],rings=[];
let spawnRemaining=0,spawnCooldown=0,stageClearTimer=-1,bossSpawned=false,pickupTimer=7;
for(let i=0;i<125;i++)stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random(),s:Math.random()*1.7+.2});

const player={x:W*.35,y:H*.58,r:17,hp:100,energy:100,speed:255,weapon:0,lastShot:0,dashCd:0,shieldCd:0,overCd:0,shield:0,over:0,bulletShield:0,inv:0,angle:0};

function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1500)}
function resetGame(){score=0;kills=0;level=1;wave=1;bullets=[];enemies=[];particles=[];pickups=[];rings=[];pickupTimer=6;Object.assign(player,{x:W*.35,y:H*.58,hp:100,energy:100,weapon:0,lastShot:0,dashCd:0,shieldCd:0,overCd:0,shield:0,over:0,bulletShield:0,inv:0});beginLevel(1);updateHUD()}
function startGame(){state='play';menu.classList.add('hidden');endScreen.classList.add('hidden');hud.classList.remove('hidden');panel.classList.add('hidden');resetGame();showToast('RIFT GATE OPEN // LEVEL 1')}
document.getElementById('playBtn').onclick=startGame;document.getElementById('restartBtn').onclick=startGame;

function beginLevel(n){level=n;wave=1;player.energy=100;player.hp=Math.min(100,player.hp+(n>1?15:0));document.getElementById('dimensionLabel').textContent='DIMENSION // '+levels[level-1].name;startWave()}
function startWave(){const cfg=levels[level-1];spawnRemaining=4+level*2+wave*2+(level===5?2:0);spawnCooldown=.25;stageClearTimer=-1;bossSpawned=false;showToast(`${cfg.name} // WAVE ${wave}`)}
function nextStage(){const cfg=levels[level-1];if(wave<cfg.waves){wave++;startWave()}else if(level<levels.length){beginLevel(level+1);showToast(`LEVEL ${level} // ${levels[level-1].name}`)}else finish(true)}

function spawnEnemy(type=null){
 let x,y,edge=Math.floor(Math.random()*4),m=70;if(edge===0){x=-m;y=100+Math.random()*(H-140)}if(edge===1){x=W+m;y=100+Math.random()*(H-140)}if(edge===2){x=Math.random()*W;y=70}if(edge===3){x=Math.random()*W;y=H+m}
 const presets=[
  {type:'SCOUT',r:14,hp:34,speed:105,color:'#22d3ee',damage:10,shoot:false},
  {type:'GUARDIAN',r:23,hp:88,speed:58,color:'#a855f7',damage:16,shoot:false},
  {type:'SNIPER',r:17,hp:50,speed:74,color:'#ec4899',damage:13,shoot:true}
 ];
 if(type===3){const hp=1650;enemies.push({type:'RIFT TITAN',r:52,hp,maxHp:hp,speed:45,damage:24,color:'#f472b6',shoot:true,boss:true,x:W+80,y:H*.45,phase:0,lastAttack:0});showToast('⚠ FINAL BOSS // RIFT TITAN');return}
 const maxType=Math.min(2,Math.floor(level/2));const p=presets[type??Math.floor(Math.random()*(maxType+1))];const finalBoost=level===5?1.18:1;const hpScale=(1+(level-1)*.24)*finalBoost;const speedScale=1+(level-1)*.075;const damageScale=1+(level-1)*.12;
 enemies.push({...p,x,y,hp:p.hp*hpScale,maxHp:p.hp*hpScale,speed:p.speed*speedScale,damage:p.damage*damageScale,phase:Math.random()*6.28,lastAttack:0,shoot:p.shoot||(level>=4&&p.type==='GUARDIAN')})
}

function shoot(now){const w=weapons[player.weapon];if(now-player.lastShot<w.rate/(player.over?1.8:1))return;player.lastShot=now;const base=Math.atan2(mouse.y-player.y,mouse.x-player.x);player.angle=base;for(let i=0;i<w.count;i++){const off=(i-(w.count-1)/2)*w.spread+(Math.random()-.5)*w.spread*.35;bullets.push({x:player.x+Math.cos(base)*24,y:player.y+Math.sin(base)*24,vx:Math.cos(base+off)*w.speed,vy:Math.sin(base+off)*w.speed,r:4,life:1.35,damage:w.damage*(player.over?1.5:1),color:w.color,enemy:false})}burst(player.x+Math.cos(base)*25,player.y+Math.sin(base)*25,w.color,5,2.5);shake=Math.max(shake,2)}
function enemyShoot(e,now){const baseRate=e.boss?540:e.type==='SNIPER'?1050:1350;const rate=baseRate*Math.max(.58,1-(level-1)*.07);if(now-e.lastAttack<rate)return;e.lastAttack=now;const a=Math.atan2(player.y-e.y,player.x-e.x),n=e.boss?7:(level===5&&e.type==='SNIPER'?3:1);for(let i=0;i<n;i++){const off=(i-(n-1)/2)*(e.boss?.13:.11);const speed=e.boss?390:305+(level-1)*8;bullets.push({x:e.x,y:e.y,vx:Math.cos(a+off)*speed,vy:Math.sin(a+off)*speed,r:e.boss?6:4,life:3.5,damage:e.damage,color:e.color,enemy:true})}}
function burst(x,y,color,n=10,power=4){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*power+1;particles.push({x,y,vx:Math.cos(a)*s*60,vy:Math.sin(a)*s*60,life:Math.random()*.45+.25,max:.7,r:Math.random()*3+1,color})}}
function ring(x,y,color){rings.push({x,y,r:8,life:.6,color})}

function spawnPickup(type=Math.random()<.52?'shield':'health',x=null,y=null){pickups.push({type,x:x??(70+Math.random()*(W-140)),y:y??(115+Math.random()*(H-190)),r:12,t:0,life:12,dead:false})}
function collectPickup(p){if(p.type==='shield'){player.bulletShield=8;ring(p.x,p.y,'#facc15');burst(p.x,p.y,'#facc15',22,5);showToast('YELLOW ORB // BULLET PROTECTION 8s')}else{const before=player.hp;player.hp=Math.min(100,player.hp+30);ring(p.x,p.y,'#38bdf8');burst(p.x,p.y,'#38bdf8',22,5);showToast(before>=100?'BLUE ORB // HEALTH FULL':'BLUE ORB // +30 HP')}p.dead=true;score+=150}

function handleAbility(e){if(state!=='play')return;if(['1','2','3'].includes(e.key)){player.weapon=+e.key-1;updateHUD();showToast(weapons[player.weapon].name)}if(e.code==='Space'&&player.dashCd<=0&&player.energy>=18){let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);if(!dx&&!dy){const a=Math.atan2(mouse.y-player.y,mouse.x-player.x);dx=Math.cos(a);dy=Math.sin(a)}const l=Math.hypot(dx,dy)||1;player.x+=dx/l*130;player.y+=dy/l*130;player.energy-=18;player.dashCd=1.3;player.inv=.25;ring(player.x,player.y,'#22d3ee');burst(player.x,player.y,'#22d3ee',18,5)}if(e.key.toLowerCase()==='q'&&player.shieldCd<=0&&player.energy>=30){player.energy-=30;player.shield=3.5;player.shieldCd=8;ring(player.x,player.y,'#7c3aed');showToast('ENERGY SHIELD ONLINE')}if(e.key.toLowerCase()==='e'&&player.overCd<=0&&player.energy>=35){player.energy-=35;player.over=4;player.overCd=10;showToast('OVERCHARGE // 150%')}}

function damagePlayer(d,fromBullet=false){if(player.shield>0){burst(player.x,player.y,'#7c3aed',8,3);return}if(fromBullet&&player.bulletShield>0){burst(player.x,player.y,'#facc15',9,3);ring(player.x,player.y,'#facc15');return}player.hp-=d;shake=8;flash=.15;burst(player.x,player.y,'#fb7185',12,4);if(player.hp<=0)finish(false)}
function killEnemy(e,index){enemies.splice(index,1);kills++;score+=e.boss?3500:100+level*20;shake=e.boss?12:4;ring(e.x,e.y,e.color);burst(e.x,e.y,e.color,e.boss?55:16,e.boss?8:4);if(!e.boss&&Math.random()<.18)spawnPickup(Math.random()<.55?'shield':'health',e.x,e.y);if(e.boss)showToast('RIFT TITAN DEFEATED')}

function update(dt,now){if(state!=='play')return;let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0),l=Math.hypot(dx,dy)||1;const sp=player.speed*(keys.shift?1.28:1)*(player.over?1.15:1);player.x+=dx/l*sp*dt;player.y+=dy/l*sp*dt;player.x=Math.max(25,Math.min(W-25,player.x));player.y=Math.max(95,Math.min(H-25,player.y));player.angle=Math.atan2(mouse.y-player.y,mouse.x-player.x);if(mouse.down)shoot(now);player.energy=Math.min(100,player.energy+8*dt);player.dashCd-=dt;player.shieldCd-=dt;player.overCd-=dt;player.shield-=dt;player.over-=dt;player.bulletShield-=dt;player.inv-=dt;

 if(spawnRemaining>0){spawnCooldown-=dt;if(spawnCooldown<=0){spawnEnemy();spawnRemaining--;spawnCooldown=Math.max(.25,.78-level*.075)}}
 const finalBossWave=level===5&&wave===levels[4].waves;if(finalBossWave&&spawnRemaining===0&&!bossSpawned&&enemies.length===0){bossSpawned=true;spawnEnemy(3)}

 bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt});
 for(let ei=enemies.length-1;ei>=0;ei--){const e=enemies[ei],a=Math.atan2(player.y-e.y,player.x-e.x),dist=Math.hypot(player.x-e.x,player.y-e.y);e.phase+=dt*3;if(e.type==='SNIPER'&&dist<360){e.x-=Math.cos(a)*e.speed*dt;e.y-=Math.sin(a)*e.speed*dt}else if(e.boss){if(dist>330){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}}else if(dist>e.r+player.r+12){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}if(e.shoot||e.boss)enemyShoot(e,now);if(dist<e.r+player.r&&player.inv<=0){damagePlayer(e.damage,false);player.inv=.65;e.x-=Math.cos(a)*30;e.y-=Math.sin(a)*30}for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];if(b.enemy)continue;if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=b.damage;bullets.splice(bi,1);burst(b.x,b.y,b.color,5,2);if(e.hp<=0){killEnemy(e,ei);break}}}}
 for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];if(b.enemy&&Math.hypot(b.x-player.x,b.y-player.y)<b.r+player.r){bullets.splice(bi,1);if(player.inv<=0){damagePlayer(b.damage,true);player.inv=.24}}else if(b.life<=0||b.x<-80||b.x>W+80||b.y<-80||b.y>H+80)bullets.splice(bi,1)}

 pickupTimer-=dt;if(pickupTimer<=0){spawnPickup();pickupTimer=8+Math.random()*6}for(const p of pickups){p.t+=dt;p.life-=dt;if(Math.hypot(p.x-player.x,p.y-player.y)<p.r+player.r+5)collectPickup(p)}pickups=pickups.filter(p=>!p.dead&&p.life>0);
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt});particles=particles.filter(p=>p.life>0);rings.forEach(r=>{r.r+=120*dt;r.life-=dt});rings=rings.filter(r=>r.life>0);

 const waveCleared=spawnRemaining===0&&enemies.length===0&&(!finalBossWave||bossSpawned);if(waveCleared&&stageClearTimer<0)stageClearTimer=1.25;if(stageClearTimer>=0){stageClearTimer-=dt;if(stageClearTimer<=0)nextStage()}
 updateHUD()}

function finish(win){state='end';hud.classList.add('hidden');endScreen.classList.remove('hidden');document.getElementById('endEyebrow').textContent=win?'CAMPAIGN COMPLETE':'RIFT COLLAPSE';document.getElementById('endTitle').innerHTML=win?'RIFT<br>CONQUERED':'SIGNAL<br>LOST';document.getElementById('endText').textContent=win?'The Rift Titan is defeated. All five dimensions are stable.':'Nova was forced out of the fracture. Re-enter the Rift.';document.getElementById('finalScore').textContent=score.toLocaleString();document.getElementById('finalLevel').textContent=Math.min(level,5)+'/5';document.getElementById('finalKills').textContent=kills}

function updateHUD(){const cfg=levels[level-1];document.getElementById('healthBar').style.width=Math.max(0,player.hp)+'%';document.getElementById('healthText').textContent=Math.max(0,Math.ceil(player.hp));document.getElementById('energyBar').style.width=player.energy+'%';document.getElementById('energyText').textContent=Math.ceil(player.energy);document.getElementById('score').textContent=String(score).padStart(6,'0');document.getElementById('killsHud').textContent=kills;document.getElementById('levelBadge').textContent='LV.'+String(level).padStart(2,'0');document.getElementById('waveText').textContent=`LEVEL ${level} · WAVE ${wave}/${cfg.waves}`;document.getElementById('objective').textContent=level===5&&wave===cfg.waves?'DEFEAT THE RIFT TITAN':'CLEAR THE RIFT WAVE';document.getElementById('dimensionLabel').textContent='DIMENSION // '+cfg.name;const w=weapons[player.weapon];document.getElementById('weaponName').textContent=w.name;document.getElementById('weaponRarity').textContent=w.rarity;document.getElementById('weaponSlot').textContent='0'+(player.weapon+1);document.getElementById('dashStatus').textContent=player.dashCd>0?player.dashCd.toFixed(1)+'s':'READY';document.getElementById('shieldStatus').textContent=player.shield>0?'ACTIVE':player.shieldCd>0?player.shieldCd.toFixed(1)+'s':'READY';document.getElementById('overchargeStatus').textContent=player.over>0?'ACTIVE':player.overCd>0?player.overCd.toFixed(1)+'s':'READY';const orb=document.getElementById('orbStatus');orb.classList.toggle('active',player.bulletShield>0);orb.textContent=player.bulletShield>0?'● BULLET SHIELD '+Math.max(0,player.bulletShield).toFixed(1)+'s':'NO BULLET SHIELD'}

function drawBackground(t){const cfg=levels[level-1]||levels[0];ctx.fillStyle=cfg.bg;ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W*.72,H*.48,20,W*.72,H*.48,W*.62);g.addColorStop(0,cfg.glow);g.addColorStop(.46,'rgba(34,211,238,.035)');g.addColorStop(1,'rgba(5,5,16,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);stars.forEach((s,i)=>{s.x-=(.1+s.z*.26);if(s.x<0)s.x=W;ctx.globalAlpha=.18+s.z*.62;ctx.fillStyle=i%6===0?cfg.accent:'#dff8ff';ctx.fillRect(s.x,s.y,s.s,s.s)});ctx.globalAlpha=1;const horizon=H*.72;ctx.strokeStyle=cfg.accent+'18';ctx.lineWidth=1;for(let y=horizon;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}for(let x=-W;x<W*2;x+=70){ctx.beginPath();ctx.moveTo(W/2+(x-W/2)*.12,horizon);ctx.lineTo(x,H);ctx.stroke()}if(level===1){for(let i=0;i<8;i++){const x=(i*173+80)%W,h=70+(i%4)*38;ctx.fillStyle='rgba(8,13,30,.85)';ctx.fillRect(x,horizon-h,78,h);ctx.fillStyle=i%2?'rgba(124,58,237,.22)':'rgba(34,211,238,.16)';for(let yy=horizon-h+12;yy<horizon-10;yy+=16)ctx.fillRect(x+10,yy,4,4)}}else if(level===2){for(let i=0;i<10;i++){const x=(i*137+60)%W,y=140+(i%4)*95;ctx.fillStyle=cfg.accent+'22';ctx.strokeStyle=cfg.accent+'66';ctx.beginPath();ctx.moveTo(x,y-34);ctx.lineTo(x+18,y);ctx.lineTo(x,y+38);ctx.lineTo(x-18,y);ctx.closePath();ctx.fill();ctx.stroke()}}else if(level===3){for(let i=0;i<9;i++){const x=(i*181+40)%W;ctx.strokeStyle='rgba(52,211,153,.18)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,H);ctx.quadraticCurveTo(x+60,H*.55,x+20,90);ctx.stroke()}}else if(level===4){for(let i=0;i<6;i++){const x=(i*220+90)%W,y=180+(i%2)*160;ctx.fillStyle='rgba(96,165,250,.1)';ctx.beginPath();ctx.ellipse(x,y,80,20,0,0,Math.PI*2);ctx.fill()}}else{ctx.save();ctx.translate(W*.75,H*.38);ctx.rotate(t*.00012);ctx.strokeStyle=cfg.accent+'66';for(let r=70;r<155;r+=19){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*1.6);ctx.stroke()}ctx.restore()}}
function drawPlayer(){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);if(player.inv>0&&Math.floor(player.inv*16)%2===0)ctx.globalAlpha=.4;ctx.shadowBlur=20;ctx.shadowColor='#22d3ee';ctx.fillStyle='#dbeafe';ctx.beginPath();ctx.moveTo(25,0);ctx.lineTo(-13,-14);ctx.lineTo(-7,-4);ctx.lineTo(-24,-3);ctx.lineTo(-24,3);ctx.lineTo(-7,4);ctx.lineTo(-13,14);ctx.closePath();ctx.fill();ctx.fillStyle='#7c3aed';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-4,-7);ctx.lineTo(0,0);ctx.lineTo(-4,7);ctx.closePath();ctx.fill();ctx.restore();if(player.shield>0||player.bulletShield>0){ctx.save();ctx.strokeStyle=player.bulletShield>0?'#facc15':'#7c3aed';ctx.lineWidth=2;ctx.globalAlpha=.65+.2*Math.sin(performance.now()*.01);ctx.shadowBlur=18;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.arc(player.x,player.y,29,0,Math.PI*2);ctx.stroke();ctx.restore()}}
function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);ctx.shadowBlur=e.boss?28:15;ctx.shadowColor=e.color;ctx.strokeStyle=e.color;ctx.fillStyle=e.color+'44';ctx.lineWidth=e.boss?3:2;if(e.boss){ctx.rotate(e.phase*.08);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(60,-8);ctx.lineTo(52,10);ctx.closePath();ctx.fill();ctx.stroke()}ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8,-4,8,0,Math.PI*2);ctx.fill()}else if(e.type==='GUARDIAN'){ctx.rotate(e.phase*.08);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?e.r*.72:e.r;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.stroke()}else if(e.type==='SNIPER'){ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(5,0,6,0,Math.PI*2);ctx.fill()}else{ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r)}ctx.closePath();ctx.fill();ctx.stroke()}ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-e.r,-e.r-10,e.r*2,3);ctx.fillStyle=e.color;ctx.fillRect(-e.r,-e.r-10,e.r*2*Math.max(0,e.hp/e.maxHp),3);ctx.restore()}
function drawPickup(p){const color=p.type==='shield'?'#facc15':'#38bdf8';ctx.save();ctx.translate(p.x,p.y);ctx.shadowBlur=25;ctx.shadowColor=color;const pulse=1+Math.sin(p.t*5)*.1;ctx.scale(pulse,pulse);ctx.fillStyle=color+'45';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.rotate(p.t);ctx.strokeStyle='#fff';ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*1.25);ctx.stroke();ctx.restore()}
function drawBullets(){for(const b of bullets){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.restore()}}
function drawEffects(){for(const p of particles){ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowBlur=8;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore()}for(const r of rings){ctx.save();ctx.globalAlpha=Math.max(0,r.life/.6);ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.restore()}}
function draw(t){ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake=Math.max(0,shake-.45)}drawBackground(t);if(state==='play'||state==='end'){pickups.forEach(drawPickup);enemies.forEach(drawEnemy);drawBullets();drawPlayer();drawEffects()}ctx.restore();if(flash>0){ctx.fillStyle=`rgba(251,113,133,${flash})`;ctx.fillRect(0,0,W,H);flash=Math.max(0,flash-.015)}}

const panelData={
 characters:{title:'CHARACTER',html:'<div class="grid-cards"><div class="mini-card"><small>RIFT RUNNER</small><b>NOVA</b><p>Fast dimensional explorer with dash, shield and overcharge abilities.</p></div></div>'},
 loadout:{title:'LOADOUT',html:weapons.map((w,i)=>`<div class="mini-card"><small>${w.rarity}</small><b>0${i+1} · ${w.name}</b><p>Damage ${w.damage} · ${Math.round(1000/w.rate)} shots/sec class</p></div>`).join('')},
 missions:{title:'LEVELS',html:levels.map((l,i)=>`<div class="mini-card"><small>LEVEL 0${i+1}</small><b>${l.name}</b><p>${i===4?'FINAL LEVEL · Rift Titan boss · maximum difficulty':'Clear every wave to unlock the next dimension.'}</p></div>`).join('')},
 help:{title:'SURVIVAL ORBS',html:'<div class="grid-cards"><div class="mini-card"><small>YELLOW ORB</small><b>BULLET PROTECTION</b><p>Blocks enemy projectiles for 8 seconds. Contact damage can still hurt Nova.</p></div><div class="mini-card"><small>BLUE ORB</small><b>HEALTH +30</b><p>Restores up to 30 HP without exceeding maximum health.</p></div><div class="mini-card"><small>CONTROLS</small><b>WASD + MOUSE</b><p>Click to fire · 1/2/3 weapons · Space dash · Q shield · E overcharge.</p></div></div>'}
};
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{const d=panelData[b.dataset.panel];document.getElementById('panelTitle').textContent=d.title;document.getElementById('panelContent').innerHTML=d.html;panel.classList.remove('hidden')});document.getElementById('closePanel').onclick=()=>panel.classList.add('hidden');

function loop(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt,now);draw(now);requestAnimationFrame(loop)}requestAnimationFrame(loop);