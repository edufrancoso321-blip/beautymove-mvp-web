/* A ocorrência agora integra o mesmo status da profissional. */
(function(){
  function cleanup(){
    document.querySelectorAll('.professional-header-occurrence,.occurrence-summary').forEach(el=>el.remove());
  }
  document.addEventListener('DOMContentLoaded',()=>{
    cleanup();
    const observer=new MutationObserver(cleanup);
    observer.observe(document.body,{childList:true,subtree:true});
  });
})();