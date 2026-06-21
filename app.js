/* ===================================================================
   Pokémon Damage Calculator — powered by the official @smogon/calc engine
   v2: custom searchable comboboxes + extra features
   =================================================================== */
const C = window.SmogonCalc;
const { calculate, Generations, Pokemon, Move, Field, Side } = C;

const TYPES = ["Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison",
  "Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"];
const STAT_KEYS = ["hp","atk","def","spa","spd","spe"];
const STAT_LABEL = { hp:"HP", atk:"Atk", def:"Def", spa:"SpA", spd:"SpD", spe:"Spe" };
const STATUSES = [
  {v:"",label:"Healthy"},{v:"brn",label:"Burned"},{v:"psn",label:"Poisoned"},
  {v:"tox",label:"Badly Poisoned"},{v:"par",label:"Paralyzed"},
  {v:"slp",label:"Asleep"},{v:"frz",label:"Frozen"}
];
const WEATHERS = ["","Sun","Rain","Sand","Snow","Hail","Harsh Sunshine","Heavy Rain","Strong Winds"];
const TERRAINS = ["","Electric","Grassy","Psychic","Misty"];
const tid = (s) => (""+s).toLowerCase().replace(/[^a-z0-9]+/g,"");

/* ---- Showdown sprite id ---- */
function spriteId(name){
  const parts = name.split("-");
  const base = tid(parts[0]);
  if (parts.length === 1) return base;
  const forme = tid(parts.slice(1).join(""));
  return forme ? base + "-" + forme : base;
}
function spriteCandidates(name, back){
  const id = spriteId(name);
  const b = "https://play.pokemonshowdown.com/sprites/";
  if (back) return [`${b}ani-back/${id}.gif`, `${b}gen5-back/${id}.png`, `${b}ani/${id}.gif`, `${b}gen5/${id}.png`, `${b}dex/${id}.png`];
  return [`${b}ani/${id}.gif`, `${b}gen5/${id}.png`, `${b}dex/${id}.png`, `${b}home/${id}.png`];
}
function miniSpriteAttrs(name){
  const id = spriteId(name);
  const b = "https://play.pokemonshowdown.com/sprites/";
  return `src="${b}gen5/${id}.png" onerror="this.onerror=null;this.src='${b}dex/${id}.png'"`;
}

/* =================== STATE =================== */
const state = {
  genNum: 9, gameType: "Singles",
  field: { weather:"", terrain:"", isGravity:false },
  sides: {
    atk: { isReflect:false, isLightScreen:false, isAuroraVeil:false, isTailwind:false, isHelpingHand:false },
    def: { isReflect:false, isLightScreen:false, isAuroraVeil:false, isTailwind:false, isHelpingHand:false }
  },
  atk: mkMon("Garchomp", true),
  def: mkMon("Toxapex", false),
};
function mkMon(species, isAtk){
  return {
    species, level: 100, nature: isAtk ? "Jolly" : "Bold",
    ability: "", item: "", status: "",
    teraType: "", terastallized: false,
    evs: isAtk ? {hp:0,atk:252,def:0,spa:0,spd:0,spe:252} : {hp:252,atk:0,def:252,spa:0,spd:4,spe:0},
    ivs: {hp:31,atk:31,def:31,spa:31,spd:31,spe:31},
    boosts: {atk:0,def:0,spa:0,spd:0,spe:0},
    moves: isAtk ? ["Earthquake","Outrage","Stone Edge","Fire Fang"] : ["Scald","","",""],
  };
}
let GEN = null, DATA = {}, activeMove = 0;

