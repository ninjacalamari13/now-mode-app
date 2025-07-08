const sheetURL = "https://script.google.com/macros/s/AKfycbx3H3tAXcTjqbD__9H3Z5GmlI_9pz3kf17sDTtan9f3cEiwg8R0zV2Qh2Pl9oYfeiU/exec";
let logs = [], habitSet = new Set(), viceSet = new Set();

// Process sheet rows
function parseSheet(rows) {
  return rows.map(r => {
    let [date, sleep, mood, focus, energy, habits, vices, notes] = r;
    let h = (habits || "").split(",").map(s=>s.trim()).filter(Boolean);
    let v = (vices || "").split(",").map(s=>s.trim()).filter(Boolean);
    h.forEach(x=>habitSet.add(x));
    v.forEach(x=>viceSet.add(x));
    return { date, sleep:+sleep, mood:+mood, focus:+focus, energy:+energy, habits:h, vices:v, notes:notes||"" };
  });
}

// Render
function render() {
  document.getElementById("habitCheckboxes").innerHTML = "";
  document.getElementById("viceCheckboxes").innerHTML = "";
  habitSet.forEach(h => {
    let l = document.createElement("label");
    l.innerHTML = `<input type="checkbox" name="habit" value="${h}">${h}`;
    document.getElementById("habitCheckboxes").appendChild(l);
  });
  viceSet.forEach(v => {
    let l = document.createElement("label");
    l.innerHTML = `<input type="checkbox" name="vice" value="${v}">${v}`;
    document.getElementById("viceCheckboxes").appendChild(l);
  });

  const ctx = document.getElementById("trendChart").getContext("2d");
  const labels = logs.map(x=>x.date);
  ["sleep","mood","focus","energy"].forEach((key,i) => {
    if (window.chartInstance) window.chartInstance.destroy();
    window.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{
        label: key.charAt(0).toUpperCase()+key.slice(1),
        data: logs.map(x=>x[key]),
        backgroundColor: ["rgba(0,255,0,0.4)", "rgba(255,255,0,0.4)", "rgba(255,0,255,0.4)", "rgba(255,0,0,0.4)"][i]
      }]},
      options: { scales:{ x:{ ticks:{ color:"#eee" } }, y:{ beginAtZero:true, max:12, ticks:{color:"#eee"} } }, plugins:{legend:{labels:{color:"#eee"}} } }
    });
  });
}

// Fetch initial data
fetch(sheetURL)
  .then(r=>r.json())
  .then(data => { logs = parseSheet(data); render(); })
  .catch(e=>console.error("Fetch failed:", e));

// Form submit sends POST
document.getElementById("logForm").addEventListener("submit", e => {
  e.preventDefault();
  let entry = {
    date: new Date().toLocaleDateString(),
    sleep:+sleep.value, mood:+mood.value, focus:+focus.value, energy:+energy.value,
    habits:[...document.querySelectorAll('input[name="habit"]:checked')].map(x=>x.value),
    vices:[...document.querySelectorAll('input[name="vice"]:checked')].map(x=>x.value),
    notes: notes.value
  };
  fetch(sheetURL, {
    method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(entry)
  })
  .then(r=>r.text())
  .then(txt => {
    console.log("sync:", txt);
    logs.push(entry);
    render();
  })
  .catch(err => console.error("POST failed:", err));
});
