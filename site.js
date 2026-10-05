// The page's scripts (they were inline in index.html). Kept in a file so the site's
// Content-Security-Policy (_headers) can refuse inline scripts and inline event handlers:
// buttons are wired up with addEventListener below, never with onclick= in the HTML.

// ── CANVAS ──
const cvs = document.getElementById('canvas-bg');
const cx = cvs.getContext('2d');
let pts = [];
const mouse = { x: -9999, y: -9999 };
const REPEL_R = 120, REPEL_F = 3.5;
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('touchmove', e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, {passive:true});
window.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });
function resize(){ cvs.width=innerWidth; cvs.height=innerHeight; }
resize();
window.addEventListener('resize',()=>{ resize(); init(); });
class P {
  constructor(){ this.r(); }
  r(){ this.x=Math.random()*cvs.width; this.y=Math.random()*cvs.height; this.vx=(Math.random()-.5)*.38; this.vy=(Math.random()-.5)*.38; this.s=Math.random()*1.4+.4; this.o=Math.random()*.38+.08; this.col=Math.random()>.5?'0,230,118':'0,191,165'; }
  u(){
    const dx=this.x-mouse.x, dy=this.y-mouse.y;
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d<REPEL_R && d>0){
      const f=(1-d/REPEL_R)*REPEL_F;
      this.vx+=dx/d*f; this.vy+=dy/d*f;
    }
    const spd=Math.sqrt(this.vx*this.vx+this.vy*this.vy);
    if(spd>3){ this.vx=this.vx/spd*3; this.vy=this.vy/spd*3; }
    this.vx*=.97; this.vy*=.97;
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<0||this.x>cvs.width)this.vx*=-1;
    if(this.y<0||this.y>cvs.height)this.vy*=-1;
  }
  d(){
    const dx=this.x-mouse.x, dy=this.y-mouse.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const glow=dist<REPEL_R ? 1-(dist/REPEL_R) : 0;
    const opacity=this.o+glow*.55;
    const size=this.s+(glow*1.8);
    cx.beginPath(); cx.arc(this.x,this.y,size,0,Math.PI*2);
    cx.fillStyle=`rgba(${this.col},${Math.min(opacity,.95)})`; cx.fill();
  }
}
function init(){ pts=[]; const n=Math.min(Math.floor(cvs.width*cvs.height/11000),110); for(let i=0;i<n;i++)pts.push(new P()); }
let _hidden=false;
document.addEventListener('visibilitychange',()=>{ _hidden=document.hidden; if(!_hidden) requestAnimationFrame(draw); });
function draw(){
  if(_hidden) return;
  cx.clearRect(0,0,cvs.width,cvs.height);
  pts.forEach(p=>{p.u();p.d();});
  for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
    const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<115){
      const mx2=(pts[i].x+pts[j].x)/2, my2=(pts[i].y+pts[j].y)/2;
      const dm=Math.sqrt((mx2-mouse.x)**2+(my2-mouse.y)**2);
      const glow=dm<160?1-dm/160:0;
      const alpha=(1-d/115)*(.09+glow*.28);
      cx.beginPath(); cx.moveTo(pts[i].x,pts[i].y); cx.lineTo(pts[j].x,pts[j].y);
      cx.strokeStyle=`rgba(0,230,118,${Math.min(alpha,.55)})`; cx.lineWidth=.5+glow*.8; cx.stroke();
    }
  }
  requestAnimationFrame(draw);
}
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){ init(); draw(); }

// ── SCROLL PROGRESS ──
const prog=document.getElementById('progress');
function updateProgress(){
  const s=document.documentElement.scrollTop||document.body.scrollTop;
  const h=document.documentElement.scrollHeight-document.documentElement.clientHeight;
  prog.style.width=(s/h*100)+'%';
}

// ── NAV ACTIVE + SCROLL ──
const nav=document.getElementById('nav');
const stbtn=document.getElementById('stbtn');
const sections=document.querySelectorAll('section[id]');
const navAs=document.querySelectorAll('.nav-links a[data-sec]');
window.addEventListener('scroll',()=>{
  updateProgress();
  nav.classList.toggle('scrolled',scrollY>50);
  stbtn.classList.toggle('show',scrollY>500);
  // active nav
  let cur='';
  sections.forEach(s=>{ if(scrollY>=s.offsetTop-120)cur=s.id; });
  navAs.forEach(a=>a.classList.toggle('active',a.dataset.sec===cur));
},{ passive:true });

