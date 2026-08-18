/* BeautyMove — Correção visual e estrutural do formulário S.O.S. */
(function(){
'use strict';
function fix(){
 const form=document.getElementById('sosForm');
 const specialty=document.getElementById('sosSpecialty');
 const service=document.getElementById('sosService');
 if(!form||!specialty||!service)return;
 if(form.dataset.modalFixApplied==='1')return;
 const clientField=document.getElementById('sosClient')?.closest('.field');
 const specialtyField=specialty.closest('.field');
 const serviceField=service.closest('.field');
 if(!clientField||!specialtyField||!serviceField)return;
 form.dataset.modalFixApplied='1';
 specialtyField.classList.add('sos-specialty-field');
 serviceField.classList.add('sos-service-field');
 specialtyField.classList.add('sos-order-specialty');
 serviceField.classList.add('sos-order-service');
 form.insertBefore(specialtyField,serviceField);
 serviceField.style.gridColumn='1 / -1';
 const select=document.getElementById('sosService');
 if(select)select.dataset.catalogReady='1';
 const pricing=serviceField.querySelector('.sos-service-pricing');
 if(pricing){
   const inputs=pricing.querySelectorAll('input');
   inputs.forEach(input=>{input.readOnly=true;input.tabIndex=-1;input.setAttribute('aria-readonly','true');});
   pricing.classList.add('sos-pricing-clean');
 }
 const professional=document.getElementById('sosProfessional')?.closest('.field');
 if(professional)professional.classList.add('sos-optional-field');
}
function injectStyle(){
 if(document.getElementById('sosModalFixStyle'))return;
 const style=document.createElement('style');style.id='sosModalFixStyle';style.textContent=`
 #sosForm .sos-service-field{grid-column:1/-1!important}
 #sosForm .sos-service-field .sos-service-pricing{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;margin-top:10px!important;width:100%!important}
 #sosForm .sos-service-field .sos-service-pricing>div{min-width:0!important;background:#faf8fd!important;border:1px solid #e7e0f1!important;border-radius:10px!important;padding:10px 12px!important}
 #sosForm .sos-service-field .sos-service-pricing input{background:#f7f3fc!important;color:#30263a!important;font-weight:900!important;cursor:default!important}
 #sosForm .sos-service-field .sos-service-pricing strong{font-size:16px!important;color:#201a28!important}
 #sosForm .sos-specialty-field{grid-column:1/2!important}
 #sosForm .sos-order-service{grid-column:1/-1!important}
 @media(max-width:700px){#sosForm .sos-specialty-field,#sosForm .sos-service-field{grid-column:1/-1!important}#sosForm .sos-service-field .sos-service-pricing{grid-template-columns:1fr!important}}
 `;document.head.appendChild(style);
}
function boot(){injectStyle();fix();setTimeout(fix,250);setTimeout(fix,800);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('beautymove:sos-accepted',()=>setTimeout(fix,100));
})();
