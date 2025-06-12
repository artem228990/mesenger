// app.js


const menuButton = document.getElementById('menu-button');
const usersListDiv = document.getElementById('users-list');

menuButton.addEventListener('click', () => {
  usersListDiv.classList.toggle('active');
});



import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, query,
  where, getDocs, onSnapshot, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-storage.js";

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyBEwIyf5_e4sUL_XDIJmk8FgZ-Fmd4j43A",
  authDomain: "my-private-chat-788ac.firebaseapp.com",
  projectId: "my-private-chat-788ac",
  storageBucket: "my-private-chat-788ac.appspot.com",
  messagingSenderId: "492996612629",
  appId: "1:492996612629:web:ab07f72a2423e2b534b41c",
  measurementId: "G-3RSQPWD6WN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- DOM Elements ---
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const nicknameInput = document.getElementById("nickname");
const avatarInput = document.getElementById("avatar");

const profileBox = document.getElementById("profile-box");
const userAvatar = document.getElementById("user-avatar");
const userInfo = document.getElementById("user-info");
const editNickname = document.getElementById("edit-nickname");
const editAvatar = document.getElementById("edit-avatar");
const updateProfileBtn = document.getElementById("update-profile");
const logoutBtn = document.getElementById("logout");

const usersBox = document.getElementById("users-box");
const usersList = document.getElementById("users-list");
const searchUser = document.getElementById("search-user");

const chatBox = document.getElementById("chat-box");
const chatWith = document.getElementById("chat-with");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send");

let currentUser = null;
let currentChatUser = null;
let unsubscribeMessages = null;

// --- Helper Functions ---

function getChatId(uid1, uid2) {
  return uid1 < uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// --- Auth & Profile ---

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  const username = usernameInput.value.trim();
  const nickname = nicknameInput.value.trim();

  if (!email || !password) {
    alert("Email and password required!");
    return;
  }

  try {
    // Try sign in first
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch {
      // If sign in failed, register new user
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save user profile in Firestore
      const uid = userCredential.user.uid;

      // Check if username is taken
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.size > 0) {
        alert("Username is already taken. Please choose another.");
        await userCredential.user.delete();
        return;
      }

      // Upload avatar if provided
      let avatarUrl = "";
      if (avatarInput.files.length > 0) {
        const avatarFile = avatarInput.files[0];
        const avatarRef = ref(storage, `avatars/${uid}`);
        await uploadBytes(avatarRef, avatarFile);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      await setDoc(doc(db, "users", uid), {
        email,
        username,
        nickname: nickname || username,
        avatarUrl,
        uid
      });

      // Update Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName: nickname || username,
        photoURL: avatarUrl || null
      });
    }

    authForm.reset();
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// --- On Auth State Changed ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authForm.style.display = "none";
    profileBox.style.display = "block";
    usersBox.style.display = "block";
    chatBox.style.display = "none";

    // Load profile info from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      userAvatar.src = data.avatarUrl || "https://via.placeholder.com/40";
      userInfo.textContent = `@${data.username} (${data.nickname})`;
      editNickname.value = data.nickname || "";
    } else {
      userAvatar.src = "https://via.placeholder.com/40";
      userInfo.textContent = "(No profile info)";
    }

    loadUsers();

  } else {
    currentUser = null;
    authForm.style.display = "block";
    profileBox.style.display = "none";
    usersBox.style.display = "none";
    chatBox.style.display = "none";
    currentChatUser = null;
    if (unsubscribeMessages) unsubscribeMessages();
  }
});

// --- Update Profile ---
updateProfileBtn.addEventListener("click", async () => {
  if (!currentUser) return;
  const newNickname = editNickname.value.trim();
  let avatarUrl = userAvatar.src;

  // Upload new avatar if selected
  if (editAvatar.files.length > 0) {
    const avatarFile = editAvatar.files[0];
    const avatarRef = ref(storage, `avatars/${currentUser.uid}`);
    await uploadBytes(avatarRef, avatarFile);
    avatarUrl = await getDownloadURL(avatarRef);
    userAvatar.src = avatarUrl;
  }

  // Update Firestore profile
  const userRef = doc(db, "users", currentUser.uid);
  await setDoc(userRef, {
    nickname: newNickname,
    avatarUrl,
    username: (await getDoc(userRef)).data().username, // keep username same
    email: currentUser.email,
    uid: currentUser.uid
  }, { merge: true });

  // Update Firebase Auth profile
  await updateProfile(currentUser, {
    displayName: newNickname,
    photoURL: avatarUrl
  });

  userInfo.textContent = `@${(await getDoc(userRef)).data().username} (${newNickname})`;
  alert("Profile updated!");
});

// --- Logout ---
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// --- Load users ---
async function loadUsers(filter = "") {
  clearChildren(usersList);
  const q = query(collection(db, "users"), orderBy("username"));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach(docSnap => {
    const userData = docSnap.data();
    if (userData.uid === currentUser.uid) return; // skip self
    if (filter && !userData.username.includes(filter)) return;

    const userDiv = document.createElement("div");
    userDiv.textContent = `@${userData.username} (${userData.nickname})`;
    userDiv.style.display = "flex";
    userDiv.style.alignItems = "center";

    const avatarImg = document.createElement("img");
    avatarImg.src = userData.avatarUrl || "https://via.placeholder.com/40";
    avatarImg.className = "avatar";
    userDiv.prepend(avatarImg);

    userDiv.onclick = () => {
      openChat(userData);
    };

    usersList.appendChild(userDiv);
  });
}

// --- Search users ---
searchUser.addEventListener("input", () => {
  const val = searchUser.value.trim();
  loadUsers(val);
});

// --- Open chat ---
function openChat(user) {
  currentChatUser = user;
  chatWith.textContent = `@${user.username}`;
  chatBox.style.display = "block";
  messagesDiv.innerHTML = "";
  loadMessages();
}

// --- Load messages ---
function loadMessages() {
  if (unsubscribeMessages) unsubscribeMessages();

  const chatId = getChatId(currentUser.uid, currentChatUser.uid);
  const messagesRef = collection(db, "privateChats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp"));

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const isMine = msg.senderId === currentUser.uid;
      const msgDiv = document.createElement("div");
      msgDiv.className = "message";
      msgDiv.style.textAlign = isMine ? "right" : "left";
      msgDiv.textContent = msg.text;
      messagesDiv.appendChild(msgDiv);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// --- Send message ---
sendBtn.addEventListener("click", async () => {
  if (!messageInput.value.trim() || !currentChatUser) return;
  const chatId = getChatId(currentUser.uid, currentChatUser.uid);
  const messagesRef = collection(db, "privateChats", chatId, "messages");

  await addDoc(messagesRef, {
    text: messageInput.value.trim(),
    senderId: currentUser.uid,
    timestamp: new Date()
  });

  messageInput.value = "";
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});
const menuToggle = document.getElementById("menu-toggle");
const sidebarMenu = document.getElementById("sidebar-menu");
const chatSection = document.getElementById("chat-section");

menuToggle.onclick = () => {
  sidebarMenu.classList.toggle("visible");
};

// Коли обрано користувача — ховаємо меню, показуємо чат
function startChatWith(uid, nickname, avatarUrl) {
  // ... твоя логіка
  sidebarMenu.classList.remove("visible");
  chatSection.classList.add("visible");
}

// При виході — сховати чат
btnLogout.onclick = () => {
  chatSection.classList.remove("visible");
};
