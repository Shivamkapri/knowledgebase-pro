async function apiJSON(url, method = 'GET', data = null) {
  const opts = { method, headers: {} };
  if (data) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

// Chat UI logic
const chatListEl = document.getElementById('chat-list');
const newChatBtn = document.getElementById('new-chat');
const chatTitleEl = document.getElementById('chat-title');
const messagesEl = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');

let currentChatId = null;

async function loadChats() {
  const chats = await apiJSON('/chats');
  chatListEl.innerHTML = '';
  for (const c of chats) {
    const li = document.createElement('li');
    li.textContent = c.title || 'Untitled';
    li.dataset.id = c.id;
    li.addEventListener('click', () => selectChat(c.id));
    chatListEl.appendChild(li);
  }
}

async function createChat() {
  const res = await apiJSON('/chats', 'POST', { title: 'New chat' });
  // Set current chat immediately (res may contain `id` or `_id` depending on backend)
  const newId = res.id || res._id || res.inserted_id || res.insertedId;
  if (newId) {
    currentChatId = newId;
    // reload list and select
    await loadChats();
    await selectChat(currentChatId);
  } else {
    // fallback: reload list and select first
    await loadChats();
    const first = chatListEl.querySelector('li');
    if (first) {
      await selectChat(first.dataset.id);
    }
  }
}

async function selectChat(id) {
  currentChatId = id;
  // visually mark selected chat
  for (const li of chatListEl.querySelectorAll('li')) {
    li.classList.toggle('selected', li.dataset.id === String(id));
  }
  const data = await apiJSON(`/chats/${id}`);
  chatTitleEl.textContent = data.title || 'Chat';
  renderMessages(data.messages || []);
}

function renderMessages(messages) {
  messagesEl.innerHTML = '';
  messagesEl._cached = messages || [];
  for (const m of messages) {
    const div = document.createElement('div');
    div.className = 'message ' + (m.role === 'user' ? 'user' : 'assistant');
    // message text
    const p = document.createElement('div');
    p.className = 'message-text';
    p.textContent = m.content;
    div.appendChild(p);

    // feedback buttons for assistant messages
    if (m.role === 'assistant') {
      const fb = document.createElement('div');
      fb.className = 'feedback';
      const like = document.createElement('button');
      like.textContent = '👍';
      like.title = 'Like';
      like.className = 'fb-like';
      const dislike = document.createElement('button');
      dislike.textContent = '👎';
      dislike.title = 'Dislike';
      dislike.className = 'fb-dislike';
      // highlight if already present
      if (m.feedback === 'like') like.classList.add('active');
      if (m.feedback === 'dislike') dislike.classList.add('active');

      like.addEventListener('click', async () => {
        try {
          const updated = await apiJSON(`/chats/messages/${m.id}/feedback`, 'POST', { feedback: 'like' });
          // update cached message
          for (const mm of messagesEl._cached) if (mm.id === m.id) mm.feedback = 'like';
          renderMessages(messagesEl._cached);
        } catch (e) {
          alert('Feedback failed: ' + e.message);
        }
      });
      dislike.addEventListener('click', async () => {
        try {
          const updated = await apiJSON(`/chats/messages/${m.id}/feedback`, 'POST', { feedback: 'dislike' });
          for (const mm of messagesEl._cached) if (mm.id === m.id) mm.feedback = 'dislike';
          renderMessages(messagesEl._cached);
        } catch (e) {
          alert('Feedback failed: ' + e.message);
        }
      });
      fb.appendChild(like);
      fb.appendChild(dislike);
      div.appendChild(fb);
    }

    messagesEl.appendChild(div);
    if (m.sources) {
      const s = document.createElement('details');
      const sum = document.createElement('summary');
      sum.textContent = 'Sources';
      s.appendChild(sum);
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(m.sources, null, 2);
      s.appendChild(pre);
      messagesEl.appendChild(s);
    }
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

newChatBtn?.addEventListener('click', async () => {
  await createChat();
});

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentChatId) return alert('Select or create a chat first');
  const input = document.getElementById('question');
  const responseLengthSelect = document.getElementById('response-length');
  const text = input.value.trim();
  if (!text) return;
  
  // Get selected response length
  const maxTokens = parseInt(responseLengthSelect.value);
  
  // show locally
  renderMessages([...(messagesEl._cached || []), { role: 'user', content: text }]);
  try {
    const res = await apiJSON(`/chats/${currentChatId}/messages`, 'POST', { 
      content: text, 
      top_k: 4, 
      temperature: 0.3,  // Slightly higher for more varied responses
      max_tokens: maxTokens 
    });
    // append assistant
    const next = (messagesEl._cached || []).concat([{ role: 'assistant', content: res.answer, sources: res.sources }]);
    messagesEl._cached = next;
    renderMessages(next);
    input.value = '';
    // update title if backend generated one
    if (res.title) {
      chatTitleEl.textContent = res.title;
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// initial load
loadChats().catch((e) => console.error('Failed to load chats', e));
