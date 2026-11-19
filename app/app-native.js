/* ===== Ponte nativa: downloads (Blob) -> arquivo + folha de compartilhar do sistema ===== */
(function(){
'use strict';
var Cap=window.Capacitor; if(!(Cap&&Cap.isNativePlatform&&Cap.isNativePlatform())) return;
function plug(n){ try{ return (Cap.Plugins&&Cap.Plugins[n])||(typeof Cap.registerPlugin==='function'?Cap.registerPlugin(n):null); }catch(e){ return null; } }
var FS=plug('Filesystem'), SH=plug('Share');
function b64(u8){ var s='',i,n=u8.length,CH=0x8000; for(i=0;i<n;i+=CH) s+=String.fromCharCode.apply(null,u8.subarray(i,Math.min(n,i+CH))); return btoa(s); }
function safe(n){ return String(n||'arquivo').replace(/[^\w.\-]+/g,'_').slice(0,100)||'arquivo'; }
function toast(t){ var d=document.createElement('div'); d.textContent=t; d.style.cssText='position:fixed;left:50%;bottom:70px;transform:translateX(-50%);background:#14223a;color:#fff;border:1px solid #3d6aa6;padding:9px 14px;border-radius:8px;z-index:2147483647;font:13px system-ui;max-width:86vw'; document.body.appendChild(d); setTimeout(function(){d.remove();},3500); }
async function saveBlob(blob,name){
  if(!FS||!SH) throw new Error('Plugins de arquivo indisponíveis');
  name=safe(name); var path='export_'+Date.now()+'_'+name; var CH=3*1024*1024, off=0, first=true;
  while(off<blob.size){ var u8=new Uint8Array(await blob.slice(off,off+CH).arrayBuffer()); off+=CH;
    if(first){ await FS.writeFile({path:path,data:b64(u8),directory:'CACHE'}); first=false; } else await FS.appendFile({path:path,data:b64(u8),directory:'CACHE'}); }
  if(first) await FS.writeFile({path:path,data:'',directory:'CACHE'});
  var uri=(await FS.getUri({path:path,directory:'CACHE'})).uri;
  try{ await SH.share({title:name,url:uri,dialogTitle:'Salvar / compartilhar '+name}); }catch(e){ if(!/cancel/i.test(e&&e.message||'')) toast('Não foi possível compartilhar o arquivo.'); }
}
document.addEventListener('click',function(ev){
  var a=ev.target&&ev.target.closest&&ev.target.closest('a[download]'); if(!a) return;
  var h=a.getAttribute('href')||''; if(h.indexOf('blob:')!==0 && h.indexOf('data:')!==0) return;
  ev.preventDefault(); ev.stopPropagation();
  fetch(h).then(function(r){return r.blob();}).then(function(b){ return saveBlob(b,a.getAttribute('download')); }).catch(function(e){ console.error(e); toast('Falha ao exportar o arquivo.'); });
},true);
})();
