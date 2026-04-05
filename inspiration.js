// ─── Supabase 配置 ───────────────────────────────────────────
// 👇 把下面两行替换成你自己的值
const SUPABASE_URL  = 'https://你的项目ID.supabase.co';
const SUPABASE_ANON = '你的anon_public_key';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── 分类规则 ───────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'tech',
    label: '⚙️ 技术',
    keywords: ['代码','编程','算法','程序','软件','开发','api','框架','数据库','前端','后端',
                'ai','机器学习','深度学习','模型','服务器','云','部署','debug','bug','函数',
                'python','java','javascript','html','css','vue','react','git','docker'],
  },
  {
    key: 'business',
    label: '💼 商业',
    keywords: ['创业','商业','产品','市场','用户','需求','运营','变现','流量','品牌','营销',
                '融资','盈利','策略','竞争','客户','销售','商业模式','增长','kpi','roi'],
  },
  {
    key: 'art',
    label: '🎨 创意',
    keywords: ['设计','艺术','绘画','音乐','摄影','电影','写作','故事','小说','诗','创作',
                '配色','排版','动画','游戏','插画','UI','UX','风格','美学','字体'],
  },
  {
    key: 'life',
    label: '🌿 生活',
    keywords: ['健康','运动','饮食','旅行','睡眠','习惯','计划','家庭','朋友','情感','心情',
                '放松','冥想','阅读','学习','成长','财务','消费','时间管理','效率'],
  },
  {
    key: 'idea',
    label: '💡 想法',
    keywords: ['想法','灵感','点子','发现','如果','假设','也许','可以','尝试','实验','思考',
                '问题','解决','方案','创新','改进','优化','思路','构想','脑洞'],
  },
];

function classify(text) {
  const lower = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const cat of CATEGORIES) {
    const score = cat.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best || { key: 'other', label: '📦 其他' };
}

// ─── 状态 ────────────────────────────────────────────────────
let inspirations = [];
let activeFilter = 'all';

// ─── DOM 引用 ────────────────────────────────────────────────
const input         = document.getElementById('inspirationInput');
const submitBtn     = document.getElementById('submitBtn');
const charCount     = document.getElementById('charCount');
const list          = document.getElementById('inspirationList');
const emptyState    = document.getElementById('emptyState');
const filterBar     = document.getElementById('filterBar');
const totalCount    = document.getElementById('totalCount');
const todayCount    = document.getElementById('todayCount');
const categoryCount = document.getElementById('categoryCount');
const toast         = document.getElementById('toast');