/* =================== DATA (per generation) =================== */
function loadGen(){
  GEN = Generations.get(state.genNum);
  const sorted = (arr)=>arr.sort((a,b)=>a.localeCompare(b));
  const spNames=[], spMeta={};
  for (const s of GEN.species){ spNames.push(s.name); spMeta[s.name]={types:s.types}; }
  const mvNames=[], mvMeta={};
  for (const m of GEN.moves){ mvNames.push(m.name); mvMeta[m.name]={type:m.type,cat:m.category,bp:m.basePower}; }
  const abNames=[]; for (const a of GEN.abilities) abNames.push(a.name);
  const itNames=[]; for (const i of GEN.items) itNames.push(i.name);
  const natNames=[], natMeta={}; for (const n of GEN.natures){ natNames.push(n.name); natMeta[n.name]={plus:n.plus,minus:n.minus}; }
  DATA = {
    species: sorted(spNames), spMeta,
    moves: sorted(mvNames), mvMeta,
    abilities: sorted(abNames),
    items: sorted(itNames),
    natures: sorted(natNames), natMeta,
  };
  // build cached combobox item arrays
  DATA.ci = {
    species: DATA.species.map(name=>{
      const types = (spMeta[name]||{}).types || [];
      return { value:name, search:name.toLowerCase(),
        html:`<img loading="lazy" class="mini-sprite sprite-img" ${miniSpriteAttrs(name)} alt="">
              <span class="flex-1 truncate">${name}</span>
              <span class="flex gap-1 shrink-0">${types.map(t=>`<span class="type-dot t-${tid(t)}" title="${t}"></span>`).join("")}</span>` };
    }),
    moves: DATA.moves.map(name=>{
      const m = mvMeta[name]||{};
      return { value:name, search:name.toLowerCase(),
        html:`${m.type?`<span class="type-badge t-${tid(m.type)}">${m.type}</span>`:""}
              <span class="flex-1 truncate">${name}</span>
              ${m.cat?`<span class="cat-badge cat-${tid(m.cat)}">${m.cat[0]}</span>`:""}
              <span class="text-[10px] opacity-50 w-7 text-right shrink-0">${m.bp||""}</span>` };
    }),
    abilities: DATA.abilities.map(name=>({value:name, search:name.toLowerCase(), html:`<span class="flex-1 truncate">${name}</span>`})),
    items: DATA.items.map(name=>({value:name, search:name.toLowerCase(), html:`<span class="flex-1 truncate">${name}</span>`})),
    natures: DATA.natures.map(name=>{
      const n = natMeta[name]||{};
      const eff = (n.plus && n.minus && n.plus!==n.minus) ? `<span class="nat-plus">+${STAT_LABEL[n.plus]}</span> <span class="nat-minus">−${STAT_LABEL[n.minus]}</span>` : `<span class="opacity-40">neutral</span>`;
      return { value:name, search:name.toLowerCase(),
        html:`<span class="flex-1">${name}</span><span class="text-[11px] shrink-0">${eff}</span>` };
    }),
  };
  for (const k of ["atk","def"]) if (!GEN.species.get(tid(state[k].species))) state[k].species = DATA.species[0];
}

/* =================== HELPERS / CALC =================== */
function speciesObj(name){ return GEN.species.get(tid(name)); }
function defaultAbility(name){ const sp=speciesObj(name); if(!sp||!sp.abilities) return ""; return sp.abilities[0]||sp.abilities["0"]||""; }
const clamp = (v,a,b)=> Math.max(a, Math.min(b, isNaN(+v)?0:+v));
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;

function buildMon(side){
  const m = state[side];
  const opts = { level:clamp(m.level,1,100), nature:m.nature, evs:{...m.evs}, ivs:{...m.ivs}, boosts:{...m.boosts} };
  if (m.ability) opts.ability=m.ability;
  if (m.item) opts.item=m.item;
  if (m.status) opts.status=m.status;
  if (state.genNum>=9 && m.terastallized && m.teraType) opts.teraType=m.teraType;
  try { return new Pokemon(GEN, m.species, opts); } catch(e){ return new Pokemon(GEN, m.species, {level:opts.level}); }
}
function buildField(){
  return new Field({ gameType:state.gameType, weather:state.field.weather||undefined,
    terrain:state.field.terrain||undefined, isGravity:state.field.isGravity,
    attackerSide:new Side(state.sides.atk), defenderSide:new Side(state.sides.def) });
}
function effectiveness(move, defender){
  if (!move.type || move.category==="Status") return 1;
  try {
    const tc=C.TYPE_CHART; const chart = tc[state.genNum] || tc[Math.max(...Object.keys(tc).map(Number))];
    let mult=1; for (const dt of (defender.types||[])){ const row=chart[move.type]; if(row&&row[dt]!=null) mult*=row[dt]; }
    return mult;
  } catch(e){ return 1; }
}
function calcMove(moveName){
  if (!moveName || !moveName.trim()) return null;
  if (!GEN.moves.get(tid(moveName.trim()))) return {error:`not available in Gen ${state.genNum}`, notInGen:true};
  let move; try { move=new Move(GEN, moveName.trim()); } catch(e){ return {error:"unknown move"}; }
  const attacker=buildMon("atk"), defender=buildMon("def");
  let result; try { result=calculate(GEN, attacker, defender, move, buildField()); } catch(e){ return {error:String(e.message||e)}; }
  const maxHP=defender.maxHP();
  const range=result.range?result.range():[0,0];
  const [lo,hi]=[range[0],range[1]];
  let desc="",ko=""; try{desc=result.desc();}catch(e){} try{const k=result.kochance();ko=k&&k.text?k.text:"";}catch(e){}
  let rolls=null; try{ const d=result.damage; if(Array.isArray(d)&&typeof d[0]==="number") rolls=d; }catch(e){}
  return { move:{name:move.name,type:move.type,category:move.category,bp:result.move?result.move.bp:move.bp},
    lo,hi, pctLo:(lo/maxHP)*100, pctHi:(hi/maxHP)*100, maxHP, desc, ko,
    eff:effectiveness(move,defender), immune:hi===0, rolls };
}

