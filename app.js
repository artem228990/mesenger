const header = document.getElementById('main-header');
const menuBtn = document.getElementById('menu-toggle');
const sidebarMenu = document.getElementById('sidebar-menu');
const chatSection = document.getElementById('chat-section');

// Показуємо хедер та головний розділ після входу
header.classList.remove('hidden');
mainSection.classList.remove('hidden');

// Кнопка меню відкриває/закриває панель
menuBtn.onclick = () => {
  sidebarMenu.classList.toggle('visible');
};

// Показує чат тільки коли вибрано користувача
function startChatWith(uid, nickname, avatarUrl) {
  currentChatUser = { uid, nickname, avatarUrl };
  chatWithSpan.textContent = nickname;
  chatSection.classList.add("visible");
  sidebarMenu.classList.remove("visible"); // ховаємо меню

  // ... решта логіки як раніше ...
}
