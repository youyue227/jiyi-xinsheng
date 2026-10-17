import {productMatches} from './engine.js';
const key=path=>JSON.stringify(path);
const unmarked=['其他','未标注二级','未确认产品'];
const periodKey=r=>r.year+'|'+r.issue;
export function buildHierarchy(data){
 const nodes=new Map(),records=new Map(data.records.map(r=>[r.id,r]));
 const root={key:key([]),path:[],level:0,label:'全部广告',short:'全部广告',color:'#eee9dd',children:[],ads:new Set(),mentions:0};nodes.set(root.key,root);
 const categories=new Map(data.categories.map(c=>[c.name,c]));
 function add(path,id,mention=true){let parent=root;root.ads.add(id);if(mention)root.mentions++;for(let level=1;level<=4;level++){const sub=path.slice(0,level),k=key(sub);if(!nodes.has(k)){const c=categories.get(path[0]),[year,issue]=level===4?sub[3].split('|').map(Number):[];const n={key:k,path:sub,level,label:level===4?`${year}年第${issue}期`:sub.at(-1),short:level===4?String(year).slice(-2)+'-'+issue:level===1?(c?.short||sub[0]):sub.at(-1),year,issue,color:c?.color||'#84868D',children:[],ads:new Set(),mentions:0};nodes.set(k,n);parent.children.push(n);}const n=nodes.get(k);n.ads.add(id);if(mention)n.mentions++;parent=n;}}
 for(const r of data.records){if(!r.products.length)add([...unmarked,periodKey(r)],r.id,false);for(const p of r.products)add([p.primary,p.secondary,p.name,periodKey(r)],r.id);}
 root.children.sort((a,b)=>data.categories.findIndex(c=>c.name===a.label)-data.categories.findIndex(c=>c.name===b.label));
 for(const n of nodes.values())if(n.level===3)n.children.sort((a,b)=>a.year-b.year||a.issue-b.issue);
 return {root,nodes,records};
}
export function graphCounts(hierarchy,matches,filters){
 const result=new Map(),add=(path,id)=>{for(let i=0;i<=4;i++){const k=key(path.slice(0,i));if(!result.has(k))result.set(k,new Set());result.get(k).add(id);}};
 for(const r of matches){if(!r.products.length)add([...unmarked,periodKey(r)],r.id);for(const p of r.products)if(productMatches(p,filters))add([p.primary,p.secondary,p.name,periodKey(r)],r.id);}
 return result;
}
export function graphMentionCounts(matches,filters){
 const result=new Map();for(const r of matches)for(const p of r.products)if(productMatches(p,filters)){const path=[p.primary,p.secondary,p.name,periodKey(r)];for(let i=0;i<=4;i++){const k=key(path.slice(0,i));result.set(k,(result.get(k)||0)+1);}}return result;
}
export function orbitLayout(items,count,{images=false,chronological=false}={}){
 const n=items.length,max=Math.max(1,...items.map(count)),radii=items.map(t=>images?74:Math.max(40,Math.sqrt(Math.max(0,count(t))/max)*(chronological?54:68))),out=[],span=Math.PI-.28,gap=18,allMax=Math.max(40,...radii);
 let start=0,previous=0,previousMax=58;
 while(start<n){const maxR=chronological?allMax:Math.max(...radii.slice(start)),remaining=n-start;
  let radius=Math.max(images?250:n<=6?175:275,previous+previousMax+maxR+24);
  if(!start&&remaining<=6)radius=Math.max(radius,remaining<2?0:(2*maxR+gap)/(2*Math.sin(span/(2*(remaining-1)))));
  const step=2*Math.asin(Math.min(1,(2*maxR+gap)/(2*radius))),length=Math.min(remaining,Math.max(1,Math.floor(span/step)+1));
  for(let i=0;i<length;i++){const angle=length===1?0:-span/2+i*span/(length-1);out.push({x:Math.cos(angle)*radius*1.45,y:Math.sin(angle)*radius,r:radii[start+i]});}
  start+=length;previous=radius;previousMax=maxR;
 }if(chronological){out.sort((a,b)=>a.y-b.y||a.x-b.x);out.forEach((p,i)=>p.r=radii[i]);}return out;
}

// Preserve the previous sibling branch and reveal only the adjacent next level.
export function graphScene(hierarchy,path){
 const focus=hierarchy.nodes.get(key(path))||hierarchy.root,origin=path.length?hierarchy.nodes.get(key(path.slice(0,-1))):null,leaf=focus.level===4;
 return {focus,origin,siblings:origin?origin.children.filter(n=>n!==focus):[],children:leaf?[...focus.ads].map(id=>hierarchy.records.get(id)).sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id)):focus.children,leaf};
}

// Place readable circles in a compact half ellipse, expanding width when needed.
export function compactFan(items,count,{height=260,width=470,minRadius=40,maxRadius=68}={}){
 const max=Math.max(1,...items.map(count)),radii=items.map(n=>Math.max(minRadius,Math.sqrt(Math.max(0,count(n))/max)*maxRadius));
 if(!items.length)return [];
 for(let attempt=0;attempt<16;attempt++){
  const extent=width*(1+attempt*.16),points=[];let complete=true;
  for(let i=0;i<items.length;i++){
   const r=radii[i],angle=items.length===1?0:-1.35+2.7*i/(items.length-1),idealX=100+extent*.65*Math.cos(angle),idealY=(height-r-12)*Math.sin(angle);let best=null,bestCost=Infinity;
   for(let y=-height+r+10;y<=height-r-10;y+=10)for(let x=r+88;x<=extent-r-10;x+=10){
    if((x/(extent-r))**2+(y/(height-r))**2>1||points.some(p=>Math.hypot(x-p.x,y-p.y)<r+p.r+16))continue;
    const cost=(x-idealX)**2+(y-idealY)**2;if(cost<bestCost){best={x,y,r};bestCost=cost;}
   }
   if(!best){complete=false;break;}points.push(best);
  }
  if(complete)return points;
 }
 return orbitLayout(items,count);
}
