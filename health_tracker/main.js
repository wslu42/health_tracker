import { bindControls } from "./controls.js";
import { loadRecords } from "./state.js";

function getElements() {
  return {
    form: document.getElementById("record-form"),
    formWarning: document.getElementById("form-warning"),
    latestRecord: document.getElementById("latest-record"),
    tableBody: document.getElementById("records-table-body"),
    chartCanvas: document.getElementById("records-chart"),
    chartRange: document.getElementById("chart-range"),
    exportJsonButton: document.getElementById("export-json"),
    exportCsvButton: document.getElementById("export-csv"),
    importJsonInput: document.getElementById("import-json"),
    mealStatus: document.getElementById("meal-status"),
    medicationTaken: document.getElementById("medication-taken")
  };
}

function initializeApp() {
  loadRecords();
  bindControls(getElements());
}

initializeApp();