/* =================== COMBOBOX ENGINE =================== */
let openCombo = null;
function closeCombo(){ if(openCombo){ openCombo.pop.remove(); openCombo.trigger.classList.remove("open"); document.removeEventListener("mousedown", openCombo.outside, true); openCombo=null; } }

function comboConfig(type){
  switch(type){
    case "species": return { items:()=>DATA.ci.species, ph:"Search Pokémon…" };
    case "move":    return { items:()=>[{value:"",search:"",html:`<span class="opacity-50">— empty —</span>`}, ...DATA.ci.moves], ph:"Search moves…" };
    case "ability": return { items:(side)=>[{value:"",search:"default",html:`<span class="opacity-60">Default${defaultAbility(state[side].species)?` (${defaultAbility(state[side].species)})`:""}</span>`}, ...DATA.ci.abilities], ph:"Search abilities…" };
    case "item":    return { items:()=>[{value:"",search:"none",html:`<span class="opacity-60">No item</span>`}, ...DATA.ci.items], ph:"Search items…" };
    case "nature":  return { items:()=>DATA.ci.natures, ph:"Search natures…" };
    case "status":  return { items:()=>STATUSES.map(s=>({value:s.v,search:s.label.toLowerCase(),html:`<span>${s.label}</span>`})), ph:null };
    case "tera":    return { items:()=>[{value:"",search:"none",html:`<span class="opacity-60">— none —</span>`}, ...TYPES.concat(["Stellar"]).map(t=>({value:t,search:t.toLowerCase(),html:`<span class="type-dot t-${tid(t)}"></span><span>${t}</span>`}))], ph:"Search types…" };
    case "weather": return { items:()=>WEATHERS.map(w=>({value:w,search:(w||"none").toLowerCase(),html:`<span>${w||"No Weather"}</span>`})), ph:null };
    case "terrain": return { items:()=>TERRAINS.map(t=>({value:t,search:(t||"none").toLowerCase(),html:`<span>${t?t+" Terrain":"No Terrain"}</span>`})), ph:null };
    case "gen":     return { items:()=>[1,2,3,4,5,6,7,8,9].map(g=>({value:String(g),search:"gen "+g,html:`<span>Generation ${g}</span>`})), ph:null };
    case "gametype":return { items:()=>["Singles","Doubles"].map(g=>({value:g,search:g.toLowerCase(),html:`<span>${g}</span>`})), ph:null };
  }
}
function curComboValue(type, side, slot){
  switch(type){
    case "species": return state[side].species;
    case "move": return state.atk.moves[slot];
    case "ability": return state[side].ability;
    case "item": return state[side].item;
    case "nature": return state[side].nature;
    case "status": return state[side].status;
    case "tera": return state[side].teraType;
    case "weather": return state.field.weather;
    case "terrain": return state.field.terrain;
    case "gen": return String(state.genNum);
    case "gametype": return state.gameType;
  }
}
function applyComboValue(type, side, slot, value){
  switch(type){
    case "species": state[side].species=value; state[side].ability=""; break;
    case "move": state.atk.moves[slot]=value; break;
    case "ability": state[side].ability=value; break;
    case "item": state[side].item=value; break;
    case "nature": state[side].nature=value; break;
    case "status": state[side].status=value; break;
    case "tera": state[side].teraType=value; if(value) state[side].terastallized=true; break;
    case "weather": state.field.weather=value; break;
    case "terrain": state.field.terrain=value; break;
    case "gen": state.genNum=+value; loadGen(); break;
    case "gametype": state.gameType=value; break;
  }
  render(); renderResults();
}
function openComboFor(trigger){
  closeCombo();
  const {ctype:type, side, slot} = trigger.dataset;
  const cfg = comboConfig(type);
  const items = cfg.items(side);
  const cur = curComboValue(type, side, slot!=null?+slot:undefined);

  const pop = document.createElement("div");
  pop.className = "combo-pop glass";
  pop.innerHTML = `
    ${cfg.ph!==null?`<div class="combo-search-wrap"><span class="combo-search-ico">🔍</span><input class="combo-search" placeholder="${cfg.ph}"></div>`:""}
    <div class="combo-list"></div>
    <div class="combo-count"></div>`;
  document.body.appendChild(pop);
  trigger.classList.add("open");

  const search = pop.querySelector(".combo-search");
  const list = pop.querySelector(".combo-list");
  const countEl = pop.querySelector(".combo-count");
  let filtered = items, hi = Math.max(0, items.findIndex(it=>it.value===cur));

  function draw(){
    const q = search ? search.value.trim().toLowerCase() : "";
    filtered = q ? items.filter(it=>it.search.includes(q)) : items;
    if (hi>=filtered.length) hi=0;
    const shown = filtered.slice(0,80);
    list.innerHTML = shown.map((it,i)=>`<div class="combo-opt ${i===hi?"hi":""} ${it.value===cur?"sel":""}" data-i="${i}">${it.html}</div>`).join("")
      || `<div class="combo-empty">No matches</div>`;
    countEl.textContent = filtered.length>80 ? `Showing 80 of ${filtered.length}` : `${filtered.length} result${filtered.length!==1?"s":""}`;
    const hiEl = list.querySelector(".combo-opt.hi"); if(hiEl) hiEl.scrollIntoView({block:"nearest"});
  }
  function choose(it){ if(!it) return; closeCombo(); applyComboValue(type, side, slot!=null?+slot:undefined, it.value); }

  draw();
  position();
  if (search){
    search.focus();
    search.oninput = ()=>{ hi=0; draw(); };
    search.onkeydown = (e)=>{
      if (e.key==="ArrowDown"){ e.preventDefault(); hi=Math.min(hi+1, Math.min(filtered.length,80)-1); draw(); }
      else if (e.key==="ArrowUp"){ e.preventDefault(); hi=Math.max(hi-1,0); draw(); }
      else if (e.key==="Enter"){ e.preventDefault(); choose(filtered[hi]); }
      else if (e.key==="Escape"){ e.preventDefault(); closeCombo(); }
    };
  }
  list.onclick = (e)=>{ const o=e.target.closest("[data-i]"); if(o) choose(filtered.slice(0,80)[+o.dataset.i]); };

  function position(){
    const r = trigger.getBoundingClientRect();
    const w = Math.max(240, r.width);
    let left = Math.min(r.left, window.innerWidth - w - 8);
    pop.style.width = w+"px"; pop.style.left = Math.max(8,left)+"px";
    const ph = pop.offsetHeight, below = window.innerHeight - r.bottom;
    pop.style.top = (below < ph+12 && r.top > below) ? Math.max(8, r.top - ph - 6)+"px" : (r.bottom + 6)+"px";
  }
  const outside = (e)=>{ if(!pop.contains(e.target) && !trigger.contains(e.target)) closeCombo(); };
  document.addEventListener("mousedown", outside, true);
  openCombo = { pop, trigger, outside };
}

