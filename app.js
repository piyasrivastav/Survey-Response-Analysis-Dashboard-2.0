let rawData = [];
let chart;

// OPTION MAP
const optionMap = {
  "Yes": "i","No": "ii","Little bit": "iii",
  "Sometimes": "iii","Maybe": "iii",
  "Strongly Agree": "i","Agree": "ii",
  "Neutral": "iii","Disagree": "iv",
  "Strongly disagree": "v",
  "Daily": "i","Weekly": "ii",
  "Occasionally": "iii","Rarely": "iv"
};

// LOAD DATA
async function loadData() {
  const res = await fetch("data.json");
  rawData = await res.json();
  setup();
  document.getElementById("totalQ").innerText = Object.keys(rawData[0]).length - 1;
document.getElementById("totalR").innerText = rawData.length;
const ageSet = new Set(rawData.map(d => d["Age"]).filter(a => a));
document.getElementById("ageGroups").innerText = ageSet.size;
}

// SETUP
function setup() {
  const keys = Object.keys(rawData[0]).filter(k => k !== "University");

  const select = document.getElementById("questionSelect");

  // Overall option
  let op = document.createElement("option");
  op.value = "overall";
  op.textContent = "Overall Summary";
  select.appendChild(op);

  // Questions
  keys.forEach((q, i) => {
    let option = document.createElement("option");
    option.value = q;
    option.textContent = `Q${i+1}`;
    select.appendChild(option);
  });

  document.getElementById("questionSelect").addEventListener("change", updateUI);
  document.getElementById("chartType").addEventListener("change", updateUI);
  document.getElementById("collegeFilter").addEventListener("change", updateUI);

  updateUI();
}

// FILTER DATA
function getFilteredData() {
  const college = document.getElementById("collegeFilter").value;

  if (college === "All") return rawData;

  return rawData.filter(d => d["University"] === college);
}

// SINGLE QUESTION COUNTS
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

// 🔥 CORRECT OVERALL (AVERAGE PER QUESTION)
function getOverallCounts() {
  const data = getFilteredData();
  const counts = {};

  const keys = Object.keys(data[0]).filter(k => k !== "University");

  const totalQuestions = keys.length;

  keys.forEach(q => {
    data.forEach(d => {
      const val = d[q];
      if (!val) return;

      const mapped = optionMap[val] || val;
      counts[mapped] = (counts[mapped] || 0) + 1;
    });
  });

  // 🔥 NORMALIZATION (CRITICAL FIX)
  Object.keys(counts).forEach(k => {
    counts[k] = Math.round(counts[k] / totalQuestions);
  });

  return counts;
}

// COLORS
function getColors(n) {
  return Array.from({length: n}, (_, i) =>
    `hsl(${i * 60}, 70%, 60%)`
  );
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
    labels.forEach((l, i) => {
      html += `${optionMap[l] || "-"} : ${l} (${values[i]})<br>`;
    });

    document.getElementById("optionsBox").innerHTML = html;
  }

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: "Responses",
        data: values,
        backgroundColor: getColors(labels.length),
        barThickness: 20,
        maxBarThickness: 25,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1000
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top'
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Responses" }
        },
        x: {
          title: { display: true, text: "Options" }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// DOWNLOAD IMAGE
function downloadImage() {
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = document.getElementById("chart").toDataURL();
  link.click();
}

// DOWNLOAD PDF
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.addImage(document.getElementById("chart").toDataURL(), "PNG", 10, 20, 180, 100);
  pdf.save("report.pdf");
}

loadData();