let chartInstance = null;

const mealLabels = {
  before_meal: "飯前",
  after_meal: "飯後",
  unknown: "不確定"
};

export function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export function renderLatestRecord(container, record) {
  if (!record) {
    container.innerHTML = `
      <div class="latest-preview-empty">
        目前還沒有紀錄，新增第一筆量測資料後即可開始追蹤。
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
          <span>收縮壓</span>
          <strong>${record.systolic}</strong>
        </div>
        <div class="reading-pill">
          <span>舒張壓</span>
          <strong>${record.diastolic}</strong>
        </div>
        <div class="reading-pill">
          <span>脈搏</span>
          <strong>${record.pulse}</strong>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <span>是否服藥</span>
          <strong>${record.medicationTaken ? "是" : "否"}</strong>
        </div>
        <div class="detail-item">
          <span>藥量 / 用藥備註</span>
          <strong>${escapeHtml(record.medicationDose || "—")}</strong>
        </div>
        <div class="detail-item">
          <span>其他備註</span>
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
          <div class="table-empty">目前尚未儲存任何紀錄。</div>
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
          <td>${record.medicationTaken ? "是" : "否"}${record.medicationDose ? `<br>${escapeHtml(record.medicationDose)}` : ""}</td>
          <td>${escapeHtml(record.note || "—")}</td>
          <td><button type="button" class="delete-button" data-record-id="${record.id}">刪除</button></td>
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
        labels: ["尚無資料"],
        datasets: []
      },
      options: baseChartOptions()
    });
    return;
  }

  chartInstance = new Chart(context, {
    type: "line",
    data: {
      labels: records.map((record) => formatTimestamp(record.timestamp)),
      datasets: [
        {
          label: "收縮壓",
          data: records.map((record) => record.systolic),
          borderColor: "#2f6f91",
          backgroundColor: "rgba(47, 111, 145, 0.15)",
          tension: 0.25,
          fill: false
        },
        {
          label: "舒張壓",
          data: records.map((record) => record.diastolic),
          borderColor: "#5ca08e",
          backgroundColor: "rgba(92, 160, 142, 0.15)",
          tension: 0.25,
          fill: false
        },
        {
          label: "脈搏",
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

function baseChartOptions() {
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
