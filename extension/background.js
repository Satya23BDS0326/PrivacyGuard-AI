importScripts("config.js");

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "OPEN_SCANNER") {
    chrome.tabs.create({ url: PRIVACYGUARD_WEBAPP_URL });
  }
});
