// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCW7haDiGehyi-FWTynCi2aHSks0JEleYQ",
  authDomain: "now-mode-app.firebaseapp.com",
  projectId: "now-mode-app",
  storageBucket: "now-mode-app.appspot.com",
  messagingSenderId: "1052464330929",
  appId: "1:1052464330929:web:fa731c39d32ede1951ca90",
  measurementId: "G-J3D33XKS78"
};

// Firebase setup
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ctx = document.getElementById('trendChart').getContext('2d');
let trendChart;

const habits = ['Meditation', 'Exercise', 'Reading', 'Cold Shower'];
const vices = ['Alcohol', 'Junk Food', 'Procrastination', 'Social Media'];

function populateCheckboxes() {
  const habitContainer = document.getElementById('habitCheckboxes');
  const viceContainer = document.getElementById('viceCheckboxes');

  habits.forEach(habit => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = habit;
    checkbox.name = 'habits';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(habit));
    habitContainer.appendChild(label);
  });

  vices.forEach(vice => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = vice;
    checkbox.name = 'vices';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(vice));
    viceContainer.appendChild(label);
  });
}

function fetchDataAndRenderChart() {
  db.collection('entries').orderBy('timestamp', 'asc').get().then(snapshot => {
    const data = snapshot.docs.map(doc => doc.data());
    renderChart(data);
  });
}

function renderChart(data) {
  const labels = data.map(entry => {
    const date = new Date(entry.timestamp);
    return date.toLocaleDateString(undefined, { month: '2-digit', year: 'numeric' });
  });

  const mood = data.map(entry => entry.mood);
  const focus = data.map(entry => entry.focus);
  const energy = data.map(entry => entry.energy);

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Mood',
          data: mood,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Focus',
          data: focus,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Energy',
          data: energy,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          tension: 0.4,
          pointRadius: 0,
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: {
            color: '#aaa',
            autoSkip: true,
            maxTicksLimit: 12
          }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#aaa' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#eee' }
        }
      }
    }
  });
}

function saveEntry(e) {
  e.preventDefault();
  const sleep = parseFloat(document.getElementById('sleep').value);
  const mood = parseFloat(document.getElementById('mood').value);
  const focus = parseFloat(document.getElementById('focus').value);
  const energy = parseFloat(document.getElementById('energy').value);
  const notes = document.getElementById('notes').value;

  const selectedHabits = Array.from(document.querySelectorAll('input[name="habits"]:checked')).map(cb => cb.value);
  const selectedVices = Array.from(document.querySelectorAll('input[name="vices"]:checked')).map(cb => cb.value);

  const entry = {
    timestamp: new Date().toISOString(),
    sleep, mood, focus, energy,
    habits: selectedHabits,
    vices: selectedVices,
    notes
  };

  db.collection('entries').add(entry).then(() => {
    alert('Entry saved!');
    document.getElementById('logForm').reset();
    fetchDataAndRenderChart();
  });
}

populateCheckboxes();
fetchDataAndRenderChart();
document.getElementById('logForm').addEventListener('submit', saveEntry);
