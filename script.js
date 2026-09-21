/**
 * シフト作成アプリケーション ホームページ用 JavaScript
 * 制作者: KAZE Soft
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. モバイルメニュートグル
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // メニュー内リンクをクリックしたら閉じる
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // 2. 機能タブの切り替え
  const tabButtons = document.querySelectorAll('.f-tab-btn');
  const tabPanes = document.querySelectorAll('.f-tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-tab');

      // 全ボタンのアクティブ解除
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // 全ペインの非表示
      tabPanes.forEach(pane => pane.classList.remove('active'));

      // 選択したタブとペインをアクティブ化
      button.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // 3. FAQ アコーディオン
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (questionBtn && answer) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // 他のアコーディオンを閉じる（単一オープン挙動）
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('open');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) {
            otherAnswer.style.maxHeight = null;
          }
        });

        // クリックされた項目の開閉
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 40 + 'px';
        }
      });
    }
  });

  // 4. スクロール時のナビゲーションバーシャドウ効果
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
    } else {
      navbar.style.boxShadow = 'none';
    }
  });

  // 5. アプリモックアップのタブクリック体験
  const mockTabs = document.querySelectorAll('.mock-tabbar .tab');
  mockTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      mockTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // 6. 掲示板（ご意見・ご感想・ご要望）の Google スプレッドシート連携
  // ※ Google Apps Script でデプロイしたWebアプリURL
  const GAS_BBS_API_URL = 'https://script.google.com/macros/s/AKfycbzrbnjp0it6yuhZOidkjxPuIF9P3_EubKAT-1Ay_shtKpt2LgUY8La9DFB8nW4-oJOH/exec'; 

  const bbsForm = document.getElementById('bbs-form');
  const bbsPostsContainer = document.getElementById('bbs-posts');
  const bbsCount = document.getElementById('bbs-count');

  const defaultPosts = [];

  function getBadgeClass(type) {
    switch (type) {
      case 'ご感想': return 'bbs-badge-impression';
      case 'ご意見': return 'bbs-badge-opinion';
      case 'ご要望': return 'bbs-badge-request';
      default: return 'bbs-badge-other';
    }
  }

  function getBadgeIcon(type) {
    switch (type) {
      case 'ご感想': return '💡';
      case 'ご意見': return '💬';
      case 'ご要望': return '✨';
      default: return '📝';
    }
  }

  function getLocalPosts() {
    try {
      const saved = localStorage.getItem('kaze_bbs_posts');
      return saved ? JSON.parse(saved) : [...defaultPosts];
    } catch (e) {
      return [...defaultPosts];
    }
  }

  function saveLocalPosts(posts) {
    try {
      localStorage.setItem('kaze_bbs_posts', JSON.stringify(posts));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function renderPostList(posts) {
    if (!bbsPostsContainer) return;

    if (bbsCount) {
      bbsCount.textContent = `${posts.length}件の投稿`;
    }

    if (!posts || posts.length === 0) {
      bbsPostsContainer.innerHTML = '<div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:0.9rem;">まだ投稿がありません。最初のご意見・ご感想をお待ちしております！</div>';
      return;
    }

    bbsPostsContainer.innerHTML = '';
    posts.forEach(post => {
      const item = document.createElement('div');
      item.className = 'bbs-post-item';

      const meta = document.createElement('div');
      meta.className = 'bbs-post-meta';

      const badge = document.createElement('span');
      badge.className = `bbs-badge ${getBadgeClass(post.type)}`;
      badge.textContent = `${getBadgeIcon(post.type)} ${post.type}`;

      const author = document.createElement('span');
      author.className = 'bbs-author';
      author.textContent = post.name || '匿名';

      const date = document.createElement('span');
      date.className = 'bbs-date';
      date.textContent = post.date || '';

      meta.appendChild(badge);
      meta.appendChild(author);
      meta.appendChild(date);

      const body = document.createElement('div');
      body.className = 'bbs-body';
      body.textContent = post.content || '';

      item.appendChild(meta);
      item.appendChild(body);
      bbsPostsContainer.appendChild(item);
    });
  }

  // スプレッドシート（GAS）から投稿一覧を取得
  async function loadPosts() {
    // まずローカルデータを即時表示
    const localPosts = getLocalPosts();
    renderPostList(localPosts);

    if (!GAS_BBS_API_URL || GAS_BBS_API_URL.trim() === '') {
      return;
    }

    try {
      const response = await fetch(`${GAS_BBS_API_URL}?action=get&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          renderPostList(data);
          saveLocalPosts(data);
        }
      }
    } catch (error) {
      console.warn('スプレッドシート取得エラー（ローカルキャッシュを使用します）:', error);
    }
  }

  if (bbsForm) {
    bbsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('bbs-name');
      const typeInput = document.getElementById('bbs-type');
      const msgInput = document.getElementById('bbs-msg');
      const submitBtn = bbsForm.querySelector('button[type="submit"]');

      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '匿名';
      const type = typeInput ? typeInput.value : 'ご意見';
      const content = msgInput ? msgInput.value.trim() : '';

      if (!content) {
        alert('ご意見・ご感想・ご要望の内容を入力してください。');
        return;
      }

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const h = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const dateStr = `${y}/${m}/${d} ${h}:${min}`;

      const newPost = {
        name: name,
        type: type,
        date: dateStr,
        content: content
      };

      // 1. 画面上に即座に追加反映（ユーザーを待たせない）
      const currentPosts = getLocalPosts();
      currentPosts.unshift(newPost);
      saveLocalPosts(currentPosts);
      renderPostList(currentPosts);

      // 入力フォームをクリア
      if (msgInput) msgInput.value = '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
      }

      if (GAS_BBS_API_URL && GAS_BBS_API_URL.trim() !== '') {
        try {
          // Google Apps Scriptへ送信 (CORS preflightを発生させないため text/plain でPOST)
          await fetch(GAS_BBS_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(newPost)
          });
        } catch (err) {
          console.warn('スプレッドシートPOST送信エラー（GETバックアップを試行）:', err);
          // バックアップ送信（GETパラメータ）
          try {
            const params = new URLSearchParams({
              action: 'post',
              name: newPost.name,
              type: newPost.type,
              content: newPost.content
            });
            const img = new Image();
            img.src = `${GAS_BBS_API_URL}?${params.toString()}&t=${Date.now()}`;
          } catch (e2) {}
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '掲示板に投稿する';
          }
        }
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '掲示板に投稿する';
        }
      }
    });

    // 初期読み込み
    loadPosts();
  }
});
