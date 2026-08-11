
(function(){
 "use strict";
 // ── 360 spinner
 document.querySelectorAll(".spin").forEach(function(el){
  var n=+el.dataset.frames, base=el.dataset.src, img=el.querySelector(".spin-img"),
      hint=el.querySelector(".spin-hint"), cache=[], on=false, i=0, x0=null, acc=0;
  function load(){
    if(on) return; on=true; el.classList.add("is-on");
    for(var k=0;k<n;k++){ var im=new Image(); im.src=base+String(k).padStart(2,"0")+".webp"; cache.push(im); }
    show(0);
  }
  function show(k){ i=((k%n)+n)%n; if(cache[i]&&cache[i].src) img.src=cache[i].src; }
  function start(e){ load(); x0=(e.touches?e.touches[0]:e).clientX; acc=0; el.classList.add("is-drag"); }
  function move(e){
    if(x0===null) return;
    var x=(e.touches?e.touches[0]:e).clientX, d=x-x0; x0=x; acc+=d;
    var stepPx=Math.max(6, el.clientWidth/(n*1.6));
    while(Math.abs(acc)>=stepPx){ show(i + (acc>0?-1:1)); acc+= acc>0?-stepPx:stepPx; }
    if(e.cancelable && e.touches) e.preventDefault();
  }
  function end(){ x0=null; el.classList.remove("is-drag"); }
  el.addEventListener("mousedown",start); window.addEventListener("mousemove",move); window.addEventListener("mouseup",end);
  el.addEventListener("touchstart",start,{passive:true}); el.addEventListener("touchmove",move,{passive:false}); el.addEventListener("touchend",end);
  if(hint) hint.addEventListener("click",function(){ load(); var k=0, t=setInterval(function(){ show(++k); if(k>=n) clearInterval(t); },55); });
 });

 // ── calculadora
 var mx=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
 document.querySelectorAll(".calc-box").forEach(function(box){
  var precio=+box.dataset.precio, R=box.querySelectorAll("input[type=range]");
  function o(k){ return box.querySelector('[data-o="'+k+'"]'); }
  function calc(){
    var eng=+box.querySelector('[name=eng]').value, pl=+box.querySelector('[name=plazo]').value, ta=+box.querySelector('[name=tasa]').value;
    var engM=Math.round(precio*eng/100), cap=precio-engM, r=ta/100/12, pago= r>0 ? cap*r/(1-Math.pow(1+r,-pl)) : cap/pl;
    o("eng").textContent=eng+"% · "+mx.format(engM);
    o("plazo").textContent=pl+" meses";
    o("tasa").textContent=ta.toFixed(1)+"%";
    o("pago").textContent=mx.format(Math.round(pago));
    o("monto").textContent=mx.format(cap);
    o("total").textContent=mx.format(Math.round(pago*pl+engM));
  }
  R.forEach(function(x){ x.addEventListener("input",calc); });
  calc();
 });

 // ── formulario de cotización → WhatsApp
 var f=document.getElementById("cot");
 if(f) f.addEventListener("submit",function(e){
   e.preventDefault();
   var d=new FormData(f), nom=(d.get("nombre")||"").trim(), mod=d.get("modelo"), giro=(d.get("giro")||"").trim();
   if(!nom||!mod){ alert("Necesitamos tu nombre y el modelo que te interesa."); return; }
   var t="Hola, soy "+nom+". Me interesa el "+mod+"."+(giro?" Muevo: "+giro+".":"")+" Quiero precio, disponibilidad y mensualidad en Tepic.";
   var wa=document.querySelector('[data-ev="wa_cotizar"]');
   if(wa && wa.href.indexOf("wa.me")>-1){ window.location.href = wa.href.split("?")[0]+"?text="+encodeURIComponent(t); }
   else { alert("Falta configurar el número de WhatsApp de la sucursal."); }
 });
})();
