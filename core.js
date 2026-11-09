/* Núcleo compartilhado: configuração, datas, dados (Supabase ou demonstração). */
(function(){
const C=window.BC01_CONFIG||{};
const live=!!(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&window.supabase);
const sb=live?window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;

const FLATS={summer:{name:'Summer E01',loc:'Porto de Galinhas'},solare:{name:'Solare C01',loc:'Muro Alto'}};
const FIDS=['summer','solare'];
const DAY=86400000;
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MS=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>(n==null||isNaN(n))?'—':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const T=s=>Date.parse(s+'T00:00:00Z');
const iso=ms=>new Date(ms).toISOString().slice(0,10);
const todayIso=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dm=s=>s?s.slice(8,10)+'/'+s.slice(5,7):'';
const dmy=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
const nightsBetween=(a,b)=>Math.max(0,Math.round((T(b)-T(a))/DAY));
const numIn=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return isNaN(n)?null:n};
const monthShift=(ym,n)=>{const [y,m]=ym.split('-').map(Number);return new Date(Date.UTC(y,m-1+n,1)).toISOString().slice(0,7)};
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():'id'+Date.now()+Math.random().toString(16).slice(2));

/* ---------- demonstração (localStorage) ---------- */
const KEY='bc01-demo-v1';
function demoSeed(){
  const t=todayIso(),p=n=>iso(T(t)+n*DAY);
  return {
   flats:[{id:'summer',base:450,base_we:550,cleaning:150},{id:'solare',base:420,base_we:520,cleaning:140}],
   rates:[{id:uuid(),flat:'summer',type:'season',name:'Alta temporada',from_date:'2000-12-15',to_date:'2000-02-28',price:650,price_we:800},
          {id:uuid(),flat:'solare',type:'season',name:'Alta temporada',from_date:'2000-12-15',to_date:'2000-02-28',price:600},
          {id:uuid(),flat:'summer',type:'especial',name:'Réveillon',from_date:'2026-12-29',to_date:'2027-01-02',price:900}],
   bookings:[
    {id:uuid(),flat:'summer',kind:'reserva',guest:'Marina Costa (exemplo)',phone:'',guests:6,checkin:p(3),checkout:p(8),status:'confirmada',adjust:0,rent:2250,cleaning:150,total:2400,payments:[{date:t,amount:800}],notes:''},
    {id:uuid(),flat:'solare',kind:'reserva',guest:'Paulo Rocha (exemplo)',phone:'',guests:4,checkin:p(10),checkout:p(14),status:'pre',adjust:0,rent:1680,cleaning:140,total:1820,payments:[],notes:''},
    {id:uuid(),flat:'summer',kind:'bloqueio',guest:'Uso dos donos',checkin:p(15),checkout:p(18),status:'confirmada',notes:''}],
   expenses:[{id:uuid(),date:t,flat:'ambos',cat:'Condomínio',descr:'Condomínio (exemplo)',amount:780}]
  };
}
function demoLoad(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s)return s}catch(e){}const s=demoSeed();try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}return s}
function demoSave(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}

/* ---------- API de dados ---------- */
const Data={
  live,
  async user(){
    if(!live)return {email:'demonstração'};
    const {data}=await sb.auth.getSession();return data.session?data.session.user:null;
  },
  async signIn(email,password){
    if(!live)return {email:'demonstração'};
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error)throw error;return data.user;
  },
  async signOut(){if(live)await sb.auth.signOut()},
  async loadAll(){
    if(!live){const s=demoLoad();return {flats:s.flats,rates:s.rates,bookings:s.bookings,expenses:s.expenses}}
    const r=await Promise.all(['flats','rates','bookings','expenses'].map(t=>sb.from(t).select('*')));
    r.forEach(x=>{if(x.error)throw x.error});
    return {flats:r[0].data,rates:r[1].data,bookings:r[2].data,expenses:r[3].data};
  },
  async save(table,row){
    if(!row.id)row.id=uuid();
    if(!live){const s=demoLoad(),i=s[table].findIndex(x=>x.id===row.id);if(i>=0)s[table][i]=row;else s[table].push(row);demoSave(s);return row}
    const {error}=await sb.from(table).upsert(row);if(error)throw error;return row;
  },
  async remove(table,id){
    if(!live){const s=demoLoad();s[table]=s[table].filter(x=>x.id!==id);demoSave(s);return}
    const {error}=await sb.from(table).delete().eq('id',id);if(error)throw error;
  },
  /* Público: só flat e datas ocupadas. */
  async availability(){
    const out={summer:[],solare:[]};
    if(!live){demoLoad().bookings.filter(b=>b.status!=='cancelada').forEach(b=>(out[b.flat]||[]).push([b.checkin,b.checkout]));return out}
    const {data,error}=await sb.rpc('availability');if(error)throw error;
    data.forEach(b=>(out[b.flat]||[]).push([b.checkin,b.checkout]));return out;
  },
  resetDemo(){try{localStorage.removeItem(KEY)}catch(e){}}
};


