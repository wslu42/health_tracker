let chartInstance = null;

const mealLabels = {
  before_meal: "Before meal",
  after_meal: "After meal",
  unknown: "Unknown"
};

export function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export function renderLatestRecord(container, record) {
  if (!record) {
    container.innerHTML = `
      <div class="latest-preview-empty">
        No records yet. Add the first reading to start tracking.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <article class="latest-preview">
      <div class="latest-meta">
        <strong>${formatTimestamp(record.timestamp)}</strong>
        <span>${mealLabels[record.mealStatus]}</span>
      </div>
      <div class="reading-row">
        <div class="reading-pill">
          <span>Systolic</span>
          <strong>${record.systolic}</strong>
        </div>
        <div class="reading-pill">
          <span>Diastolic</span>
          <strong>${record.diastolic}</strong>
        </div>
        <div class="reading-pill">
          <span>Pulse</span>
          <strong>${record.pulse}</strong>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <span>Medication Taken</span>
          <strong>${record.medicationTaken ? "Yes" : "No"}</strong>
        </div>
        <div class="detail-item">
          <span>Medication Dose / Note</span>
          <strong>${escapeHtml(record.medicationDose || "—")}</strong>
        </div>
        <div class="detail-item">
          <span>Additional Note</span>
          <strong>${escapeHtml(record.note || "—")}</strong>
        </div>
      </div>
    </article>
  `;
}

export function renderRecordsTable(container, records) {
  if (!records.length) {
    container.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="table-empty">No saved records yet.</div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>${formatTimestamp(record.timestamp)}</td>
          <td>${record.systolic}/${record.diastolic}</td>
          <td>${record.pulse}</td>
          <td>${mealLabels[record.mealStatus]}</td>
          <td>${record.medicationTaken ? "Yes" : "No"}${record.medicationDose ? `<br>${escapeHtml(record.medicationDose)}` : ""}</td>
          <td>${escapeHtml(record.note || "—")}</td>
          <td><button type="button" class="delete-button" data-record-id="${record.id}">Delete</button></td>
        </tr>
      `
    )
    .join("");
}

export function renderChart(canvas, records) {
  const context = canvas.getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!records.length) {
    chartInstance = new Chart(context, {
      type: "line",
      data: {
        labels: ["No records"],
        datasets: []
      },
      options: baseChartOptions("Add records to see chart trends.")
    });
    return;
  }

  chartInstance = new Chart(context, {
    type: "line",
    data: {
      labels: records.map((record) => formatTimestamp(record.timestamp)),
      datasets: [
        {
          label: "Systolic",
          data: records.map((record) => record.systolic),
          borderColor: "#2f6f91",
          backgroundColor: "rgba(47, 111, 145, 0.15)",
          tension: 0.25,
          fill: false
        },
        {
          label: "Diastolic",
          data: records.map((record) => record.diastolic),
          borderColor: "#5ca08e",
          backgroundColor: "rgba(92, 160, 142, 0.15)",
          tension: 0.25,
          fill: false
        },
        {
          label: "Pulse",
          data: records.map((record) => record.pulse),
          borderColor: "#b87545",
          backgroundColor: "rgba(184, 117, 69, 0.15)",
          tension: 0.25,
          fill: false
        }
      ]
    },
    options: {
      ...baseChartOptions(),
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "bottom"
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            color: "#4e6573"
          },
          grid: {
            color: "rgba(32, 49, 61, 0.08)"
          }
        },
        x: {
          ticks: {
            color: "#4e6573",
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

export function renderWarning(element, message) {
  if (!message) {
    element.textContent = "";
    element.classList.add("hidden");
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");
}

function baseChartOptions(emptyText) {
  return {
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      duration: 250
    },
    plugins: {
      legend: {
        position: "bottom"
      },
      tooltip: {
        backgroundColor: "#20313d"
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
