// app.js (Now Mode with Firebase + Graph Filters and Fixes)
const firebaseConfig = {
  apiKey: "AIzaSyCW7haDiGehyi-FWTynCi2aHSks0JEleYQ",
  authDomain: "now-mode-app.firebaseapp.com",
  projectId: "now-mode-app",
  storageBucket: "now-mode-app.appspot.com",
  messagingSenderId: "1052464330929",
  appId: "1:1052464330929:web:fa731c39d32ede1951ca90",
  measurementId: "G-J3D33XKS78"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let logs = [], habitSet = new Set(), viceSet = new Set();

function normalizeDate(dateStr) {
  // Handles MM/DD/YYYY → YYYY-MM-DD
  if (dateStr.includes("/")) {
    const [month, day, year] = dateStr.split("/");
    return `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr; // already in correct format
}

function parseEntries(snapshot) {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    let h = data.habits || [];
    let v = data.vices || [];
    h.forEach(x => habitSet.add(x));
    v.forEach(x => viceSet.add(x));

    return {
      date: normalizeDate(data.date),
      sleep: +data.sleep,
      mood: +data.mood,
      focus: +data.focus,
      energy: +data.energy,
      habits: h,
      vices: v,
      notes: data.notes || ""
    };
  });
}


function render(filteredLogs = logs) {
  const habitContainer = document.getElementById("habitCheckboxes");
  const viceContainer = document.getElementById("viceCheckboxes");
  habitContainer.innerHTML = "";
  viceContainer.innerHTML = "";

  habitSet.forEach(h => {
    const id = `habit_${h}`.replace(/\s+/g, '_');
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerHTML = `<input type="checkbox" id="${id}" name="habit" value="${h}" checked> ${h}`;
    habitContainer.appendChild(label);
  });

  viceSet.forEach(v => {
    const id = `vice_${v}`.replace(/\s+/g, '_');
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerHTML = `<input type="checkbox" id="${id}" name="vice" value="${v}" checked> ${v}`;
    viceContainer.appendChild(label);
  });

  const ctx = document.getElementById("trendChart").getContext("2d");
  if (window.chartInstance) window.chartInstance.destroy();

  const labels = filteredLogs.map(x => x.date.toISOString().split("T")[0]);
  window.chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Focus",
          data: filteredLogs.map(x => x.focus),
          borderColor: "white",
          backgroundColor: "rgba(255,255,255,0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Energy",
          data: filteredLogs.map(x => x.energy),
          borderColor: "red",
          backgroundColor: "rgba(255,0,0,0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Mood",
          data: filteredLogs.map(x => x.mood),
          borderColor: "yellow",
          backgroundColor: "rgba(255,255,0,0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Sleep",
          data: filteredLogs.map(x => x.sleep),
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#eee" } } },
      scales: {
        x: {
          type: 'category',
          ticks: { color: "#eee" }
        },
        y: {
          beginAtZero: true,
          max: 12,
          ticks: { color: "#eee" }
        }
      }
    }
  });
}

function filterChart(range) {
  const now = new Date();
  let filtered = logs;

  if (range === 'ytd') {
    const start = new Date(now.getFullYear(), 0, 1);
    filtered = logs.filter(log => log.date >= start);
  } else if (range === 'year') {
    const lastYear = new Date(now);
    lastYear.setFullYear(now.getFullYear() - 1);
    filtered = logs.filter(log => log.date >= lastYear);
  } else if (range === 'month') {
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    filtered = logs.filter(log => log.date >= lastMonth);
  } else if (range === 'week') {
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    filtered = logs.filter(log => log.date >= lastWeek);
  }

  render(filtered);
}

async function fetchEntries() {
  const snapshot = await db.collection("entries").orderBy("date").get();
  logs = parseEntries(snapshot);
  render();
}

fetchEntries();

document.getElementById("logForm").addEventListener("submit", async e => {
  e.preventDefault();
  const entry = {
    date: new Date().toISOString().split("T")[0],
    sleep: +sleep.value || 0,
    mood: +mood.value || 0,
    focus: +focus.value || 0,
    energy: +energy.value || 0,
    habits: [...document.querySelectorAll('input[name="habit"]:checked')].map(x => x.value),
    vices: [...document.querySelectorAll('input[name="vice"]:checked')].map(x => x.value),
    notes: notes.value || ""
  };

  await db.collection("entries").add(entry);
  logs.push({ ...entry, date: new Date(entry.date) });
  render();
});

