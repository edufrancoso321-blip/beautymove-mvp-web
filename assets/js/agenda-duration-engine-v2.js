/* BeautyMove — agenda duration engine v2 */
(function () {
  if (document.body?.dataset?.role !== 'salao') return;

  const STATE_KEY='beautymove.mvp.state', SERVICES_KEY='beautymove.mvp.services';
  const STEP=30;
  const DEFAULT_DURATION={
    'svc-corte-feminino':60,'svc-corte-masculino':60,'svc-escova':30,'svc-hidratacao':60,'svc-coloracao':120,'svc-luzes':180,
    'svc-maos':60,'svc-pes':60,'svc-maos-pes':90,'svc-esmaltacao':45,'svc-limpeza-pele':60,'svc-design-facial':45,
    'svc-virilha':30,'svc-axila':20,'svc-buco':15,'svc-pernas':45,'svc-design-sobrancelhas':30,'svc-henna':45
  };
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const services=()=>{const s=read(SERVICES_KEY,[]);return Array.isArray(s)?s:[]};
  const map=()=>new Map(services().map(s=>[s.id,s]));
  const durationFor=s=>{
    const explicit=Number(s?.durationMinutes||s?.duration||s?.estimatedMinutes||0); if(explicit>0)return explicit;
    if(DEFAULT_DURATION[s?.id])return DEFAULT_DURATION[s.id];
    const n=String(s?.name||'').toLowerCase();
    if(n.includes('luzes')||n.includes('mechas'))return 180;
    if(n.includes('coloração')||n.includes('coloracao'))return 120;
    if(n.includes('escova'))return 30;
    if(n.includes('corte'))return 60;
    if(n.includes('hidrata'))return 60;
    if(n.includes('virilha'))return 30;
    if(n.includes('axila'))return 20;
    if(n.includes('buço')||n.includes('buco'))return 15;
    if(n.includes('sobrancel'))return 30;
    return 60;
  };
  const fmt=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h&&r?`${h}h ${r}min`:h?`${h}h`:`${r}min`};
  const mins=t=>{const [h,m]=String(t).split(':').map(Number);return h*60+m};
  const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const apptServices=a=>{
    if(Array.isArray(a?.services)&&a.services.length)return a.services;
    const sm=map();
    if(Array.isArray(a?.serviceIds)&&a.serviceIds.length)return a.serviceIds.map(id=>sm.get(id)).filter(Boolean);
    if(a?.serviceId&&sm.has(a.serviceId))return [sm.get(a.serviceId)];
    return a?.service?[{name:a.service}]:[];
  };
  const duration=a=>{
    const explicit=Number(a?.durationMinutes||a?.duration||a?.estimatedMinutes||0); if(explicit>0)return explicit;
    return apptServices(a).reduce((sum,s)=>sum+durationFor(s),0);
  };
  const timing=a=>{const start=mins(a.time),d=Math.max(STEP,duration(a));return {start,end:start+d,duration:d,endTime:time(start+d)}};
  const dateIso=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const agendaDateIso=()=>{
    const text=document.querySelector('#agendaDate')?.textContent?.trim();
    if(text==='Hoje')return dateIso();
    const m=String(text||'').match(/(\d{2})\/(\d{2})/);
    return m?`${new Date().getFullYear()}-${m[2]}-${m[1]}`:dateIso();
  };

  function decorateMenus(){
    const sm=map();
    document.querySelectorAll('.service-option').forEach(row=>{
      const input=row.querySelector('input'),strong=row.querySelector('strong'); if(!input||!strong)return;
      const s=sm.get(input.value); if(!s)return;
      const price=strong.dataset.bmPrice||strong.textContent.trim(); strong.dataset.bmPrice=price;
      strong.innerHTML=`${esc(price)}<small style="display:block;text-align:right;color:#6f35e8;font-size:11px;font-weight:600">${fmt(durationFor(s))}</small>`;
    });
  }

  function decorateAgenda(){
    const state=read(STATE_KEY,{appointments:[]});
    const appointments=Array.isArray(state.appointments)?state.appointments.filter(a=>a.status!=='cancelado'):[];
    const current=agendaDateIso();
    document.querySelectorAll('#agendaBody [data-slot]').forEach(cell=>{
      const [start,...rest]=String(cell.dataset.slot).split('-'), professional=rest.join('-'), minute=mins(start);
      const a=appointments.find(x=>x.date===current&&x.professional===professional&&minute>=timing(x).start&&minute<timing(x).end);
      if(!a){
        cell.classList.remove('bm-duration-occupied');
        cell.style.background=''; cell.style.borderLeft=''; cell.style.cursor='pointer';
        return;
      }
      const t=timing(a), isStart=minute===t.start;
      cell.classList.add('bm-duration-occupied');
      cell.style.background=isStart?'#f0e9ff':'#faf8ff';
      cell.style.borderLeft=isStart?'3px solid #7438ff':'3px solid #e4dcf7';
      cell.style.cursor=isStart?'pointer':'not-allowed';
      if(isStart){
        cell.innerHTML=`<strong>${esc(a.client)}</strong><span>${esc(apptServices(a).map(s=>s.name).join(' + '))}</span><small style="display:block;margin-top:3px;color:#6f35e8;font-weight:700">${esc(a.time)} – ${esc(t.endTime)} · ${fmt(t.duration)}</small>`;
      }else{
        cell.innerHTML=`<span style="font-size:12px;color:#7b6f8e;font-weight:600">Ocupado até ${esc(t.endTime)}</span>`;
        cell.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();};
      }
    });
  }

  function protectOverlap(e){
    const form=e.target; if(!(form instanceof HTMLFormElement)||form.id!=='appointmentForm')return;
    const picker=document.querySelector('#servicePicker'), professional=document.querySelector('#professionalName')?.value, startText=document.querySelector('#appointmentTime')?.value;
    const selection=picker?._getSelected?.(); if(!professional||!startText||!selection?.services?.length)return;
    const start=mins(startText),end=start+selection.services.reduce((sum,s)=>sum+durationFor(s),0), state=read(STATE_KEY,{appointments:[]});
    const conflict=(state.appointments||[]).some(a=>a.status!=='cancelado'&&a.date===dateIso()&&a.professional===professional&&start<timing(a).end&&end>timing(a).start);
    if(conflict){e.preventDefault();e.stopImmediatePropagation();alert(`Esse profissional já possui um atendimento nesse período.\n\nHorário solicitado: ${startText} – ${time(end)}.`);}
  }

  function init(){
    document.addEventListener('submit',protectOverlap,true);
    const detail=document.querySelector('#appointmentDetailBody'); if(detail)new MutationObserver(decorateMenus).observe(detail,{childList:true,subtree:true});
    const agenda=document.querySelector('#agendaBody');
    if(agenda){
      let observing=true;
      const observer=new MutationObserver(()=>{
        if(!observing)return;
        observing=false; observer.disconnect(); decorateMenus(); decorateAgenda(); observer.observe(agenda,{childList:true,subtree:true}); observing=true;
      });
      observer.observe(agenda,{childList:true,subtree:true});
    }
    decorateMenus(); decorateAgenda();
    setTimeout(()=>{decorateMenus();decorateAgenda()},500);
    setTimeout(()=>{decorateMenus();decorateAgenda()},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
