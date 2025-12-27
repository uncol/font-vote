const loginBtn = document.getElementById("loginBtn");
const userBadge = document.getElementById("userBadge");
const adminGate = document.getElementById("adminGate");
const adminPanel = document.getElementById("adminPanel");
const adminJournal = document.getElementById("adminJournal");

const newSemantic = document.getElementById("newSemantic");
const newIcon = document.getElementById("newIcon");
const addBtn = document.getElementById("addBtn");
const exportBtn = document.getElementById("exportBtn");
const testIcon = document.getElementById("testIcon");
const testBtn = document.getElementById("testBtn");
const testResult = document.getElementById("testResult");
const collectionCount = document.getElementById("collectionCount");
const collectionBody = document.querySelector("#adminCollectionTable tbody");

const journalFilter = document.getElementById("journalFilter");
const journalOrder = document.getElementById("journalOrder");
const journalCount = document.getElementById("journalCount");
const journalBody = document.querySelector("#adminJournalTable tbody");

let session = { user: null, isAdmin: false };

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
    adminJournal.hidden = false;
  } else {
    adminGate.hidden = false;
    adminPanel.hidden = true;
    adminJournal.hidden = true;
  }
}

async function loadCollection() {
  const data = await fetchJSON("/api/collection1?sort=semantic&order=asc");
  renderCollection(data.items || []);
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
    `;
    const iconCell = row.querySelector("td:nth-child(2)");
    const actionCell = row.querySelector("td:nth-child(3)");

    const input = document.createElement("input");
    input.className = "inline-input";
    input.value = item.icon;

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
        await loadJournal();
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
        await loadJournal();
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
    await loadJournal();
  } catch (err) {
    alert(err.message);
  } finally {
    addBtn.disabled = false;
  }
}

function buildJournalQuery() {
  const params = new URLSearchParams();
  if (journalFilter.value.trim()) params.set("semantic", journalFilter.value.trim());
  params.set("order", journalOrder.value);
  return params.toString();
}

async function loadJournal() {
  const query = buildJournalQuery();
  const data = await fetchJSON(`/api/journal?${query}`);
  renderJournal(data.items || []);
}

function renderJournal(items) {
  journalBody.innerHTML = "";
  journalCount.textContent = `Записей: ${items.length}`;
  items.forEach((item) => {
    const row = document.createElement("tr");
    const created = new Date(item.created).toLocaleString("ru-RU");
    const statusClass = item.applied ? "applied" : "pending";
    const statusLabel = item.applied ? "applied" : "pending";
    row.innerHTML = `
      <td>${created}</td>
      <td>${item.semantic}</td>
      <td>${item.icon}</td>
      <td>${item.user}</td>
      <td><span class="status ${statusClass}">${statusLabel}</span></td>
      <td></td>
    `;

    const cell = row.querySelector("td:last-child");
    if (!item.applied) {
      const btn = document.createElement("button");
      btn.textContent = "Apply";
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await fetchJSON("/api/admin/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id }),
          });
          await loadCollection();
          await loadJournal();
        } catch (err) {
          alert(err.message);
        } finally {
          btn.disabled = false;
        }
      });
      cell.appendChild(btn);
    } else {
      cell.textContent = "—";
    }

    journalBody.appendChild(row);
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function exportTypeScript() {
  const rows = Array.from(collectionBody.querySelectorAll("tr"));
  const items = rows.map(row => {
    const semantic = row.querySelector("td:nth-child(1)").textContent.trim();
    const icon = row.querySelector("td:nth-child(2) input").value.trim();
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

const debouncedJournal = debounce(loadJournal, 300);

function testGlyph() {
  const icon = testIcon.value.trim();
  if (!icon) {
    testResult.innerHTML = "";
    return;
  }
  testResult.innerHTML = `<i class="gufo ${icon}"></i> <span style="font-size: 14px; color: var(--muted);">${icon}</span>`;
}

journalFilter.addEventListener("input", debouncedJournal);
journalOrder.addEventListener("change", loadJournal);
addBtn.addEventListener("click", addEntry);
exportBtn.addEventListener("click", exportTypeScript);
testBtn.addEventListener("click", testGlyph);
testIcon.addEventListener("input", testGlyph);
loginBtn.addEventListener("click", () => {
  window.location.href = "/api/auth/github";
});

(async () => {
  await loadSession();
  if (session.isAdmin) {
    await loadCollection();
    await loadJournal();
  }
})();
