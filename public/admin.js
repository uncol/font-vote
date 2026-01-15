import { initIconAutocomplete } from "./autocomplete.js";

const loginBtn = document.getElementById("loginBtn");
const userBadge = document.getElementById("userBadge");
const adminGate = document.getElementById("adminGate");
const adminPanel = document.getElementById("adminPanel");

const newSemantic = document.getElementById("newSemantic");
const newIcon = document.getElementById("newIcon");
const addBtn = document.getElementById("addBtn");
const exportBtn = document.getElementById("exportBtn");
const collectionCount = document.getElementById("collectionCount");
const collectionBody = document.querySelector("#adminCollectionTable tbody");
const filterSemantic = document.getElementById("filterSemantic");
const filterIcon = document.getElementById("filterIcon");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const {
  setupInput: setupIconAutocomplete,
  loadIconGroups: ensureIconManifest,
} = initIconAutocomplete(document.getElementById("iconDropdown"));

setupIconAutocomplete(newIcon);

let session = { user: null, isAdmin: false };
let allItems = [];

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function loadSession() {
  session = await fetchJSON("/api/me");
  if (session.user) {
    loginBtn.style.display = "none";
    userBadge.textContent = `Вы вошли как ${session.user}`;
  } else {
    loginBtn.style.display = "inline-flex";
    userBadge.textContent = "";
  }

  if (session.isAdmin) {
    adminGate.hidden = true;
    adminPanel.hidden = false;
  } else {
    adminGate.hidden = false;
    adminPanel.hidden = true;
  }
}

async function loadCollection() {
  const data = await fetchJSON("/api/collection1?sort=semantic&order=asc");
  allItems = data.items || [];
  applyFilters();
}

function applyFilters() {
  const semanticFilter = filterSemantic.value.toLowerCase().trim();
  const iconFilter = filterIcon.value.toLowerCase().trim();
  
  const filtered = allItems.filter(item => {
    const matchSemantic = !semanticFilter || item.semantic.toLowerCase().includes(semanticFilter);
    const matchIcon = !iconFilter || item.icon.toLowerCase().includes(iconFilter);
    return matchSemantic && matchIcon;
  });
  
  renderCollection(filtered);
}

function renderIconCell(cell, iconName) {
  cell.innerHTML = "";
  const iconValue = iconName?.trim();
  if (!iconValue) return;
  const previewWrapper = document.createElement("div");
  previewWrapper.className = "icon-cell";
  const iconEl = document.createElement("i");
  const iconClass = iconValue.replace(/_/g, "-");
  iconEl.className = `gf ${iconClass} gf-24px`;
  iconEl.style.paddingBottom = "4px";
  previewWrapper.appendChild(iconEl);
  cell.appendChild(previewWrapper);
}

function renderCollection(items) {
  collectionBody.innerHTML = "";
  collectionCount.textContent = `Строк в справочнике: ${items.length}`;
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.semantic}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    `;
    const previewCell = row.querySelector("td:nth-child(2)");
    const proposalCell = row.querySelector("td:nth-child(3)");
    const iconCell = row.querySelector("td:nth-child(4)");
    const actionCell = row.querySelector("td:nth-child(5)");

    renderIconCell(previewCell, item.icon);

    const input = document.createElement("input");
    input.className = "inline-input admin-icon-input";
    input.value = item.icon;
    setupIconAutocomplete(input);

    const updateProposal = () => renderIconCell(proposalCell, input.value);
    updateProposal();
    input.addEventListener("input", updateProposal);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Сохранить";
    saveBtn.addEventListener("click", async () => {
      const icon = input.value.trim();
      if (!icon) return alert("Введите icon");
      saveBtn.disabled = true;
      try {
        await fetchJSON("/api/admin/collection1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semantic: item.semantic, icon }),
        });
      } catch (err) {
        alert(err.message);
      } finally {
        saveBtn.disabled = false;
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Удалить";
    deleteBtn.className = "ghost";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Удалить ${item.semantic}?`)) return;
      deleteBtn.disabled = true;
      try {
        await fetchJSON("/api/admin/collection1", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semantic: item.semantic }),
        });
        await loadCollection();
      } catch (err) {
        alert(err.message);
      } finally {
        deleteBtn.disabled = false;
      }
    });

    iconCell.appendChild(input);
    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.appendChild(saveBtn);
    actions.appendChild(deleteBtn);
    actionCell.appendChild(actions);

    collectionBody.appendChild(row);
  });
}

async function addEntry() {
  const semantic = newSemantic.value.trim();
  const icon = newIcon.value.trim();
  if (!semantic || !icon) return alert("semantic и icon обязательны");
  addBtn.disabled = true;
  try {
    await fetchJSON("/api/admin/collection1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semantic, icon }),
    });
    newSemantic.value = "";
    newIcon.value = "";
    await loadCollection();
  } catch (err) {
    alert(err.message);
  } finally {
    addBtn.disabled = false;
  }
}

function exportTypeScript() {
  const rows = Array.from(collectionBody.querySelectorAll("tr"));
  const items = rows.map(row => {
    const semantic = row.querySelector("td:nth-child(1)").textContent.trim();
    const iconInput = row.querySelector("td:nth-child(4) input");
    const icon = iconInput ? iconInput.value.trim() : "";
    return { semantic, icon };
  }).filter(item => item.semantic && item.icon);

  if (items.length === 0) {
    alert("Нет данных для экспорта");
    return;
  }

  const lines = items.map(item => 
    `      /** @glyphName ${item.icon} */\n      readonly ${item.semantic}: string;`
  );

  const header = `/**
 * NOC Semantic Glyph Type Definitions
 * Provides IntelliSense/autocomplete for NOC.glyph.semantic in VSCode
 * Augments the existing NOC global object defined in ui/web/js/boot.js
 */

interface NOC {
  glyph: {
    semantic: {
`;

  const footer = `    };
    [key: string]: number | typeof NOC.glyph.semantic;
  };
}

// eslint-disable-next-line no-var
declare var NOC: NOC;
`;

  const content = header + lines.join("\n") + "\n" + footer;
  
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.d.ts";
  a.click();
  URL.revokeObjectURL(url);
}

addBtn.addEventListener("click", addEntry);
exportBtn.addEventListener("click", exportTypeScript);
loginBtn.addEventListener("click", () => {
  window.location.href = "/api/auth/github";
});

if (filterSemantic && filterIcon && clearFiltersBtn) {
  filterSemantic.addEventListener("input", applyFilters);
  filterIcon.addEventListener("input", applyFilters);
  clearFiltersBtn.addEventListener("click", () => {
    filterSemantic.value = "";
    filterIcon.value = "";
    applyFilters();
  });
}

(async () => {
  await loadSession();
  if (session.isAdmin) {
    await Promise.all([
      loadCollection(),
      ensureIconManifest(),
    ]);
  }
})();
