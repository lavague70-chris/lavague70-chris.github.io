// Chris's Pick — data.json을 읽어서 화면을 그립니다.
// 주소 뒤 #ai, #sewing, #walk 에 따라 카테고리 화면을 보여줍니다.

const app = document.getElementById('app');
let data = { categories: [], items: [] };

// 글자 안의 < > 등을 안전하게 바꿔줍니다
function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// 유튜브 링크면 썸네일 주소를 만들어줍니다
function youtubeThumb(link) {
  const m = String(link).match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
}

// 첫 화면: 카테고리 카드 3개
function renderHome() {
  document.title = "Chris's Pick";
  app.innerHTML = `<div class="cats">${data.categories.map(cat => {
    const count = data.items.filter(i => i.category === cat.id).length;
    return `
      <a class="cat" data-id="${esc(cat.id)}" href="#${esc(cat.id)}">
        <div class="cat-emoji">${esc(cat.emoji)}</div>
        <div class="cat-text">
          <div class="cat-name">${esc(cat.name)}</div>
          <div class="cat-desc">${esc(cat.desc)}</div>
        </div>
        <div class="cat-count">${count}개</div>
      </a>`;
  }).join('')}</div>`;
}

// 카테고리 화면: 올린 자료 목록 (최신순)
function renderCategory(cat) {
  document.title = `${cat.name} · Chris's Pick`;
  const items = data.items
    .filter(i => i.category === cat.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const list = items.length ? items.map(item => {
    const img = item.image || youtubeThumb(item.link);
    const tag = item.link ? 'a' : 'div';
    const href = item.link ? ` href="${esc(item.link)}" target="_blank" rel="noopener"` : '';
    return `
      <${tag} class="item"${href}>
        ${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}
        <div class="item-body">
          <h3 class="item-title">${esc(item.title)}</h3>
          ${item.memo ? `<p class="item-memo">${esc(item.memo)}</p>` : ''}
          <div class="item-meta">
            <span>${esc(item.date)}</span>
            ${item.link ? '<span class="item-link">보러 가기 →</span>' : ''}
          </div>
        </div>
      </${tag}>`;
  }).join('') : '<p class="empty">아직 올린 자료가 없어요</p>';

  // 위쪽 탭: 다른 카테고리로 바로 이동
  const tabs = data.categories.map(c => `
    <a class="tab${c.id === cat.id ? ' on' : ''}" data-id="${esc(c.id)}" href="#${esc(c.id)}">${esc(c.emoji)} ${esc(c.name)}</a>`
  ).join('');

  app.innerHTML = `
    <a class="back" href="#">← 처음으로</a>
    <nav class="tabs">${tabs}</nav>
    <section class="section" data-id="${esc(cat.id)}">
      <div class="section-head">
        <h2>${esc(cat.emoji)} ${esc(cat.name)}</h2>
        <p>${esc(cat.desc)}</p>
      </div>
      <div class="items">${list}</div>
    </section>`;
}

function route() {
  const id = location.hash.slice(1);
  const cat = data.categories.find(c => c.id === id);
  cat ? renderCategory(cat) : renderHome();
  window.scrollTo(0, 0);
}

fetch('data.json', { cache: 'no-cache' })
  .then(res => res.json())
  .then(json => { data = json; route(); })
  .catch(() => { app.innerHTML = '<p class="empty">자료를 불러오지 못했어요</p>'; });

window.addEventListener('hashchange', route);

// ---- 홈화면 설치 (PWA) ----

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// 안드로이드 크롬: 설치 버튼 보여주기
const installBtn = document.getElementById('installBtn');
let installEvent = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvent = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  installBtn.hidden = true;
});

// 기기에 맞는 설치 방법 안내
const ua = navigator.userAgent;
const howto = document.getElementById('howtoBody');
if (/KAKAOTALK/i.test(ua)) {
  const url = encodeURIComponent(location.href);
  howto.innerHTML = `
    <p>카톡 안에서는 설치가 안 돼요. 먼저 다른 브라우저로 열어주세요.</p>
    <a class="kakao-btn" href="kakaotalk://web/openExternal?url=${url}">브라우저로 열기</a>
    <p>열린 화면에서 아래 '홈화면에 추가'를 따라 하시면 됩니다.</p>`;
} else if (/iPhone|iPad|iPod/i.test(ua)) {
  howto.innerHTML = `
    <ol>
      <li>사파리 아래쪽 <b>공유 버튼(□↑)</b>을 누르세요</li>
      <li><b>홈 화면에 추가</b>를 누르세요</li>
      <li>오른쪽 위 <b>추가</b>를 누르면 끝!</li>
    </ol>`;
} else {
  howto.innerHTML = `
    <ol>
      <li>크롬 오른쪽 위 <b>⋮ 메뉴</b>를 누르세요</li>
      <li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 누르세요</li>
      <li><b>설치</b>를 누르면 홈화면에 아이콘이 생겨요</li>
    </ol>`;
}
