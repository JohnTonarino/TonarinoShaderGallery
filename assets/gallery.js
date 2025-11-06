function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }

function videoNode(it){
  const v=document.createElement('video');
  v.className='lb-media'; v.autoplay=true; v.muted=true; v.loop=true; v.playsInline=true; v.controls=true; v.poster=it.poster||'';
  for(const s of it.sources) { const src=document.createElement('source'); src.src=s.src; src.type=s.type; v.appendChild(src); }
  return {node:v, caption:`${it.title} — ${it.theme}`};
}
function imageNode(it){
  const img=document.createElement('img');
  img.className='lb-media'; img.src=it.sources[0].src; img.alt=it.title; img.loading='eager';
  return {node:img, caption:`${it.title} — ${it.theme}`};
}

// Lightbox
const lightbox=document.getElementById('lightbox');
const lbStage=document.getElementById('lb-stage');
const lbCaption=document.getElementById('lb-caption');
function openLightbox(media){ lbStage.innerHTML=''; lbStage.appendChild(media.node); lbCaption.textContent=media.caption; lightbox.hidden=false; }
function closeLightbox(){
const vid=lbStage.querySelector('video');
  if(vid){ vid.pause(); vid.removeAttribute('src'); while (vid.firstChild) vid.removeChild(vid.firstChild); }
  lbStage.innerHTML=''; lightbox.hidden=true;
}

(async function () {
  let GALLERY_DATA = [];
  try {
    const response = await fetch('./gallery-data.json');
    if (!response.ok) throw new Error('Network response was not ok');
    GALLERY_DATA = await response.json();
  } catch (error) {
    console.error('Failed to load gallery data:', error);
    return;
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  GALLERY_DATA.sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtersEl = document.getElementById('filters');
  const grid = document.getElementById('gallery');
  const allTags = [...new Set(GALLERY_DATA.flatMap(item => 
    (item.tags || []).concat(item.type.charAt(0).toUpperCase() + item.type.slice(1))
  ))];
  allTags.sort();
  const filterBtns = [{ label: 'All', value: '__all' }].concat(allTags.map(t => ({ label: t, value: t })));
  let activeFilter = '__all';

  // Render関数
  function render() {
    grid.innerHTML = '';
    const items = GALLERY_DATA.filter(it => {
      if (activeFilter === '__all') return true;
      // 1. type (Video/Image)
      const itemTypeTag = it.type.charAt(0).toUpperCase() + it.type.slice(1);
      if (itemTypeTag === activeFilter) return true;
      // 2. tags
      if (it.tags && it.tags.includes(activeFilter)) return true;
      return false;
    });

    for (const it of items) {
      const dateElement = it.date ? `<time class="card-date" datetime="${it.date}">${it.date}</time>` : '';
      const tagBadges = (it.tags || []).map(tag => `<span class="badge">${tag}</span>`).join('');
      if (it.type === 'video') {
        const previewVideoHTML = `<video
            class="thumb thumb-preview"
            src="${it.sources[0].src}"
            preload="none" 
            muted 
            loop 
            playsinline
            hidden 
          ></video>`;

        const card = el(`<article class="card">
          <button class="thumb-btn" aria-label="open">
            <img class="thumb thumb-poster" alt="${it.title}" loading="lazy" src="${it.thumbnail}">
            ${previewVideoHTML}
          </button>
          <div class="meta">
            <h3>${it.title}</h3>
            ${dateElement}
            <div class="badges"><span class="badge type-video">Video</span>${tagBadges}</div>
          </div>
        </article>`);

        const btn = card.querySelector('.thumb-btn');
        const poster = card.querySelector('.thumb-poster');
        const preview = card.querySelector('.thumb-preview');
        
        btn.addEventListener('mouseenter', () => {
          poster.hidden = true;
          preview.hidden = false;
          preview.play();
        });
        
        btn.addEventListener('mouseleave', () => {
          poster.hidden = false;
          preview.hidden = true;
          preview.pause();
          preview.currentTime = 0;
          btn.style.transform = '';
          btn.style.zIndex = '';
        });

        btn.onclick = () => {
          poster.hidden = false;
          preview.hidden = true;
          preview.pause();
          btn.style.transform = 'none'; 
          btn.style.zIndex = '0';
          openLightbox(videoNode(it));
        }
        grid.appendChild(card);
      } else if (it.type === 'image') {
        const card = el(`<article class="card">
          <button class="thumb-btn" aria-label="open">
            <img class="thumb" alt="${it.title}" loading="lazy" src="${it.thumbnail}">
          </button><div class="meta">
            <h3>${it.title}</h3>
            ${dateElement}
            <div class="badges"><span class="badge type-image">Image</span>${tagBadges}</div>
          </div>
        </article>`);
        const btn = card.querySelector('.thumb-btn');

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = '';
          btn.style.zIndex = '';
        });

        btn.onclick = () => {
          btn.style.transform = 'none'; 
          btn.style.zIndex = '0';
          openLightbox(imageNode(it));
        };
        grid.appendChild(card);
      }
    }
  }

  filterBtns.forEach(f => {
    const b = document.createElement('button');
    b.className = 'filter-btn' + (f.value === activeFilter ? ' active' : '');
    b.textContent = f.label;
    b.dataset.value = f.value;
    b.onclick = () => {
      activeFilter = f.value;
      document.querySelectorAll('.filter-btn').forEach(x => x.classList.toggle('active', x === b));
      render();
    };
    filtersEl.appendChild(b);
  });

  document.querySelector('.lb-close').onclick = closeLightbox;
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  window.addEventListener('keydown', e => { if (!lightbox.hidden && e.key === 'Escape') closeLightbox(); });

  render();
})();