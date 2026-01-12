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
const iconDropdown = document.getElementById("iconDropdown");

let session = { user: null, isAdmin: false };
let iconGroups = [];
let selectedIndex = -1;
let activeAutocompleteInput = null;

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
      input.className = "inline-input";
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
      setupAutocomplete(input);
      
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

async function loadIconGroups() {
  try {
    const manifest = await fetchJSON('/api/manifest');
    
    // Convert manifest.json format to iconGroups format
    iconGroups = Object.entries(manifest.icons).map(([group, items]) => ({
      group,
      items: items.map(item => ({
        icon: item.name,
        description: item.description || item.added_in || ''
      }))
    }));
  } catch (err) {
    console.error('Failed to load icon groups:', err);
    iconGroups = [];
  }
}

function filterAndRenderDropdown(query, inputElement) {
  if (!query.trim()) {
    iconDropdown.classList.remove('show');
    selectedIndex = -1;
    return;
  }
  
  activeAutocompleteInput = inputElement;
  
  const lowerQuery = query.toLowerCase();
  let html = '';
  let visibleCount = 0;
  
  iconGroups.forEach(({ group, items }) => {
    const filtered = items.filter(item => 
      item.icon.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
    
    if (filtered.length > 0) {
      html += `<div class="autocomplete-group">${group}</div>`;
      filtered.forEach((item, idx) => {
        const iconClass = item.icon.replace(/_/g, '-');
        html += `
          <div class="autocomplete-item" data-icon="${item.icon}" data-index="${visibleCount}">
            <i class="gf ${iconClass}"></i>
            <span class="autocomplete-item-icon">${item.icon}</span>
            <span class="autocomplete-item-desc">${item.description}</span>
          </div>
        `;
        visibleCount++;
      });
    }
  });
  
  if (html) {
    iconDropdown.innerHTML = html;
    iconDropdown.classList.add('show');
  } else {
    iconDropdown.innerHTML = '<div style="padding: 12px; color: var(--muted); text-align: center;">Ничего не найдено</div>';
    iconDropdown.classList.add('show');
  }
  
  // Position dropdown relative to input
  const rect = inputElement.getBoundingClientRect();
  iconDropdown.style.position = 'fixed';
  iconDropdown.style.top = `${rect.bottom}px`;
  iconDropdown.style.left = `${rect.left}px`;
  iconDropdown.style.width = `${rect.width}px`;
  
  selectedIndex = -1;
}

function updateDropdownPosition() {
  if (activeAutocompleteInput && iconDropdown.classList.contains('show')) {
    const rect = activeAutocompleteInput.getBoundingClientRect();
    iconDropdown.style.top = `${rect.bottom}px`;
    iconDropdown.style.left = `${rect.left}px`;
    iconDropdown.style.width = `${rect.width}px`;
  }
}

function selectDropdownItem(icon) {
  if (activeAutocompleteInput) {
    activeAutocompleteInput.value = icon;
    if (activeAutocompleteInput.classList.contains('test-icon')) {
      testGlyph();
    }
    if (activeAutocompleteInput.classList.contains('inline-input')) {
      const iconEl = activeAutocompleteInput.closest("tr").querySelector('td:nth-child(2) i:nth-child(2)'); 
      const iconClass = `gf ${icon.replace(/_/g, '-')} gf-24px`;
      iconEl.className = iconClass;
    }
  }
  iconDropdown.classList.remove('show');
  selectedIndex = -1;
  activeAutocompleteInput = null;
}

function highlightDropdownItem(index) {
  const items = iconDropdown.querySelectorAll('.autocomplete-item');
  items.forEach((item, idx) => {
    item.classList.toggle('selected', idx === index);
  });
  
  if (index >= 0 && index < items.length) {
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

function setupAutocomplete(inputElement) {
  const debouncedFilter = debounce((value) => {
    filterAndRenderDropdown(value, inputElement);
  }, 200);

  inputElement.addEventListener("input", (e) => {
    debouncedFilter(e.target.value);
  });

  inputElement.addEventListener("focus", () => {
    if (inputElement.value.trim()) {
      filterAndRenderDropdown(inputElement.value, inputElement);
    }
  });

  inputElement.addEventListener("keydown", (e) => {
    const items = iconDropdown.querySelectorAll('.autocomplete-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      highlightDropdownItem(selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      highlightDropdownItem(selectedIndex);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const icon = items[selectedIndex].getAttribute('data-icon');
      selectDropdownItem(icon);
    } else if (e.key === 'Escape') {
      iconDropdown.classList.remove('show');
      selectedIndex = -1;
    }
  });
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
setupAutocomplete(testIcon);
testIcon.addEventListener("input", testGlyph);

iconDropdown.addEventListener('click', (e) => {
  const item = e.target.closest('.autocomplete-item');
  if (item) {
    const icon = item.dataset.icon;
    selectDropdownItem(icon);
  }
});

document.addEventListener('click', (e) => {
  const isInputClick = e.target.classList?.contains('inline-input') || e.target === testIcon;
  if (!isInputClick && !iconDropdown.contains(e.target)) {
    iconDropdown.classList.remove('show');
    selectedIndex = -1;
    activeAutocompleteInput = null;
  }
});

window.addEventListener('scroll', updateDropdownPosition, true);
window.addEventListener('resize', updateDropdownPosition);

loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github';
});

(async () => {
  await loadSession();
  await Promise.all([
    loadCollection(),
    loadIconGroups()
  ]);
})();
