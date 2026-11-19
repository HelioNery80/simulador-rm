/* mobile.js — ajustes móveis (safe-area, dock de botões flutuantes, modais). Não altera o desktop. */
(function(){
'use strict';
function mq(q){ try{ return window.matchMedia(q); }catch(e){ return {matches:false}; } }
var isMob = function(){ return mq('(pointer:coarse)').matches || mq('(max-width:1050px)').matches; };

/* 1) viewport-fit=cover (necessário p/ env(safe-area-inset-*) no iOS/Android) */
try{
  var m = document.querySelector('meta[name=viewport]');
  if(!m){ m = document.createElement('meta'); m.name='viewport'; document.head.appendChild(m); }
  var c = m.getAttribute('content')||'width=device-width, initial-scale=1.0';
  if(!/viewport-fit\s*=/.test(c)) c += ', viewport-fit=cover';
  if(isMob() && !/maximum-scale|user-scalable/.test(c)) c += ', maximum-scale=5';  /* sem zoom de página por input; a pinça do usuário continua nos viewports */
  m.setAttribute('content', c);
}catch(e){}

function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }

ready(function(){
  var B = document.body;
  /* 2) dock: um botão único que abre Lab / Estúdio */
  var dock = document.createElement('div'); dock.id='mobDock';
  var tg = document.createElement('button'); tg.type='button'; tg.textContent='⋯'; tg.setAttribute('aria-label','Mais ferramentas: Lab, Estúdio'); tg.setAttribute('aria-expanded','false');
  dock.appendChild(tg); B.appendChild(dock);
  function setOpen(o){ B.classList.toggle('mob-dock-open',!!o); tg.textContent=o?'✕':'⋯'; tg.setAttribute('aria-expanded',o?'true':'false'); }
  tg.addEventListener('click',function(e){ e.stopPropagation(); setOpen(!B.classList.contains('mob-dock-open')); });
  document.addEventListener('click',function(e){
    if(!B.classList.contains('mob-dock-open')) return;
    var t=e.target; if(t&&t.closest&&t.closest('#mobDock')) return;
    setOpen(false);                                  /* toque fora ou em um dos botões fecha o dock */
  },true);

  /* 3) classe mob-modal enquanto Lab/Estúdio estiverem abertos (esconde o dock; trava rolagem do fundo) */
  function visible(el){ if(!el) return false; var s=getComputedStyle(el); return s.display!=='none' && s.visibility!=='hidden'; }
  function sync(){
    var open = visible(document.getElementById('ilab')) || visible(document.getElementById('stuRoot')) || visible(document.getElementById('onboardingModal'));
    if(B.classList.contains('mob-modal')!==open){ B.classList.toggle('mob-modal',open); document.documentElement.style.overflow = (open&&isMob())?'hidden':''; if(open) setOpen(false); }
  }
  var raf=0; function sched(){ if(!raf) raf=requestAnimationFrame(function(){ raf=0; sync(); }); }
  new MutationObserver(sched).observe(B,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  sync();

  /* 4) texto de boas-vindas: instruções de toque no lugar de mouse (somente pt-BR e ponteiro grosso) */
  try{
    if(mq('(pointer:coarse)').matches){
      var ps = document.querySelectorAll('#onboardingModal p');
      for(var i=0;i<ps.length;i++){
        if(/botão direito/.test(ps[i].textContent) && /viewports/.test(ps[i].textContent)){
          ps[i].innerHTML='<strong>2.</strong> Nos viewports: <strong>toque ou arraste</strong> move o cursor de corte, <strong>pinça</strong> dá zoom, <strong>toque longo</strong> abre o menu (janela/nível e mais).';
        }
        if(/Setas do teclado/.test(ps[i].textContent)){ ps[i].innerHTML='<strong>3.</strong> Use as abas inferiores (Imagem, Parâmetros, Protocolo, Avaliação) e os botões Axial/Sagital/Coronal para trocar de plano.'; }
      }
    }
  }catch(e){}


  /* 6) menus suspensos (Arquivo/Visualização/Ajuda) nunca saem da tela: desloca na horizontal após abrir */
  function clampMenus(){
    var ds=document.querySelectorAll('.menu-dropdown');
    for(var i=0;i<ds.length;i++){
      var d=ds[i]; if(d.offsetWidth===0) continue;
      d.style.maxWidth='calc(100vw - 16px)'; d.style.marginLeft='';
      var r=d.getBoundingClientRect(), W=document.documentElement.clientWidth, pad=8, sh=0;
      if(r.right>W-pad) sh=(W-pad)-r.right;
      if(r.left+sh<pad) sh=pad-r.left;
      if(sh) d.style.marginLeft=Math.round(sh)+'px';
    }
  }
  document.addEventListener('click',function(e){ if(isMob()&&e.target.closest&&e.target.closest('.menu-trigger')){ requestAnimationFrame(function(){ requestAnimationFrame(clampMenus); }); } },true);
  window.addEventListener('resize',function(){ if(isMob()) clampMenus(); });

  /* 5) bloqueia o gesto de "puxar para atualizar" iniciado nos viewports/modais (WebView antigo sem overscroll-behavior) */
  var sy=0;
  document.addEventListener('touchstart',function(e){ if(e.touches.length===1) sy=e.touches[0].clientY; },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(e.touches.length!==1) return;
    var dy=e.touches[0].clientY-sy;
    if(dy<=0 || (window.scrollY||document.documentElement.scrollTop)>0) return;
    var t=e.target, el=t; while(el&&el!==document.body){ if(el.scrollHeight>el.clientHeight+1){ var o=getComputedStyle(el).overflowY; if((o==='auto'||o==='scroll') && el.scrollTop>0) return; } el=el.parentElement; }
    if(e.cancelable) e.preventDefault();
  },{passive:false});
});
})();
