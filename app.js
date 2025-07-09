// Assuming the original app.js fetches and renders data using Chart.js and Firebase
// Let's confirm and enhance it based on the updated visual requirements

// Firebase setup

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
            callback: function(value, index, ticks) {
              const shown = new Set();
              const label = this.getLabelForValue(value);
              if (!shown.has(label)) {
                shown.add(label);
                return label;
              }
              return '';
            },
            color: '#aaa'
          }
        },
        y: {
          beginAtZero: true,
          color: '#aaa'
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#eee'
          }
        }
      }
    }
  });
}

fetchDataAndRenderChart();

// Your log form handling and Firebase submission code goes below here...
// Already present in the original file (assumed). Let me know if you want that upgraded or themed too.
