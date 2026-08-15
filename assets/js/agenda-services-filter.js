(function(){
  const PROFESSIONAL_SPECIALTY={Ana:'Cabelos',Bruna:'Cabelos',Paula:'Mãos e Pés',Carla:'Estética'};
  const RULES={
    'Cabelos':['Corte','Escova','Coloração','Luzes','Corte feminino','Corte masculino'],
    'Mãos e Pés':['Manicure','Pedicure'],
    'Estética':['Limpeza de pele'],
    'Depilação':['Depilação facial','Depilação corporal','Depilação'],
    'Sobrancelhas':['Design de sobrancelhas']
  };

  function specialtyForProfessional(name){return PROFESSIONAL_SPECIALTY[name]||'';}

  function applyFilter(){
    const professional=document.getElementById('appointmentProfessional');
    const list=document.getElementById('serviceList');
    const title=document.getElementById('servicesTitle');
    if(!professional||!list)return;

    const specialty=specialtyForProfessional(professional.value);
    const allowed=new Set(RULES[specialty]||[]);
    const options=list.querySelectorAll('.service-option');
    let visible=0;

    options.forEach(option=>{
      const input=option.querySelector('input[data-service]');
      const name=input?.getAttribute('data-service')||'';
      const show=!specialty||allowed.has(name);
      option.style.display=show?'flex':'none';
      if(!show&&input?.checked){
        input.checked=false;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }
      if(show)visible++;
    });

    if(title)title.textContent=specialty?`Serviços — ${specialty}`:'Incluir ou remover serviços';

    list.querySelector('.specialty-empty')?.remove();
    if(!visible){
      const msg=document.createElement('div');
      msg.className='specialty-empty';
      msg.textContent=`Nenhum serviço cadastrado para ${specialty||'esta especialidade'}.`;
      list.appendChild(msg);
    }
  }

  function scheduleFilter(){setTimeout(applyFilter,0);}

  document.addEventListener('click',event=>{
    if(event.target.closest('#openServicesFromAppointment'))scheduleFilter();
  },true);

  document.addEventListener('change',event=>{
    if(event.target.id==='appointmentProfessional'){
      const modal=document.getElementById('servicesModal');
      if(modal?.classList.contains('is-open'))scheduleFilter();
    }
  });
})();
