/**
 * content.js
 * ----------
 * Runs on LinkedIn / X / Instagram / Facebook. Watches for the user
 * selecting or dropping an image into a post composer and shows a small
 * warning banner nudging them to run it through PrivacyGuard AI first.
 *
 * Scope note (read this before extending): this MVP does NOT run OCR
 * inside the page itself — composer upload flows on these sites are behind
 * heavily locked-down CSPs and dynamically-rebuilt DOM, so reliably
 * intercepting the exact file and scanning it in-page is a project of its
 * own. Instead, "Scan Now" opens the full PrivacyGuard AI web app in a new
 * tab so the user can drop the same image there. See README "Extending the
 * extension" for how to go further (e.g. bundling the detector so it can
 * run right inside the banner).
 */

(() => {
  const BANNER_ID = "privacyguard-banner";

  function isImageFile(file) {
    return file && file.type && file.type.startsWith("image/");
  }

  function removeBanner() {
    const existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();
  }

  function showBanner() {
    removeBanner();

    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.innerHTML = `
      <div class="pg-banner__icon">⚠️</div>
      <div class="pg-banner__body">
        <strong>Check this image before posting</strong>
        <p>PrivacyGuard AI can scan it for Aadhaar, PAN, phone numbers, emails, bank details and faces — entirely on-device.</p>
      </div>
      <div class="pg-banner__actions">
        <button class="pg-banner__scan">Scan Now</button>
        <button class="pg-banner__dismiss" aria-label="Dismiss">×</button>
      </div>
    `;

    banner.querySelector(".pg-banner__scan").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_SCANNER" });
      removeBanner();
    });
    banner.querySelector(".pg-banner__dismiss").addEventListener("click", removeBanner);

    document.body.appendChild(banner);

    // Don't nag forever — fade out on its own after 25s if ignored.
    setTimeout(removeBanner, 25000);
  }

  // Most composer "add photo" buttons are backed by a hidden
  // <input type="file">. Delegate on document so this also catches inputs
  // that get added to the DOM after this script first runs.
  document.addEventListener(
    "change",
    (e) => {
      const target = e.target;
      if (target && target.tagName === "INPUT" && target.type === "file" && target.files?.length) {
        const anyImage = Array.from(target.files).some(isImageFile);
        if (anyImage) showBanner();
      }
    },
    true
  );

  // Some composers accept direct drag-and-drop onto the page instead of
  // going through a file input.
  document.addEventListener(
    "drop",
    (e) => {
      const files = e.dataTransfer?.files;
      if (files && Array.from(files).some(isImageFile)) {
        showBanner();
      }
    },
    true
  );
})();
