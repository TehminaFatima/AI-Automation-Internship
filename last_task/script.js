const N8N_WEBHOOK_URL = "https://tehminafatima.app.n8n.cloud/webhook-test/chat_backend";
const SESSION_STORAGE_KEY = "chatSessionId";
const MESSAGE_STORAGE_KEY = "chatMessages";
const REQUEST_TIMEOUT_MS = 30000;

let sessionId = getOrCreateSessionId();
let isLoading = false;
let messages = loadMessages();

const messageList = document.querySelector("#messageList");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const characterCount = document.querySelector("#characterCount");
const resetButton = document.querySelector("#resetChat");

function getOrCreateSessionId() {
  let storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!storedSessionId) {
    storedSessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, storedSessionId);
  }
  console.debug("Session ID:", storedSessionId);
  return storedSessionId;
}

function loadMessages() {
  try {
    const savedMessages = JSON.parse(localStorage.getItem(MESSAGE_STORAGE_KEY) || "[]");
    return Array.isArray(savedMessages) ? savedMessages : [];
  } catch (error) {
    console.warn("Could not restore saved messages.", error);
    return [];
  }
}

function saveMessages() {
  localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(messages));
}

function formatTime(value) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderWelcome() {
  const welcome = createElement("div", "welcome");
  const glyph = createElement("div", "welcome-glyph", "✦");
  glyph.setAttribute("aria-hidden", "true");
  welcome.append(glyph, createElement("h1", "", "How can I help you?"), createElement("p", "", "Ask questions about our knowledge base and I'll find the relevant information for you."));

  const suggestions = createElement("div", "suggestions");
  ["What products do you offer?", "What are your services?", "Tell me about pricing", "How can I contact support?"]
    .forEach((text) => {
      const button = createElement("button", "suggestion", text);
      button.type = "button";
      button.addEventListener("click", () => sendMessage(text));
      suggestions.appendChild(button);
    });
  welcome.appendChild(suggestions);
  messageList.appendChild(welcome);
}

function renderMessages() {
  messageList.replaceChildren();
  if (messages.length === 0) {
    renderWelcome();
    return;
  }
  messages.forEach((message) => renderMessage(message));
  scrollToLatest();
}

function renderMessage(message) {
  const isUser = message.role === "user";
  const row = createElement("div", `message-row ${isUser ? "user-row" : "assistant-row"}`);
  const avatar = createElement("div", `avatar ${isUser ? "user-avatar" : "ai-avatar"}`, isUser ? "You" : "✦");
  avatar.setAttribute("aria-hidden", "true");
  const content = createElement("div", "message-content");
  content.appendChild(createElement("span", "message-label", isUser ? "You" : "AI Assistant"));
  content.appendChild(createElement("div", "message-bubble", message.text));
  content.appendChild(createElement("time", "message-time", formatTime(message.createdAt)));
  row.append(isUser ? content : avatar, isUser ? avatar : content);
  messageList.appendChild(row);
}

function addMessage(text, role) {
  const message = { text, role, createdAt: Date.now() };
  messages.push(message);
  saveMessages();
  const welcome = messageList.querySelector(".welcome");
  if (welcome) welcome.remove();
  renderMessage(message);
  scrollToLatest();
}

function showTypingIndicator() {
  const row = createElement("div", "message-row assistant-row");
  row.id = "typingIndicator";
  const avatar = createElement("div", "avatar ai-avatar", "✦");
  avatar.setAttribute("aria-hidden", "true");
  const content = createElement("div", "message-content");
  content.appendChild(createElement("span", "message-label", "AI Assistant"));
  const bubble = createElement("div", "message-bubble typing-bubble");
  bubble.setAttribute("aria-label", "AI Assistant is thinking");
  bubble.innerHTML = "<i></i><i></i><i></i>";
  content.appendChild(bubble);
  row.append(avatar, content);
  messageList.appendChild(row);
  scrollToLatest();
}

function removeTypingIndicator() {
  document.querySelector("#typingIndicator")?.remove();
}

function scrollToLatest() {
  messageList.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
}

function extractResponse(data) {
  const item = Array.isArray(data) ? data[0] : data;
  const payload = item?.json || item || {};
  const response = payload.output || payload.response || payload.reply || payload.message;
  if (typeof response === "string" && response.trim()) return response.trim();
  if (response && typeof response === "object") {
    const nested = response.output || response.response || response.message || response.text;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return "";
}

async function requestAssistant(message) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  console.debug("Session ID:", sessionId);
  console.debug("User message:", message);
  console.debug("Sending request to n8n...");
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sessionId, message }),
      signal: controller.signal
    });
    const responseText = await response.text();
    console.debug("n8n response:", responseText);
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
    let data = {};
    if (responseText.trim()) {
      try { data = JSON.parse(responseText); } catch { throw new Error("Webhook returned invalid JSON"); }
    }
    const reply = extractResponse(data);
    if (!reply) throw new Error("Webhook returned an empty AI response");
    return reply;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendMessage(rawText) {
  const text = rawText.trim();
  if (!text || isLoading) return;
  isLoading = true;
  messageInput.disabled = true;
  sendButton.disabled = true;
  addMessage(text, "user");
  showTypingIndicator();
  try {
    const reply = await requestAssistant(text);
    removeTypingIndicator();
    addMessage(reply, "assistant");
  } catch (error) {
    removeTypingIndicator();
    addMessage("Sorry, something went wrong while processing your request. Please try again.", "assistant");
    console.error("Chat request failed:", error);
  } finally {
    isLoading = false;
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  }
}

function createNewChat() {
  sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  messages = [];
  localStorage.removeItem(MESSAGE_STORAGE_KEY);
  console.debug("New session ID:", sessionId);
  renderMessages();
  messageInput.focus();
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value;
  messageInput.value = "";
  messageInput.style.height = "auto";
  characterCount.textContent = "0 / 1200";
  sendMessage(text);
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 140)}px`;
  characterCount.textContent = `${messageInput.value.length} / 1200`;
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

resetButton.addEventListener("click", createNewChat);
renderMessages();
