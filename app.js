const sheetURL = "https://script.google.com/macros/s/AKfycbyrXlbeWtMDNIgbw3JbiTp07VkZ7jIqsey-WNTGgRwRvHIGsE8i4lQ2oyJR5SoyLsk/exec";
let logs = [], habitSet = new Set(), viceSet = new Set();

// Process sheet rows
function parseSheet(rows) {
  return rows.map(r => {
    let [date, sleep, mood, focus, energy, habits, vices, notes] = r;
    let h = (habits || "").split(",").map(s => s.trim()).filter(Boolean);
    let v = (vices || "").split(",").map(s => s.trim()).filter(Boolean);
    h.forEach(x => habitSet.add(x));
    v.forEach(x => viceSet.add(x));
    return { date, sleep: +sleep, mood: +mood, focus: +focus, energy: +energy, habits: h, vices: v, notes: notes || "" };
  });
}

// Render chart and checkboxes
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

  const labels = logs.map(x => x.date);
  window.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Sleep', data: logs.map(x => x.sleep), backgroundColor: 'rgba(0,255,0,0.4)' },
        { label: 'Mood', data: logs.map(x => x.mood), backgroundColor: 'rgba(255,255,0,0.4)' },
        { label: 'Focus', data: logs.map(x => x.focus), backgroundColor: 'rgba(255,0,255,0.4)' },
        { label: 'Energy', data: logs.map(x => x.energy), backgroundColor: 'rgba(255,0,0,0.4)' }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#eee" } }
      },
      scales: {
        x: { ticks: { color: "#eee" } },
        y: { beginAtZero: true, max: 12, ticks: { color: "#eee" } }
      }
    }
  });
}

// Fetch initial data
fetch(sheetURL)
  .then(r => r.json())
  .then(data => {
    logs = parseSheet(data);
    render();
  })
  .catch(e => console.error("Fetch failed:", e));

// Form submission
document.getElementById("logForm").addEventListener("submit", e => {
  e.preventDefault();

  const entry = {
    date: new Date().toLocaleDateString(),
    sleep: +sleep.value,
    mood: +mood.value,
    focus: +focus.value,
    energy: +energy.value,
    habits: [...document.querySelectorAll('input[name="habit"]:checked')].map(x => x.value),
    vices: [...document.querySelectorAll('input[name="vice"]:checked')].map(x => x.value),
    notes: notes.value
  };

  if (isNaN(entry.sleep) || isNaN(entry.mood) || isNaN(entry.focus) || isNaN(entry.energy)) {
    alert("Please fill out all sliders before submitting.");
    return;
  }

  fetch(sheetURL, {
  method: "POST",
  mode: "no-cors",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(entry)
});

    
    .then(r => r.text())
    .then(txt => {
      console.log("✅ Synced:", txt);
      logs.push(entry);
      render();
    })
    .catch(err => {
      console.error("❌ POST failed:", err);
      alert("Failed to sync with Google Sheets.");
    });
});
