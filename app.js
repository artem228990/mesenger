const header = document.getElementById('main-header');
const menuBtn = document.getElementById('menu-toggle');
const sidebarMenu = document.getElementById('sidebar-menu');
const chatSection = document.getElementById('chat-section');


header.classList.remove('hidden');
mainSection.classList.remove('hidden');


menuBtn.onclick = () => {
  sidebarMenu.classList.toggle('visible');
};


function startChatWith(uid, nickname, avatarUrl) {
  currentChatUser = { uid, nickname, avatarUrl };
  chatWithSpan.textContent = nickname;
  chatSection.classList.add("visible");
  sidebarMenu.classList.remove("visible"); 


}