// ── HAMBURGER ──
const hbg=document.getElementById('hbg');
const nl=document.getElementById('navLinks');
hbg.addEventListener('click',()=>{ hbg.classList.toggle('open'); nl.classList.toggle('open'); const menuOpen=nl.classList.contains('open'); document.body.classList.toggle('nav-open',menuOpen); hbg.setAttribute('aria-expanded',menuOpen); hbg.setAttribute('aria-label',menuOpen?'Close menu':'Open menu'); });
nl.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  hbg.classList.remove('open'); nl.classList.remove('open'); document.body.classList.remove('nav-open');
  hbg.setAttribute('aria-expanded','false'); hbg.setAttribute('aria-label','Open menu');
  setTimeout(()=>{
    let cur='';
    sections.forEach(s=>{ if(scrollY>=s.offsetTop-120)cur=s.id; });
    navAs.forEach(a=>a.classList.toggle('active',a.dataset.sec===cur));
  },400);
}));

// ── STAT COUNTERS ──
function animCount(el,raw,dur){
  if(!/^[\d.]/.test(raw)) return; // labels like "Top 15" stay as written
  const isFloat=raw.includes('.');
  const num=parseFloat(raw);
  const suf=raw.replace(/[\d.]/g,'');
  const start=Date.now();
  const tick=()=>{
    const p=Math.min((Date.now()-start)/dur,1);
    const e=1-Math.pow(1-p,3);
    el.textContent=(isFloat?( num*e).toFixed(2):Math.floor(num*e))+suf;
    if(p<1)requestAnimationFrame(tick);
    else el.textContent=raw;
  };
  tick();
}
const statObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const numEl=e.target.querySelector('.stat-num');
      if(numEl&&!e.target.dataset.counted){
        e.target.dataset.counted='1';
        animCount(numEl,numEl.textContent,1400);
      }
    }
  });
},{threshold:.5});
document.querySelectorAll('.stat-box').forEach(b=>statObs.observe(b));

// ── SCROLL ANIMATIONS ──
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('show');
    }
  });
},{threshold:.1});
document.querySelectorAll('.fi').forEach(el=>obs.observe(el));

// ── THEME TOGGLE ──
function toggleTheme(){
  const light=document.body.classList.toggle('light');
  const icon=document.getElementById('themeIcon');
  if(light){
    icon.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
    localStorage.setItem('theme','light');
  } else {
    icon.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
    localStorage.setItem('theme','dark');
  }
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.setAttribute('content',light?'#fafcfa':'#030803'));
}
// Respect the visitor's OS theme on first visit; their manual choice wins afterwards
const _storedTheme=localStorage.getItem('theme');
if(_storedTheme==='light'||(!_storedTheme&&window.matchMedia('(prefers-color-scheme: light)').matches)) toggleTheme();

// ── CASE STUDY TOGGLE ──
function toggleCS(btn){
  const body=btn.nextElementSibling;
  const open=body.classList.toggle('open');
  btn.classList.toggle('open',open);
  btn.setAttribute('aria-expanded',open);
}

// ── CONTACT FORM ──
function handleForm(e){
  e.preventDefault();
  const ar=window.LANGCUR==='ar';
  const btn=document.getElementById('fbtn'), status=document.getElementById('fstatus');
  // show a result on the button, announce it to screen readers, then put the button back
  const show=(label,bg,fg,ms)=>{
    btn.textContent=label; status.textContent=label; btn.style.background=bg; btn.style.color=fg;
    setTimeout(()=>{ btn.textContent=window.LANGCUR==='ar'?'أرسل الرسالة ←':'Send Message →'; btn.style.background=''; btn.style.color=''; btn.disabled=false; },ms);
  };
  const fail=()=>show(ar?'خطأ - حاول مجدداً':'Error - try again','#dc2626','#fff',3000);
  btn.textContent=ar?'جارٍ الإرسال…':'Sending…'; btn.disabled=true;
  fetch('https://formspree.io/f/xpqgdlay',{method:'POST',body:new FormData(e.target),headers:{Accept:'application/json'}})
    .then(r=>{ if(!r.ok) return fail(); e.target.reset(); show(ar?'تم الإرسال! ✓':'Sent! ✓','#22c55e','#03130a',3200); })
    .catch(fail);
}

// ── PHOTO FALLBACK ──
const profileImg=document.getElementById('profile-img');
const fallback=document.getElementById('photo-fallback');
if(profileImg){ profileImg.onerror=()=>{ profileImg.style.display='none'; if(fallback)fallback.style.display='flex'; }; }

// ── CERT LOGO FALLBACKS ──
document.querySelectorAll('.cert-logo img').forEach(img=>{
  img.onerror=function(){ this.classList.add('err'); };
});

