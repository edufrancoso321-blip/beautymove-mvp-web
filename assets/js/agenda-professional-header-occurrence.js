/* Identificação informativa de ocorrências na Agenda e no painel da profissional. */
(function(){
  const KEY='beautymove.mvp.professional.daily-status';
  const PROFESSIONALS=['Ana','Bruna','Paula','Carla'];
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
  function dateKey(){const p=document.getElementById('agendaDatePicker');if(p&&p.value)return p.value;const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function record(name){const v=read()[`${dateKey()}::${name}`];return typeof v==='string'?{status:v}:v||{status:'unregistered'};}
  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function occurrenceText(rec){if(!rec.absenceType)return '';if(rec.absenceType==='during_day'){return `${rec.absenceReason||'Interrupção do expediente'}${rec.absenceStart?` · a partir de ${rec.absenceStart}`:''}`;}return rec.absenceType==='full_notice'?'Ausência com aviso prévio':'Não compareceu';}
  function inject(){
    const grid=document.getElementById('agendaGrid');if(!grid)return;
    grid.querySelectorAll('thead th:not(.time-col):not(.sos-col)').forEach(th=>{
      const name=th.querySelector('.professional-name')?.textContent.trim();if(!PROFESSIONALS.includes(name))return;
      let box=th.querySelector('.professional-header-occurrence');const text=occurrenceText(record(name));
      if(!text){box?.remove();return;}
      if(!box){box=document.createElement('div');box.className='professional-header-occurrence';th.appendChild(box);}
      box.innerHTML=`<span class="occurrence-label">Ocorrência:</span><span class="occurrence-text">${esc(text)}</span>`;
    });
  }
  function normalizePanel(){
    const p=document.querySelector('.professional-control-popover');if(!p)return;
    const summary=p.querySelector('.occurrence-summary');const date=p.querySelector('.popover-date');const status=p.querySelector('.popover-status');
    if(summary&&date&&status){
      const label=summary.querySelector('strong');if(label)label.textContent='Ocorrência';
      date.after(status);status.after(summary);
    }
  }
  function styles(){
    if(document.getElementById('professionalHeaderOccurrenceStyles'))return;
    const s=document.createElement('style');s.id='professionalHeaderOccurrenceStyles';
    s.textContent=`
      .professional-header-occurrence{display:block!important;margin:4px 8px 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#667085!important;text-align:center!important;cursor:default!important;pointer-events:none!important;box-shadow:none!important}
      .professional-header-occurrence .occurrence-label{display:inline!important;margin-right:4px!important;font-size:9px!important;line-height:1.1!important;font-weight:700!important;color:#667085!important}
      .professional-header-occurrence .occurrence-text{display:inline!important;font-size:9px!important;line-height:1.2!important;font-weight:500!important;color:#667085!important}
      .professional-control-popover .occurrence-summary{margin:8px 0 10px!important;padding:0!important;border:0!important;border-left:0!important;border-radius:0!important;background:transparent!important;color:#6f6878!important;cursor:default!important;pointer-events:none!important;box-shadow:none!important}
      .professional-control-popover .occurrence-summary strong{display:block!important;margin:0 0 2px!important;color:#5f5968!important;font-size:11px!important;font-weight:700!important}
      .professional-control-popover .occurrence-summary span{display:block!important;color:#6f6878!important;font-size:11px!important;font-weight:400!important}
      .professional-control-popover .popover-status{margin-bottom:4px!important}
    `;
    document.head.appendChild(s);
  }
  function boot(){
    styles();inject();normalizePanel();
    const observer=new MutationObserver(()=>normalizePanel());observer.observe(document.body,{childList:true,subtree:true});
    setInterval(()=>{inject();normalizePanel();},1000);
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450));
})();
