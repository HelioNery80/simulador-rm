/* ===== Assinatura Premium (freemium) — só ativa dentro do app nativo (Android/iOS) =====
   Na versão web/arquivo HTML avulso NÃO restringe nada. Usa RevenueCat (Play Billing + StoreKit). */
(function(){
'use strict';
var C = window.APP_CONFIG || {};
var Cap = window.Capacitor;
var NATIVE = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
var FORCE = /[?&]forceapp=1/.test(location.search);        // apenas para testar o layout no navegador
var WEBLIM = !NATIVE && !FORCE && C.webLimited===true;   // PWA gratuita: bloqueio + aviso, sem compra
if(!NATIVE && !FORCE && !WEBLIM) return;
var PLAT = 'android'; try{ if(NATIVE && Cap.getPlatform) PLAT = Cap.getPlatform() || 'android'; }catch(e){}
var KEY = PLAT==='ios' ? C.rcKeyIos : C.rcKeyAndroid;
/* chave ausente/placeholder => modo "sem cobrança": app abre normal, premium bloqueado com aviso, nunca exceção */
var CONFIGURED = !WEBLIM && typeof KEY==='string' && KEY.length>4 && !/^REPLACE/i.test(KEY);
var P = null;
if(!WEBLIM) try{ P = (Cap && Cap.Plugins && Cap.Plugins.Purchases) || (CONFIGURED && Cap && typeof Cap.registerPlugin==='function' ? Cap.registerPlugin('Purchases') : null); }catch(e){ P = null; }
var UNAVAIL = 'Assinatura indisponível no momento.';
var premium = false, offerings = null, ready = false, mgmtUrl = null, failed = false;
function usable(){ return !!P && CONFIGURED && !failed; }
/* chama método do plugin sem nunca lançar: sempre devolve Promise */
function call(fn){ try{ return Promise.resolve(fn()); }catch(e){ return Promise.reject(e); } }
var CK='srm_prem_v1';
function cacheGet(){ try{ var o=JSON.parse(localStorage.getItem(CK)||'null'); if(o && o.p && Date.now()-o.t < 3*864e5) return true; }catch(e){} return false; }
function cacheSet(v){ try{ localStorage.setItem(CK, JSON.stringify({p:!!v,t:Date.now()})); }catch(e){} }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

var P_API = window.Premium = {
  isPremium: function(){ return premium; },
  isLockedRegion: function(id){ return !premium && (C.freeRegions||[]).indexOf(id) < 0; },
  openPaywall: function(reason){ showPaywall(reason); }, openLegal: function(){ showLegal(); },
  refresh: function(){ return loadInfo(); },
  _setPremium: function(v){ setPremium(v); }
};

function setPremium(v,fromCache){ v=!!v; var ch = v!==premium; premium=v; if(!fromCache) cacheSet(v); if(ch){ paintBadge(); try{ if(typeof refreshAll==='function') refreshAll(); }catch(e){} } }
function active(ci){ var e=ci && ci.entitlements && ci.entitlements.active; return !!(e && e[C.entitlement||'premium']); }
function loadInfo(){
  if(!usable()) return Promise.resolve(premium);
  return call(function(){ return P.getCustomerInfo(); }).then(function(r){ var ci=r.customerInfo||r; try{ mgmtUrl=ci.managementURL||ci.managementUrl||mgmtUrl; }catch(e){} setPremium(active(ci)); return premium; })
    .catch(function(){ if(cacheGet()) setPremium(true,true); return premium; });
}
function init(){
  try{
    if(P && CONFIGURED){
      call(function(){ return P.configure({apiKey:KEY}); }).then(function(){
        call(function(){ return P.addCustomerInfoUpdateListener(function(ci){ setPremium(active(ci && (ci.customerInfo||ci))); }); }).catch(function(){});
        return loadInfo();
      }).then(function(){ ready=true; return call(function(){ return P.getOfferings(); }).then(function(o){ offerings=o; }).catch(function(){}); })
      .catch(function(e){ failed=true; console.warn('Purchases init', e); try{ paintBadge(); }catch(_){} });
    }
    /* sem SDK/chave: nunca libera por cache */
    paintBadge(); decorate();
  }catch(e){ failed=true; console.warn('premium init', e); }
}

/* ---------- bloqueios ---------- */
var lastFree = (C.freeRegions&&C.freeRegions[0])||'cranio';
function guardRegion(){
  try{
    if(typeof state==='undefined' || typeof REGIONS==='undefined') return;
    if(P_API.isLockedRegion(state.regionId)){
      var bad=state.regionId; state.regionId=lastFree; try{ applyRegionDefaults(); }catch(e){}
      var nm=(REGIONS.filter(function(r){return r.id===bad;})[0]||{}).name||bad;
      setTimeout(function(){ showPaywall('A região “'+nm+'” é exclusiva para assinantes.'); },0);
    } else lastFree=state.regionId;
  }catch(e){}
}
var wrapTries=0;
(function wrap(){
  if(typeof refreshAll!=='function'){ if(++wrapTries<100) setTimeout(wrap,200); return; }
  if(refreshAll.__prem) return;
  var orig=refreshAll; var w=function(){ guardRegion(); var r=orig.apply(this,arguments); decorate(); return r; }; w.__prem=1;
  try{ window.refreshAll=w; }catch(e){} try{ refreshAll=w; }catch(e){}
})();
function decorate(){
  try{
    if(typeof REGIONS==='undefined') return;
    var nodes=document.querySelectorAll('#regionList > *, #regionSelectedHeader');
    nodes.forEach(function(n){ if(n.__lk) return; var t=n.textContent||'';
      REGIONS.forEach(function(r){ if(P_API.isLockedRegion(r.id) && t.indexOf(r.name)>=0 && !n.querySelector('.prem-lock')){ var s=document.createElement('span'); s.className='prem-lock'; s.textContent=' 🔒'; s.title='Exclusivo para assinantes'; n.appendChild(s); } });
    });
    if(premium) document.querySelectorAll('.prem-lock').forEach(function(x){x.remove();});
  }catch(e){}
}
document.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest&&ev.target.closest('#ilabBtn,#stuBtn'); if(!t||premium) return;
  var lab=t.id==='ilabBtn'; if((lab&&C.lockLab===false)||(!lab&&C.lockStudio===false)) return;
  ev.stopPropagation(); ev.preventDefault(); showPaywall((lab?'O Lab de Imagem':'O Estúdio de Imagem/Dados')+' é exclusivo para assinantes.');
},true);
/* região lista é recriada: observa */
try{ new MutationObserver(function(){ clearTimeout(decorate._t); decorate._t=setTimeout(decorate,120); }).observe(document.body,{childList:true,subtree:true}); }catch(e){}