// ── MOUSE PARALLAX ──
document.addEventListener('mousemove',e=>{
  const x=(e.clientX/innerWidth-.5)*22,y=(e.clientY/innerHeight-.5)*22;
  document.querySelector('.orb1').style.transform=`translate(${x*.4}px,${y*.4}px)`;
  document.querySelector('.orb2').style.transform=`translate(${-x*.3}px,${-y*.3}px)`;
});

// ── PHOTO 3D TILT ──
(function(){
  const wrap = document.querySelector('.photo-wrap');
  const hero = document.querySelector('.hero-photo');
  if(!wrap||!hero) return;
  hero.addEventListener('mousemove', e=>{
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width/2) / (r.width/2);
    const y = (e.clientY - r.top - r.height/2) / (r.height/2);
    wrap.style.transform = `perspective(700px) rotateY(${x*9}deg) rotateX(${-y*9}deg) scale(1.03)`;
  });
  hero.addEventListener('mouseleave', ()=>{ wrap.style.transform = ''; });
})();

// ── BUTTONS ──
document.getElementById('themeBtn').addEventListener('click',toggleTheme);
document.querySelectorAll('.cs-toggle').forEach(btn=>btn.addEventListener('click',()=>toggleCS(btn)));
document.getElementById('cform').addEventListener('submit',handleForm);
stbtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// ── ARABIC / ENGLISH TOGGLE ──
// English lives in the DOM and is cached into data-en on first swap, so only
// Arabic strings are stored here. null in a list = keep that element in English.
// Lists follow DOM order: reordering or adding cards means updating them here too.
// ?lang=ar (or en) picks the language for that visit, so an Arabic link can be shared.
const _qLang = new URLSearchParams(location.search).get('lang');
window.LANGCUR = (_qLang==='ar'||_qLang==='en') ? _qLang : (localStorage.getItem('lang') || 'en');

const AR_HTML = {
  '.skip-link': 'تخطَّ إلى المحتوى',
  'a.coop-banner': '<span class="coop-dot"></span> مهندس برمجيات في مايكروموبيليتي · تدريب تعاوني في صلة ←',
  '.hero-greeting': 'أهلاً، أنا',
  '.hero-name': 'مالك <span>النجار</span>',
  '.hero-role': '<span class="tw">مهندس برمجيات</span> <span>· تطوير متكامل وبيانات</span>',
  '.hero-desc': 'أبني برمجيات إنتاجية من البداية إلى النهاية. في مايكروموبيليتي أطوّر منصة الحجز وتسجيل الحضور ونقاط البيع التي تدير رحلاتها في جدة، على <strong>PostgreSQL</strong> و<strong>Supabase</strong> و<strong>Cloudflare</strong>، وأتدرّب حالياً تدريباً تعاونياً في إدارة تقنية المعلومات في صلة. وتمتد مشاريعي إلى <strong>خطوط البيانات</strong> و<strong>تعلم الآلة</strong> و<strong>إنترنت الأشياء</strong>. خريج جامعة الأعمال والتكنولوجيا (معدل <strong>4.97/5.0</strong> بمرتبة الشرف الأولى) · معتمد من AWS · ثنائي اللغة.',
  '.cs-fig figcaption': 'تبويب السلوك على نموذج العرض الحي',
  '.sk-also-label': 'تدرّبت أيضاً على (ضمن مسارات الشهادات)',
  '.vol-title': 'التطوع',
  '.contact-info h3': 'جاهزون لبناء شيء ذي أثر؟',
  '.contact-info p': 'أعمل مهندس برمجيات في مايكروموبيليتي بجدة، وأتدرّب تدريباً تعاونياً في إدارة تقنية المعلومات في صلة، وأستمتع ببناء أنظمة يعتمد عليها الناس كل يوم. تواصل معي بخصوص المشاريع أو التعاون أو الفرص الوظيفية.',
  '.form-box h3': 'أرسل رسالة',
  '.form-box .sub': 'سأرد عليك خلال 24 ساعة.',
  '#fbtn': 'أرسل الرسالة ←',
  '.footer-copy': 'صمّمه وبناه <span>مالك النجار</span> · 2026',
  '.footer-built': 'مهندس برمجيات · جدة، السعودية'
};

