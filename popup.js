const DEFAULT_DOMAIN = "www.kinokino.vip";
const domainInput = document.getElementById("domain");
const form = document.getElementById("settings-form");
const saveButton = document.getElementById("save");
const resetButton = document.getElementById("reset");
const status = document.getElementById("status");
let savedTimer;

function normalizeDomain(value) {
  let domain = value.trim();
  if (/^https?:\/\//i.test(domain)) {
    try { domain = new URL(domain).hostname; } catch { return null; }
  }
  domain = domain.replace(/\/$/, "").toLowerCase();
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain) ? domain : null;
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.toggleAttribute("data-error", isError);
}

async function save() {
  const domain = normalizeDomain(domainInput.value);
  if (!domain) {
    showStatus("Введите корректный домен, например www.kinokino.vip", true);
    domainInput.focus();
    return;
  }
  await chrome.storage.sync.set({ kinokinoDomain: domain });
  domainInput.value = domain;
  showStatus("Настройки сохранены");
  saveButton.classList.add("is-saved");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => saveButton.classList.remove("is-saved"), 1600);
}

async function load() {
  const { kinokinoDomain } = await chrome.storage.sync.get({ kinokinoDomain: DEFAULT_DOMAIN });
  domainInput.value = kinokinoDomain;
}

form.addEventListener("submit", (event) => { event.preventDefault(); save(); });
resetButton.addEventListener("click", () => { domainInput.value = DEFAULT_DOMAIN; save(); });
domainInput.addEventListener("input", () => { status.textContent = ""; status.removeAttribute("data-error"); });
load();
