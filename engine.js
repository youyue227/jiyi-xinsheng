export const unique = a => [...new Set(a)];
export function productMatches(p, f, except='') {
  if (except!=='industry' && (f.industries.size || f.secondaries.size) && !f.industries.has(p.primary) && !f.secondaries.has(p.primary+'|'+p.secondary)) return false;
  if (except!=='material' && f.materials.size && !p.materials.some(m=>f.materials.has(m))) return false;
  if (except!=='use' && f.uses.size && !p.uses.some(u=>f.uses.has(u))) return false;
  return true;
}
export function filterRecords(records, f, except='') {
  return records.filter(r=>{
    if (f.query && !r.searchText.includes(f.query.toLowerCase().trim())) return false;
    if (!r.products.length) return (except==='industry' || (!f.industries.size&&!f.secondaries.size) || f.industries.has('其他')) && (except==='material'||!f.materials.size||f.materials.has('未知')) && (except==='use'||!f.uses.size||f.uses.has('其他与未明确'));
    return r.products.some(p=>productMatches(p,f,except));
  });
}
export function countMatches(records, f, metric='mentions', except='') {
  const rows=filterRecords(records,f,except);
  return metric==='ads'?rows.length:rows.reduce((n,r)=>n+r.products.filter(p=>productMatches(p,f,except)).length,0);
}
export function annualCounts(records, f, metric='mentions') {
  const years=unique(records.map(r=>r.year)).sort((a,b)=>a-b),values=new Map(years.map(y=>[y,0]));
  for(const r of filterRecords(records,f))values.set(r.year,values.get(r.year)+(metric==='ads'?1:r.products.filter(p=>productMatches(p,f)).length));
  return years.map(year=>({year,value:values.get(year)}));
}
export function facetCounts(records, f, mode, metric='ads') {
  const counts = new Map(), secondary = new Map();
  for (const r of filterRecords(records,f,mode)) {
    const products=r.products.filter(p=>productMatches(p,f,mode));
    if(metric==='mentions'){
      for(const p of products){for(const t of unique(mode==='industry'?[p.primary]:mode==='material'?p.materials:p.uses))counts.set(t,(counts.get(t)||0)+1);const k=p.primary+'|'+p.secondary;secondary.set(k,(secondary.get(k)||0)+1);}
    }else{
      const values=unique(products.flatMap(p=>mode==='industry'?[p.primary]:mode==='material'?p.materials:p.uses));
      if (!products.length && !r.products.length) values.push(mode==='industry'?'其他':mode==='material'?'未知':'其他与未明确');
      for (const t of values) counts.set(t,(counts.get(t)||0)+1);
      for (const t of unique(products.map(p=>p.primary+'|'+p.secondary))) secondary.set(t,(secondary.get(t)||0)+1);
    }
  }
  return {counts,secondary};
}
export function createLayout(records) {
  const columns=[], years=[], byKey=new Map();
  for (const r of records) {
    const key=r.year+'|'+r.issue;
    if (!byKey.has(key)) {const col={key,year:r.year,issue:r.issue,ads:[],x:columns.length*76};byKey.set(key,col);columns.push(col);}
    byKey.get(key).ads.push(r);
  }
  let x=28;
  for (const col of columns) {if (!years.length||years.at(-1).year!==col.year) {if(years.length)x+=24;years.push({year:col.year,start:x,columns:[]});}col.x=x;years.at(-1).columns.push(col);x+=76;}
  for (const y of years) y.end=y.columns.at(-1).x+70;
  return {columns,years,width:x+28,height:Math.max(...columns.map(c=>c.ads.length))*92+34,byKey};
}
export function layoutVisible(layout, matches) {
  const ids=new Set(matches.map(r=>r.id)), tiles=[];
  for (const col of layout.columns) {
    let row=0;
    for (const ad of col.ads) {tiles.push({ad,col,matched:ids.has(ad.id),x:col.x,y:layout.height-30-(++row)*92,w:68,h:86});}
  }
  return tiles;
}