const AR_LIST = {
  '.nav-links a[data-sec]': ['عني','الخبرة','المشاريع','المهارات','الشهادات','الجوائز','تواصل'],
  '.sec-tag': ['عني','الخبرة','المشاريع','التقنيات','الشهادات','الإنجازات','تواصل'],
  '.sec-title': ['من <span>أنا</span>','الخبرة و<span>القيادة</span>','ماذا <span>بنيت</span>','ترسانتي <span>التقنية</span>','الشهادات <span>الاحترافية</span>','الإنجازات و<span>الأثر</span>','لنبقَ على <span>تواصل</span>'],
  '.sec-sub': ['مطوّر عند ملتقى البرمجيات والبيانات','أدوار قدتُ فيها وبنيتُ وأنجزت','أنظمة حقيقية تحل مشكلات حقيقية','ما أستخدمه في الإنتاج وفي مشاريعي','اعتمادات معترف بها في السحابة والبيانات والإدارة','ما وراء الكود: منافسة وقيادة ومساهمة','لديك مشروع أو فرصة أو سؤال؟ يسعدني تواصلك.'],
  '#about .about-text > p': [
    'أنا <strong>مهندس برمجيات في مايكروموبيليتي</strong> بجدة، أبني وأدير المنصة التي تقوم عليها رحلات الشركة الجماعية: حجز العملاء وتسجيل الحضور ونقاط البيع والتقارير، ويستخدمها الموظفون والدرّاجون في كل ليلة رحلات. وإلى جانب ذلك أتدرّب تدريباً تعاونياً في إدارة تقنية المعلومات في <strong>صلة</strong>.',
    'تخرجت في <strong>هندسة البرمجيات</strong> من جامعة الأعمال والتكنولوجيا (UBT) بمرتبة الشرف الأولى وبمعدل <strong>4.97/5.0</strong>. تمتد مشاريعي من <strong>استشعار إنترنت الأشياء والذكاء الطرفي</strong> إلى <strong>خطوط جودة البيانات</strong> و<strong>التنبؤ بتعلم الآلة</strong>، وأحمل شهادتَي AWS في هندسة البيانات وهندسة الحلول.',
    'ثنائي اللغة (عربي/إنجليزي، IELTS 7.5)، وقائد مجتمع تقني عبر GDG وACM، ومدفوع ببرمجيات تحل مشكلات حقيقية بما يتماشى مع <strong>رؤية السعودية 2030</strong>.'
  ],
  '.hl-title': ['مايكروموبيليتي','صلة','جامعة UBT، جدة','معتمد من AWS'],
  '.hl-desc': ['مهندس برمجيات · منذ يونيو 2026','تدريب تعاوني في تقنية المعلومات · منذ يوليو 2026','بكالوريوس هندسة برمجيات · معدل 4.97/5.0',null],
  '.tl-live': ['حالياً','حالياً','حالياً'],
  '.exp-title': ['مهندس برمجيات','تدريب تعاوني في تقنية المعلومات','متطوع في حماية الحقوق','قائد فريق التواصل المجتمعي','نائب الرئيس وأمين الصندوق'],
  '.exp-org': ['مايكروموبيليتي · جدة، السعودية','صلة · السعودية','اللجنة المنظمة المحلية للاتحاد الآسيوي · السعودية','مجموعات مطوري Google في الجامعات · UBT','فرع ACM الطلابي · UBT'],
  '.exp-bullets li': [
    'أبني وأدير منصة الحجز والتشغيل للشركة: حجز العملاء بتسجيل دخول Google وApple، وتسجيل حضور الموظفين، ونقاط البيع، والمخزون، والاسترداد',
    'أصمم الخلفية على PostgreSQL وSupabase: أمان على مستوى الصفوف لكل جدول، ودوال خاصة بالموظفين، ومزامنة لحظية بين أجهزتهم، وأكثر من 85 ترحيلاً مُرقّماً لقاعدة البيانات',
    'أطلق تسجيل الدراجات عبر NFC وبطاقات Apple Wallet وواجهة بعشر لغات تدعم العربية والأردية من اليمين إلى اليسار',
    'أحمي كل إصدار باختبارات Playwright شاملة وفحوص CI للجودة والأنواع وتطابق الترجمات',
    'حماية الملكية الفكرية وحقوق البث للاتحاد الآسيوي خلال نهائيات دوري أبطال آسيا للنخبة 2026',
    'مراقبة الامتثال المباشر عبر عدة ملاعب في مباريات نخبة الأندية القارية',
    'سبق أن تطوعت في حماية العلامة التجارية بكأس آسيا تحت 23 (يناير 2026)',
    'قدت فريق تواصل من 5 أعضاء نظّم ورشاً في السحابة والبيانات والذكاء الاصطناعي داخل الحرم الجامعي',
    'وصلنا لأكثر من 100 طالب عبر الجلسات، ونما الحضور في كل جلسة بأكثر من 40%',
    'نسّقت مع قيادة GDG استراتيجية الفعاليات واستقطاب المتحدثين',
    'أدرت ميزانية سنوية قدرها 5,000 ريال دون أي تجاوز طوال العام',
    'قدمنا 3-5 فعاليات تقنية في كل دورة: هاكاثونات وورش سحابية ومسابقات برمجة',
    'أكثر من 30 مشاركاً في كل فعالية مع نمو العضوية النشطة على مدار العام'
  ],
  '.proj-award': ['يعمل في الإنتاج','مشروع تخرج 2025-26','متأهل لنهائيات الإحصاء','أفضل 15 / +500 فريق','عسير تبتكر 2025'],
  '.proj-priv': ['مستودع خاص','مستودع خاص','مستودع خاص'],
  '.proj-type': ['منصة حجز وتسجيل حضور ونقاط بيع · تطبيق ويب تقدمي','نظام أرفف تجزئة ذكي','منصة جودة البيانات والتحقق','كرسي متحرك ذاتي القيادة وتطبيق مساعد سفر · أفيثون 2025 (هيئة الطيران المدني)','منصة سياحة مغامرات ذكية'],
  '.proj-desc': [
    'المنصة الإنتاجية التي تدير رحلات مايكروموبيليتي الجماعية وفعالياتها في جدة. يحجز الدرّاجون بعشر لغات مع تسجيل الدخول عبر Google أو Apple ويحصلون على بطاقات Apple Wallet، ويدير الموظفون تسجيل الحضور (بما فيه وسوم NFC على الدراجات) ونقاط البيع والمخزون والاسترداد والتقارير من هواتفهم مع مزامنة لحظية. قاعدة PostgreSQL على Supabase بأمان على مستوى الصفوف، منشورة على Cloudflare، مع اختبارات Playwright شاملة في CI.',
    'رف تجزئة ذكي ثنائي الاستشعار للمتاجر الصغيرة: خلية وزن وكاميرا على ESP32-S3 تنشران الأحداث عبر MQTT إلى خادم محلي FastAPI مع PostgreSQL (29 نقطة REST مع WebSocket مباشر). يتحقق نموذج YOLOv12n من كل حدث وزن عبر مقطع الكاميرا، وتتنبأ نماذج LightGBM الكمّية (q10/q50/q90) بالطلب لكل صنف، ويعدّل محرك من خمس قواعد الأسعار ضمن نطاق ±15% مع سجل تدقيق كامل. دون أي بيانات شخصية، ويعمل دون اتصال، مع 143 اختبار تكامل ناجحاً وبكلفة 80 ريالاً للرف.',
    'حارس جودة لحظي لمسوح الهيئة العامة للإحصاء الميدانية: إضافة متصفح تكتشف التناقضات الدلالية (شاب عمره 19 سنة "مدير عام"، دخل مرتفع دون عمل) أثناء الإدخال وقبل إرسال الاستمارة. ثلاث طبقات متصاعدة: تحقق هيكلي عبر Great Expectations، وحارس إحصائي One-Class SVM، ونموذج لغوي محلي يدعم العربية (Qwen 2.5 عبر Ollama) يشرح سبب كل تعارض. ارتفع الاكتشاف من 23% إلى 87.5% (F1 = 0.829 على بيانات حقيقية من مسح القوى العاملة) بدقة تتجاوز 97%، دون خروج أي بيانات من الشبكة الحكومية.',
    'كرسي متحرك ذكي ذاتي القيادة مع تطبيق مساعد سفر يمنح ذوي الإعاقة استقلالية كاملة في المطار: خرائط ROS مع LiDAR وكاميرا عمق RealSense ومشفرات العجلات مدموجة على Jetson Nano بذكاء اصطناعي طرفي، مع توجيه ذكي ومراقبة طوارئ وتواصل متكيف للصم والمكفوفين، ويُحجز مباشرة من مواقع شركات الطيران. أمان بالتصميم: TLS 1.3 أثناء النقل وAES-256 عند التخزين وMFA وحذف تلقائي للبيانات الشخصية بعد الصعود (بمواءمة ECC-2 وISO 27001). ضمن أفضل 15 من بين أكثر من 500 فريق في أفيثون 2025.',
    'منصة سياحة مغامرات تجعل مسارات عسير الجبلية آمنة وقابلة للحجز: تطبيق Flutter مع Mapbox يشمل حجز الرحلات، ونظام إنذار مبكر بالذكاء الاصطناعي وإنترنت الأشياء (AWS IoT Core وSageMaker) يراقب حالة المسارات، وشبكة مرشدين محليين معتمدين، و"جواز قمم عسير" الرقمي يُختم عند إكمال كل مسار. وعبر خاصية "دليل القمم" يصوّر المرشد المعتمد المسارات غير الموثقة فيولّد الذكاء الاصطناعي المسار الأمثل ونقاط الاستراحة والخطر والخدمات لمراجعة فريق مختص. قُدم لهيئة تطوير منطقة عسير في هاكاثون عسير تبتكر 2025.'
  ],
  // architecture strips: AUJ, Sadeed, Tayseer, Masra (5 stages each)
  '.flow-role': [
    'الحافة','النقل','الخادم المحلي','تعلم الآلة','لوحة التحكم',
    'الالتقاط','الطبقة 1','الطبقة 2','الطبقة 3','النتيجة',
    'الاستشعار','ذكاء طرفي','التنقل','المساعدة','الأمان',
    'التطبيق','الخادم','الحساسات','تعلم الآلة','المرشدون'
  ],
  '.flow-node': [
    'خلية وزن وكاميرا · ESP32-S3','أحداث MQTT · مقاطع HTTP',null,'قواعد التسعير · YOLOv12n · LightGBM','لوحة React · WebSocket مباشر',
    'إضافة متصفح',null,null,null,'الاكتشاف من 23% إلى 87.5%',
    'مشفرات العجلات · LiDAR · RealSense',null,'تنقل ذاتي','تطبيق مساعد السفر',null,
    null,null,null,null,'فيديو المرشد وGPS إلى مسار'
  ],
  '.cs-label': Array(5).fill(['التحدي','الحل','الأثر']).flat(),
  '.cs-text': [
    'استبدال الطوابير الورقية في عملية تأجير حقيقية: الحجوزات والإقرارات وتسجيل الحضور والمدفوعات في ليالي الرحلات المزدحمة، عبر عدة هواتف للموظفين في الوقت نفسه، مع حماية صارمة لبيانات العملاء.',
    'تطبيق ويب تقدمي واحد بلغة JavaScript للدرّاجين والموظفين على Supabase: قاعدة Postgres بأمان على مستوى الصفوف ودوال خاصة بالموظفين، وتحديثات لحظية بدلاً من الاستطلاع الدوري، وعامل خدمة للتثبيت والعمل دون اتصال. توقّع دوال Cloudflare Pages بطاقات Apple Wallet، ويمر كل تغيير بفحوص الجودة والأنواع والترجمة وباختبارات Playwright تحاكي قاعدة البيانات فلا تلمس بيانات الإنتاج أبداً.',
    'يعمل في الإنتاج في كل ليلة رحلات: يسجّل الموظفون حضور الدرّاجين ويخصصون الدراجات ويستلمون الدفع نقداً أو بالبطاقة من هواتفهم، بينما يدير الدرّاجون حجوزاتهم بأنفسهم بعشر لغات، منها العربية والأردية من اليمين إلى اليسار.',
    'منح متاجر التجزئة الصغيرة في السعودية رؤية لحظية للرف: مخزون حي وسلوك عملاء وتنبؤ بالطلب وتسعير ديناميكي، على عتاد شائع، دون إنترنت، ودون أي بيانات تعريف شخصية (متوافق مع نظام حماية البيانات الشخصية) وبميزانية 80 ريالاً للرف.',
    'كل رف يجمع خلية وزن بتردد 10 هرتز مع آلة حالات رباعية وكاميرا: الأحداث المؤكدة تُنشر عبر MQTT بينما يُرفع مقطع من 8 إطارات عبر HTTP. يتحقق الخادم المحلي (FastAPI مع PostgreSQL 16) من الوزن عبر نموذج YOLOv12n مضبوط مع احتياطي فرق الإطارات، ويتتبع سلوك الممر بـ ByteTrack بمعرفات مؤقتة فقط، ويتنبأ بالطلب بنماذج LightGBM الكمّية المدربة على بيانات M5، ويعيد التسعير يومياً عبر خمس قواعد بأسبقية صارمة ضمن نطاق ±15%.',
    'زمن من الالتقاط إلى اللوحة بثوانٍ، وكل تغيير سعر مسجل للتدقيق، وأي تعارض بين الحساسين يُرفع تنبيه تضارب، و143 اختبار تكامل ناجحاً على قاعدة PostgreSQL حقيقية. كل البيانات تبقى داخل المتجر: لا سحابة ولا بيانات شخصية.',
    'في الاستبيانات الميدانية تظهر تناقضات دلالية لا تكتشفها القواعد الجامدة: شاب عمره 19 سنة مسماه "مدير عام"، ومستجيب بلا عمل بدخل 12,000 ريال شهرياً، وخبرة تتجاوز عمر صاحبها. تصل السجلات غير الموثوقة إلى مستودعات البيانات ولا يُكتشف التعارض إلا بعد فوات الأوان وبتكلفة عالية.',
    'إضافة متصفح تتحقق من كل سجل لحظياً عبر ثلاث طبقات متصاعدة: تحقق هيكلي عبر Great Expectations، وحارس إحصائي One-Class SVM يمرر السجلات المشبوهة فقط بتكلفة شبه صفرية، ونموذج لغوي محلي قابل للتبديل (Qwen 2.5 / Mistral 7B عبر Ollama بأسلوب Few-Shot وبدعم عربي كامل) يحكم دلالياً ويشرح سبب التعارض. طوابير Redis تتيح معالجة آلاف الاستمارات يومياً، وREST API مفتوح يتكامل مع أي منصة استبيان دون تعديل أنظمة الجهة.',
    'ارتفع اكتشاف الشذوذ من 23% بالقواعد وحدها (F1 = 0.374) إلى 87.5% (F1 = 0.829 على سجلات حقيقية من مسح القوى العاملة) بدقة تتجاوز 97% وأقل من 5 إنذارات كاذبة. بيانات المواطنين لا تغادر الشبكة الحكومية، مع التأهل لنهائيات هاكاثون الهيئة الوطني.',
    'المطارات مرهقة للمسافرين ذوي الإعاقة: المساعدة اليدوية بطيئة أو غير متاحة وقت الذروة، والكراسي المتحركة الحالية لا توفر أي استقلالية، فيشعر كبار السن والمكفوفون والصم وذوو الإعاقة الحركية بالضياع والاعتماد على الآخرين والقلق من تفويت الرحلات أو الطوارئ الطبية.',
    'بصفتي عالم البيانات في فريق من خمسة أعضاء: كرسي متحرك ذاتي القيادة يدمج خرائط ROS مع LiDAR وكاميرا عمق RealSense ومشفرات العجلات على Jetson Nano بذكاء اصطناعي طرفي، مع تطبيق مساعد سفر على جهاز لوحي بتوجيه ذكي ومراقبة طوارئ وتواصل متكيف، ويُحجز عبر مواقع شركات الطيران. أمان بالتصميم: TLS 1.3 وAES-256 وMFA بصلاحيات حسب الدور وحذف تلقائي للبيانات بعد الصعود مع تحكم يدوي وعمل دون اتصال.',
    'بحث ميداني في مطار الملك عبدالعزيز الدولي (مقابلات مع ضباط الأمن ومشرف الكاونتر وموظفي خدمات ذوي الإعاقة) أكد الحاجة: المساعدة تنهار وقت الذروة وكثير من المسافرين يخجلون من طلبها. المرتبة ضمن أفضل 15 من أكثر من 500 فريق في أفيثون 2025 من هيئة الطيران المدني.',
    'قطاع الهايكنج في عسير تعيقه مسارات غير معروفة وفجوات سلامة خطيرة (الإصابات الدماغية تمثل 74% من وفيات الهايكنج وتصيب عديمي الخبرة أكثر)، وبطء الإنقاذ الجبلي في المسارات النائية، وغياب منصة موحدة تربط المرشدين المعتمدين بالسياح.',
    'بصفتي مطور الذكاء الاصطناعي في فريق من خمسة أعضاء: تطبيق Flutter مع Mapbox بخلفية Node.js/Express وPostgreSQL، ونماذج Python/FastAPI وscikit-learn على AWS SageMaker. حساسات AWS IoT Core تغذي نظام الإنذار المبكر بحالة المسار، وخاصية "دليل القمم" تحوّل فيديو المرشد وموقعه الجغرافي إلى مسار مقترح بنقاط الاستراحة والخطر والخدمات لمراجعة المختصين، مع تنظيم الدخول بنظام QR ومدفوعات Stripe وطقس OpenWeatherMap.',
    'خطة إطلاق من ثلاث مراحل (تجربة في أبها، ثم توسع إقليمي في عسير، ثم تكامل وطني مع روح السعودية) تستهدف أكثر من 100 فرصة عمل للمرشدين المحليين خلال ثلاث سنوات، قُدمت لهيئة تطوير منطقة عسير في هاكاثون عسير تبتكر 2025، في سوق عالمي لسياحة المغامرات يُتوقع أن يبلغ 2 تريليون دولار بحلول 2032.'
  ],
  '.sk-title': ['الويب والخلفية','البيانات وتعلم الآلة','السحابة وDevOps والاختبار','إنترنت الأشياء والحافة'],
  '.cert-group-label': ['خدمات أمازون السحابية','هندسة البيانات والتحليلات','احترافية وإدارية'],
  '.aw-title': ['أفضل 15 على مستوى المملكة: أفيثون 2025','متأهل للنهائيات الوطنية: هاكاثون الهيئة العامة للإحصاء','المركز الثاني: بطولة إدارة المشاريع'],
  '.aw-org': ['الهيئة العامة للطيران المدني','الهيئة العامة للإحصاء','شركة Beyond · السعودية'],
  '.aw-desc': [
    'ضمن أفضل 15 من بين أكثر من 500 فريق بمشروع تيسير، كرسي متحرك ذاتي القيادة صُمم بناءً على بحث ميداني في مطار الملك عبدالعزيز بجدة.',
    'التأهل للنهائيات الوطنية بمشروع سديد، حارس جودة بيانات لحظي رفع اكتشاف الشذوذ من 23% إلى 87.5% على بيانات مسح القوى العاملة.',
    'الثاني من بين أكثر من 30 فريقاً، بأعلى الدرجات في التخطيط وإدارة المخاطر والتواصل مع أصحاب المصلحة.'
  ],
  '.vol-name': ['مؤسسة Falling Walls','مؤتمر APCG 2026'],
  '.vol-desc': ['فعالية ابتكار عالمية','مؤتمر دولي استضافته جامعة الأعمال والتكنولوجيا'],
  '.stat-num': [null,null,null,'أفضل 15'],
  '.stat-lbl': ['المعدل / 5.0','شهادة احترافية','مشروع منجز','أفيثون · من أصل 500+ فريق'],
  '.fg label': ['الاسم','البريد الإلكتروني','الرسالة']
};

