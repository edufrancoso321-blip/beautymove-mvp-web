(function(){
  if(document.body?.dataset?.role!=='salao') return;
  const KEY='beautymove.mvp.professionals';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const defaults=[{name:'Ana',specialty:'Cabelos'},{name:'Bruna',specialty:'Cabelos'},{name:'Paula',specialty:'Mãos e Pés'},{name:'Carla',specialty:'Estética'}];
  function pros(){const p=read(KEY,null);return Array.isArray(p)&&p.length?p:[...defaults]}
  function open(){const e=document.querySelector('#professionalModal');if(e){e.classList.add('is-open');e.setAttribute('aria-hidden','false');document.querySelector('#professionalNewName')?.focus()}}
  document.querySelector('#addProfessionalBtn')?.addEventListener('click',open);
  document.querySelector('#professionalForm')?.addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#professionalNewName')?.value.trim(),specialty=document.querySelector('#professionalNewSpecialty')?.value;if(!name)return;const list=pros();if(list.some(p=>p.name.toLowerCase()===name.toLowerCase()))return alert('Essa profissional já está cadastrada.');list.push({name,specialty});write(KEY,list);document.querySelector('#professionalModal')?.classList.remove('is-open');document.querySelector('#professionalModal')?.setAttribute('aria-hidden','true');window.location.reload()},true);
})();