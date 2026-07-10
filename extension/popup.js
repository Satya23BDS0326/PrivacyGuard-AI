document.getElementById("open-scanner").addEventListener("click", () => {
  chrome.tabs.create({ url: PRIVACYGUARD_WEBAPP_URL });
});
