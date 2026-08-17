/* Identificação informativa de ocorrências no cabeçalho da Agenda. */
(function(){
  const KEY='beautymove.mvp.professional.daily-status';
  const PROFESSIONALS=['Ana','Bruna','Paula','Carla'];
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
  function dateKey(){const p=document.getElementById('agendaDatePicker');if(p&&p.value)return p.value;const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function record(name){const v=read()[`${dateKey()}::${name}`];return typeof v==='string'?{status:v}:v||{status:'unregistered'};}
  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function occurrenceText(rec){if(!rec.absenceType)return '';if(rec.absenceType==='during_day'){return `${rec.absenceReason||'Interrupção do expediente'}${rec.absenceStart?` · a partir de ${rec.absenceStart}`:''}`;}return rec.absenceType==='full_notice'?'Ausência com aviso prévio':'Não compareceu';}
  function inject(){const grid=document.getElementById('agendaGrid');if(!grid)return;grid.querySelectorAll('thead th:not(.time-col):not(.sos-col)').forEach(th=>{const name=th.querySelector('.professional-name')?.textContent.trim();if(!PROFESSIONALS.includes(name))return;let box=th.querySelector('.professional-header-occurrence');const text=occurrenceText(record(name));if(!text){box?.remove();return;}if(!box){box=document.createElement('div');box.className='professional-header-occurrence';th.appendChild(box);}box.innerHTML=`<span class="occurrence-label">Ocorrência</span><span class="occurrence-text">${esc(text)}</span>`;});}
  function styles(){if(document.getElementById('professionalHeaderOccurrenceStyles'))return;const s=document.createElement('style');s.id='professionalHeaderOccurrenceStyles';s.textContent=`.professional-header-occurrence{display:block;margin:7px 8px 0;padding:5px 7px;border:1px solid #e3e0e6;border-radius:6px;background:#fff;color:#5f5968;text-align:left;cursor:default;pointer-events:none;box-shadow:none}.professional-header-occurrence .occurrence-label{display:block;font-size:9px;line-height:1.1;font-weight:700;color:#5f5968;margin-bottom:2px}.professional-header-occurrence .occurrence-text{display:block;font-size:9px;line-height:1.25;font-weight:500;color:#6f6878}`;document.head.appendChild(s);}
  function boot(){styles();inject();setInterval(inject,1000);}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450));
})();
