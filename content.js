(() => {
  const BUTTON_ID = "kinokino-watch-button";

  function isFilmPage() {
    return /^\/film\/\d+\/?$/.test(window.location.pathname);
  }

  async function openKinokino() {
    const { kinokinoDomain } = await chrome.storage.sync.get({
      kinokinoDomain: "www.kinokino.vip"
    });
    const target = new URL(window.location.href);
    target.hostname = kinokinoDomain;
    window.location.assign(target.href);
  }

  function createButton() {
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Смотреть";
    button.title = "Открыть фильм на Kinokino";
    button.addEventListener("click", openKinokino);
    return button;
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!isFilmPage()) return;

    const watchButton = [...document.querySelectorAll("button, a")].find((element) =>
      element.textContent.trim().includes("Буду смотреть")
    );

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
