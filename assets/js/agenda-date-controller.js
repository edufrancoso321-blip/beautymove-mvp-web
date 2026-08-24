/* BeautyMove — controlador visual da data da Agenda.
 * O calendário principal é a única autoridade de data.
 * Agenda Profissionais e Agenda S.O.S. apenas refletem essa data.
 */
(function(){
  'use strict';
  const picker=()=>document.getElementById('agendaDatePicker');
  const label=()=>document.getElementById('agendaDate');
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
  const format=value=>{
    if(!value)return 'Hoje';
    const d=new Date(`${value}T12:00:00`);
    if(Number.isNaN(d.getTime()))return value;
    return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
  };
  function render(){
    const p=picker(),l=label();
    if(!p||!l)return;
    if(!p.value)p.value=today();
    l.textContent=format(p.value);
    l.setAttribute('aria-label',`Data selecionada: ${format(p.value)}`);
  }
  function boot(){
    render();
    picker()?.addEventListener('change',render);
    document.getElementById('prevDay')?.addEventListener('click',()=>setTimeout(render,0));
    document.getElementById('nextDay')?.addEventListener('click',()=>setTimeout(render,0));
    document.getElementById('todayBtn')?.addEventListener('click',()=>setTimeout(render,0));
    window.addEventListener('beautymove:agenda-date-changed',render);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
