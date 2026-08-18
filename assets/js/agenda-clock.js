(function(){
  const RECOVERY_KEY='beautymove.mvp.recovery.v1';
  const STATE_KEY='beautymove.mvp.state';

  // Recuperação controlada dos dados demonstrativos que estavam visíveis na Agenda.
  // Só executa uma vez e nunca sobrescreve atendimentos já existentes.
  try{
    if(localStorage.getItem(RECOVERY_KEY)!=='1'){
      const today=new Date();
      const y=today.getFullYear(),m=String(today.getMonth()+1).padStart(2,'0'),d=String(today.getDate()).padStart(2,'0');
      const date=`${y}-${m}-${d}`;
      const state=JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{appointments:[],opportunities:[],transactions:[]};
      state.appointments=Array.isArray(state.appointments)?state.appointments:[];
      state.opportunities=Array.isArray(state.opportunities)?state.opportunities:[];
      state.transactions=Array.isArray(state.transactions)?state.transactions:[];

      if(!state.appointments.some(a=>a.date===date)){
        state.appointments.push({
          id:`recovery-${date}-marta-ana`,
          date,
          time:'08:00',
          professional:'Ana',
          client:'MARTA',
          service:'Coloração + Luzes + Corte feminino',
          services:[
            {name:'Coloração',duration:120,value:150},
            {name:'Luzes',duration:180,value:250},
            {name:'Corte feminino',duration:60,value:80}
          ],
          duration:360,
          value:480,
          status:'agendado',
          source:'agenda-recovery'
        });
      }

      if(!state.opportunities.some(o=>o.date===date&&o.source==='sos'&&o.time==='10:00')){
        state.opportunities.push({
          id:`recovery-sos-${date}-10`,
          date,
          time:'10:00',
          client:'KLJLKJLK',
          service:'Corte feminino + Escova',
          specialty:'Cabelos',
          radius:'5 km',
          status:'aberta',
          source:'sos'
        });
      }

      localStorage.setItem(STATE_KEY,JSON.stringify(state));
      localStorage.setItem(RECOVERY_KEY,'1');
      window.location.reload();
      return;
    }
  }catch(_){
    // A Agenda segue funcionando mesmo se o armazenamento estiver indisponível.
  }

  const clockEl=document.querySelector('.current-clock');
  const grid=document.querySelector('#agendaGrid');
  if(!clockEl||!grid)return;

  function nowTime(){
    return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  }

  function localDateKey(date){
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  function updateClock(){
    const now=new Date();
    const hh=String(now.getHours()).padStart(2,'0');
    const mm=String(now.getMinutes()).padStart(2,'0');
    const ss=String(now.getSeconds()).padStart(2,'0');
    const time=clockEl.querySelector('.current-clock-time');
    if(time)time.textContent=`${hh}:${mm}:${ss}`;
    updateTimeLine();
  }

  function updateTimeLine(){
    const shell=grid.querySelector('.agenda-shell-v2')||grid;
    const scroll=grid.querySelector('.agenda-scroll-v2');
    const table=grid.querySelector('.agenda-grid');
    if(!scroll||!table)return;
    let line=shell.querySelector('.current-time-line');
    if(!line){
      line=document.createElement('div');
      line.className='current-time-line';
      line.innerHTML='<span class="current-time-label"></span>';
      shell.appendChild(line);
    }
    const now=new Date();
    const picker=document.querySelector('#agendaDatePicker');
    if(picker&&picker.value&&picker.value!==localDateKey(now)){line.style.display='none';return;}
    const minutes=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
    const start=8*60;
    const end=18*60;
    if(minutes<start||minutes>end){line.style.display='none';return;}
    const rows=table.querySelectorAll('tbody tr');
    if(!rows.length){line.style.display='none';return;}
    const totalRows=rows.length;
    const rowMinutes=(end-start)/totalRows;
    const index=Math.min(totalRows-1,Math.floor((minutes-start)/rowMinutes));
    const row=rows[index];
    if(!row){line.style.display='none';return;}
    const rowRect=row.getBoundingClientRect();
    const shellRect=shell.getBoundingClientRect();
    const fraction=((minutes-start)-index*rowMinutes)/rowMinutes;
    const y=rowRect.top-shellRect.top+fraction*rowRect.height;
    line.style.top=`${y}px`;
    line.style.display='block';
    const label=line.querySelector('.current-time-label');
    if(label)label.textContent=nowTime().slice(0,5);
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(updateTimeLine));
  observer.observe(grid,{childList:true,subtree:true});
  grid.addEventListener('scroll',updateTimeLine,true);
  window.addEventListener('resize',updateTimeLine);
  setInterval(updateClock,1000);
  updateClock();
})();