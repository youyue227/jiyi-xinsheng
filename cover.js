const cover=document.getElementById('projectCover');
const collage=document.getElementById('productCollage');
const label=document.getElementById('coverLabel');
const intro=document.getElementById('coverIntro');
const toggle=document.getElementById('introToggle');
const background=[...document.querySelectorAll('body > .masthead, body > .archive-workspace, body > dialog')];
let active=null,items=[],observer;

function setIntro(open){
 cover.classList.toggle('intro-closed',!open);
 toggle.setAttribute('aria-expanded',String(open));
 toggle.setAttribute('aria-label',open?'收起项目介绍':'展开项目介绍');
 toggle.querySelector('span').textContent=open?'‹':'›';
 intro.inert=!open;
 if(!open)hideLabel();
}
function showCover(){
 for(const d of document.querySelectorAll('dialog[open]'))d.close();
 cover.hidden=false;document.body.classList.add('cover-open');
 background.forEach(el=>el.inert=true);
 requestAnimationFrame(()=>{arrange();document.getElementById('enterArchive').focus({preventScroll:true});});
}
function enter(){
 hideLabel();cover.hidden=true;document.body.classList.remove('cover-open');
 background.forEach(el=>el.inert=false);
 document.getElementById('archiveCanvas').focus({preventScroll:true});
 window.dispatchEvent(new Event('resize'));
}
function hideLabel(){
 active?.classList.remove('cover-active');active=null;label.hidden=true;collage.classList.remove('has-active');
}
function placeLabel(x,y){
 const w=label.offsetWidth,h=label.offsetHeight;
 label.style.left=Math.max(12,Math.min(innerWidth-w-12,x+18))+'px';
 label.style.top=Math.max(12,Math.min(innerHeight-h-12,y+18))+'px';
}
function highlight(button,item,x,y){
 if(active!==button){hideLabel();active=button;button.classList.add('cover-active');collage.classList.add('has-active');}
 document.getElementById('coverCategory').textContent=item.category;
 label.style.setProperty('--category-color',item.categoryColor);label.hidden=false;placeLabel(x,y);
}
// Edge-to-edge bands preserve all 20 regions. Their order stays stable on resize.
function arrange(){
 const W=collage.clientWidth,H=collage.clientHeight;
 if(!W||!H)return;
 const columns=W<650?4:5,rows=Math.ceil(items.length/columns);
 const bandWeights=Array.from({length:rows},(_,r)=>1+(r%2?.08:-.08)),bandSum=bandWeights.reduce((a,b)=>a+b,0);let y=0;
 for(let row=0;row<rows;row++){
  const group=items.slice(row*columns,(row+1)*columns),weightSum=group.reduce((n,item)=>n+item.weight,0),height=H*bandWeights[row]/bandSum;let x=0;
  group.forEach(item=>{
   const width=W*item.weight/weightSum;
   Object.assign(item.button.style,{width:width+.5+'px',height:height+.5+'px',left:x+'px',top:y+'px'});
   const c=item.cropPercent,[sw,sh]=item.sourceSize,cw=sw*c.width/100,ch=sh*c.height/100,scale=Math.max(width/cw,height/ch);
   Object.assign(item.image.style,{width:sw*scale+'px',height:sh*scale+'px',left:(width-cw*scale)/2-sw*c.x/100*scale+'px',top:(height-ch*scale)/2-sh*c.y/100*scale+'px'});
   x+=width;
  });y+=height;
 }
}
function mount(source){
 const shuffled=[...source];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 collage.replaceChildren();items=shuffled.map((item,i)=>{
  const button=document.createElement('button');button.className='cover-product';button.type='button';
  button.dataset.coverCategory=item.category;button.dataset.coverId=item.id;
  button.setAttribute('aria-label',item.productName+'，'+item.category);
  button.style.setProperty('--category-color',item.categoryColor);
  const window=document.createElement('span');window.className='product-cutout';
  const image=document.createElement('img');image.src=item.siteImage;image.alt=item.productName+'的原广告图像';image.decoding='async';
  window.append(image);button.append(window);collage.append(button);
  button.addEventListener('pointerenter',e=>highlight(button,item,e.clientX,e.clientY));
  button.addEventListener('pointermove',e=>{if(active===button)placeLabel(e.clientX,e.clientY);});
  button.addEventListener('pointerleave',()=>{if(document.activeElement!==button)hideLabel();});
  button.addEventListener('focus',()=>{const r=button.getBoundingClientRect();highlight(button,item,r.right,r.top);});
  button.addEventListener('blur',hideLabel);
  button.addEventListener('click',()=>{const r=button.getBoundingClientRect();highlight(button,item,r.left,r.bottom);});
  return {...item,button,image,weight:.78+Math.random()*.45};
 });
 observer=new ResizeObserver(()=>{hideLabel();arrange();});observer.observe(collage);arrange();
}
toggle.addEventListener('click',()=>setIntro(toggle.getAttribute('aria-expanded')!=='true'));
document.getElementById('enterArchive').addEventListener('click',enter);
document.querySelector('body > .masthead .brand').addEventListener('click',e=>{e.preventDefault();showCover();});
document.addEventListener('keydown',e=>{if(!cover.hidden&&e.key==='Escape')hideLabel();});
document.body.classList.add('cover-open');background.forEach(el=>el.inert=true);
if(innerWidth<=760)setIntro(false);
fetch('cover-items.json').then(r=>{if(!r.ok)throw new Error('封面图像清单未载入');return r.json();}).then(d=>mount(d.items)).catch(()=>{collage.querySelector('.cover-loading').textContent='封面图像暂未载入，可点击“开始探索”浏览完整档案。';});