// Elements where only the trailing text node changes (icons stay untouched)
const AR_TEXT = {
  '.hero-btns .btn-p': ['شاهد أعمالي'],
  '.hero-btns .btn-s': ['تواصل معي'],
  '.hero-btns .btn-g': ['تحميل السيرة الذاتية'],
  '.hero-social .soc': [null,null,'البريد'],
  '.cs-toggle': Array(5).fill('دراسة حالة'),
  '.proj-link': ['معاينة مباشرة ↗','عرض على GitHub ↗']
};

function _lastText(el){
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  let n,best=null;
  while(n=w.nextNode()){ if(n.nodeValue.trim()) best=n; }
  return best;
}

function applyLang(){
  const ar = window.LANGCUR==='ar';
  document.documentElement.lang = ar?'ar':'en';
  document.documentElement.dir = ar?'rtl':'ltr';
  const swapHtml=(el,val)=>{ if(el.dataset.en===undefined)el.dataset.en=el.innerHTML; el.innerHTML = ar?val:el.dataset.en; };
  for(const sel in AR_HTML){ const el=document.querySelector(sel); if(el)swapHtml(el,AR_HTML[sel]); }
  for(const sel in AR_LIST){ document.querySelectorAll(sel).forEach((el,i)=>{ const v=AR_LIST[sel][i]; if(v!==undefined&&v!==null)swapHtml(el,v); }); }
  for(const sel in AR_TEXT){ document.querySelectorAll(sel).forEach((el,i)=>{ const v=AR_TEXT[sel][i]; if(v===undefined||v===null)return; const t=_lastText(el); if(!t)return; if(el.dataset.entxt===undefined)el.dataset.entxt=t.nodeValue; t.nodeValue = ar?' '+v+' ':el.dataset.entxt; }); }
  // form placeholders
  [['f-name','اسمك'],['f-msg','حدثني عن الفرصة...']].forEach(([id,v])=>{
    const el=document.getElementById(id); if(!el)return;
    if(el.dataset.enph===undefined)el.dataset.enph=el.getAttribute('placeholder');
    el.setAttribute('placeholder',ar?v:el.dataset.enph);
  });
  const lb=document.getElementById('langBtn');
  if(lb) lb.setAttribute('aria-label', ar?'Switch to English':'التبديل إلى العربية');
}

function toggleLang(){
  window.LANGCUR = window.LANGCUR==='ar'?'en':'ar';
  localStorage.setItem('lang',window.LANGCUR);
  applyLang();
}

applyLang();
document.getElementById('langBtn').addEventListener('click',toggleLang);
