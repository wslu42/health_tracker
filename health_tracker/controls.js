import {
  addRecord,
  deleteRecord,
  exportRecordsAsCSV,
  exportRecordsAsJSON,
  filterRecordsByDays,
  getLatestRecord,
  getRecords,
  importRecordsFromJSON,
  validateMeasurementValues
} from "./state.js";
import {
  renderChart,
  renderLatestRecord,
  renderRecordsTable,
  renderWarning
} from "./render.js";

export function bindControls(elements) {
  const refreshUi = () => {
    const records = getRecords();
    renderLatestRecord(elements.latestRecord, getLatestRecord());
    renderRecordsTable(elements.tableBody, records);
    renderChart(elements.chartCanvas, filterRecordsByDays(elements.chartRange.value));
  };

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(elements.form);
    const recordInput = {
      systolic: Number(formData.get("systolic")),
      diastolic: Number(formData.get("diastolic")),
      pulse: Number(formData.get("pulse")),
      mealStatus: String(formData.get("mealStatus")),
      medicationTaken: formData.get("medicationTaken") === "true",
      medicationDose: String(formData.get("medicationDose") || "").trim(),
      hadDizziness: formData.get("hadDizziness") === "on",
      hadBreathlessness: formData.get("hadBreathlessness") === "on",
      hadChestTightness: formData.get("hadChestTightness") === "on",
      hadVisionChange: formData.get("hadVisionChange") === "on",
      energyChange: String(formData.get("energyChange") || "unchanged"),
      measurementContext: String(formData.get("measurementContext") || "unknown"),
      note: String(formData.get("note") || "").trim()
    };

    const validation = validateMeasurementValues(recordInput);

    if (!validation.valid) {
      renderWarning(elements.formWarning, validation.message);
      return;
    }

    renderWarning(elements.formWarning, "");
    addRecord(recordInput);
    elements.form.reset();
    resetDefaults(elements);
    refreshUi();
  });

  elements.form.addEventListener("reset", () => {
    window.setTimeout(() => {
      renderWarning(elements.formWarning, "");
      resetDefaults(elements);
    }, 0);
  });

  elements.tableBody.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-record-id]");

    if (!deleteButton) {
      return;
    }

    deleteRecord(deleteButton.dataset.recordId);
    refreshUi();
  });

  elements.exportJsonButton.addEventListener("click", () => {
    downloadFile("health-tracker-records.json", exportRecordsAsJSON(), "application/json");
  });

  elements.exportCsvButton.addEventListener("click", () => {
    downloadFile("health-tracker-records.csv", exportRecordsAsCSV(), "text/csv;charset=utf-8");
  });

  elements.importJsonInput.addEventListener("change", async (event) => {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      importRecordsFromJSON(text);
      renderWarning(elements.formWarning, "");
      refreshUi();
    } catch (error) {
      renderWarning(
        elements.formWarning,
        error instanceof Error ? error.message : "匯入失敗，請確認所選檔案是正確的 JSON 匯出檔。"
      );
    } finally {
      elements.importJsonInput.value = "";
    }
  });

  elements.chartRange.addEventListener("change", () => {
    renderChart(elements.chartCanvas, filterRecordsByDays(elements.chartRange.value));
  });

  refreshUi();
}

function resetDefaults(elements) {
  elements.mealStatus.value = "unknown";
  elements.medicationTaken.value = "false";
  elements.energyChange.value = "unchanged";
  elements.measurementContext.value = "resting";
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