// ─── 工具函数 ────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const pad = n => String(n).padStart(2, '0');
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (isToday) return `今天 ${time}`;
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 1) return `昨天 ${time}`;
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${time}`;
}

function showToast(msg = '✅ 灵感已收录！') {
  toast.textContent = msg;
  toast.classList.add('toast-show');
  setTimeout(() => toast.classList.remove('toast-show'), 2200);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── 渲染 ────────────────────────────────────────────────────
function render() {
  const today = new Date().toDateString();
  const todayItems = inspirations.filter(i => new Date(i.time).toDateString() === today);
  const cats = new Set(inspirations.map(i => i.category));
  totalCount.textContent    = inspirations.length;
  todayCount.textContent    = todayItems.length;
  categoryCount.textContent = cats.size;

  const filtered = activeFilter === 'all'
    ? [...inspirations].reverse()
    : [...inspirations].filter(i => i.category === activeFilter).reverse();

  emptyState.style.display = inspirations.length === 0 ? 'block' : 'none';

  Array.from(list.children).forEach(el => {
    if (el.id !== 'emptyState') el.remove();
  });

  filtered.forEach(item => {
    const cat = CATEGORIES.find(c => c.key === item.category)
             || { key: 'other', label: '📦 其他' };
    const card = document.createElement('div');
    card.className = `inspiration-card bg-white rounded-xl shadow-sm border-l-4 border-${cat.key}`;
    card.dataset.id = item.id;

    const repliesHtml = (item.replies || []).map((r, idx) => `
      <div class="reply-item flex gap-3 py-3 ${idx > 0 ? 'border-t border-gray-100' : ''}">
        <div class="reply-avatar flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm">💬</div>
        <div class="flex-1 min-w-0">
          <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(r.text)}</p>
          <span class="text-xs text-gray-400 mt-1 block">${formatDate(r.time)}</span>
        </div>
        <button class="delete-reply-btn flex-shrink-0 text-gray-300 hover:text-red-400 transition text-sm leading-none" data-id="${item.id}" data-ridx="${idx}" title="删除此迭代">✕</button>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="p-5 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-3">
          <p class="text-gray-800 text-base leading-relaxed flex-1 whitespace-pre-wrap">${escapeHtml(item.text)}</p>
          <button class="delete-btn flex-shrink-0 text-gray-300 hover:text-red-400 transition text-lg leading-none" data-id="${item.id}" title="删除灵感">✕</button>
        </div>
        <div class="flex items-center gap-3 mt-1">
          <span class="tag-${cat.key} text-xs font-semibold px-2.5 py-0.5 rounded-full border">${cat.label}</span>
          <span class="text-xs text-gray-400">${formatDate(item.time)}</span>
        </div>
      </div>
      ${(item.replies && item.replies.length > 0) ? `
      <div class="replies-list px-5 pb-2 border-t border-gray-100">
        <div class="text-xs text-gray-400 pt-3 pb-1 font-semibold uppercase tracking-wider">迭代记录</div>
        ${repliesHtml}
      </div>` : ''}
      <div class="reply-area px-5 pb-4 ${(item.replies && item.replies.length > 0) ? '' : 'border-t border-gray-100 pt-3'}">
        <div class="flex gap-2 items-end">
          <textarea
            class="reply-input flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition placeholder-gray-300"
            rows="1"
            placeholder="继续迭代这个灵感..."
            data-id="${item.id}"
          ></textarea>
          <button class="reply-voice-btn voice-btn flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-indigo-200 text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition" data-id="${item.id}" title="语音输入">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 10a7 7 0 01-14 0M12 19v4M8 23h8"/>
            </svg>
          </button>
          <button class="reply-btn bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition active:scale-95 flex-shrink-0" data-id="${item.id}">回复</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  // 绑定删除灵感
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteInspiration(+btn.dataset.id));
  });

  // 绑定删除回复
  document.querySelectorAll('.delete-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteReply(+btn.dataset.id, +btn.dataset.ridx));
  });

  // 绑定回复提交
  document.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', () => submitReply(+btn.dataset.id));
  });

  // 绑定回复区语音按钮
  document.querySelectorAll('.reply-voice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = list.querySelector(`[data-id="${btn.dataset.id}"]`);
      const ta = card ? card.querySelector('.reply-input') : null;
      if (ta) startVoice(ta, btn);
    });
  });

  // 回复框自动扩展 & Ctrl+Enter 提交
  document.querySelectorAll('.reply-input').forEach(ta => {
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitReply(+ta.dataset.id);
    });
  });

  buildFilterBar();
}

function buildFilterBar() {
  filterBar.classList.remove('hidden');
  filterBar.innerHTML = '';
  filterBar.appendChild(makeFilterBtn('all', '全部', inspirations.length));
  const allCats = [...CATEGORIES, { key: 'other', label: '📦 其他' }];
  allCats.forEach(cat => {
    const count = inspirations.filter(i => i.category === cat.key).length;
    filterBar.appendChild(makeFilterBtn(cat.key, cat.label, count));
  });
}

function makeFilterBtn(key, label, count) {
  const btn = document.createElement('button');
  btn.dataset.filter = key;
  btn.className = `filter-btn px-4 py-1.5 rounded-full text-sm font-semibold border border-indigo-300 text-indigo-700 bg-indigo-50 transition ${activeFilter === key ? 'active-filter' : ''}`;
  btn.textContent = `${label} ${count}`;
  btn.addEventListener('click', () => { activeFilter = key; render(); });
  return btn;
}

// ─── Supabase CRUD ───────────────────────────────────────────

async function fetchAll() {
  const { data, error } = await _supabase
    .from('inspirations')
    .select('*')
    .order('time', { ascending: true });
  if (error) { console.error(error); showToast('❌ 加载失败：' + error.message); return; }
  // 将 DB 行映射成前端格式（id 保持数字兼容）
  inspirations = data.map(row => ({
    id:       row.id,
    text:     row.text,
    time:     row.time,
    category: row.category,
    replies:  row.replies || [],
  }));
  render();
}