/* ---------- UI ---------- */
var css='#premBadge{position:fixed;right:12px;bottom:12px;z-index:2147483200;padding:7px 12px;border-radius:18px;border:1px solid #ffb84a;background:rgba(40,26,6,.94);color:#ffe2b0;font:700 12px system-ui;cursor:pointer;box-shadow:0 2px 10px #0008}'
+'#premBadge.on{border-color:#4be08a;color:#c9ffd9;background:rgba(6,40,22,.94)}'
+'#premWrap{position:fixed;inset:0;z-index:2147483600;background:rgba(2,5,10,.88);display:none;align-items:center;justify-content:center;font:14px system-ui;color:#e6eefc;padding:12px}'
+'#premBox{background:#0f1726;border:1px solid #34527a;border-radius:14px;max-width:460px;width:100%;max-height:96vh;overflow:auto;padding:18px}'
+'#premBox h2{margin:0 0 4px;font-size:20px;color:#ffd79a}#premBox .why{color:#ff9f9f;font-size:13px;margin:6px 0}'
+'#premBox ul{padding-left:18px;margin:8px 0;line-height:1.5}'
+'.premPlan{display:block;width:100%;text-align:left;margin:8px 0;padding:12px;border-radius:10px;border:2px solid #34527a;background:#14223a;color:#e6eefc;cursor:pointer;font:inherit}'
+'.premPlan.sel{border-color:#ffb84a;background:#2a1f0c}.premPlan b{font-size:16px}.premPlan small{display:block;color:#c3d3ec;font-size:13px;margin-top:2px}'
+'.premTag{float:right;background:#ffb84a;color:#241600;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700}'
+'#premGo{width:100%;margin-top:8px;padding:13px;border:0;border-radius:10px;background:#ffb84a;color:#241600;font:800 16px system-ui;cursor:pointer}#premGo[disabled]{opacity:.5}'
+'#premBox .lnk{background:none;border:0;color:#7db4ff;text-decoration:underline;cursor:pointer;font:13px system-ui;padding:4px}'
+'#premBox .fine{color:#a9bbd8;font-size:12.5px;line-height:1.45;margin-top:10px}#premMsg{min-height:18px;margin-top:6px;font-size:13px;color:#ffcf80}';
var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
var badge=document.createElement('button'); badge.id='premBadge'; badge.type='button'; document.body.appendChild(badge);
badge.onclick=function(){ if(premium) showLegal(); else showPaywall(); };
var info=document.createElement('button'); info.id='premInfo'; info.type='button'; info.textContent='ⓘ'; info.title='Sobre / Aviso legal'; info.setAttribute('aria-label','Sobre e aviso legal'); info.style.cssText='position:fixed;right:12px;bottom:52px;z-index:2147483200;width:32px;height:32px;border-radius:16px;border:1px solid #3d6aa6;background:rgba(10,20,36,.94);color:#cfe0ff;font:700 15px system-ui;cursor:pointer'; document.body.appendChild(info); info.onclick=showLegal;
function paintBadge(){ badge.className=premium?'on':''; badge.textContent=premium?'⭐ Premium ativo':(WEBLIM?'🔒 Versão web gratuita':'🔓 Seja Premium'); }
function manage(){ var u=mgmtUrl||(PLAT==='ios'?'https://apps.apple.com/account/subscriptions':'https://play.google.com/store/account/subscriptions?package=br.com.nerysolution.simuladorrm'); openUrl(u); }
function openUrl(u){ try{ var B=Cap.Plugins&&Cap.Plugins.Browser; if(B&&B.open){ B.open({url:u}); return; } }catch(e){} try{ window.open(u,'_blank'); }catch(e){ location.href=u; } }

