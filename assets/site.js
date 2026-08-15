
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

 // ── carrusel del encabezado: los cinco vehículos, mismo escenario
 (function(){
  var car=document.getElementById("heroCar"); if(!car) return;
  var datosEl=document.getElementById("heroDatos"); if(!datosEl) return;
  var datos; try{ datos=JSON.parse(datosEl.textContent); }catch(e){ return; }
  if(!datos.length) return;

  var imgs=car.querySelectorAll(".hv"),
      palabra=car.querySelector("[data-hero-word]"),
      meta=document.querySelector("[data-hero-meta]"),
      ficha=document.querySelector("[data-hero-ficha]"),
      pestanas=document.querySelectorAll(".hero-dot");
  var i=0, reloj=null, elegido=false;
  // en táctil no hay cursor que pause: el avance solo cambiaría el botón
  // "Ver el X30" justo cuando el dedo va bajando. Mejor manda el deslizamiento.
  var tactil=window.matchMedia("(hover: none)").matches;
  var aLaVista=true;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ir(k){
   var n=datos.length;
   i=(k+n)%n;
   var ant=(i-1+n)%n, sig=(i+1)%n;
   for(var j=0;j<imgs.length;j++){
    imgs[j].classList.toggle("is-cur",  j===i);
    imgs[j].classList.toggle("is-prev", j===ant && n>2);
    imgs[j].classList.toggle("is-next", j===sig && n>1);
   }
   for(var t=0;t<pestanas.length;t++){
    pestanas[t].classList.toggle("on", t===i);
    pestanas[t].setAttribute("aria-selected", t===i ? "true" : "false");
   }
   if(palabra) palabra.textContent=datos[i].w;
   if(meta) meta.textContent=datos[i].m;
   if(ficha){ ficha.textContent="Ver el "+datos[i].w; ficha.href=datos[i].u; }
  }
  function para(){ if(reloj){ clearInterval(reloj); reloj=null; } }
  function arranca(){ if(!reduce && !elegido && aLaVista && !reloj) reloj=setInterval(function(){ ir(i+1); },4000); }

  for(var t=0;t<pestanas.length;t++)(function(t){
   pestanas[t].addEventListener("click",function(){ elegido=true; para(); ir(t); });
  })(t);

  // los vehículos de los lados también llevan a su modelo
  for(var q=0;q<imgs.length;q++)(function(q){
   imgs[q].addEventListener("click",function(){ elegido=true; para(); ir(q); });
  })(q);

  ir(0);
  // avanza solo hasta que la persona elige: a partir de ahí manda ella
  arranca();

  // deslizar para cambiar de vehículo
  var sx=null, sy=null;
  car.addEventListener("touchstart",function(e){
   sx=e.touches[0].clientX; sy=e.touches[0].clientY;
  },{passive:true});
  car.addEventListener("touchend",function(e){
   if(sx===null) return;
   var dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy;
   sx=null;
   if(Math.abs(dx)<40 || Math.abs(dx)<Math.abs(dy)) return;   // iba bajando, no de lado
   elegido=true; para(); ir(i + (dx<0?1:-1));
  },{passive:true});
  car.addEventListener("pointerenter",para);
  car.addEventListener("pointerleave",arranca);
  if("IntersectionObserver" in window){
   new IntersectionObserver(function(e){
    aLaVista=e[0].isIntersecting;
    if(aLaVista) arranca(); else para();
   },{threshold:.5}).observe(car);
  }
 })();

 // ── 360: los cuadros se decodifican una sola vez y después solo se dibujan
 document.querySelectorAll(".spin").forEach(function(el){
  var n=+el.dataset.frames, base=el.dataset.src,
      img=el.querySelector(".spin-img"), hint=el.querySelector(".spin-hint");
  if(!n || !img) return;

  var cache=new Array(n), pedido=false, cv=null, ctx=null,
      i=+(el.dataset.start||0), acc=0, vel=0, glide=null,
      arrastra=false, xPrev=0, dxPend=0, pintando=null;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function lienzo(w,h){
   cv=document.createElement("canvas");
   cv.width=w; cv.height=h; cv.className="spin-cv"; cv.setAttribute("aria-hidden","true");
   ctx=cv.getContext("2d",{alpha:true,desynchronized:true});
   el.appendChild(cv);
  }
  function dibujar(){
   var im=cache[i];
   if(!im || !im.complete || !im.naturalWidth) return;       // aún no llega: se queda el cuadro anterior
   if(!cv) lienzo(im.naturalWidth, im.naturalHeight);
   ctx.clearRect(0,0,cv.width,cv.height);
   ctx.drawImage(im,0,0,cv.width,cv.height);
   el.classList.add("is-ready");                              // recién aquí se oculta el <img>
  }
  function traer(k,prio){
   if(cache[k]) return;
   var im=new Image();
   im.decoding="async";
   if("fetchPriority" in im) im.fetchPriority=prio;
   im.onload=function(){ if(k===i) dibujar(); };
   im.src=base+String(k).padStart(2,"0")+".webp";
   cache[k]=im;
  }
  function ocioso(f){ (window.requestIdleCallback||function(g){setTimeout(g,200);})(f); }

  // el juego completo pesa ~600 KB: si se baja de golpe le quita ancho de banda
  // a la imagen grande del encabezado, que es la que mide el LCP.
  // Primero el cuadro visible; el resto en baja prioridad y ya cargada la página.
  function cargar(prisa){
   if(pedido) return; pedido=true; el.classList.add("is-on");
   traer(i,"high");
   var resto=function(){
    for(var d=1;d<=n;d++){ traer((i+d)%n,"low"); traer((i-d+n)%n,"low"); }
   };
   if(prisa) resto();                                   // ya interactuó: lo quiere ahora
   else if(document.readyState==="complete") ocioso(resto);
   else window.addEventListener("load",function(){ ocioso(resto); },{once:true});
  }
  function ir(k){ i=((k%n)+n)%n; dibujar(); }

  // una vuelta completa ≈ 520 px de arrastre
  function paso(){ return Math.max(4, Math.min(520, Math.max(260, el.clientWidth*0.5))/n); }

  // el ratón dispara muchos más eventos que cuadros pinta la pantalla:
  // se acumulan y se aplican una sola vez por refresco
  function aplicar(){
   pintando=null;
   var p=paso(), cambio=false;
   acc+=dxPend; dxPend=0;
   while(Math.abs(acc)>=p){ i=((i+(acc>0?-1:1))%n+n)%n; acc+= acc>0?-p:p; cambio=true; }
   if(cambio) dibujar();
  }
  function encolar(dx){
   dxPend+=dx;
   if(!pintando) pintando=requestAnimationFrame(aplicar);
  }

  function abajo(e){
   if(e.button && e.button!==0) return;
   e.preventDefault();
   cargar(true);
   if(glide){ cancelAnimationFrame(glide); glide=null; }
   arrastra=true; xPrev=e.clientX; vel=0; acc=0; dxPend=0;
   el.classList.add("is-drag");
   try{ el.setPointerCapture(e.pointerId); }catch(_){}
  }
  function mueve(e){
   if(!arrastra) return;
   var dx=e.clientX-xPrev; xPrev=e.clientX;
   vel=vel*0.75+dx*0.25;
   encolar(dx);
  }
  function suelta(e){
   if(!arrastra) return;
   arrastra=false; el.classList.remove("is-drag");
   try{ el.releasePointerCapture(e.pointerId); }catch(_){}
   if(reduce || Math.abs(vel)<1.2) return;
   (function f(){
    vel*=0.945; encolar(vel);
    glide = Math.abs(vel)>0.35 ? requestAnimationFrame(f) : null;
   })();
  }

  if(window.PointerEvent){
   el.addEventListener("pointerdown",abajo);
   el.addEventListener("pointermove",mueve);
   el.addEventListener("pointerup",suelta);
   el.addEventListener("pointercancel",suelta);
   el.addEventListener("pointerenter",function(){ cargar(true); });   // en escritorio ya está listo antes de arrastrar
  } else {
   el.addEventListener("mousedown",function(e){ abajo(e); });
   window.addEventListener("mousemove",function(e){ mueve(e); });
   window.addEventListener("mouseup",function(e){ suelta(e); });
   el.addEventListener("touchstart",function(e){ abajo(e.touches[0]); },{passive:false});
   el.addEventListener("touchmove",function(e){ mueve(e.touches[0]); if(e.cancelable) e.preventDefault(); },{passive:false});
   el.addEventListener("touchend",function(e){ suelta({}); });
  }

  el.setAttribute("tabindex","0");
  el.setAttribute("role","group");
  el.setAttribute("aria-label","Vista 360° — arrastra o usa las flechas");
  el.addEventListener("keydown",function(e){
   if(e.key!=="ArrowLeft" && e.key!=="ArrowRight") return;
   e.preventDefault(); cargar(true); ir(i + (e.key==="ArrowRight"?1:-1));
  });

  if(hint) hint.addEventListener("click",function(){
   cargar(true);
   var k=0, t=setInterval(function(){ ir(i+1); if(++k>=n) clearInterval(t); },55);
  });

  // al entrar en pantalla: precarga siempre, y da un empujoncito para que se
  // note que la unidad se puede arrastrar
  if("IntersectionObserver" in window){
   var io=new IntersectionObserver(function(ent){
    ent.forEach(function(x){
     if(!x.isIntersecting) return;
     io.unobserve(el); cargar();
     if(reduce) return;
     var guino=function(reintento){
      var listo=cache[(i+3)%n] && cache[(i+3)%n].complete;
      if(!listo){ if(reintento) setTimeout(function(){ guino(false); },1600); return; }
      var i0=i, pasos=[1,2,3,2,1,0], k=0;
      var t=setInterval(function(){ ir(i0+pasos[k]); if(++k>=pasos.length) clearInterval(t); },110);
     };
     setTimeout(function(){ guino(true); },700);
    });
   },{threshold:.4});
   io.observe(el);
  } else { cargar(); }
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
  // las del carrusel quedan fuera: ya tienen su propio fundido y este las forzaba a verse
  document.querySelectorAll('img[loading="lazy"]:not(.hv)').forEach(function(img){
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
