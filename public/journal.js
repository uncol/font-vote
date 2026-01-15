const loginBtn = document.getElementById("loginBtn");
const userBadge = document.getElementById("userBadge");
const tableBody = document.querySelector("#journalTable tbody");
const countBadge = document.getElementById("countBadge");

const filterSemantic = document.getElementById("filterSemantic");
const filterUser = document.getElementById("filterUser");
const sortOrder = document.getElementById("sortOrder");
const clearJournalFiltersBtn = document.getElementById("clearJournalFiltersBtn");

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function loadSession() {
  const session = await fetchJSON("/api/me");
  if (session.user) {
    loginBtn.style.display = "none";
    userBadge.textContent = `Вы вошли как ${session.user}`;
  } else {
    loginBtn.style.display = "inline-flex";
    userBadge.textContent = "";
  }
}

function buildQuery() {
  const params = new URLSearchParams();
  if (filterSemantic.value.trim()) params.set("semantic", filterSemantic.value.trim());
  if (filterUser.value.trim()) params.set("user", filterUser.value.trim());
  params.set("order", sortOrder.value);
  return params.toString();
}

async function loadJournal() {
  const query = buildQuery();
  const data = await fetchJSON(`/api/journal?${query}`);
  renderTable(data.items || []);
}

function renderTable(items) {
  tableBody.innerHTML = "";
  countBadge.textContent = `Записей: ${items.length}`;
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
    `;
    tableBody.appendChild(row);
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedLoad = debounce(loadJournal, 300);

[filterSemantic, filterUser].forEach((input) => input.addEventListener("input", debouncedLoad));
sortOrder.addEventListener("change", loadJournal);

clearJournalFiltersBtn.addEventListener("click", () => {
  filterSemantic.value = "";
  filterUser.value = "";
  sortOrder.value = "desc";
  loadJournal();
});

loginBtn.addEventListener("click", () => {
  window.location.href = "/api/auth/github";
});

(async () => {
  await loadSession();
  await loadJournal();
})();