function showLegal(){ wrap.style.display='flex'; wrap.innerHTML='<div id="premBox" role="dialog" aria-modal="true"><h2>Sobre / Aviso legal</h2><p style="font-size:14px">Simulador RM — conteúdo educacional para treino de planejamento de ressonância magnética. Não substitui protocolos institucionais, manuais dos fabricantes nem orientação clínica ou de segurança em RM.</p><div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px"><button class="lnk" id="lgPriv" type="button">Política de privacidade</button><button class="lnk" id="lgTerms" type="button">Termos de uso</button><button class="lnk" id="lgSup" type="button">Suporte: '+esc(C.supportEmail||'')+'</button>'+(premium?'<button class="lnk" id="lgMng" type="button">Gerenciar assinatura</button>':'')+'<button class="lnk" id="lgRest" type="button">Restaurar compras</button></div><div id="premMsg"></div><div style="text-align:center;margin-top:8px"><button class="lnk" id="premClose" type="button">Fechar</button></div></div>';
  wrap.querySelector('#premClose').onclick=function(){ wrap.style.display='none'; }; wrap.querySelector('#lgPriv').onclick=function(){ openUrl(C.privacyUrl); }; wrap.querySelector('#lgTerms').onclick=function(){ openUrl(C.termsUrl); }; wrap.querySelector('#lgSup').onclick=function(){ openUrl('mailto:'+C.supportEmail); };
  var m=wrap.querySelector('#lgMng'); if(m) m.onclick=manage; wrap.querySelector('#lgRest').onclick=function(){ var msg=wrap.querySelector('#premMsg'); if(!usable()){ msg.textContent=UNAVAIL; return; } msg.textContent='Restaurando…'; call(function(){ return P.restorePurchases(); }).then(function(r){ setPremium(active(r&&(r.customerInfo||r))); msg.textContent=premium?'Assinatura restaurada!':'Nenhuma assinatura ativa encontrada.'; }).catch(function(){ msg.textContent='Falha ao restaurar.'; }); }; }
