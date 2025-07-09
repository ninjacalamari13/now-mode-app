// app.js (Firebase-integrated version with relaxed validation)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCW7haDiGehyi-FWTynCi2aHSks0JEleYQ",
  authDomain: "now-mode-app.firebaseapp.com",
  projectId: "now-mode-app",
  storageBucket: "now-mode-app.appspot.com",
  messagingSenderId: "1052464330929",
  appId: "1:1052464330929:web:fa731c39d32ede1951ca90",
  measurementId: "G-J3D33XKS78"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let logs = [], habitSet = new Set(), viceSet = new Set();

function parseEntries(snapshot) {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    let h = (data.habits || []);
    let v = (data.vices || []);
    h.forEach(x => habitSet.add(x));
    v.forEach(x => viceSet.add(x));
    return {
      date: data.date,
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

function render() {
  if (!logs.length) return;

  const habitContainer = document.getElementById("habitCheckboxes");
  const viceContainer = document.getElementById("viceCheckboxes");
  habitContainer.innerHTML = "";
  viceContainer.innerHTML = "";

  habitSet.forEach(h => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="habit" value="${h}"> ${h}`;
    habitContainer.appendChild(label);
  });

  viceSet.forEach(v => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="vice" value="${v}"> ${v}`;
    viceContainer.appendChild(label);
  });

  const ctx = document.getElementById("trendChart").getContext("2d");
  if (window.chartInstance) window.chartInstance.destroy();

  const labels = logs.map(x => {
    const d = new Date(x.date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  window.chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Focus",
          data: logs.map(x => x.focus),
          borderColor: "white",
          backgroundColor: "rgba(255,255,255,0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Energy",
          data: logs.map(x => x.energy),
          borderColor: "red",
          backgroundColor: "rgba(255,0,0,0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Mood",
          data: logs.map(x => x.mood),
          borderColor: "yellow",
          backgroundColor: "rgba(255,255,0,0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Sleep",
          data: logs.map(x => x.sleep),
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
          ticks: {
            color: "#eee",
            maxTicksLimit: 12,
            callback: function(val, i, ticks) {
              return i === 0 || val.endsWith("-01");
            }
          }
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

async function fetchEntries() {
  const q = query(collection(db, "entries"), orderBy("date"));
  const snapshot = await getDocs(q);
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

  await addDoc(collection(db, "entries"), entry);
  logs.push(entry);
  render();
});