/* trigger HTML generators */
function comboTrigger(type, side, slot, opts={}){
  const ds = `data-ctype="${type}"${side?` data-side="${side}"`:""}${slot!=null?` data-slot="${slot}"`:""}`;
  let inner = opts.inner;
  if (!inner){ const v=curComboValue(type,side,slot); inner = v ? `<span class="truncate">${v}</span>` : `<span class="ph">${opts.ph||"Select…"}</span>`; }
  return `<button class="combo-trigger" ${ds}>${inner}<span class="chev">▾</span></button>`;
}

/* =================== RENDER =================== */
const $app = document.getElementById("app");
function render(){
  $app.innerHTML = `
    ${header()}
    ${fieldBar()}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 relative">
      ${monPanel("atk")}
      ${monPanel("def")}
    </div>
    <div class="flex justify-center -my-1 relative z-10">
      <button id="swap-btn" class="swap-btn" title="Swap attacker & defender">⇄ Swap</button>
    </div>
    ${battleStage()}
    ${results()}
    <div class="text-center text-[11px] opacity-50 mt-6 pb-4">Damage engine: official <b>@smogon/calc</b> · Sprites: Pokémon Showdown</div>`;
  wire(); updateSprites();
}

function header(){
  return `
  <div class="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2 mr-auto">
      <div class="w-9 h-9 rounded-full relative shadow-md" style="background:linear-gradient(#ef4444 0 50%,#fff 50% 100%);">
        <div class="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white border-2 border-gray-800" style="top:50%;left:50%;transform:translate(-50%,-50%)"></div>
        <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gray-800"></div>
      </div>
      <div><div class="font-extrabold text-base sm:text-lg leading-tight">Damage Calculator</div>
        <div class="text-[10px] opacity-60 -mt-0.5">Smogon engine · all generations</div></div>
    </div>
    <div style="width:130px">${comboTrigger("gen",null,null,{inner:`<span>Gen ${state.genNum}</span>`})}</div>
    <div style="width:120px">${comboTrigger("gametype",null,null,{})}</div>
    <button id="theme-btn" class="ico-btn" title="Toggle theme">🌓</button>
  </div>`;
}
function fieldBar(){
  return `
  <div class="glass rounded-2xl px-4 py-3 mt-4 flex flex-wrap items-center gap-3">
    <span class="text-[11px] font-bold uppercase tracking-wide opacity-60">Field</span>
    <div style="width:170px">${comboTrigger("weather",null,null,{inner:`<span>${state.field.weather||"No Weather"}</span>`})}</div>
    <div style="width:170px">${comboTrigger("terrain",null,null,{inner:`<span>${state.field.terrain?state.field.terrain+" Terrain":"No Terrain"}</span>`})}</div>
    <label class="flex items-center gap-1.5 text-xs cursor-pointer select-none"><input type="checkbox" id="fld-gravity" ${state.field.isGravity?"checked":""}> Gravity</label>
  </div>`;
}
function sideToggles(side){
  const s=state.sides[side];
  const items=[["isReflect","Reflect"],["isLightScreen","Light Screen"],["isAuroraVeil","Aurora Veil"],["isTailwind","Tailwind"],["isHelpingHand","Helping Hand"]];
  return `<div class="flex flex-wrap gap-x-3 gap-y-1 mt-1">${items.map(([k,l])=>`
    <label class="flex items-center gap-1 text-[11px] cursor-pointer select-none opacity-90"><input type="checkbox" data-side="${side}" data-skey="${k}" ${s[k]?"checked":""}> ${l}</label>`).join("")}</div>`;
}
function monPanel(side){
  const m=state[side], isAtk=side==="atk", sp=speciesObj(m.species), types=sp?sp.types:[];
  const accent=isAtk?"from-red-500/15 to-orange-500/10":"from-blue-500/15 to-indigo-500/10";
  const label=isAtk?"⚔️ Attacker":"🛡️ Defender";
  let stats={},maxhp=""; try{const b=buildMon(side);stats=b.stats;maxhp=b.maxHP();}catch(e){}
  const evTotal=STAT_KEYS.reduce((a,k)=>a+(+m.evs[k]||0),0);
  return `
  <div class="glass rounded-2xl overflow-hidden" data-panel="${side}">
    <div class="bg-gradient-to-r ${accent} px-4 py-2 flex items-center justify-between">
      <span class="font-bold text-sm">${label}</span>
      <div class="flex gap-1 items-center">${types.map(t=>typeBadge(t)).join("")}
        ${(state.genNum>=9&&m.terastallized&&m.teraType)?`<span class="type-badge t-${tid(m.teraType)}" title="Terastallized">✦ ${m.teraType}</span>`:""}</div>
    </div>
    <div class="p-4 grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
      <div class="flex sm:flex-col items-center gap-2">
        <div class="w-28 h-28 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 relative">
          <img class="sprite-img floaty max-w-[96px] max-h-[96px]" data-sprite="${side}" alt="${m.species}">
          <button class="ico-btn absolute bottom-1 right-1" data-random="${side}" title="Random Pokémon">🎲</button>
        </div>
        <div class="text-center"><div class="text-xs font-bold">${m.species}</div><div class="text-[10px] opacity-60">${maxhp?("HP "+maxhp):""}</div></div>
      </div>
      <div class="space-y-2">
        <div><label class="fld-label">Pokémon</label>
          ${comboTrigger("species",side,null,{inner:`<img class="mini-sprite sprite-img" ${miniSpriteAttrs(m.species)} alt=""><span class="flex-1 truncate font-semibold">${m.species}</span>`})}</div>
        <div class="grid grid-cols-3 gap-2">
          <div><label class="fld-label">Level</label><input type="number" min="1" max="100" class="fld" data-f="level" data-side="${side}" value="${m.level}"></div>
          <div><label class="fld-label">Nature</label>${comboTrigger("nature",side,null,{})}</div>
          <div><label class="fld-label">Status</label>${comboTrigger("status",side,null,{inner:`<span>${(STATUSES.find(s=>s.v===m.status)||{}).label||"Healthy"}</span>`})}</div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="fld-label">Ability</label>${comboTrigger("ability",side,null,{inner: m.ability?`<span class="truncate">${m.ability}</span>`:`<span class="ph">${defaultAbility(m.species)||"Ability"}</span>`})}</div>
          <div><label class="fld-label">Item</label>${comboTrigger("item",side,null,{inner: m.item?`<span class="truncate">${m.item}</span>`:`<span class="ph">No item</span>`})}</div>
        </div>
        ${state.genNum>=9?`<div class="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div><label class="fld-label">Tera Type</label>${comboTrigger("tera",side,null,{inner: m.teraType?`<span class="type-dot t-${tid(m.teraType)}"></span><span>${m.teraType}</span>`:`<span class="ph">— none —</span>`})}</div>
          <label class="flex items-center gap-1 text-[11px] cursor-pointer select-none pb-2"><input type="checkbox" data-f="terastallized" data-side="${side}" ${m.terastallized?"checked":""}> Tera</label>
        </div>`:""}
        <div>
          <div class="flex items-center justify-between"><label class="fld-label">EVs · IVs · Boosts</label>
            <div class="flex gap-1">${evPresetChips(side)}</div></div>
          <div class="ev-scroll"><div class="ev-grid">
            ${STAT_KEYS.map(k=>`<div class="text-center">
              <div class="text-[9px] font-bold opacity-60">${STAT_LABEL[k]}</div>
              <div class="text-[10px] font-bold ${k==="hp"?"text-emerald-500":"text-blue-500 dark:text-blue-400"}">${stats[k]??""}</div>
              <input type="number" min="0" max="252" step="4" class="fld ev-in" data-ev="${k}" data-side="${side}" value="${m.evs[k]}" title="EVs">
              <input type="number" min="0" max="31" class="fld ev-in mt-0.5 opacity-70" data-iv="${k}" data-side="${side}" value="${m.ivs[k]}" title="IVs">
              ${k!=="hp"?`<input type="number" min="-6" max="6" class="fld ev-in mt-0.5" data-boost="${k}" data-side="${side}" value="${m.boosts[k]}" title="Stat stage">`:`<div class="ev-in mt-0.5"></div>`}
            </div>`).join("")}
          </div></div>
          <div class="text-[9px] opacity-50 mt-0.5">rows: EV / IV / boost · EV total: <b class="${evTotal>508?"text-red-500":""}">${evTotal}</b>/508</div>
        </div>
        ${isAtk ? `${moveSlots()}<div><label class="fld-label">Side conditions (attacker)</label>${sideToggles("atk")}</div>`
                : `<div><label class="fld-label">Side conditions (defender)</label>${sideToggles("def")}</div>`}
      </div>
    </div>
  </div>`;
}
function evPresetChips(side){
  const presets=[["HP","hp"],["Atk","atk"],["Def","def"],["SpA","spa"],["SpD","spd"],["Spe","spe"]];
  return `<span class="chip" data-evpreset="clear" data-side="${side}">Clear</span>`;
}
function moveSlots(){
  const m=state.atk;
  return `<div><label class="fld-label">Moves</label>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      ${m.moves.map((mv,i)=>{
        const meta = mv&&mv.trim()?DATA.mvMeta[mv.trim()]:null;
        const inner = mv&&mv.trim()
          ? `${meta&&meta.type?`<span class="type-badge t-${tid(meta.type)}">${meta.type}</span>`:""}<span class="flex-1 truncate font-semibold">${mv.trim()}</span>`
          : `<span class="ph">Move ${i+1}</span>`;
        return `<div class="move-slot rounded-lg border ${i===activeMove?"active":"border-black/10 dark:border-white/10"} p-1.5" data-moveslot="${i}">
          <div class="flex items-center gap-1 mb-1 px-1"><span class="text-[10px] font-bold opacity-50">${i+1}</span></div>
          ${comboTrigger("move","atk",i,{inner})}</div>`;
      }).join("")}
    </div></div>`;
}
function typeBadge(t){ return `<span class="type-badge t-${tid(t)}">${t}</span>`; }

