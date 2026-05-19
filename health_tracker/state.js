const STORAGE_KEY = "bp-tracker-records";

const ranges = {
  systolic: { min: 60, max: 250 },
  diastolic: { min: 30, max: 150 },
  pulse: { min: 30, max: 220 }
};

const appState = {
  records: []
};

function normalizeRecord(record) {
  const timestamp = new Date(record.timestamp);

  return {
    id: String(record.id),
    timestamp: timestamp.toISOString(),
    systolic: Number(record.systolic),
    diastolic: Number(record.diastolic),
    pulse: Number(record.pulse),
    mealStatus: ["before_meal", "after_meal", "unknown"].includes(record.mealStatus)
      ? record.mealStatus
      : "unknown",
    medicationTaken: toBoolean(record.medicationTaken),
    medicationDose: typeof record.medicationDose === "string" ? record.medicationDose : "",
    note: typeof record.note === "string" ? record.note : ""
  };
}

function validateRecordShape(record) {
  const timestamp = new Date(record?.timestamp);

  return (
    record &&
    typeof record.id !== "undefined" &&
    typeof record.timestamp !== "undefined" &&
    Number.isFinite(timestamp.getTime()) &&
    Number.isFinite(Number(record.systolic)) &&
    Number.isFinite(Number(record.diastolic)) &&
    Number.isFinite(Number(record.pulse))
  );
}

export function getRanges() {
  return ranges;
}

export function getRecords() {
  return [...appState.records];
}

export function getLatestRecord() {
  return appState.records[0] ?? null;
}

export function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    appState.records = [];
    return getRecords();
  }

  try {
    const parsed = JSON.parse(raw);
    appState.records = Array.isArray(parsed)
      ? parsed.filter(validateRecordShape).map(normalizeRecord).sort(sortByNewest)
      : [];
  } catch {
    appState.records = [];
  }

  return getRecords();
}

export function saveRecords(records = appState.records) {
  const normalized = records
    .filter(validateRecordShape)
    .map(normalizeRecord)
    .sort(sortByNewest);

  appState.records = normalized;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return getRecords();
}

export function addRecord(recordInput) {
  const record = normalizeRecord({
    ...recordInput,
    id: recordInput.id ?? createId(),
    timestamp: recordInput.timestamp ?? new Date().toISOString()
  });

  appState.records = [record, ...appState.records].sort(sortByNewest);
  saveRecords(appState.records);
  return record;
}

export function deleteRecord(id) {
  appState.records = appState.records.filter((record) => record.id !== id);
  saveRecords(appState.records);
  return getRecords();
}

export function exportRecordsAsJSON() {
  return JSON.stringify(appState.records, null, 2);
}

export function importRecordsFromJSON(jsonText) {
  const parsed = JSON.parse(jsonText);

  if (!Array.isArray(parsed)) {
    throw new Error("匯入的 JSON 內容必須是紀錄陣列。");
  }

  const normalized = parsed.filter(validateRecordShape).map(normalizeRecord);

  if (!normalized.length && parsed.length > 0) {
    throw new Error("匯入的 JSON 中沒有可用的有效紀錄。");
  }

  saveRecords(normalized);
  return getRecords();
}

export function exportRecordsAsCSV() {
  const header = [
    "id",
    "timestamp",
    "systolic",
    "diastolic",
    "pulse",
    "mealStatus",
    "medicationTaken",
    "medicationDose",
    "note"
  ];

  const rows = appState.records.map((record) => [
    record.id,
    record.timestamp,
    record.systolic,
    record.diastolic,
    record.pulse,
    record.mealStatus,
    record.medicationTaken,
    record.medicationDose,
    record.note
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

export function filterRecordsByDays(range) {
  if (range === "all") {
    return [...appState.records].sort(sortByOldest);
  }

  const days = Number(range);

  if (!Number.isFinite(days)) {
    return [...appState.records].sort(sortByOldest);
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return appState.records
    .filter((record) => new Date(record.timestamp).getTime() >= cutoff)
    .sort(sortByOldest);
}

export function validateMeasurementValues({ systolic, diastolic, pulse }) {
  const issues = [];

  checkRange("收縮壓", Number(systolic), ranges.systolic, issues);
  checkRange("舒張壓", Number(diastolic), ranges.diastolic, issues);
  checkRange("脈搏", Number(pulse), ranges.pulse, issues);

  return {
    valid: issues.length === 0,
    message: issues.join(" ")
  };
}

function checkRange(label, value, range, issues) {
  if (!Number.isFinite(value)) {
    issues.push(`${label}必須是數字。`);
    return;
  }

  if (value < range.min || value > range.max) {
    issues.push(`${label}必須介於 ${range.min} 到 ${range.max} 之間。`);
  }
}

function createId() {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toBoolean(value) {
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

function sortByNewest(a, b) {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

function sortByOldest(a, b) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}
