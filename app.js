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

  if (typeof rawDate === "string") {
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [year, month, day] = rawDate.split("-").map(part => parseInt(part, 10));
      return new Date(year, month - 1, day);
    }

    // Handle Month Day format (e.g., "July 9")
    const monthDayMatch = rawDate.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})$/i);
    if (monthDayMatch) {
      const [_, monthName, dayStr] = monthDayMatch;
      const year = new Date().getFullYear();
      const dateStr = `${monthName} ${parseInt(dayStr)}, ${year}`;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  const parsed = new Date(rawDate);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function formatDateLabel(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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

function uncheckAllHabitBoxes() {
  setTimeout(() => {
    document.querySelectorAll('input[name="habit"], input[name="vice"]').forEach(cb => cb.checked = false);
  }, 100); // slight delay allows DOM to populate checkboxes
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
    label.innerHTML = `<input type="checkbox" id="${id}" name="habit" value="${h}"> ${h}`;
    habitContainer.appendChild(label);
  });

  viceSet.forEach(v => {
    const id = `vice_${v}`.replace(/\s+/g, '_');
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerHTML = `<input type="checkbox" id="${id}" name="vice" value="${v}"> ${v}`;
    viceContainer.appendChild(label);
  });
}

function renderChart() {
  const ctx = document.getElementById("trendChart").getContext("2d");
  if (window.chartInstance) window.chartInstance.destroy();

  const habitBar = (label, color) => ({
    type: 'bar',
    label,
    data: filteredLogs.map(x => ({
      x: new Date(x.date),
      y: x.habits.includes(label) ? 1.25 : 0
    })),
    backgroundColor: color,
    stack: 'habitStack',
    yAxisID: 'yBars',
    order: 0,
    barThickness: 2,
    categoryPercentage: 1.0
  });

  const viceBar = (label, color) => ({
    type: 'bar',
    label,
    data: filteredLogs.map(x => ({
      x: new Date(x.date),
      y: x.vices.includes(label) ? -1.25 : 0
    })),
    backgroundColor: color,
    stack: 'viceStack',
    yAxisID: 'yBars',
    order: 0,
    barThickness: 2,
    categoryPercentage: 1.0
  });

  const focusData = filteredLogs.map(x => ({ x: new Date(x.date), y: x.focus }));
  const moodData = filteredLogs.map(x => ({ x: new Date(x.date), y: x.mood }));
  const energyData = filteredLogs.map(x => ({ x: new Date(x.date), y: x.energy }));
  const sleepData = filteredLogs.map(x => ({ x: new Date(x.date), y: x.sleep }));

  const activeLineData = [focusData, moodData, energyData, sleepData].filter(dataset => dataset.some(d => d.y > 0));
  const maxLineY = activeLineData.flat().reduce((max, point) => Math.max(max, point.y), 0);
  const totalHabitHeight = 5;
  const totalViceHeight = -5;
  const yMax = Math.max(maxLineY, 12);
  const yMin = totalViceHeight - 1;

  window.chartInstance = new Chart(ctx, {
    // type is now defined per dataset, so remove this line or replace with neutral base
    data: {
      datasets: [
        // Stacked Habit Bars
        habitBar("Meditation", "rgba(0,150,255,0.5)"),
        habitBar("Movement", "rgba(255,0,0,0.5)"),
        habitBar("Reflection", "rgba(255,255,0,0.5)"),
        habitBar("Learning", "rgba(0,255,0,0.5)"),

        // Stacked Vice Bars
        viceBar("Nic", "rgba(200,200,200,0.5)"),
        viceBar("Alcohol", "rgba(0,200,200,0.5)"),
        viceBar("Weed", "rgba(0,255,100,0.5)"),
        viceBar("Wank", "rgba(255,100,100,0.5)"),

        // Line datasets (not stacked)
        {
          type: 'line',
          label: "Focus",
          data: focusData,
          borderColor: "white",
          backgroundColor: "rgba(255,255,255,0.2)",
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
          order: 4
        },
        {
          type: 'line',
          label: "Mood",
          data: moodData,
          borderColor: "yellow",
          backgroundColor: "rgba(255,255,0,0.2)",
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
          order: 3
        },
        {
          type: 'line',
          label: "Energy",
          data: energyData,
          borderColor: "red",
          backgroundColor: "rgba(255,0,0,0.2)",
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
          order: 2
        },
        {
          type: 'line',
          label: "Sleep",
          data: sleepData,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.2)",
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#eee" } },
        annotation: {
          annotations: {
            divider: {
              type: 'line',
              yMin: 0,
              yMax: 0,
              borderColor: 'white',
              borderWidth: 1,
              borderDash: [5, 5],
              label: { display: false }
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: { day: 'yyyy-MM-dd' }
          },
          ticks: {
            color: "#eee",
            callback: function(value) {
              const date = new Date(value);
              const day = date.getDate();
              if (day === 1 || day === 15) {
                return date.toISOString().split("T")[0];
              }
              return '';
            }
          },
          stacked: false
        },
        y: {
          position: 'left',
          stacked: false,
          min: yMin,
          max: yMax,
          ticks: {
            color: "#eee",
            display: false
          }
        },
        yBars: {
          position: 'left',
          stacked: true,
          min: yMin,
          max: yMax,
          display: false,
          grid: { drawOnChartArea: false }
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

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  const entry = {
    date: formattedDate,
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
  uncheckAllHabitBoxes();
  renderChart();
});
window.addEventListener("load", () => {
  uncheckAllHabitBoxes();
});
