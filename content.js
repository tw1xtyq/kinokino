(() => {
  const BUTTON_ID = "kinokino-watch-button";
  const DEFAULT_DOMAIN = "www.kinokino.vip";
  const DOMAIN_SOURCE = "https://brogiro.cfd/";

  function isFilmPage() {
    // Учитываем любые query-параметры, в т.ч. ?socialAlias=...
    return /^\/film\/\d+\/?$/.test(window.location.pathname);
  }

  function normalizeDomain(value) {
    let domain = value.trim();
    if (/^https?:\/\//i.test(domain)) {
      try {
        domain = new URL(domain).hostname;
      } catch {
        return null;
      }
    }
    domain = domain.replace(/\/$/, "").toLowerCase();
    return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)
      ? domain
      : null;
  }

  function getStorage() {
    return globalThis.chrome?.storage?.sync;
  }

  async function getSavedDomain() {
    try {
      const storage = getStorage();
      if (storage) {
        const settings = await storage.get({ kinokinoDomain: DEFAULT_DOMAIN });
        return normalizeDomain(settings.kinokinoDomain) ?? DEFAULT_DOMAIN;
      }
    } catch {
      // Продолжаем с доменом по умолчанию.
    }
    return DEFAULT_DOMAIN;
  }

  function getDomainFromPage(html) {
    const page = new DOMParser().parseFromString(html, "text/html");
    const emphasizedDomains = [...page.querySelectorAll("b, strong, code, [data-domain]")]
      .map((element) => normalizeDomain(element.textContent));
    return emphasizedDomains.find(Boolean) ?? null;
  }

  async function getCurrentDomain() {
    let domain = await getSavedDomain();

    try {
      const response = await fetch(DOMAIN_SOURCE, { cache: "no-store" });
      if (!response.ok) return domain;
      const remoteDomain = getDomainFromPage(await response.text());
      if (!remoteDomain) return domain;

      domain = remoteDomain;
      const storage = getStorage();
      if (storage) {
        await storage.set({ kinokinoDomain: domain });
      }
    } catch {
      // Используем последний сохранённый домен, если источник недоступен.
    }
    return domain;
  }

  async function openKinokino(button) {
    button.disabled = true;
    button.textContent = "Открываем…";
    const kinokinoDomain = await getCurrentDomain();

    // Убираем служебные параметры Кинопоиска (например, ?socialAlias=...),
    // на Kinokino они не нужны и могут ломать страницу.
    const target = new URL(window.location.href);
    target.hostname = kinokinoDomain;
    target.search = "";
    target.hash = "";
    window.location.assign(target.href);
  }

  function createButton() {
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Смотреть";
    button.title = "Открыть фильм на Kinokino";
    button.addEventListener("click", () => openKinokino(button));
    return button;
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!isFilmPage()) return;

    // «Буду смотреть» — кнопка для фильмов, уже добавленных в список.
    // Ищем также вариант «Хочу посмотреть», чтобы кнопка появлялась и
    // на страницах, где пользователь ещё не отмечал фильм.
    const WATCH_LABELS = ["Буду смотреть", "Хочу посмотреть"];
    const watchButton = [...document.querySelectorAll("button, a")].find((element) => {
      const text = element.textContent.trim();
      return WATCH_LABELS.some((label) => text.includes(label));
    });

    if (!watchButton) return;
    const actions = watchButton.parentElement;
    const moreButton = watchButton.nextElementSibling;
    const button = createButton();

    // Блок действий Кинопоиска — CSS-сетка из двух колонок. Новый элемент
    // иначе автоматически оказывается во втором ряду.
    if (actions) {
      actions.style.position = "relative";
    }

    watchButton.insertAdjacentElement("afterend", button);

    const anchor = moreButton instanceof HTMLElement ? moreButton : watchButton;
    // Небольшой запас оставляет видимой круглую кнопку «…» Кинопоиска.
    button.style.left = `${anchor.offsetLeft + anchor.offsetWidth + 68}px`;
    button.style.position = "absolute";
    button.style.top = `${watchButton.offsetTop}px`;
  }

  function syncButton() {
    if (!isFilmPage()) {
      document.getElementById(BUTTON_ID)?.remove();
      return;
    }
    addButton();
  }

  syncButton();

  new MutationObserver(syncButton).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
