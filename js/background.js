// Background script
chrome.runtime.onInstalled.addListener(() => {
  console.log("Freshchat Assistant yüklendi");
});

// Content script ile iletişim için mesaj dinleyicisi
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SUGGESTION") {
    // Gerekirse burada ek işlemler yapılabilir
    sendResponse({ success: true });
  }
});
