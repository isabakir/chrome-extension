// İlk yükleme kontrolü
console.log("🚀 Content Script Yükleniyor - " + window.location.href);

// Mesaj kutusunu ve gelen mesajları izle
let messageBox = null;
let lastMessage = "";

// Backend API URL'i
const API_URL = "http://localhost:3005/api/query";

// Ana fonksiyon
function initializeExtension() {
  console.log("🚀 Freshchat Assistant Başlatılıyor");
  startSetupProcess();
}

function findMessageBox() {
  return new Promise((resolve) => {
    function checkForMessageBox() {
      let element = document.querySelector(".msg-reply-box");
      return element;
    }

    const interval = setInterval(() => {
      const element = checkForMessageBox();
      if (element) {
        clearInterval(interval);
        console.log("✅ Mesaj kutusu bulundu!");
        resolve(element);
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      console.log("⚠️ Mesaj kutusu 60 saniye içinde bulunamadı");
      resolve(null);
    }, 60000);
  });
}

function startSetupProcess() {
  findMessageBox().then((textArea) => {
    if (textArea) {
      messageBox = textArea;
      setupMessageBox();
    } else {
      console.log("❌ Mesaj kutusu bulunamadı");
    }
  });
}

// Mesaj kutusu için gerekli ayarları yap
function setupMessageBox() {
  try {
    // Öneri butonu oluştur
    const suggestionButton = document.createElement("button");
    suggestionButton.innerHTML = "💡 AI Öneri";
    suggestionButton.className = "ai-suggestion-button";
    suggestionButton.style.cssText = `
            background-color: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        `;

    // Butonun konumunu ayarla
    const buttonContainer = messageBox.parentElement;
    if (buttonContainer) {
      buttonContainer.appendChild(suggestionButton);
      console.log("✅ AI Öneri butonu eklendi");
    } else {
      messageBox.insertAdjacentElement("beforebegin", suggestionButton);
    }

    // Konuşma container'ını bul
    const conversationContainer = document.body;

    // Gelen mesajları izle
    const conversationObserver = new MutationObserver((mutations) => {
      try {
        // Bugünkü müşteri mesajlarını al
        const customerMessages = getTodayMessages();

        if (customerMessages.length > 0) {
          // En son mesajı kontrol et
          const lastMessageText = customerMessages[customerMessages.length - 1];

          // Eğer yeni bir mesajsa
          if (lastMessageText !== lastMessage) {
            console.log("📨 Yeni müşteri mesajı:", lastMessageText);
            lastMessage = lastMessageText;
            getSuggestion(customerMessages.join("\n"));
          }
        }
      } catch (error) {
        console.error("❌ Mesaj izleme hatası:", error);
      }
    });

    conversationObserver.observe(conversationContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Öneri butonu için click event listener
    suggestionButton.addEventListener("click", () => {
      const customerMessages = getTodayMessages();
      if (customerMessages.length > 0) {
        console.log("🔄 AI Öneri isteniyor");
        getSuggestion(customerMessages.join("\n"));
      } else {
        console.log("⚠️ Henüz bir müşteri mesajı yok");
      }
    });
  } catch (error) {
    console.error("❌ Setup hatası:", error);
  }
}

// Backend'den öneri al
async function getSuggestion(message) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: message,
      }),
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`API yanıt vermedi: ${response.status}`);
    }

    const data = await response.json();
    if (data.response && data.response.summary) {
      showSuggestion(data.response.summary);
    } else {
      console.error("❌ Öneri alınamadı: Yanıt formatı geçersiz", data);
    }
  } catch (error) {
    console.error("❌ Öneri alınamadı:", error);
  }
}

// Öneriyi göster
function showSuggestion(suggestion) {
  try {
    // Varsa eski öneri kutusunu kaldır
    const oldSuggestionBox = document.querySelector(".suggestion-box");
    if (oldSuggestionBox) {
      oldSuggestionBox.remove();
    }

    const suggestionBox = document.createElement("div");
    suggestionBox.className = "suggestion-box";
    suggestionBox.innerHTML = `
            <div class="suggestion-content">
                <p>${suggestion}</p>
                <button class="accept-suggestion">Kabul Et</button>
                <button class="reject-suggestion">Reddet</button>
            </div>
        `;

    document.body.appendChild(suggestionBox);

    // Kabul et butonu için event listener
    suggestionBox
      .querySelector(".accept-suggestion")
      .addEventListener("click", () => {
        messageBox.textContent = suggestion;
        messageBox.dispatchEvent(new Event("input", { bubbles: true }));
        messageBox.focus();
        // İmleci sona getir
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(messageBox);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        suggestionBox.remove();
      });

    // Reddet butonu için event listener
    suggestionBox
      .querySelector(".reject-suggestion")
      .addEventListener("click", () => {
        suggestionBox.remove();
      });
  } catch (error) {
    console.error("❌ Öneri gösterme hatası:", error);
  }
}

// Müşteri mesajlarını al
function getTodayMessages() {
  try {
    // Tüm müşteri mesajlarını al
    const messages = Array.from(
      document.querySelectorAll(
        ".fc-ui-message-bubble.comment.user-message.ember-view"
      )
    ).map((element) => element.textContent.trim());

    return messages;
  } catch (error) {
    console.error("❌ Mesaj alma hatası:", error);
    return [];
  }
}

// Extension'ı başlat
console.log("🎬 Extension başlatılıyor");
initializeExtension();