function battleStage(){
  return `
  <div class="glass rounded-2xl mt-2 p-4 relative overflow-hidden">
    <div class="absolute inset-0 opacity-[0.07] pointer-events-none" style="background:radial-gradient(circle at 30% 30%,#3b82f6,transparent 40%),radial-gradient(circle at 70% 70%,#ef4444,transparent 40%)"></div>
    <div class="relative flex items-end justify-between gap-4">
      <div class="flex-1 text-center"><img class="sprite-img inline-block max-h-[110px]" data-stage="atk" alt=""><div class="text-xs font-bold mt-1">${state.atk.species}</div></div>
      <div class="text-3xl sm:text-4xl font-black opacity-30 select-none">VS</div>
      <div class="flex-1">
        <div class="mb-2 px-2"><div class="flex items-center justify-between text-[11px] font-bold mb-1"><span>${state.def.species}</span><span data-hp-pct>100%</span></div>
          <div class="hp-track h-3 relative"><div class="hp-fill hp-green" data-hp-fill style="width:100%"></div></div></div>
        <div class="text-center"><img class="sprite-img inline-block max-h-[110px]" data-stage="def" alt=""></div>
      </div>
    </div>
  </div>`;
}
function results(){ return `<div class="mt-4 space-y-2" id="results-area"></div>`; }

