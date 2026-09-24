const DEFAULT_DOMAIN = "www.kinokino.vip";
const DOMAIN_SOURCE = "https://brogiro.cfd/";
const domainInput = document.getElementById("domain");
const refreshButton = document.getElementById("refresh");
const status = document.getElementById("status");

function normalizeDomain(value) {
  const domain = value.trim().replace(/\/$/, "").toLowerCase();
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)
    ? domain
    : null;
}

function getDomainFromPage(html) {
  const page = new DOMParser().parseFromString(html, "text/html");
  const domains = [...page.querySelectorAll("b, strong, code, [data-domain]")]
    .map((element) => normalizeDomain(element.textContent));
  return domains.find(Boolean) ?? null;
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.toggleAttribute("data-error", isError);
}

async function loadSavedDomain() {
  const { kinokinoDomain } = await chrome.storage.sync.get({ kinokinoDomain: DEFAULT_DOMAIN });
  domainInput.value = normalizeDomain(kinokinoDomain) ?? DEFAULT_DOMAIN;
}

async function refreshDomain() {
  refreshButton.disabled = true;
  refreshButton.querySelector(".button-text").textContent = "Проверяем…";
  showStatus("");
  try {
    const response = await fetch(DOMAIN_SOURCE, { cache: "no-store" });
    if (!response.ok) throw new Error("Источник временно недоступен");
    const domain = getDomainFromPage(await response.text());
    if (!domain) throw new Error("Домен не найден на странице источника");

    await chrome.storage.sync.set({ kinokinoDomain: domain });
    domainInput.value = domain;
    refreshButton.classList.add("is-saved");
    showStatus("Домен обновлён");
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    refreshButton.disabled = false;
    refreshButton.querySelector(".button-text").textContent = "Проверить сейчас";
    setTimeout(() => refreshButton.classList.remove("is-saved"), 1600);
  }
}

refreshButton.addEventListener("click", refreshDomain);
loadSavedDomain();
