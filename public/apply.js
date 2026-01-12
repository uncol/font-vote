const loginBtn = document.getElementById("loginBtn");
const userBadge = document.getElementById("userBadge");
const adminGate = document.getElementById("adminGate");
const applyPanel = document.getElementById("applyPanel");

const journalFilter = document.getElementById("journalFilter");
const appliedFilter = document.getElementById("appliedFilter");
const journalOrder = document.getElementById("journalOrder");
const journalCount = document.getElementById("journalCount");
const journalBody = document.querySelector("#journalTable tbody");

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
    applyPanel.hidden = false;
  } else {
    adminGate.hidden = false;
    applyPanel.hidden = true;
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
  
  // Применяем фильтр по статусу applied
  const statusFilter = appliedFilter.value;
  const filteredItems = items.filter(item => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return !item.applied;
    if (statusFilter === "applied") return item.applied;
    return true;
  });
  
  journalCount.textContent = `Записей: ${filteredItems.length}`;
  filteredItems.forEach((item) => {
    const row = document.createElement("tr");
    const created = new Date(item.created).toLocaleString("ru-RU");
    const statusClass = item.applied ? "applied" : "pending";
    const statusLabel = item.applied ? "applied" : "pending";
    row.innerHTML = `
      <td>${created}</td>
      <td>${item.semantic}</td>
      <td>${item.icon}</td>
      <td></td>
      <td>${item.user}</td>
      <td><span class="status ${statusClass}">${statusLabel}</span></td>
      <td></td>
    `;

    const previewCell = row.querySelector("td:nth-child(4)");
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "icon-cell";
    const iconEl = document.createElement("i");
    const iconClass = item.icon.replace(/_/g, '-');
    iconEl.className = `gf ${iconClass} gf-16px`;
    iconEl.style.paddingBottom = "4px";
    iconWrapper.appendChild(iconEl);
    previewCell.appendChild(iconWrapper);

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

const debouncedJournal = debounce(loadJournal, 300);

journalFilter.addEventListener("input", debouncedJournal);
appliedFilter.addEventListener("change", loadJournal);
journalOrder.addEventListener("change", loadJournal);
loginBtn.addEventListener("click", () => {
  window.location.href = "/api/auth/github";
});

(async () => {
  await loadSession();
  if (session.isAdmin) {
    await loadJournal();
  }
})();
