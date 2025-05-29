const days = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
let activities = [];
let plan = {};

const BIN_ID = "683822fd8a456b7966a6d83d";
const API_KEY = "$2a$10$HOZFJr6xE4AyXyJZC3XVVO9wh1zFD0a4s7k6em0cm5/8peG6pN3Wq";

// ========== JSONBIN ==========
async function fetchActivities() {
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID + '/latest', {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await res.json();
    if (Array.isArray(data.record)) {
      activities = data.record;
    } else {
      activities = ["Běh", "Posilovna"];
    }
  } catch (e) {
    console.error("Chyba při načítání aktivit:", e);
    activities = ["Běh", "Posilovna"];
  } finally {
    loadPlan();
  }
}

async function updateActivitiesInBin() {
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify(activities)
    });
    if (!res.ok) throw new Error("Network response was not ok");
  } catch (e) {
    console.error("Chyba při ukládání do JSONBin:", e);
  }
}

// ========== LOCAL STORAGE ==========
function loadPlan() {
  const saved = localStorage.getItem("plan");
  if (saved) plan = JSON.parse(saved);
  initPlanner();
}

function savePlan() {
  localStorage.setItem("plan", JSON.stringify(plan));
  document.getElementById("status").innerText = "Plán byl uložen ✅";
  setTimeout(() => document.getElementById("status").innerText = "", 2000);
}

// ========== UI ==========
function initPlanner() {
  const planner = document.getElementById("planner");
  planner.innerHTML = "";

  days.forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.innerHTML = `<h3>${day}</h3>`;

    const select = document.createElement("select");
    select.style.maxWidth = "200px";

    activities.forEach(act => {
      const opt = document.createElement("option");
      opt.value = act;
      opt.innerText = act;
      select.appendChild(opt);
    });

    const addBtn = document.createElement("button");
    addBtn.innerText = "Přidat";
    addBtn.onclick = () => {
      const val = select.value;
      if (!plan[day]) plan[day] = [];
      plan[day].push(val);
      renderPlan();
      savePlan();
    };

    const list = document.createElement("ul");
    list.className = "activity-list";
    list.id = "list-" + day;

    dayDiv.appendChild(select);
    dayDiv.appendChild(addBtn);
    dayDiv.appendChild(list);
    planner.appendChild(dayDiv);
  });

  renderPlan();
  renderActivityDeletionList();
}

function renderPlan() {
  days.forEach(day => {
    const list = document.getElementById("list-" + day);
    list.innerHTML = "";
    (plan[day] || []).forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `${item} <button onclick="removeActivity('${day}', ${index})">×</button>`;
      list.appendChild(li);
    });
  });
}

function removeActivity(day, index) {
  plan[day].splice(index, 1);
  renderPlan();
  savePlan();
}

function addCustomActivity() {
  const input = document.getElementById("customActivity");
  const value = input.value.trim();
  if (value && !activities.includes(value)) {
    activities.push(value);
    input.value = "";
    updateActivitiesInBin();
    initPlanner();
  }
}

function renderActivityDeletionList() {
  let container = document.getElementById("deleteActivityList");
  if (!container) {
    container = document.createElement("div");
    container.id = "deleteActivityList";
    document.querySelector(".custom").appendChild(container);
  }
  container.innerHTML = "<h4>Správa aktivit:</h4>";

  activities.forEach((act, i) => {
    const item = document.createElement("div");
    item.style.marginBottom = "8px";

    const span = document.createElement("span");
    span.innerText = act;
    span.style.marginRight = "12px";

    const editBtn = document.createElement("button");
    editBtn.innerText = "✏️ Upravit";
    editBtn.style.marginRight = "6px";
    editBtn.onclick = () => {
      const newName = prompt("Upravit aktivitu:", act);
      if (newName && newName.trim() !== "") {
        activities[i] = newName.trim();
        updateActivitiesInBin();
        initPlanner();
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "🗑 Smazat";
    deleteBtn.style.color = "red";
    deleteBtn.onclick = async () => {
      if (confirm(`Opravdu chceš smazat aktivitu "${act}"?`)) {
        activities.splice(i, 1);
        await updateActivitiesInBin();
        initPlanner();
      }
    };

    item.appendChild(span);
    item.appendChild(editBtn);
    item.appendChild(deleteBtn);

    container.appendChild(item);
  });
}

// Start
fetchActivities();