var wrap=document.createElement('div'); wrap.id='premWrap'; document.body.appendChild(wrap);
var selPkg=null;
function pkgs(){ var a=(offerings&&offerings.current&&offerings.current.availablePackages)||[]; var f=a.filter(function(p){ return /^(MONTHLY|ANNUAL)$/i.test(p.packageType||''); }); f.sort(function(x,y){ return /ANNUAL/i.test(y.packageType)-/ANNUAL/i.test(x.packageType); }); return f; }
function defIdx(pk){ for(var i=0;i<pk.length;i++){ if(/ANNUAL/i.test(pk[i].packageType||'')) return i; } return 0; }
function priceOf(p){ return ((p&&p.product)||{}).priceString||''; }
function isAnn(p){ return !!p && /ANNUAL/i.test(p.packageType||''); }
function trialOf(p){ var pr=(p&&p.product)||{}, i=pr.introPrice||pr.introductoryPrice; if(!i || i.price!==0 || !i.periodNumberOfUnits || !i.periodUnit) return ''; var n=i.periodNumberOfUnits, nm={DAY:['dia','dias'],WEEK:['semana','semanas'],MONTH:['mês','meses'],YEAR:['ano','anos']}[i.periodUnit]; return nm?(n+' '+(n===1?nm[0]:nm[1])+' grátis'):''; }
function paintCta(){ var g=wrap.querySelector('#premGo'), d=wrap.querySelector('#premCtaInfo'); if(!g) return; var t=trialOf(selPkg), pr=priceOf(selPkg), per=isAnn(selPkg)?'ano':'mês'; g.textContent=t?('Começar '+t.replace(' grátis','')+' grátis'):(pr?('Assinar por '+pr+'/'+per):'Assinar'); if(d) d.textContent=selPkg?((t?('Depois do teste, '):'')+'cobrança de '+pr+' por '+per+', renovada automaticamente. Cancele quando quiser.'):''; }
function plansHtml(){
  var pk=pkgs();
  if(!pk.length) return '<div class="fine" style="font-size:13px">'+(usable()?'Não foi possível carregar os planos agora. Verifique a conexão e tente novamente.':UNAVAIL)+'</div>';
  var h='', di=defIdx(pk); pk.forEach(function(p,i){ var ann=isAnn(p), trial=trialOf(p), pr=priceOf(p);
    h+='<button type="button" class="premPlan'+(i===di?' sel':'')+'" data-i="'+i+'">'+(ann?'<span class="premTag">MELHOR VALOR</span>':'')+'<b>'+(ann?'Anual':'Mensal')+' — '+esc(pr)+'/'+(ann?'ano':'mês')+'</b><small>'+(trial?esc(trial)+', depois ':'')+esc(pr)+(ann?' por ano':' por mês')+'. Renovação automática; cancele quando quiser.</small></button>'; }); return h; }
