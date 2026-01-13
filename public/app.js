import { initIconAutocomplete } from "./autocomplete.js";

const loginBtn = document.getElementById("loginBtn");
const userBadge = document.getElementById("userBadge");
const tableBody = document.querySelector("#collectionTable tbody");
const countBadge = document.getElementById("countBadge");

const searchSemantic = document.getElementById("searchSemantic");
const searchIcon = document.getElementById("searchIcon");
const sortBy = document.getElementById("sortBy");
const sortOrder = document.getElementById("sortOrder");
const testIcon = document.getElementById("testIcon");
const testResult = document.getElementById("testResult");
const {
  setupInput: setupIconAutocomplete,
  loadIconGroups: ensureIconManifest,
} = initIconAutocomplete(document.getElementById("iconDropdown"));

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
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "icon-cell";
    const iconEl = document.createElement("i");
    const iconClass = item.icon.replace(/_/g, '-');
    iconEl.className = `gf ${iconClass} gf-24px`;
    iconEl.style.paddingBottom = "4px"; 
    iconWrapper.appendChild(iconEl);
    previewCell.appendChild(iconWrapper);
    if (session.user) {
      const input = document.createElement("input");
      const proposePreviewEl = document.createElement("i");
      proposePreviewEl.style.margin = "0 8px";
      proposePreviewEl.style.paddingBottom = "4px"; 
      proposePreviewEl.style.width = "24px";
      input.className = "inline-input catalog-icon-input";
      input.placeholder = "Новая icon";
      input.addEventListener("input", () => {
        const val = input.value.trim();
        if (val) {
          const cls = val.replace(/_/g, '-');
          proposePreviewEl.className = `gf ${cls} gf-24px`;
        } else {
          proposePreviewEl.className = "";
        }
      });
      
      // Setup autocomplete for this input
      setupIconAutocomplete(input);
      
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
      iconWrapper.appendChild(proposePreviewEl);
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

function testGlyph() {
  const icon = testIcon.value.trim();
  if (!icon) {
    testResult.innerHTML = "";
    return;
  }
  const className = icon.replace(/_/g, "-");
  testResult.innerHTML = `<i class="gf ${className}" style="width: 32px;"></i> <span style="font-size: 14px; color: var(--muted);">${icon} → ${className}</span>`;
}

const debouncedLoad = debounce(loadCollection, 300);

[searchSemantic, searchIcon].forEach((input) => input.addEventListener("input", debouncedLoad));
[sortBy, sortOrder].forEach((select) => select.addEventListener("change", loadCollection));

// Setup autocomplete for test icon field
setupIconAutocomplete(testIcon);
testIcon.addEventListener("input", testGlyph);

loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github';
});

(async () => {
  await loadSession();
  await Promise.all([
    loadCollection(),
    ensureIconManifest()
  ]);
})();
