// Replaces localStorage with Google Sheets read via doGet

const sheetReadUrl = "https://script.google.com/macros/s/AKfycbx3H3tAXcTjqbD__9H3Z5GmlI_9pz3kf17sDTtan9f3cEiwg8R0zV2Qh2Pl9oYfeiU/exec";

let logs = [];
const habitSet = new Set();
const viceSet = new Set();

function parseSheetRows(rows) {
  return rows.map(row => {
    const [date, sleep, mood, focus, energy, habitsStr, vicesStr, notes] = row;
    const habits = (habitsStr || '').split(',').map(s => s.trim()).filter(Boolean);
    const vices = (vicesStr || '').split(',').map(s => s.trim()).filter(Boolean);
    habits.forEach(h => habitSet.add(h));
    vices.forEach(v => viceSet.add(v));
    return {
      date,
      sleep: parseFloat(sleep) || 0,
      mood: parseFloat(mood) || 0,
      focus: parseFloat(focus) || 0,
      energy: parseFloat(energy) || 0,
      habits,
      vices,
      notes: notes || ''
    };
  });
}

function buildChart(data) {
  if (!data.length) return;
  const ctx = document.getElementById('trendChart').getContext('2d');
  const labels = data.map(d => d.date);
  const sleep = data.map(d => d.sleep);
  const mood = data.map(d => d.mood);
  const focus = data.map(d => d.focus);
  const energy = data.map(d => d.energy);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Sleep', data: sleep, backgroundColor: 'rgba(0,255,0,0.3)' },
        { label: 'Mood', data: mood, backgroundColor: 'rgba(255,255,0,0.3)' },
        { label: 'Focus', data: focus, backgroundColor: 'rgba(255,255,255,0.3)' },
        { label: 'Energy', data: energy, backgroundColor: 'rgba(255,0,0,0.3)' }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'white' } }
      },
      scales: {
        x: {
          ticks: {
            color: 'white',
            autoSkip: true,
            maxTicksLimit: Math.floor(labels.length / 14) || 7
          }
        },
        y: {
          ticks: { color: 'white' },
          beginAtZero: true,
          max: 12
        }
      }
    }
  });
}

function renderCheckboxes() {
  const habitCheckboxes = document.getElementById('habitCheckboxes');
  const viceCheckboxes = document.getElementById('viceCheckboxes');
  habitCheckboxes.innerHTML = '';
  viceCheckboxes.innerHTML = '';

  habitSet.forEach(habit => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" name="habit" value="${habit}"> ${habit}`;
    habitCheckboxes.appendChild(label);
  });

  viceSet.forEach(vice => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" name="vice" value="${vice}"> ${vice}`;
    viceCheckboxes.appendChild(label);
  });
}

// Fetch sheet data on load
fetch(sheetReadUrl)
  .then(res => res.json())
  .then(json => {
    logs = parseSheetRows(json);
    renderCheckboxes();
    buildChart(logs);
  })
  .catch(err => {
    console.error('Failed to fetch from Google Sheets:', err);
  });

// Submit handler for posting new entry
const form = document.getElementById('logForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const sleep = parseFloat(document.getElementById('sleep').value);
  const mood = parseFloat(document.getElementById('mood').value);
  const focus = parseFloat(document.getElementById('focus').value);
  const energy = parseFloat(document.getElementById('energy').value);
  const notes = document.getElementById('notes').value;

  const habits = [...document.querySelectorAll('input[name="habit"]:checked')].map(el => el.value);
  const vices = [...document.querySelectorAll('input[name="vice"]:checked')].map(el => el.value);

  const entry = {
    date: new Date().toLocaleDateString(),
    sleep, mood, focus, energy, habits, vices, notes
  };

  const sheetWebhookUrl = sheetReadUrl;

  fetch(sheetWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  })
    .then(res => res.text())
    .then(text => {
      console.log("✅ Google Sheet response:", text);
      alert("Entry saved and synced!");
      location.reload();
    })
    .catch(err => {
      console.error("❌ Google Sheet sync failed:", err);
      alert("Failed to sync with Google Sheets.");
    });
