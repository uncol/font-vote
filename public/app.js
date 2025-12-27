const loginBtn = document.getElementById("loginBtn");
const userBadge = document.getElementById("userBadge");
const tableBody = document.querySelector("#collectionTable tbody");
const countBadge = document.getElementById("countBadge");

const searchSemantic = document.getElementById("searchSemantic");
const searchIcon = document.getElementById("searchIcon");
const sortBy = document.getElementById("sortBy");
const sortOrder = document.getElementById("sortOrder");

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
}

function buildQuery() {
  const params = new URLSearchParams();
  if (searchSemantic.value.trim()) params.set("semantic", searchSemantic.value.trim());
  if (searchIcon.value.trim()) params.set("icon", searchIcon.value.trim());
  params.set("sort", sortBy.value);
  params.set("order", sortOrder.value);
  return params.toString();
}

async function loadCollection() {
  const query = buildQuery();
  const data = await fetchJSON(`/api/collection1?${query}`);
  renderTable(data.items || []);
}

function renderTable(items) {
  tableBody.innerHTML = "";
  countBadge.textContent = `Найдено строк: ${items.length}`;
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.semantic}</td>
      <td></td>
      <td>${item.icon}</td>
      <td></td>
    `;
    const previewCell = row.querySelector("td:nth-child(2)");
    const cell = row.querySelector("td:last-child");
    const iconEl = document.createElement("i");
    iconEl.className = `gf ${item.icon} gf-16px`;
    previewCell.appendChild(iconEl);
    if (session.user) {
      const input = document.createElement("input");
      input.className = "inline-input";
      input.placeholder = "Новый icon";
      const button = document.createElement("button");
      button.textContent = "Предложить";
      button.addEventListener("click", async () => {
        const icon = input.value.trim();
        if (!icon) return alert("Введите icon");
        button.disabled = true;
        try {
          await fetchJSON("/api/propose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ semantic: item.semantic, icon }),
          });
          input.value = "";
          alert("Предложение отправлено");
        } catch (err) {
          alert(err.message);
        } finally {
          button.disabled = false;
        }
      });
      const wrapper = document.createElement("div");
      wrapper.className = "row-actions";
      wrapper.appendChild(input);
      wrapper.appendChild(button);
      cell.appendChild(wrapper);
    } else {
      cell.innerHTML = '<span class="notice">Авторизуйтесь для предложения</span>';
    }
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

const debouncedLoad = debounce(loadCollection, 300);

[searchSemantic, searchIcon].forEach((input) => input.addEventListener("input", debouncedLoad));
[sortBy, sortOrder].forEach((select) => select.addEventListener("change", loadCollection));

loginBtn.addEventListener("click", () => {
  window.location.href = "/api/auth/github";
});

(async () => {
  await loadSession();
  await loadCollection();
})();
