
(function(){
 "use strict";
 // panel de vehículos: pasa el cursor en escritorio, toca en móvil
 (function(){
  var w=document.querySelector(".mega-wrap"); if(!w) return;
  var b=w.querySelector(".nav-trigger"), p=w.querySelector(".mega"), t=null;
  function open(){ clearTimeout(t); p.classList.add("is-open"); b.setAttribute("aria-expanded","true"); }
  function close(){ p.classList.remove("is-open"); b.setAttribute("aria-expanded","false"); }
  function lazy(ms){ clearTimeout(t); t=setTimeout(close,ms||220); }
  b.addEventListener("click",function(e){ e.preventDefault(); p.classList.contains("is-open")?close():open(); });
  if(window.matchMedia("(hover:hover)").matches){
    w.addEventListener("mouseenter",open); w.addEventListener("mouseleave",function(){lazy();});
    p.addEventListener("mouseenter",open); p.addEventListener("mouseleave",function(){lazy();});
  }
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&p.classList.contains("is-open")){ close(); b.focus(); } });
  document.addEventListener("click",function(e){ if(!w.contains(e.target)) close(); });
 })();

 // ── encabezado: sombra al separarse del tope, y se oculta al bajar / vuelve al subir
 (function(){
  var hdr=document.querySelector(".hdr"), shell=document.querySelector(".hdr-shell");
  if(!hdr||!shell) return;
  var last=window.scrollY||window.pageYOffset||0, acc=0, ticking=false;
  var OCULTAR=70;  // hay que bajar 70 px seguidos para que se retire
  var MOSTRAR=40;  // basta subir 40 px para recuperarla
  var TOPE=120;    // arriba del todo la barra siempre se ve

  // barra de modelo: solo tiene sentido cuando el escenario ya quedó atrás
  var bar=document.getElementById("modelbar"), heroFuera=false;
  var hero=document.querySelector(".hero-m");
  if(bar && hero && "IntersectionObserver" in window){
   new IntersectionObserver(function(e){ heroFuera=!e[0].isIntersecting; sync(); },{threshold:0}).observe(hero);
  }
  function sync(){
   if(!bar) return;
   bar.classList.toggle("is-on", heroFuera && hdr.classList.contains("is-hidden"));
  }

  var prog=document.querySelector(".hdr-prog i");

  function upd(){
   var y=window.scrollY||window.pageYOffset, d=y-last;

   shell.style.boxShadow = y>12
     ? "0 2px 4px rgba(23,22,26,.06), 0 18px 40px rgba(23,22,26,.10)"
     : "";

   if(prog){
    var alto=(document.documentElement.scrollHeight-window.innerHeight);
    prog.style.width = (alto>0 ? Math.min(100, Math.max(0, y/alto*100)) : 0) + "%";
   }

   // no se esconde con el panel de vehículos abierto: se vería como un salto
   var megaAbierto = !!hdr.querySelector(".mega.is-open");

   // se acumula el recorrido en una misma dirección; así también funciona
   // con scroll lento, donde el desplazamiento por cuadro es de pocos píxeles
   if((d>0) !== (acc>0)) acc=0;
   acc+=d;

   if(y<=TOPE || megaAbierto){
     hdr.classList.remove("is-hidden"); acc=0;
   } else if(acc>OCULTAR){
     hdr.classList.add("is-hidden"); acc=0;
   } else if(acc<-MOSTRAR){
     hdr.classList.remove("is-hidden"); acc=0;
   }
   sync();
   last=y; ticking=false;
  }

  window.addEventListener("scroll",function(){
   if(!ticking){ requestAnimationFrame(upd); ticking=true; }
  },{passive:true});

  // si alguien llega al encabezado con el teclado, tiene que estar visible
  hdr.addEventListener("focusin",function(){ hdr.classList.remove("is-hidden"); });
  upd();
 })();

 // ── 360 spinner
 document.querySelectorAll(".spin").forEach(function(el){
  var n=+el.dataset.frames, base=el.dataset.src, img=el.querySelector(".spin-img"),
      hint=el.querySelector(".spin-hint"), cache=[], on=false, i=+(el.dataset.start||0), x0=null, acc=0;
  function load(){
    if(on) return; on=true; el.classList.add("is-on");
    for(var k=0;k<n;k++){ var im=new Image(); im.src=base+String(k).padStart(2,"0")+".webp"; cache.push(im); }
    show(i);
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
  if(hint) hint.addEventListener("click",function(){ var s0=i; load(); var k=0, t=setInterval(function(){ show(s0+(++k)); if(k>=n) clearInterval(t); },55); });

  // empujoncito: al entrar en pantalla gira un par de cuadros y regresa,
  // para que se note que la unidad se puede arrastrar
  if("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
   var yaGuinado=false;
   var ioSpin=new IntersectionObserver(function(entradas){
    entradas.forEach(function(en){
     if(!en.isIntersecting || yaGuinado) return;
     yaGuinado=true; ioSpin.unobserve(el);
     setTimeout(function(){
      var s0=i; load();
      var pasos=[1,2,3,2,1,0], k=0;
      var t=setInterval(function(){
       show(s0+pasos[k]); k++;
       if(k>=pasos.length) clearInterval(t);
      },110);
     }, 550);
    });
   },{threshold:.45});
   ioSpin.observe(el);
  }
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

 // ── revelado al hacer scroll: cada sección de nivel superior entra con fundido + subida
 (function(){
  var secs = document.querySelectorAll("main > section");
  if(!secs.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  secs.forEach(function(s,idx){
   s.classList.add("reveal");
   if(idx===0 || reduce){ s.classList.add("is-visible"); return; }
   if(!("IntersectionObserver" in window)){ s.classList.add("is-visible"); return; }
  });
  if(reduce || !("IntersectionObserver" in window)) return;
  var targets = Array.prototype.slice.call(secs,1);
  var io = new IntersectionObserver(function(entries){
   entries.forEach(function(e){
    if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); }
   });
  }, {threshold:.12, rootMargin:"0px 0px -6% 0px"});
  targets.forEach(function(s){ io.observe(s); });
 })();

 // ── paralaje suave en la palabra gigante de fondo del escenario (hero)
 (function(){
  var word = document.querySelector(".hero-h .stage-word, .hero-m .stage-word");
  if(!word) return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ticking=false;
  function update(){
   var y = window.scrollY || window.pageYOffset;
   word.style.transform = "translateX(-50%) translateY(" + Math.min(y*0.16, 90) + "px)";
   ticking=false;
  }
  window.addEventListener("scroll", function(){ if(!ticking){ requestAnimationFrame(update); ticking=true; } }, {passive:true});
 })();

 // ── las cifras de la banda oscura cuentan hacia arriba al entrar en pantalla
 (function(){
  var celdas=document.querySelectorAll(".sec-stat .kpi b");
  if(!celdas.length) return;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce || !("IntersectionObserver" in window)) return;

  var objetivos=[];
  celdas.forEach(function(el){
   // separa "≈4.3 m³" en prefijo, número y sufijo; si no hay número, se deja igual
   var m=String(el.textContent).match(/^(\D*)([\d][\d.,]*)(.*)$/);
   if(!m) return;
   var crudo=m[2].replace(/,/g,"");
   var valor=parseFloat(crudo);
   if(!isFinite(valor)) return;
   var dec=(crudo.split(".")[1]||"").length;
   objetivos.push({el:el, pre:m[1], post:m[3], valor:valor, dec:dec, hecho:false});
   el.textContent = m[1] + (0).toFixed(dec) + m[3];
  });
  if(!objetivos.length) return;

  function fmt(n,dec){ return n.toLocaleString("es-MX",{minimumFractionDigits:dec,maximumFractionDigits:dec}); }

  function animar(o){
   if(o.hecho) return; o.hecho=true;
   var t0=null, dur=1100;
   function paso(ts){
    if(t0===null) t0=ts;
    var p=Math.min(1,(ts-t0)/dur);
    var e=1-Math.pow(1-p,3);              // easeOutCubic
    o.el.textContent=o.pre+fmt(o.valor*e,o.dec)+o.post;
    if(p<1) requestAnimationFrame(paso);
    else o.el.textContent=o.pre+fmt(o.valor,o.dec)+o.post;
   }
   requestAnimationFrame(paso);
  }

  var io=new IntersectionObserver(function(entradas){
   entradas.forEach(function(en){
    if(!en.isIntersecting) return;
    objetivos.forEach(function(o){ if(en.target.contains(o.el)) animar(o); });
   });
  },{threshold:.35});
  document.querySelectorAll(".sec-stat").forEach(function(s){ io.observe(s); });
 })();

 // ── las imágenes diferidas entran con fundido en lugar de aparecer de golpe
 (function(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll('img[loading="lazy"]').forEach(function(img){
   if(img.complete) return;                 // ya estaba: no la escondemos
   img.classList.add("img-fade");           // la clase la pone el JS: sin JS todo se ve
   function listo(){ img.classList.add("is-loaded"); }
   img.addEventListener("load",listo,{once:true});
   img.addEventListener("error",listo,{once:true});
  });
 })();

 // ── botón de reproducción sobre el video, en lugar de los controles pelones
 document.querySelectorAll(".vid-frame").forEach(function(marco){
  var v=marco.querySelector("video"); if(!v) return;
  var b=document.createElement("button");
  b.className="vid-play"; b.type="button";
  b.setAttribute("aria-label","Reproducir video");
  marco.appendChild(b);
  b.addEventListener("click",function(){
   b.classList.add("is-gone");
   var p=v.play();
   if(p && p.catch) p.catch(function(){ b.classList.remove("is-gone"); });
  });
  v.addEventListener("play",function(){ b.classList.add("is-gone"); });
 });

 // ── comparador: filtrar modelos
 (function(){
  var tabla=document.getElementById("tabla-comparador"); if(!tabla) return;
  var chips=document.querySelectorAll('[data-cmp-toggle]');
  function apply(){
   chips.forEach(function(c){
    var on=c.checked, slug=c.dataset.cmpToggle;
    tabla.querySelectorAll('[data-cmp-col="'+slug+'"]').forEach(function(el){ el.classList.toggle("is-hidden",!on); });
   });
  }
  chips.forEach(function(c){ c.addEventListener("change",function(){
   var checked=Array.prototype.filter.call(chips,function(x){return x.checked;});
   if(checked.length<2){ c.checked=true; return; } // siempre queda algo que comparar
   apply();
  }); });
 })();

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
