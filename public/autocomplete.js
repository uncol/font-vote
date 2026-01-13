const registeredInputs = new WeakSet();
let dropdownEl = null;
let iconGroups = [];
let iconGroupsPromise = null;
let selectedIndex = -1;
let activeInput = null;
let initialized = false;

const normalizeIconName = (name = "") => name.toLowerCase().replace(/-/g, "_");

/**
 * Подготавливает общие обработчики для автодополнения icon.
 */
export function initIconAutocomplete(dropdownElement) {
  if (!dropdownElement) {
    throw new Error("Icon dropdown element is required for autocomplete");
  }

  dropdownEl = dropdownElement;

  if (!initialized) {
    dropdownEl.addEventListener("click", handleDropdownClick);
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    initialized = true;
  }

  return {
    setupInput,
    loadIconGroups,
    closeDropdown,
  };
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

async function ensureIconGroups() {
  if (iconGroups.length > 0) return iconGroups;
  if (!iconGroupsPromise) {
    iconGroupsPromise = fetch("/api/manifest")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load manifest");
        return res.json();
      })
      .then((manifest) => {
        const entries = Object.entries(manifest.icons || {});
        iconGroups = entries.map(([group, items]) => ({
          group,
          items: items.map((item) => ({
            icon: item.name,
            description: item.description || item.added_in || "",
          })),
        }));
        return iconGroups;
      })
      .catch((err) => {
        console.error("Failed to load icon groups:", err);
        iconGroups = [];
        return iconGroups;
      });
  }
  return iconGroupsPromise;
}

async function loadIconGroups() {
  await ensureIconGroups();
  return iconGroups;
}

function closeDropdown() {
  if (!dropdownEl) return;
  dropdownEl.classList.remove("show");
  dropdownEl.innerHTML = "";
  selectedIndex = -1;
  activeInput = null;
}

async function filterAndRenderDropdown(query, inputElement, options = {}) {
  const { showAll = false } = options;
  if (!dropdownEl) return;
  const trimmedQuery = query.trim();
  if (!showAll && !trimmedQuery) {
    closeDropdown();
    return;
  }

  await ensureIconGroups();
  activeInput = inputElement;

  const lowerQuery = trimmedQuery.toLowerCase();
  const normalizedQuery = normalizeIconName(trimmedQuery);
  const seenIcons = new Set();
  const renderAll = showAll && !trimmedQuery;
  let html = "";
  let visibleCount = 0;

  if (inputElement.classList.contains("catalog-icon-input")) {
    html += "<div class='autocomplete-item' data-icon='external-link-selected'><span class='autocomplete-item-desc'>Внешняя ссылка</span></div>";
  }
  iconGroups.forEach(({ group, items }) => {
    const filtered = renderAll
      ? items
      : items.filter((item) => {
          const iconText = item.icon.toLowerCase();
          const normalizedIcon = normalizeIconName(item.icon);
          const descText = item.description.toLowerCase();
          return (
            normalizedIcon.includes(normalizedQuery) ||
            iconText.includes(lowerQuery) ||
            descText.includes(lowerQuery)
          );
        });

    const uniqueItems = [];
    filtered.forEach((item) => {
      const deDupKey = normalizeIconName(item.icon);
      if (seenIcons.has(deDupKey)) return;
      seenIcons.add(deDupKey);
      uniqueItems.push(item);
    });

    if (uniqueItems.length > 0) {
      html += `<div class="autocomplete-group">${group}</div>`;
      uniqueItems.forEach((item) => {
        const iconClass = item.icon.replace(/_/g, "-");
        html += `
          <div class="autocomplete-item" data-icon="${item.icon}" data-index="${visibleCount}">
            <i class="gf ${iconClass}"></i>
            <span class="autocomplete-item-icon">${item.icon}</span>
            <span class="autocomplete-item-desc">${item.description}</span>
          </div>
        `;
        visibleCount += 1;
      });
    }
  });

  if (!html.includes("autocomplete-item-icon")) {
    html += '<div style="padding: 12px; color: var(--muted); text-align: center;">Ничего не найдено</div>';
  }

  dropdownEl.innerHTML = html;
  dropdownEl.classList.add("show");

  const rect = inputElement.getBoundingClientRect();
  dropdownEl.style.position = "fixed";
  dropdownEl.style.top = `${rect.bottom}px`;
  dropdownEl.style.left = `${rect.left}px`;
  dropdownEl.style.width = `${rect.width}px`;

  selectedIndex = -1;
}

function updateDropdownPosition() {
  if (!dropdownEl || !activeInput || !dropdownEl.classList.contains("show")) return;
  const rect = activeInput.getBoundingClientRect();
  dropdownEl.style.top = `${rect.bottom}px`;
  dropdownEl.style.left = `${rect.left}px`;
  dropdownEl.style.width = `${rect.width}px`;
}

function selectDropdownItem(icon) {
  if (!activeInput) return;
  if (icon === "external-link-selected") {
    activeInput.value = "https://";
  } else {
    activeInput.value = icon;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
  closeDropdown();
}

function highlightDropdownItem(index) {
  if (!dropdownEl) return;
  const items = dropdownEl.querySelectorAll(".autocomplete-item");
  items.forEach((item, idx) => {
    item.classList.toggle("selected", idx === index);
  });
  if (index >= 0 && index < items.length) {
    items[index].scrollIntoView({ block: "nearest" });
  }
}

function handleDropdownClick(event) {
  const item = event.target.closest(".autocomplete-item");
  if (item) {
    selectDropdownItem(item.dataset.icon);
  }
}

function handleDocumentClick(event) {
  if (!dropdownEl) return;
  const target = event.target;
  if (target instanceof HTMLElement && registeredInputs.has(target)) {
    return;
  }
  if (target instanceof Node && dropdownEl.contains(target)) {
    return;
  }
  closeDropdown();
}

function setupInput(inputElement) {
  if (!dropdownEl || !inputElement) return;
  registeredInputs.add(inputElement);
  inputElement.setAttribute("autocomplete", "off");

  const debouncedFilter = debounce((value) => {
    filterAndRenderDropdown(value, inputElement);
  }, 200);

  inputElement.addEventListener("input", (event) => {
    debouncedFilter(event.target.value);
  });

  inputElement.addEventListener("focus", () => {
    const value = inputElement.value.trim();
    if (value) {
      filterAndRenderDropdown(value, inputElement);
      return;
    }
    filterAndRenderDropdown("", inputElement, { showAll: true });
  });

  inputElement.addEventListener("keydown", (event) => {
    if (!dropdownEl.classList.contains("show")) return;
    const items = dropdownEl.querySelectorAll(".autocomplete-item");

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      highlightDropdownItem(selectedIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      highlightDropdownItem(selectedIndex);
    } else if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      const target = items[selectedIndex];
      if (target) selectDropdownItem(target.getAttribute("data-icon"));
    } else if (event.key === "Escape") {
      closeDropdown();
    }
  });
}
