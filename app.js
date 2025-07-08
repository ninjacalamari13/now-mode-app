const sheetURL = "https://script.google.com/macros/s/AKfycbyrXlbeWtMDNIgbw3JbiTp07VkZ7jIqsey-WNTGgRwRvHIGsE8i4lQ2oyJR5SoyLsk/exec";
let logs = [], habitSet = new Set(), viceSet = new Set();

function parseSheet(rows) {
  return rows.map(r => {
    let [date, sleep, mood, focus, energy, habits, vices, notes] = r;
    let d = new Date(date);
    let h = (habits || "").split(",").map(s => s.trim()).filter(Boolean);
    let v = (vices || "").split(",").map(s => s.trim()).filter(Boolean);
    h.forEach(x => habitSet.add(x));
    v.forEach(x => viceSet.add(x));
    return {
      date: d,
      dateLabel: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      sleep: +sleep,
      mood: +mood,
      focus: +focus,
      energy: +energy,
      habits: h,
      vices: v,
      notes: notes || ""
    };
  }).sort((a, b) => a.date - b.date);
}

function render() {
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

  const labels = [...new Set(logs.map(x => x.dateLabel))]; // One per month
  const groupByMonth = key =>
    labels.map(label => {
      const filtered = logs.filter(l => l.dateLabel === label);
      return filtered.length
        ? filtered.reduce((a, b) => a + b[key], 0) / filtered.length
        : null;
    });

  window.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Focus',
          data: groupByMonth("focus"),
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: 'white',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Energy',
          data: groupByMonth("energy"),
          backgroundColor: 'rgba(255,0,0,0.1)',
          borderColor: 'red',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Mood',
          data: groupByMonth("mood"),
          backgroundColor: 'rgba(255,255,0,0.1)',
          borderColor: 'yellow',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Sleep',
          data: groupByMonth("sleep"),
          backgroundColor: 'rgba(0,0,255,0.1)',
          borderColor: 'blue',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#eee" } }
      },
      scales: {
        x: {
          ticks: {
            color: "#eee",
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 10,
          ticks: { color: "#eee" }
        }
      }
    }
  });
}

// Fetch data
fetch(sheetURL)
  .then(r => r.json())
  .then(data => {
    logs = parseSheet(data);
    render();
  })
  .catch(e => console.error("Fetch failed:", e));

// Submit form
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

  logs.push({ ...entry, date: new Date(), dateLabel: new Date().toISOString().slice(0, 7), habits: entry.habits, vices: entry.vices });
  render();
});