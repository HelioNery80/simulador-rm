/* ===== Versão GRATUITA — nada é bloqueado (sem cobrança, sem login, sem anúncios). Este módulo só adiciona o acesso à Política de Privacidade dentro do app
   (exigência do Google Play): item "Política de Privacidade" no menu Ajuda e um link discreto no rodapé.
   Abre pelo plugin @capacitor/browser (fallback: window.open '_system'). Não faz requisições de rede. ===== */
(function(){
'use strict';
var C = window.APP_CONFIG || {};
var URL = C.privacyUrl || 'https://helionery80.github.io/simulador-rm/privacidade.html';
var Cap = window.Capacitor;
function openUrl(u){
  try{
    var B = Cap && Cap.Plugins && Cap.Plugins.Browser;
    if(!B && Cap && typeof Cap.registerPlugin==='function' && Cap.isNativePlatform && Cap.isNativePlatform()){ try{ B = Cap.registerPlugin('Browser'); }catch(e){} }
    if(B && typeof B.open==='function'){ var p = B.open({url:u}); if(p && p.catch) p.catch(function(){ try{ window.open(u,'_system'); }catch(e){} }); return; }
  }catch(e){}
  try{ var w = window.open(u,'_system'); if(!w) location.href = u; }catch(e){ try{ location.href = u; }catch(_){} }
}
window.openPrivacy = function(){ openUrl(URL); };

function addMenuItem(){
  var m = document.getElementById('a11Menu');
  if(!m) return false;
  if(m.querySelector('[data-privacy]')) return true;
  var b = document.createElement('button');
  b.className = 'menu-item'; b.type = 'button'; b.setAttribute('data-privacy','1'); b.textContent = 'Política de Privacidade';
  /* captura: o handler do menu Ajuda só trata [data-a]; fecha o menu e abre a página */
  b.addEventListener('click', function(e){ e.stopPropagation(); m.classList.remove('open'); openUrl(URL); });
  m.appendChild(b);
  return true;
}
function addFooterLink(){
  var f = document.querySelector('footer');
  if(!f || f.querySelector('[data-privacy-foot]')) return;
  var d = document.createElement('div'); d.style.cssText = 'margin-top:8px';
  var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-privacy-foot','1'); b.textContent = 'Política de Privacidade';
  b.style.cssText = 'background:none;border:0;color:inherit;text-decoration:underline;font:inherit;cursor:pointer;padding:8px 10px;min-height:32px';
  b.addEventListener('click', function(){ openUrl(URL); });
  d.appendChild(b); f.appendChild(d);
}
function addFallbackButton(){
  if(document.getElementById('privInfo')) return;
  var i = document.createElement('button'); i.id = 'privInfo'; i.type = 'button'; i.textContent = 'ⓘ';
  i.title = 'Política de Privacidade'; i.setAttribute('aria-label','Política de Privacidade');
  i.style.cssText = 'position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:2147483200;width:32px;height:32px;border-radius:16px;border:1px solid #3d6aa6;background:rgba(10,20,36,.94);color:#cfe0ff;font:700 15px system-ui;cursor:pointer;padding:0';
  i.addEventListener('click', function(){ openUrl(URL); });
  document.body.appendChild(i);
}
function init(){
  addFooterLink();
  var tries = 0;
  (function t(){
    if(addMenuItem()) return;
    if(++tries < 25) setTimeout(t, 200); else addFallbackButton();   /* menu Ajuda ausente após ~5 s */
  })();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
