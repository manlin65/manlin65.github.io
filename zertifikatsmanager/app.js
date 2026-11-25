(() => {
  "use strict";

  const STORAGE_KEY = "zertifikatsmanager.records.v1";
  const DAY_MS = 86_400_000;
  const statuses = {
    valid: "Gültig",
    soon: "Läuft bald ab",
    expired: "Abgelaufen",
    unlimited: "Unbefristet"
  };
  const fields = ["person", "department", "certificate", "issuer", "issued", "expires"];
  const dateFormat = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC"
  });
  const byId = (id) => document.getElementById(id);
  const search = byId("search");
  const filter = byId("status-filter");
  const rows = byId("records-body");
  const rowTemplate = byId("row-template");
  const addButton = byId("add-record");
  const recordDialog = byId("record-dialog");
  const recordForm = byId("record-form");
  const confirmDialog = byId("confirm-dialog");
  const formError = byId("form-error");
  const confirmError = byId("confirm-error");

  let storageAvailable = true;
  let records = loadRecords();
  let editedId = null;
  let confirmation = null;
  let recordTrigger = null;
  let confirmTrigger = null;
  let displayedDay;

  function localDate(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return [date.getFullYear(), month, day].join("-");
  }

  function dateValue(date) {
    return Date.parse(date + "T00:00:00Z");
  }

  function getStatus(expires, today) {
    if (!expires) return "unlimited";
    const remaining = (dateValue(expires) - today) / DAY_MS;
    if (remaining < 0) return "expired";
    if (remaining <= 90) return "soon";
    return "valid";
  }

  function demoRecords() {
    const people = [
      ["Lena Falkenberg", "Digitalisierung"],
      ["Jonas Winterfeld", "Produktion"],
      ["Mira Schönwald", "Personal"],
      ["Felix Dornbach", "Technik"],
      ["Nele Rosenhain", "Qualität"],
      ["Emil Bergmann", "Logistik"],
      ["Tessa Lindenau", "IT"],
      ["Jannik Auenwald", "Einkauf"],
      ["Sina Morgenstern", "Vertrieb"],
      ["Mats Breitenfeld", "Instandhaltung"]
    ];
    const examples = [
      [0, "KI-Manager", "Akademie Nordlicht", -148, 217],
      [1, "Erste Hilfe", "MediKom Lernzentrum", -698, 32],
      [2, "Projektmanagement", "Campus Weitblick", -386, null],
      [3, "Herstellerschulung · Antriebstechnik", "Novaris Technik", -765, -35],
      [4, "Interne Audits", "Institut Klarpunkt", -251, 114],
      [5, "Flurförderzeuge", "Logistik Campus West", -185, null],
      [6, "IT-Sicherheitsgrundlagen", "Akademie Nordlicht", -305, 60],
      [7, "Nachhaltiger Einkauf", "Campus Weitblick", -413, 317],
      [8, "Datenschutz im Vertrieb", "Institut Klarpunkt", -389, -24],
      [9, "Herstellerschulung · Steuerungstechnik", "Novaris Technik", -645, 85],
      [0, "Datenkompetenz", "Campus Weitblick", -113, 252],
      [1, "Arbeitssicherheit", "Institut Klarpunkt", -375, -10],
      [3, "Elektrotechnische Unterweisung", "Novaris Technik", -351, 14],
      [4, "Qualitätsmanagement", "Institut Klarpunkt", -138, null],
      [6, "Projektmanagement", "Campus Weitblick", -232, 498]
    ];

    return examples.map(([personIndex, certificate, issuer, issued, expires], index) => {
      const [person, department] = people[personIndex];
      return {
        id: "demo-" + index, person, department, certificate, issuer,
        issued: localDate(issued), expires: expires === null ? "" : localDate(expires)
      };
    });
  }

  function loadRecords() {
    const seed = demoRecords();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
        throw new TypeError("Ungültiges Speicherformat");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {
      storageAvailable = false;
      const notice = byId("storage-notice");
      notice.textContent = "Lokaler Browserspeicher ist derzeit nicht verfügbar. Änderungen gelten nur bis zum Neuladen.";
      notice.hidden = false;
    }
    return seed;
  }

  function saveRecords(nextRecords) {
    if (storageAvailable) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
    records = nextRecords;
    render();
  }

  function makeRow(record, status) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.id = record.id;
    const values = {
      ...record,
      issued: dateFormat.format(dateValue(record.issued)),
      expires: record.expires ? dateFormat.format(dateValue(record.expires)) : "Unbefristet"
    };
    for (const cell of row.querySelectorAll("[data-field]")) {
      cell.textContent = values[cell.dataset.field];
    }
    row.querySelector(".avatar").textContent = record.person.split(/\s+/).slice(0, 2)
      .map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("de");
    const badge = row.querySelector(".status-badge");
    badge.classList.add("status-" + status);
    badge.textContent = statuses[status];
    for (const button of row.querySelectorAll("[data-action]")) {
      button.setAttribute("aria-label", record.certificate + " für " + record.person + " " + button.title.toLocaleLowerCase("de"));
    }
    return row;
  }

  function render() {
    displayedDay = localDate();
    const today = dateValue(displayedDay);
    const term = search.value.trim().toLocaleLowerCase("de");
    const selectedStatus = filter.value;
    const counts = { valid: 0, soon: 0, expired: 0, unlimited: 0 };
    const fragment = document.createDocumentFragment();

    for (const record of records) {
      const status = getStatus(record.expires, today);
      counts[status] += 1;
      const matchesTerm = [record.person, record.certificate]
        .some((value) => value.toLocaleLowerCase("de").includes(term));
      if (matchesTerm && (selectedStatus === "all" || status === selectedStatus)) {
        fragment.append(makeRow(record, status));
      }
    }

    const visible = fragment.childElementCount;
    rows.replaceChildren(fragment);
    byId("count-total").textContent = records.length;
    byId("count-valid").textContent = counts.valid + counts.unlimited;
    byId("count-soon").textContent = counts.soon;
    byId("count-expired").textContent = counts.expired;
    byId("result-count").textContent = visible + " von " + records.length + " Nachweisen";
    const emptyState = byId("empty-state");
    emptyState.hidden = visible !== 0;
    emptyState.textContent = records.length
      ? "Keine Nachweise für diese Suche oder Filterauswahl gefunden."
      : "Es sind noch keine Nachweise vorhanden.";
  }

  function openForm(record, trigger) {
    editedId = record?.id ?? null;
    recordTrigger = trigger;
    recordForm.reset();
    for (const field of fields) {
      const input = recordForm.elements.namedItem(field);
      input.setCustomValidity("");
      if (record) input.value = record[field];
    }
    formError.hidden = true;
    byId("form-title").textContent = record ? "Nachweis bearbeiten" : "Nachweis hinzufügen";
    recordDialog.showModal();
  }

  function validateForm() {
    for (const input of recordForm.querySelectorAll("input[required]:not([type=date])")) {
      input.setCustomValidity(input.value.trim() ? "" : "Bitte füllen Sie dieses Feld aus.");
    }
    const issued = recordForm.elements.namedItem("issued");
    const expires = recordForm.elements.namedItem("expires");
    expires.setCustomValidity(issued.value && expires.value && expires.value < issued.value
      ? "Das Ablaufdatum muss am oder nach dem Ausstellungsdatum liegen." : "");
  }

  function showStorageError(element) {
    element.textContent = "Die Änderung konnte nicht im Browser gespeichert werden.";
    element.hidden = false;
  }

  function openConfirmation({ title, message, label, apply, trigger }) {
    confirmation = apply;
    confirmTrigger = trigger;
    byId("confirm-title").textContent = title;
    byId("confirm-message").textContent = message;
    byId("confirm-submit").textContent = label;
    confirmError.hidden = true;
    confirmDialog.showModal();
  }

  function restoreFocus(trigger) {
    if (trigger?.isConnected) {
      trigger.focus();
      return;
    }
    const replacement = Array.from(rows.children).find((row) => row.dataset.id === trigger?.closest("tr")?.dataset.id);
    const target = replacement?.querySelector('[data-action="' + trigger.dataset.action + '"]') ?? search;
    target.focus();
  }

  addButton.addEventListener("click", () => openForm(null, addButton));
  search.addEventListener("input", render);
  filter.addEventListener("change", render);

  rows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const record = records.find(({ id }) => id === button.closest("tr").dataset.id);
    if (button.dataset.action === "edit") {
      openForm(record, button);
      return;
    }
    openConfirmation({
      title: "Nachweis löschen?",
      message: "„" + record.certificate + "“ für " + record.person + " wird dauerhaft aus dieser Demo gelöscht.",
      label: "Löschen",
      trigger: button,
      apply: () => {
        saveRecords(records.filter(({ id }) => id !== record.id));
        byId("action-status").textContent = "Nachweis gelöscht.";
      }
    });
  });

  recordForm.addEventListener("input", validateForm);
  recordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    validateForm();
    if (!recordForm.reportValidity()) return;
    const formData = new FormData(recordForm);
    const entry = Object.fromEntries(fields.map((field) => [field, formData.get(field).trim()]));
    entry.id = editedId ?? "record-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    const nextRecords = editedId
      ? records.map((record) => record.id === editedId ? entry : record)
      : [entry, ...records];

    try {
      saveRecords(nextRecords);
    } catch {
      showStorageError(formError);
      return;
    }
    byId("action-status").textContent = editedId ? "Nachweis aktualisiert." : "Nachweis hinzugefügt.";
    recordDialog.close();
  });

  byId("reset-demo").addEventListener("click", (event) => {
    openConfirmation({
      title: "Demodaten zurücksetzen?",
      message: "Alle Einträge und Änderungen in dieser Demo werden durch frisch datierte Beispieldaten ersetzt.",
      label: "Zurücksetzen",
      trigger: event.currentTarget,
      apply: () => {
        search.value = "";
        filter.value = "all";
        saveRecords(demoRecords());
        byId("action-status").textContent = "Demodaten zurückgesetzt.";
      }
    });
  });

  confirmDialog.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      confirmation();
    } catch {
      showStorageError(confirmError);
      return;
    }
    confirmDialog.close();
  });

  for (const dialog of [recordDialog, confirmDialog]) {
    for (const button of dialog.querySelectorAll("[data-close]")) {
      button.addEventListener("click", () => dialog.close());
    }
  }
  recordDialog.addEventListener("close", () => restoreFocus(recordTrigger));
  confirmDialog.addEventListener("close", () => restoreFocus(confirmTrigger));

  function updateNavigation() {
    const current = location.hash === "#nachweise" ? "#nachweise" : "#uebersicht";
    for (const link of document.querySelectorAll(".navigation a")) {
      if (link.hash === current) {
        link.setAttribute("aria-current", "location");
        document.querySelector(".page-label").textContent = link.textContent.trim();
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function refreshDate() {
    if (displayedDay !== localDate()) render();
  }

  window.addEventListener("hashchange", updateNavigation);
  window.addEventListener("focus", refreshDate);
  window.setInterval(refreshDate, 60_000);
  updateNavigation();
  render();
})();
