/* BeautyMove — S.O.S. service picker behavior + live totals */
(function(){
  'use strict';
  const MONEY=/R\$\s*([\d.]+(?:,\d{1,2})?)/i;
  const MINUTES=/(\d+)\s*min/i;
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  function checkedInputs(){
    return [...document.querySelectorAll('#sosModal input[type="checkbox"]:checked, #sosModal input[type="radio"]:checked')];
  }
  function parseService(input){
    const row=input.closest('label,.service-option,[data-service],li,div');
    const text=norm(row?.innerText||row?.textContent||input.parentElement?.innerText||'');
    const values=[...text.matchAll(new RegExp(MONEY.source,'gi'))].map(m=>Number(m[1].replace(/\./g,'').replace(',','.')));
    const mins=text.match(MINUTES);
    const name=norm((row?.querySelector('strong,b,[data-service-name]')?.textContent)||text.split('R$')[0]).replace(/\s+·\s*$/,'');
    return {name,client:values[0]||0,offer:values[1]||0,duration:mins?Number(mins[1]):0};
  }
  function findSummaryValue(label){
    const nodes=[...document.querySelectorAll('#sosModal *')];
    const node=nodes.find(el=>norm(el.textContent)===label && el.children.length===0);
    if(!node)return null;
    return node.parentElement?.querySelector('strong, b, [data-value]')||node.nextElementSibling||node.parentElement?.lastElementChild||null;
  }
  function updateTotals(){
    const items=checkedInputs().map(parseService);
    const client=items.reduce((s,x)=>s+x.client,0);
    const offer=items.reduce((s,x)=>s+x.offer,0);
    const duration=items.reduce((s,x)=>s+x.duration,0);
    const targets={
      client:['#sosClientPrice','#sosValueClient','[data-sos-client-price]'],
      offer:['#sosProfessionalOffer','#sosOfferProfessional','[data-sos-professional-offer]'],
      duration:['#sosServiceDuration','#sosEstimatedTime','[data-sos-duration]']
    };
    const values={client:client?money(client):'—',offer:offer?money(offer):'—',duration:duration?`${duration} min`:'—'};
    Object.entries(targets).forEach(([key,selectors])=>{
      let nodes=selectors.flatMap(s=>[...document.querySelectorAll(`#sosModal ${s}`)]);
      if(!nodes.length){const label=key==='client'?'Valor para cliente':key==='offer'?'Oferta ao profissional':'Tempo estimado';const n=findSummaryValue(label);if(n)nodes=[n];}
      nodes.forEach(n=>{if(n) n.textContent=values[key];});
    });
    const form=document.querySelector('#sosForm');
    if(form){form.dataset.selectedServices=JSON.stringify(items);form.dataset.clientValue=String(client);form.dataset.professionalOffer=String(offer);form.dataset.duration=String(duration);}
    return {items,client,offer,duration};
  }
  function fixPicker(){
    const modal=document.querySelector('#sosModal');
    if(!modal)return;
    const buttons=[...modal.querySelectorAll('button')].filter(b=>norm(b.textContent)==='Concluir');
    buttons.forEach(button=>{
      if(button.dataset.bmFixed==='1')return;
      const parent=button.parentElement;
      const menu=parent?.querySelector('input[type="checkbox"]')?.closest('div,ul,section') || parent?.previousElementSibling || parent;
      if(!menu)return;
      button.dataset.bmFixed='1';
      const shell=menu.closest('.bm-sos-service-menu-shell')||menu;
      shell.classList.add('bm-sos-service-menu-shell');
      menu.classList.add('bm-sos-service-list');
      const footer=document.createElement('div');
      footer.className='bm-sos-service-footer';
      footer.appendChild(button);
      shell.appendChild(footer);
    });
    modal.querySelectorAll('input[type="checkbox"],input[type="radio"]').forEach(input=>{
      if(input.dataset.bmTotals==='1')return;
      input.dataset.bmTotals='1';
      input.addEventListener('change',()=>setTimeout(updateTotals,0));
    });
    updateTotals();
  }
  function boot(){fixPicker();setTimeout(fixPicker,150);setTimeout(fixPicker,500);setTimeout(fixPicker,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(fixPicker).observe(document.body,{childList:true,subtree:true});
})();