function showWebNotice(reason){
  wrap.style.display='flex';
  wrap.innerHTML='<div id="premBox" role="dialog" aria-modal="true" aria-labelledby="premH"><h2 id="premH">🔒 Disponível na assinatura do app</h2>'+(reason?'<div class="why">'+esc(reason)+'</div>':'')
  +'<p style="font-size:14px">Esta versão web é gratuita e inclui Crânio, Coluna, Joelho e Ombro. Protocolos, bobinas e geometria das demais regiões, o Lab de Imagem, o Estúdio e a Biblioteca GE fazem parte da assinatura do app Simulador RM (Google Play / App Store, quando disponível).</p>'
  +'<div style="text-align:center"><button class="lnk" id="premClose" type="button">Entendi</button></div>'
  +'<div class="fine">Conteúdo educacional: não substitui protocolos clínicos nem orientação profissional.<br><button class="lnk" id="premTerms" type="button">Termos de uso</button> · <button class="lnk" id="premPriv" type="button">Política de privacidade</button></div></div>';
  wrap.querySelector('#premClose').onclick=function(){ wrap.style.display='none'; };
  wrap.querySelector('#premTerms').onclick=function(){ openUrl(C.termsUrl); };
  wrap.querySelector('#premPriv').onclick=function(){ openUrl(C.privacyUrl); };
}
function showPaywall(reason){
  if(WEBLIM){ showWebNotice(reason); return; }
  wrap.style.display='flex';
  wrap.innerHTML='<div id="premBox" role="dialog" aria-modal="true" aria-labelledby="premH"><h2 id="premH">⭐ Simulador RM Premium</h2>'+(reason?'<div class="why">'+esc(reason)+'</div>':'')
  +'<ul><li>Protocolos, bobinas e geometria de 25 regiões anatômicas</li><li>🔬 Lab de Imagem: 109 artefatos e efeitos de formação de imagem</li><li>🎛 Estúdio: editar cortes, reformatar volume, tags DICOM e exportar</li><li>📚 Biblioteca de protocolos GE e referência dos protocolos</li></ul>'
  +'<div id="premPlans">'+plansHtml()+'</div><button id="premGo" type="button">Assinar</button><div id="premCtaInfo" style="font-size:14px;color:#dbe6f8;margin-top:8px;text-align:center"></div><div id="premMsg"></div>'
  +'<div style="text-align:center"><button class="lnk" id="premRestore" type="button">Restaurar compras</button> <button class="lnk" id="premClose" type="button">Agora não</button></div>'
  +'<div class="fine">A assinatura é renovada automaticamente ao fim de cada período (mensal ou anual) pelo valor exibido, cobrada na sua conta '+(PLAT==='ios'?'Apple':'Google Play')+' na confirmação da compra. O teste grátis, quando oferecido, vale uma vez por conta e converte-se em assinatura paga se não for cancelado '+(PLAT==='ios'?'pelo menos 24 horas antes do fim do teste':'antes do fim do teste')+'. Gerencie ou cancele a qualquer momento nos ajustes da sua conta '+(PLAT==='ios'?'Apple':'Google Play')+'. Conteúdo educacional: não substitui protocolos clínicos nem orientação profissional.<br><button class="lnk" id="premTerms" type="button">Termos de uso</button> · <button class="lnk" id="premPriv" type="button">Política de privacidade</button></div></div>';
  var pk=pkgs(); selPkg=pk[defIdx(pk)]||null;
  wrap.querySelectorAll('.premPlan').forEach(function(b){ b.onclick=function(){ wrap.querySelectorAll('.premPlan').forEach(function(x){x.classList.remove('sel');}); b.classList.add('sel'); selPkg=pk[+b.dataset.i]; paintCta(); }; });
  paintCta();
  var msg=wrap.querySelector('#premMsg');
  if(!usable()){ var gb=wrap.querySelector('#premGo'); if(gb){ gb.disabled=true; gb.textContent=UNAVAIL.replace(/\.$/,''); } var rb=wrap.querySelector('#premRestore'); if(rb) rb.style.display='none'; }
  wrap.querySelector('#premClose').onclick=function(){ wrap.style.display='none'; };
  wrap.querySelector('#premTerms').onclick=function(){ openUrl(C.termsUrl); };
  wrap.querySelector('#premPriv').onclick=function(){ openUrl(C.privacyUrl); };
  wrap.querySelector('#premGo').onclick=function(){
    if(!usable()){ msg.textContent=UNAVAIL; return; }
    if(!selPkg){ msg.textContent='Plano não carregado. Tente novamente.'; refreshOfferings(); return; }
    var go=this; go.disabled=true; msg.textContent='Abrindo a loja…';
    call(function(){ return P.purchasePackage({aPackage:selPkg}); }).then(function(r){ var ci=r&&(r.customerInfo||r); setPremium(active(ci)); msg.textContent=premium?'Pronto! Premium ativo. Obrigado!':'Compra concluída; aguardando confirmação…'; if(premium) setTimeout(function(){wrap.style.display='none';},900); })
      .catch(function(e){ msg.textContent=(e&&(e.userCancelled||/cancel/i.test(e.message||'')))?'Compra cancelada.':'Não foi possível concluir a compra.'; }).then(function(){ go.disabled=false; });
  };
  wrap.querySelector('#premRestore').onclick=function(){
    if(!usable()){ msg.textContent=UNAVAIL; return; }
    msg.textContent='Restaurando…';
    call(function(){ return P.restorePurchases(); }).then(function(r){ setPremium(active(r&&(r.customerInfo||r))); msg.textContent=premium?'Assinatura restaurada!':'Nenhuma assinatura ativa encontrada.'; if(premium) setTimeout(function(){wrap.style.display='none';},900); }).catch(function(){ msg.textContent='Falha ao restaurar. Tente novamente.'; });
  };
  if(!offerings) refreshOfferings();
}
function refreshOfferings(){ if(!usable()) return; call(function(){ return P.getOfferings(); }).then(function(o){ offerings=o; var el=wrap.querySelector('#premPlans'); if(el&&wrap.style.display!=='none'){ el.innerHTML=plansHtml(); var pk=pkgs(); selPkg=pk[defIdx(pk)]||null; wrap.querySelectorAll('.premPlan').forEach(function(b){ b.onclick=function(){ wrap.querySelectorAll('.premPlan').forEach(function(x){x.classList.remove('sel');}); b.classList.add('sel'); selPkg=pk[+b.dataset.i]; paintCta(); }; }); paintCta(); } }).catch(function(){}); }

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
