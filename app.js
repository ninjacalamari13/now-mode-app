// app.js
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

let logs = [], filteredLogs = [], habitSet = new Set(), viceSet = new Set();

function parseDate(rawDate) {
  if (rawDate instanceof firebase.firestore.Timestamp) {
    return rawDate.toDate();
  }

  if (typeof rawDate === "string" && rawDate.includes("/")) {
    const [month, day, year] = rawDate.split("/").map(part => parseInt(part, 10));
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(rawDate);
  return isNaN(parsed) ? new Date() : parsed;
}


function parseEntries(snapshot) {
  return snapshot.docs.map(doc => {
    const data = doc.data();
let h = Array.isArray(data.habits)
  ? data.habits
  : (typeof data.habits === "string" ? data.habits.split(",").map(x => x.trim()) : []);

let v = Array.isArray(data.vices)
  ? data.vices
  : (typeof data.vices === "string" ? data.vices.split(",").map(x => x.trim()) : []);

    h.forEach(x => habitSet.add(x));
    v.forEach(x => viceSet.add(x));
    return {
      date: parseDate(data.date),
      sleep: +data.sleep || 0,
      mood: +data.mood || 0,
      focus: +data.focus || 0,
      energy: +data.energy || 0,
      habits: h,
      vices: v,
      notes: data.notes || ""
    };
  });
}

function renderCheckboxes() {
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
}

function renderChart() {
  filteredLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
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
          ticks: { color: "#eee" },
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
  filteredLogs = logs.filter(entry => {
    const daysDiff = (now - entry.date) / (1000 * 60 * 60 * 24);
    switch (range) {
      case 'week': return daysDiff <= 7;
      case 'month': return daysDiff <= 30;
      case 'year': return daysDiff <= 365;
      case 'ytd': return entry.date.getFullYear() === now.getFullYear();
      default: return true;
    }
  });
  renderChart();
}

async function fetchEntries() {
  const snapshot = await db.collection("entries").orderBy("date").get();
  logs = parseEntries(snapshot);
  filteredLogs = logs;
  renderCheckboxes();
  renderChart();
}

fetchEntries();

document.getElementById("logForm").addEventListener("submit", async e => {
  e.preventDefault();

  const entry = {
    date: new Date(),
    sleep: +document.getElementById("sleep").value,
    mood: +document.getElementById("mood").value,
    focus: +document.getElementById("focus").value,
    energy: +document.getElementById("energy").value,
    habits: [...document.querySelectorAll('input[name="habit"]:checked')].map(x => x.value),
    vices: [...document.querySelectorAll('input[name="vice"]:checked')].map(x => x.value),
    notes: document.getElementById("notes").value
  };

  await db.collection("entries").add(entry);
  logs.push(entry);
  filteredLogs = logs;
  renderChart();
});