/* =================== SPRITES =================== */
function applySprite(img,name,back){ const c=spriteCandidates(name,back); let i=0; img.onerror=()=>{i++; if(i<c.length) img.src=c[i]; else img.onerror=null;}; img.src=c[0]; }
function updateSprites(){
  document.querySelectorAll('[data-sprite]').forEach(img=>applySprite(img,state[img.getAttribute('data-sprite')].species,img.getAttribute('data-sprite')==="atk"));
  const sa=document.querySelector('[data-stage="atk"]'), sd=document.querySelector('[data-stage="def"]');
  if(sa) applySprite(sa,state.atk.species,true); if(sd) applySprite(sd,state.def.species,false);
}

/* =================== RESULTS =================== */
function renderResults(){
  const area=document.getElementById("results-area"); if(!area) return;
  const res=state.atk.moves.map((mv,i)=>({i,mv,r:calcMove(mv)}));
  area.innerHTML = res.map(({i,mv,r})=>{
    if(!mv||!mv.trim()||!r) return "";
    if(r.error) return `<div class="glass rounded-xl px-4 py-2 text-xs flex items-center gap-2 opacity-80"><span class="font-bold">${mv}</span><span class="opacity-60">${r.error}</span></div>`;
    const effClass=r.immune?"eff-immune":r.eff>1?"eff-super":r.eff<1?"eff-not":"eff-neutral";
    const effText=r.immune?"Immune":r.eff>1?`Super effective ×${r.eff}`:r.eff<1?`Not very effective ×${r.eff}`:"Neutral";
    const barColor=r.pctHi>=100?"hp-red":r.pctHi>=50?"hp-yellow":"hp-green";
    const pctTxt=r.immune?"0%":`${r.pctLo.toFixed(1)} – ${r.pctHi.toFixed(1)}%`;
    return `<div class="glass rounded-xl p-3 ${i===activeMove?"ring-2 ring-blue-500/60":""} cursor-pointer" data-resslot="${i}">
      <div class="flex items-center gap-2 flex-wrap">${typeBadge(r.move.type)}<span class="font-bold text-sm">${r.move.name}</span>
        <span class="cat-badge cat-${tid(r.move.category)}">${r.move.category}</span>${r.move.bp?`<span class="text-[11px] opacity-60">BP ${r.move.bp}</span>`:""}
        <span class="eff-pill ${effClass} ml-auto">${effText}</span></div>
      <div class="mt-2 flex items-center gap-3 flex-wrap">
        <div class="text-lg font-extrabold tabular-nums">${r.immune?"0":r.lo+"–"+r.hi}</div>
        <div class="text-xs opacity-70">${pctTxt} of HP</div>
        ${r.ko?`<div class="ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${koClass(r.ko)}">${cap(r.ko)}</div>`:""}</div>
      <div class="hp-track h-2 mt-2"><div class="hp-fill ${barColor}" style="width:${Math.min(100,r.pctHi).toFixed(1)}%"></div></div>
      ${r.rolls&&!r.immune?`<div class="mt-2"><div class="text-[9px] opacity-50 mb-0.5">damage rolls (${r.rolls.length})</div><div class="rolls">${sparkline(r.rolls)}</div></div>`:""}
      <div class="flex items-start gap-2 mt-2"><div class="text-[11px] font-mono opacity-75 flex-1 break-words leading-snug">${r.desc||(r.immune?"The target is immune.":"")}</div>
        ${r.desc?`<button class="ico-btn shrink-0" data-copy="${encodeURIComponent(r.desc)}" title="Copy">📋</button>`:""}</div>
    </div>`;
  }).join("") || `<div class="glass rounded-xl px-4 py-3 text-xs opacity-60">Add a move to the attacker to see damage.</div>`;

  area.querySelectorAll('[data-resslot]').forEach(el=>el.addEventListener("click",(ev)=>{
    if(ev.target.closest("[data-copy]")) return;
    activeMove=+el.getAttribute("data-resslot"); renderResults();
    const r=calcMove(state.atk.moves[activeMove]); if(r&&!r.error) playAttack(r);
  }));
  area.querySelectorAll('[data-copy]').forEach(el=>el.addEventListener("click",(ev)=>{ ev.stopPropagation(); copyText(decodeURIComponent(el.dataset.copy)); }));
  const ar=calcMove(state.atk.moves[activeMove]); if(ar&&!ar.error) updateHPBar(ar);
}
function sparkline(rolls){ const max=Math.max(...rolls)||1; return rolls.map(v=>`<div class="roll-bar" style="height:${Math.max(8,(v/max)*100)}%" title="${v}"></div>`).join(""); }
function koClass(t){ t=t.toLowerCase(); if(t.includes("guaranteed ohko")||t.includes("guaranteed 2hko")) return "bg-red-500 text-white"; if(t.includes("ohko")||t.includes("2hko")) return "bg-orange-500 text-white"; return "bg-gray-400/30"; }
function updateHPBar(r){ const fill=document.querySelector('[data-hp-fill]'),pctEl=document.querySelector('[data-hp-pct]'); if(!fill)return;
  const remaining=Math.max(0,100-Math.min(100,r.pctHi)); fill.style.width=remaining+"%";
  fill.className="hp-fill "+(remaining<=20?"hp-red":remaining<=50?"hp-yellow":"hp-green"); if(pctEl) pctEl.textContent=remaining.toFixed(0)+"%"; }
