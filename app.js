let rawData = [];
let chart;

// OPTION MAP
const optionMap = {
  "Yes": "i","No": "ii","Little bit": "iii",
  "Sometimes": "iii","Maybe": "iii",
  "Strongly Agree": "i","Agree": "ii",
  "Neutral": "iii","Disagree": "iv",
  "Strongly disagree": "v"
};

// LOAD DATA
async function loadData() {
  const res = await fetch("data.json");
  rawData = await res.json();
  setup();
}

// SETUP
function setup() {
  const keys = Object.keys(rawData[0]).filter(k => k !== "University");

  document.getElementById("totalQ").innerText = keys.length;
  document.getElementById("totalR").innerText = rawData.length;

  const select = document.getElementById("questionSelect");

  // Overall
  let overall = document.createElement("option");
  overall.value = "overall";
  overall.textContent = "Overall Summary";
  select.appendChild(overall);

  // Questions
  keys.forEach((q, i) => {
    let op = document.createElement("option");
    op.value = q;
    op.textContent = "Q" + (i+1);
    select.appendChild(op);
  });

  // EVENTS
  document.getElementById("questionSelect").addEventListener("change", updateUI);
  document.getElementById("chartType").addEventListener("change", updateUI);
  document.getElementById("collegeFilter").addEventListener("change", updateUI);
  document.getElementById("ageFilter").addEventListener("change", updateUI);

  updateUI();
}

// FILTER DATA
function getFilteredData() {
  const college = document.getElementById("collegeFilter").value;
  const age = document.getElementById("ageFilter").value;

  let filtered = rawData;

  const sample = rawData[0];

  const ageKey = Object.keys(sample).find(k =>
    k.toLowerCase().includes("age")
  );

  const collegeKey = Object.keys(sample).find(k =>
    k.toLowerCase().includes("university")
  );

  // 🔥 normalize ANY format into clean format
  const normalize = (val) => {
    if (!val) return "";

    return val
      .toString()
      .replace(/–/g, "-")     // fix dash
      .replace(/to/g, "-")    // "18 to 23"
      .replace(/\s+/g, "")    // remove spaces
      .trim();
  };

  // COLLEGE FILTER
  if (college !== "All") {
    filtered = filtered.filter(d =>
      normalize(d[collegeKey]) === normalize(college)
    );
  }

  // 🔥 AGE FILTER (FIXED PROPERLY)
  if (age !== "All") {
    filtered = filtered.filter(d => {
      const val = normalize(d[ageKey]);
      return val === normalize(age);
    });
  }

  return filtered;
}

// COUNTS
function getCounts(question) {
  const data = getFilteredData();
  const counts = {};

  data.forEach(d => {
    const val = d[question];
    if (!val) return;
    counts[val] = (counts[val] || 0) + 1;
  });

  return counts;
}

// OVERALL (FIXED)
function getOverallCounts() {
  const data = getFilteredData();
  const counts = {};
  const keys = Object.keys(data[0]).filter(k => k !== "University");

  keys.forEach(q => {
    data.forEach(d => {
      const val = d[q];
      if (!val) return;

      const mapped = optionMap[val] || val;
      counts[mapped] = (counts[mapped] || 0) + 1;
    });
  });

  Object.keys(counts).forEach(k => {
    counts[k] = Math.round(counts[k] / keys.length);
  });

  return counts;
}

// COLORS
function getColors(n) {
  return Array.from({length: n}, (_, i) => `hsl(${i*60},70%,60%)`);
}

// UPDATE UI
function updateUI() {
  const selected = document.getElementById("questionSelect").value;
  const chartType = document.getElementById("chartType").value;

  let labels, values;

  if (selected === "overall") {
    const data = getOverallCounts();
    labels = Object.keys(data);
    values = Object.values(data);

    document.getElementById("questionText").innerText =
      "Overall Summary (Average across all questions)";
    document.getElementById("optionsBox").innerHTML = "";
  } else {
    const data = getCounts(selected);
    labels = Object.keys(data);
    values = Object.values(data);

    document.getElementById("questionText").innerText = selected;

    let html = "<b>Options:</b><br>";
    labels.forEach((l,i)=>{
      html += `${optionMap[l]||"-"} : ${l} (${values[i]})<br>`;
    });
    document.getElementById("optionsBox").innerHTML = html;
  }

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: chartType,
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: getColors(labels.length),
        barThickness: 20,
        borderRadius: 6
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top'
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// DOWNLOAD
function downloadImage() {
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = document.getElementById("chart").toDataURL();
  link.click();
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.addImage(document.getElementById("chart").toDataURL(), "PNG", 10, 20, 180, 100);
  pdf.save("report.pdf");
}

loadData();