/* Feriados: nacionais, estadual de Pernambuco (Data Magna) e pontos facultativos. Municipais não entram. */
function easterMs(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return Date.UTC(y,mo-1,da)}
const _HC={};
function holidaysOf(y){
  if(_HC[y])return _HC[y];const m={},fx=(mm,dd,n,t)=>{m[y+'-'+mm+'-'+dd]={n,t}},ad=(ms,n,t)=>{m[iso(ms)]={n,t}};
  fx('01','01','Confraternização Universal','nac');fx('03','06','Data Magna de Pernambuco','est');fx('04','21','Tiradentes','nac');fx('06','24','São João','fac');fx('05','01','Dia do Trabalho','nac');
  fx('09','07','Independência do Brasil','nac');fx('10','12','Nossa Senhora Aparecida','nac');fx('11','02','Finados','nac');fx('11','15','Proclamação da República','nac');fx('11','20','Consciência Negra','nac');fx('12','25','Natal','nac');
  const E=easterMs(y);ad(E-48*DAY,'Segunda de Carnaval','fac');ad(E-47*DAY,'Terça de Carnaval','fac');ad(E-46*DAY,'Quarta de Cinzas (até 14h)','fac');ad(E-2*DAY,'Sexta-feira Santa','nac');ad(E+60*DAY,'Corpus Christi','fac');
  return _HC[y]=m;
}
const HTYPE={nac:'feriado nacional',est:'feriado estadual (PE)',fac:'ponto facultativo'};
const holidayAt=d=>holidaysOf(+d.slice(0,4))[d]||null;
function holidaysIn(a,b){const o=[];for(let t=T(a);t<=T(b);t+=DAY){const h=holidayAt(iso(t));if(h)o.push({d:iso(t),...h})}return o}
/* Sugestões prontas para a aba Diárias: [nome, de, até] a partir de hoje, 18 meses */
function holidaySuggestions(from){
  const y=+from.slice(0,4),out=[];
  [y,y+1,y+2].forEach(yy=>{const E=easterMs(yy);
    Object.entries(holidaysOf(yy)).forEach(([d,h])=>{if((h.t!=='fac'||h.n.startsWith('Corpus')||h.n==='São João')&&h.n!=='Sexta-feira Santa')out.push([h.n+(h.t==='fac'?' (ponto facultativo)':''),d,d])});
    out.push(['Carnaval '+yy,iso(E-50*DAY),iso(E-47*DAY)]);out.push(['Semana Santa '+yy,iso(E-2*DAY),iso(E)]);out.push(['Réveillon '+yy,yy+'-12-29',(yy+1)+'-01-02']);});
  const lim=iso(T(from)+548*DAY);
  return out.filter(x=>x[2]>=from&&x[1]<=lim).filter((x,i,a)=>a.findIndex(z=>z[0]===x[0]&&z[1]===x[1])===i&&!/^Segunda de Carnaval|^Terça de Carnaval|^Quarta de Cinzas/.test(x[0])).sort((a,b)=>a[1].localeCompare(b[1]));
}


/* Sugestões de um ano específico */
function holidaySuggestionsYear(yy){
  const E=easterMs(yy),out=[];
  Object.entries(holidaysOf(yy)).forEach(([d,h])=>{if(h.n==='Sexta-feira Santa')return;if(h.t!=='fac'||h.n.startsWith('Corpus')||h.n==='São João')out.push([h.n+(h.t==='fac'?' (ponto facultativo)':''),d,d])});
  out.push(['Carnaval '+yy,iso(E-50*DAY),iso(E-47*DAY)]);out.push(['Semana Santa '+yy,iso(E-2*DAY),iso(E)]);out.push(['Réveillon '+yy,yy+'-12-29',(yy+1)+'-01-02']);
  return out.sort((a,b)=>a[1].localeCompare(b[1]));
}
/* Feriadões: sequências de 3+ dias seguidos (sáb, dom, feriado) com ao menos um feriado; "emenda" quando o feriado cai na terça ou quinta */
function longWeekends(from,to){
  const out=[],off=d=>{const dow=new Date(T(d)).getUTCDay();return dow===0||dow===6||!!holidayAt(d)};
  const bridge=d=>{const dow=new Date(T(d)).getUTCDay(),n=iso(T(d)+DAY),p=iso(T(d)-DAY);return (dow===1&&!!holidayAt(n)&&new Date(T(n)).getUTCDay()===2)||(dow===5&&!!holidayAt(p)&&new Date(T(p)).getUTCDay()===4)};
  let run=[];const flush=()=>{if(run.length>=3){const hs=run.filter(x=>holidayAt(x.d));if(hs.length){out.push({from:run[0].d,to:run[run.length-1].d,days:run.length,names:[...new Set(hs.map(x=>holidayAt(x.d).n))],emenda:run.some(x=>x.b),fac:hs.every(x=>holidayAt(x.d).t==='fac')})}}run=[]};
  for(let t=T(from)-4*DAY;t<=T(to)+4*DAY;t+=DAY){const d=iso(t),b=!off(d)&&bridge(d);if(off(d)||b)run.push({d,b});else flush()}
  flush();
  return out.filter(x=>x.to>=from&&x.from<=to);
}
window.BC={holidaySuggestionsYear,longWeekends,holidayAt,holidaysIn,holidaySuggestions,HTYPE,C,Data,FLATS,FIDS,DAY,MESES,MS,esc,brl,T,iso,todayIso,dm,dmy,nightsBetween,numIn,monthShift,uuid};
})();
