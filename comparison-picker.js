const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createComparisonPicker(button,{data,options,getValue,onChange}){
 const menu=document.createElement('div');menu.className='condition-menu';menu.id='conditionMenu'+button.dataset.trendPicker;menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','选择年度对照条件');document.body.append(menu);button.setAttribute('aria-controls',menu.id);
 let step='root',category=null;
 const value=(kind,v)=>JSON.stringify([kind,v]);
 const choice=(label,v,color)=>`<button class="condition-choice ${getValue()===v?'selected':''}" data-choice="${esc(v)}"><i style="background:${color||'#bca876'}"></i><span>${esc(label)}</span><b>${getValue()===v?'✓':''}</b></button>`;
 const branch=(label,next)=>`<button class="condition-branch" data-step="${esc(next)}"><span>${esc(label)}</span><b>›</b></button>`;
 function position(){const r=button.getBoundingClientRect(),w=Math.min(330,innerWidth-24);menu.style.width=w+'px';menu.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left))+'px';const height=menu.offsetHeight,above=r.top-12,below=innerHeight-r.bottom-12;menu.style.top=(below>=height?r.bottom+7:above>=height?r.top-height-7:Math.max(12,innerHeight-height-12))+'px';}
 function draw(){const title=step==='root'?'选择浏览入口':step==='industry'?'产业门类':step==='secondary'?category.short:step==='material'?'材料':'生活用途';
  let content='';
  if(step==='root')content=choice('全部', 'all')+branch('产业门类','industry')+branch('材料','material')+branch('生活用途','use');
  if(step==='industry')content=data.categories.map(c=>`<button class="condition-branch" data-category="${esc(c.name)}"><i style="background:${c.color}"></i><span>${esc(c.name)}</span><b>›</b></button>`).join('');
  if(step==='secondary')content=choice(category.name+'（全部）',value('industries',category.name),category.color)+`<p class="condition-section">二级产品大类</p>`+category.secondaries.map(s=>choice(s,value('secondaries',category.name+'|'+s),category.color)).join('');
  if(step==='material'||step==='use'){const kind=step==='material'?'materials':'uses';content=options.filter(o=>o.group===(step==='material'?'材料':'生活用途')).map(o=>choice(JSON.parse(o.value)[1],o.value,o.color)).join('');}
  menu.innerHTML=`<header><button data-back aria-label="返回上一级条件" ${step==='root'?'hidden':''}>←</button><b>${esc(title)}</b><button data-close aria-label="关闭条件选择">×</button></header><div class="condition-options">${content}</div>`;position();menu.querySelector('.condition-options button')?.focus();
 }
 function close(refocus=false){if(menu.hidden)return;menu.hidden=true;button.setAttribute('aria-expanded','false');if(refocus)button.focus();}
 function open(){step='root';category=null;menu.hidden=false;button.setAttribute('aria-expanded','true');draw();menu.querySelector('.condition-options button')?.focus();}
 button.addEventListener('click',()=>menu.hidden?open():close());
 menu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close')){close(true);return;}if(b.hasAttribute('data-back')){step=step==='secondary'?'industry':'root';category=null;draw();return;}if(b.dataset.choice){onChange(b.dataset.choice);close(true);return;}if(b.dataset.category){category=data.categories.find(c=>c.name===b.dataset.category);step='secondary';draw();return;}if(b.dataset.step){step=b.dataset.step;draw();}});
 document.addEventListener('click',e=>{const path=e.composedPath();if(!path.includes(menu)&&!path.includes(button))close();});document.addEventListener('keydown',e=>{if(!menu.hidden&&e.key==='Escape'){e.preventDefault();close(true);}});window.addEventListener('resize',()=>close());document.addEventListener('scroll',e=>{if(!menu.hidden&&!menu.contains(e.target))close();},true);
 return {close};
}