function playAttack(r){ const atk=document.querySelector('[data-stage="atk"]'),def=document.querySelector('[data-stage="def"]');
  if(atk){atk.classList.remove("attack-right");void atk.offsetWidth;atk.classList.add("attack-right");}
  setTimeout(()=>{ if(def&&!r.immune){def.classList.remove("shake","hitflash");void def.offsetWidth;def.classList.add("shake","hitflash");} updateHPBar(r); },220); }
function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),1400); }
function copyText(text){
  const done=()=>toast("Copied!");
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text){
  const ta=document.createElement("textarea"); ta.value=text;
  ta.style.cssText="position:fixed;top:0;left:0;opacity:0;"; document.body.appendChild(ta);
  ta.focus(); ta.select();
  try{ document.execCommand("copy"); toast("Copied!"); }catch(e){ toast("Press Ctrl/Cmd+C"); }
  ta.remove();
}

/* =================== WIRING =================== */
function wire(){
  document.querySelectorAll(".combo-trigger").forEach(el=>el.addEventListener("click",()=>{ if(el.classList.contains("open")) closeCombo(); else openComboFor(el); }));
  byId("theme-btn").onclick=()=>document.documentElement.classList.toggle("dark");
  byId("fld-gravity").onchange=e=>{state.field.isGravity=e.target.checked;renderResults();};
  byId("swap-btn").onclick=()=>{ const a=state.atk,d=state.def; state.atk=d; state.def=a; const sa=state.sides.atk; state.sides.atk=state.sides.def; state.sides.def=sa; render(); renderResults(); toast("Swapped sides"); };

  document.querySelectorAll('input[data-skey]').forEach(el=>el.onchange=()=>{state.sides[el.dataset.side][el.dataset.skey]=el.checked;renderResults();});
  document.querySelectorAll('[data-f]').forEach(el=>{
    el.addEventListener("change",()=>{ const side=el.dataset.side,f=el.dataset.f; let val=el.type==="checkbox"?el.checked:el.value;
      if(f==="level") val=clamp(val,1,100); state[side][f]=val; render(); renderResults(); });
  });
  document.querySelectorAll('[data-ev]').forEach(el=>el.onchange=()=>{state[el.dataset.side].evs[el.dataset.ev]=clamp(el.value,0,252);render();renderResults();});
  document.querySelectorAll('[data-iv]').forEach(el=>el.onchange=()=>{state[el.dataset.side].ivs[el.dataset.iv]=clamp(el.value,0,31);render();renderResults();});
  document.querySelectorAll('[data-boost]').forEach(el=>el.onchange=()=>{state[el.dataset.side].boosts[el.dataset.boost]=clamp(el.value,-6,6);render();renderResults();});
  document.querySelectorAll('[data-evpreset]').forEach(el=>el.onclick=()=>{ const s=state[el.dataset.side]; s.evs={hp:0,atk:0,def:0,spa:0,spd:0,spe:0}; render(); renderResults(); });
  document.querySelectorAll('[data-random]').forEach(el=>el.addEventListener("click",(ev)=>{ ev.stopPropagation(); const side=el.dataset.random; state[side].species=DATA.species[Math.floor(Math.random()*DATA.species.length)]; state[side].ability=""; render(); renderResults(); }));

  document.querySelectorAll('[data-moveslot]').forEach(el=>el.addEventListener("click",(ev)=>{
    if(ev.target.closest(".combo-trigger")) return;
    activeMove=+el.getAttribute("data-moveslot"); render(); renderResults();
    const r=calcMove(state.atk.moves[activeMove]); if(r&&!r.error) playAttack(r);
  }));
}
const byId=id=>document.getElementById(id);
window.addEventListener("resize", closeCombo);

/* =================== BOOT =================== */
loadGen(); render(); renderResults();