async function submit() {
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  const cat = classify(text);
  submitBtn.disabled = true;

  const { error } = await _supabase.from('inspirations').insert({
    text,
    time:     new Date().toISOString(),
    category: cat.key,
    replies:  [],
  });

  submitBtn.disabled = false;
  if (error) { showToast('❌ 提交失败：' + error.message); return; }

  input.value = '';
  charCount.textContent = '0 字';
  activeFilter = 'all';
  showToast('✅ 灵感已收录！');
  list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // 实时订阅会自动触发 fetchAll，无需手动调用
}

async function deleteInspiration(id) {
  const { error } = await _supabase.from('inspirations').delete().eq('id', id);
  if (error) showToast('❌ 删除失败：' + error.message);
}

async function submitReply(id) {
  const card = list.querySelector(`[data-id="${id}"]`);
  if (!card) return;
  const ta = card.querySelector('.reply-input');
  const text = ta.value.trim();
  if (!text) { ta.focus(); return; }

  const item = inspirations.find(i => i.id === id);
  if (!item) return;
  const newReplies = [...(item.replies || []), { text, time: new Date().toISOString() }];

  const { error } = await _supabase
    .from('inspirations')
    .update({ replies: newReplies })
    .eq('id', id);

  if (error) { showToast('❌ 回复失败：' + error.message); return; }
  showToast('💬 迭代已记录！');
}

async function deleteReply(id, ridx) {
  const item = inspirations.find(i => i.id === id);
  if (!item || !item.replies) return;
  const newReplies = item.replies.filter((_, i) => i !== ridx);
  const { error } = await _supabase
    .from('inspirations')
    .update({ replies: newReplies })
    .eq('id', id);
  if (error) showToast('❌ 删除失败：' + error.message);
}

// ─── 实时订阅（任何人操作后所有客户端自动刷新）────────────────
function subscribeRealtime() {
  _supabase
    .channel('inspirations-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inspirations' }, () => {
      fetchAll();
    })
    .subscribe();
}

// ─── 事件绑定 ────────────────────────────────────────────────
submitBtn.addEventListener('click', submit);

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
});

input.addEventListener('input', () => {
  charCount.textContent = `${input.value.length} 字`;
});

// ─── 初始化 ──────────────────────────────────────────────────
fetchAll();
subscribeRealtime();

// ─── 语音输入 ────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let activeVoiceBtn    = null;
let activeVoiceTarget = null;

const voiceBtn   = document.getElementById('voiceBtn');
const voiceLabel = document.getElementById('voiceLabel');

function buildRecognition() {
  if (!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.lang = 'zh-CN';
  r.continuous = true;
  r.interimResults = true;

  let finalText = '';

  r.onstart = () => {
    finalText = activeVoiceTarget ? activeVoiceTarget.value : '';
  };

  r.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t;
      else interim = t;
    }
    if (activeVoiceTarget) {
      activeVoiceTarget.value = finalText + interim;
      activeVoiceTarget.dispatchEvent(new Event('input'));
    }
  };

  r.onerror = e => {
    if (e.error !== 'aborted') showToast('🎤 语音识别出错：' + e.error);
    stopVoice();
  };

  r.onend = () => {
    if (activeVoiceBtn) stopVoice();
  };

  return r;
}

function startVoice(targetTextarea, triggerBtn) {
  if (!SpeechRecognition) {
    showToast('⚠️ 当前浏览器不支持语音识别（建议用 Chrome）');
    return;
  }
  if (activeVoiceBtn) {
    const prev = activeVoiceBtn;
    stopVoice();
    if (prev === triggerBtn) return;
  }

  activeVoiceTarget = targetTextarea;
  activeVoiceBtn    = triggerBtn;
  recognition = buildRecognition();
  recognition.start();

  triggerBtn.classList.add('voice-recording');
  if (triggerBtn === voiceBtn) voiceLabel.textContent = '停止';
  showToast('🎤 开始录音，再次点击停止');
}

function stopVoice() {
  if (recognition) { try { recognition.abort(); } catch(_) {} recognition = null; }
  if (activeVoiceBtn) {
    activeVoiceBtn.classList.remove('voice-recording');
    if (activeVoiceBtn === voiceBtn) voiceLabel.textContent = '语音';
    activeVoiceBtn = null;
  }
  activeVoiceTarget = null;
}

if (voiceBtn) {
  voiceBtn.addEventListener('click', () => startVoice(input, voiceBtn));
}
