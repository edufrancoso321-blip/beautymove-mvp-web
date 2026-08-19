/* BeautyMove — preserva o horário e a profissional da célula selecionada */
(function(){
  'use strict';
  function boot(){
    const modal=document.getElementById('appointmentModal');
    const form=document.getElementById('appointmentForm');
    const time=document.getElementById('appointmentTime');
    const professional=document.getElementById('appointmentProfessional');
    if(!modal||!form||!time||!professional)return;
    const capture=()=>{
      if(!modal.classList.contains('is-open'))return;
      if(time.value)form.dataset.bmSelectedTime=time.value;
      if(professional.value)form.dataset.bmSelectedProfessional=professional.value;
    };
    const restoreTime=()=>{
      if(!modal.classList.contains('is-open'))return;
      const selected=form.dataset.bmSelectedTime;
      if(selected&&[...time.options].some(o=>o.value===selected)&&time.value!==selected)time.value=selected;
      const selectedProfessional=form.dataset.bmSelectedProfessional;
      if(selectedProfessional&&[...professional.options].some(o=>o.value===selectedProfessional)&&professional.value!==selectedProfessional)professional.value=selectedProfessional;
    };
    time.addEventListener('change',()=>{form.dataset.bmSelectedTime=time.value;});
    professional.addEventListener('change',()=>{form.dataset.bmSelectedProfessional=professional.value;});
    form.addEventListener('submit',()=>{restoreTime();capture();},true);
    const modalObserver=new MutationObserver(()=>{
      if(modal.classList.contains('is-open'))capture();
    });
    modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
    const timeObserver=new MutationObserver(()=>restoreTime());
    timeObserver.observe(time,{childList:true,subtree:true});
    setInterval(restoreTime,250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
