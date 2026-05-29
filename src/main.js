import {
  answerTypeNeedsOptions,
  answerTypes,
  clone,
  createBlankForm,
  createBlankQuestion,
  deleteFormTemplate,
  formatUpdatedDate,
  hasValidationErrors,
  initialFormTemplates,
  saveFormTemplate,
  validateFormTemplate,
} from "./formTemplates.js";

const screens = [
  {
    id: "services",
    label: "Appointment Services",
  },
  {
    id: "setup",
    label: "Form Setup",
  },
];

let activeScreen = "services";
let forms = clone(initialFormTemplates);
let setupMode = "list";
let editingFormId = "";
let formDraft = createBlankForm();
let formErrors = { form: {}, questions: {} };
let setupNotice = "";
let setupError = "";
let isLoadingForms = false;
let setupSearchQuery = "";
let previewForm = null;
let previewReturnMode = "list";
const confirmedAppointment = {
  id: "appointment-1001",
  clientId: "client-500",
  clientName: "Maya Reed",
  serviceName: "Color Retouch",
  date: "May 30, 2026",
  time: "10:30 AM",
  requiredFormIds: ["form-client-intake", "form-color-consultation", "form-service-consent-signature"],
};
let activeAppointmentFormId = "";
let appointmentErrors = {};
let appointmentResponses = {};
let updatingPreviousForms = new Set();
let clientProfile = {
  id: "client-500",
  savedResponses: {
    "form-client-intake": {
      formId: "form-client-intake",
      answers: {
        "q-phone": "555-0148",
        "q-allergies": "No known allergies.",
      },
      updatedAt: "2026-05-24T18:30:00.000Z",
    },
  },
};
const app = document.querySelector("#app");

function formatShortDate(value) {
  const date = new Date(value);

  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
}

function appointmentDateTime() {
  return `${confirmedAppointment.date} at ${confirmedAppointment.time}`;
}

function getRequiredAppointmentForms() {
  return forms.filter((form) => confirmedAppointment.requiredFormIds.includes(form.id));
}

function getNextIncompleteFormId(currentFormId = "") {
  const requiredForms = getRequiredAppointmentForms();
  const currentIndex = requiredForms.findIndex((form) => form.id === currentFormId);
  const afterCurrent = currentIndex >= 0 ? requiredForms.slice(currentIndex + 1) : requiredForms;
  const beforeCurrent = currentIndex >= 0 ? requiredForms.slice(0, currentIndex) : [];
  const nextForm = [...afterCurrent, ...beforeCurrent].find((form) => !appointmentResponses[form.id]);

  return nextForm?.id || "";
}

function getLastCompletedFormId(currentFormId = "") {
  const requiredForms = getRequiredAppointmentForms();
  const currentIndex = requiredForms.findIndex((form) => form.id === currentFormId);
  const completedBeforeCurrent = currentIndex > 0
    ? requiredForms.slice(0, currentIndex).filter((form) => appointmentResponses[form.id])
    : [];
  const completedForms = completedBeforeCurrent.length
    ? completedBeforeCurrent
    : requiredForms.filter((form) => form.id !== currentFormId && appointmentResponses[form.id]);
  const lastCompletedForm = completedForms[completedForms.length - 1];

  return lastCompletedForm?.id || "";
}

function shouldReviewOnly(form) {
  return Boolean(
    form.requireOnlyOnce &&
      clientProfile.savedResponses[form.id] &&
      !appointmentResponses[form.id] &&
      !updatingPreviousForms.has(form.id),
  );
}

function render() {
  app.innerHTML = `
    <header class="app-header">
      <div class="brand-lockup">
        <div class="brand-mark" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div>
          <p class="eyebrow">Salon school</p>
          <h1>Client Consultation</h1>
        </div>
      </div>
      <nav aria-label="Main navigation">
        ${screens
          .map(
            (item) =>
              `<button class="${item.id === activeScreen ? "active" : ""}" data-screen="${item.id}">${item.label}</button>`,
          )
          .join("")}
      </nav>
    </header>

    ${activeScreen === "setup" ? renderFormSetup() : renderAppointmentForms()}
  `;

  app.querySelectorAll("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      activeScreen = button.dataset.screen;
      setupNotice = "";
      setupError = "";
      render();
    });
  });

  if (activeScreen === "setup") {
    bindFormSetup();
  }

  if (activeScreen === "services") {
    bindAppointmentForms();
  }
}

function renderFormSetup() {
  if (setupMode === "preview") return renderFormPreview();
  return setupMode === "builder" ? renderFormBuilder() : renderFormsList();
}

function renderFormsList() {
  return `
    <section class="workspace">
      <div class="workspace-header">
        <div>
          <p class="eyebrow">School owner tools</p>
          <h2>Form Setup</h2>
          <p>Create and manage consultation forms used before client appointments.</p>
        </div>
        <button class="primary" data-action="add-form">Add New Form</button>
      </div>
      ${setupNotice ? `<div class="notice">${escapeHtml(setupNotice)}</div>` : ""}
      ${setupError ? `<div class="error-banner">${escapeHtml(setupError)}</div>` : ""}
      ${isLoadingForms ? `<div class="state-panel">Loading forms...</div>` : renderFormsListContent()}
    </section>
  `;
}

function renderFormsListContent() {
  if (forms.length === 0) {
    return `
      <div class="empty-state">
        <strong>No forms created yet.</strong>
        <p>Create your first consultation form.</p>
        <button class="primary" data-action="add-form">Add New Form</button>
      </div>
    `;
  }

  const visibleForms = forms.filter((form) =>
    form.name.toLowerCase().includes(setupSearchQuery.trim().toLowerCase()),
  );

  return `
    <div class="list-tools">
      <label class="search-field">
        <span>Search forms</span>
        <input data-search-forms value="${escapeHtml(setupSearchQuery)}" placeholder="Search by form name">
      </label>
    </div>
    ${
      visibleForms.length === 0
        ? `
          <div class="empty-state">
            <strong>No matching forms.</strong>
            <p>Try a different form name.</p>
          </div>
        `
        : `
    <div class="forms-list">
      ${visibleForms.map(renderFormRow).join("")}
    </div>
        `
    }
  `;
}

function renderFormRow(form) {
  return `
    <article class="form-row">
      <div>
        <h3>${escapeHtml(form.name)}</h3>
        ${form.description ? `<p>${escapeHtml(form.description)}</p>` : ""}
        <span>Last updated ${formatUpdatedDate(form.updatedAt)}</span>
      </div>
      <div class="row-actions">
        <button data-action="preview-form" data-form-id="${form.id}">${renderButtonIcon("preview")}Preview</button>
        <button data-action="edit-form" data-form-id="${form.id}">${renderButtonIcon("edit")}Edit</button>
        <button class="danger" data-action="delete-form" data-form-id="${form.id}">${renderButtonIcon("delete")}Delete</button>
      </div>
    </article>
  `;
}

function renderButtonIcon(type) {
  const icons = {
    preview: '<circle cx="12" cy="12" r="3.5"></circle><path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z"></path>',
    edit: '<path d="M4 20h4l10.5-10.5-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path>',
    delete: '<path d="M6 6 18 18"></path><path d="m18 6-12 12"></path>',
  };

  return `
    <svg class="button-icon" aria-hidden="true" viewBox="0 0 24 24">
      ${icons[type]}
    </svg>
  `;
}

function renderFormBuilder() {
  const isEditing = Boolean(editingFormId);

  return `
    <section class="workspace">
      <div class="workspace-header">
        <div>
          <p class="eyebrow">${isEditing ? "Edit form" : "New form"}</p>
          <h2>${isEditing ? "Edit Consultation Form" : "Build a Consultation Form"}</h2>
        </div>
        <button data-action="back-to-list">Back to forms</button>
      </div>
      ${setupError ? `<div class="error-banner">${escapeHtml(setupError)}</div>` : ""}

      <section class="builder-card">
        <label>
          Form name
          <input data-field="form-name" value="${escapeHtml(formDraft.name)}" placeholder="Example: Color Consultation">
          ${formErrors.form.name ? `<span class="field-error">${escapeHtml(formErrors.form.name)}</span>` : ""}
        </label>
        <label>
          Description
          <textarea data-field="form-description" placeholder="Optional description for school owners">${escapeHtml(formDraft.description)}</textarea>
        </label>
        <label class="toggle setting-toggle">
          <input type="checkbox" data-field="require-only-once" ${formDraft.requireOnlyOnce ? "checked" : ""}>
          Require only once
          <span>Clients with a previous completed version only review and confirm their saved information.</span>
        </label>
        <label class="toggle setting-toggle">
          <input type="checkbox" data-field="require-signature" ${formDraft.requireSignature ? "checked" : ""}>
          Request signature
          <span>Clients must type their signature before submitting this form.</span>
        </label>
      </section>

      <section class="questions-list">
        ${formDraft.questions.length ? formDraft.questions.map(renderQuestionEditor).join("") : `<div class="state-panel">No questions yet. Add your first question.</div>`}
      </section>

      <div class="builder-actions">
        <button data-action="add-question">Add New Question</button>
        <button data-action="preview-draft">Preview</button>
        <button class="primary" data-action="save-form">Save Form</button>
      </div>
    </section>
  `;
}

function renderFormPreview() {
  const form = previewForm || createBlankForm();

  return `
    <section class="workspace">
      <div class="workspace-header">
        <div>
          <p class="eyebrow">Preview</p>
          <h2>${escapeHtml(form.name || "Untitled form")}</h2>
          <p>${escapeHtml(form.description || "This is how clients will see this consultation form.")}</p>
        </div>
        <button data-action="close-preview">${previewReturnMode === "builder" ? "Back to builder" : "Back to forms"}</button>
      </div>
      <section class="preview-card">
        ${
          form.questions.length
            ? form.questions.map(renderPreviewQuestion).join("")
            : `<div class="state-panel">No questions to preview yet.</div>`
        }
        ${form.requireSignature ? renderSignatureField({ mode: "preview" }) : ""}
      </section>
    </section>
  `;
}

function renderPreviewQuestion(question, index) {
  return `
    <article class="preview-question">
      <label>
        <span>${index + 1}. ${escapeHtml(question.text || "Untitled question")}${question.required ? ` <em>*</em>` : ""}</span>
        ${renderPreviewAnswer(question)}
      </label>
    </article>
  `;
}

function renderPreviewAnswer(question) {
  if (question.type === "paragraph") {
    return `<textarea placeholder="Long answer text"></textarea>`;
  }

  if (question.type === "short_answer") {
    return `<input placeholder="Short answer text">`;
  }

  if (question.type === "dropdown") {
    return `
      <select>
        <option>Select an option</option>
        ${question.options.map((option) => `<option>${escapeHtml(option || "Untitled choice")}</option>`).join("")}
      </select>
    `;
  }

  const inputType = question.type === "checkboxes" ? "checkbox" : "radio";

  return `
    <div class="preview-options">
      ${question.options.map((option, optionIndex) => `
        <label>
          <input type="${inputType}" name="preview-${question.id}">
          <span>${escapeHtml(option || `Choice ${optionIndex + 1}`)}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function renderAppointmentForms() {
  const requiredForms = getRequiredAppointmentForms();
  const completedCount = requiredForms.filter((form) => appointmentResponses[form.id]).length;
  if (!activeAppointmentFormId && requiredForms.some((form) => !appointmentResponses[form.id])) {
    activeAppointmentFormId = requiredForms.find((form) => !appointmentResponses[form.id])?.id || "";
  }
  const activeForm = requiredForms.find((form) => form.id === activeAppointmentFormId);
  const allDone = requiredForms.length > 0 && completedCount === requiredForms.length && !activeForm;

  return `
    <section class="workspace">
      <div class="workspace-header">
        <div>
          <h2>Intake Forms</h2>
          <p class="eyebrow">Confirmed service</p>
          <p>${escapeHtml(confirmedAppointment.clientName)} is booked for ${escapeHtml(confirmedAppointment.serviceName)} on ${escapeHtml(appointmentDateTime())}.</p>
        </div>
        <div class="completion-pill">${completedCount} of ${requiredForms.length} complete</div>
      </div>
      ${
        allDone
          ? renderAllDone(requiredForms)
          : `
            ${renderCompletedAppointmentForms(requiredForms)}
            <section class="appointment-workspace single">
              ${
                activeForm
                  ? renderClientForm(activeForm)
                  : `<div class="state-panel">Choose a form to review or complete.</div>`
              }
            </section>
          `
      }
    </section>
  `;
}

function renderCompletedAppointmentForms(requiredForms) {
  const completedForms = requiredForms.filter((form) => appointmentResponses[form.id]);

  if (!completedForms.length) return "";

  return `
    <section class="completed-strip" aria-label="Completed forms">
      ${completedForms.map((form) => renderCompletedFormChip(form)).join("")}
    </section>
  `;
}

function renderCompletedFormChip(form, includeAction = false) {
  const response = appointmentResponses[form.id];
  const status = response.reviewedAt
    ? `Reviewed on ${formatShortDate(response.reviewedAt)}`
    : `Completed on ${formatShortDate(response.submittedAt || response.updatedAt)}`;

  return `
    <article class="completed-chip">
      <strong>${escapeHtml(form.name)}</strong>
      ${includeAction ? `<span>Complete</span>` : ""}
      <span>${escapeHtml(status)}</span>
      ${includeAction ? `<button data-appointment-action="open-form" data-form-id="${form.id}">Edit</button>` : ""}
    </article>
  `;
}

function renderAllDone(requiredForms) {
  const completedForms = requiredForms.filter((form) => appointmentResponses[form.id]);

  return `
    <section class="all-done-card">
      <h2>All Done!</h2>
      <p>See you on ${escapeHtml(appointmentDateTime())}.</p>
    </section>
    <section class="completed-strip review-strip" aria-label="Review completed forms">
      ${completedForms.map((form) => renderCompletedFormChip(form, true)).join("")}
    </section>
  `;
}

function renderClientForm(form) {
  if (shouldReviewOnly(form)) return renderReviewOnlyForm(form);

  const savedAnswers =
    appointmentResponses[form.id]?.answers || clientProfile.savedResponses[form.id]?.answers || {};
  const errors = appointmentErrors[form.id] || {};
  const isChangingPrevious = Boolean(clientProfile.savedResponses[form.id] && updatingPreviousForms.has(form.id));
  const primaryLabel = isChangingPrevious ? "Save changes" : "Save to client profile";
  const lastCompletedFormId = getLastCompletedFormId(form.id);

  return `
    <article class="client-form-card">
      <div class="form-card-header">
        <div>
          <h3>${escapeHtml(form.name)}</h3>
          <p class="eyebrow">${isChangingPrevious ? "Update saved information" : "Client form"}</p>
          ${form.description ? `<p>${escapeHtml(form.description)}</p>` : ""}
        </div>
      </div>
      <div class="preview-card client-answer-card">
        ${form.questions.map((question, index) => renderClientQuestion(question, index, savedAnswers, errors)).join("")}
        ${form.requireSignature ? renderSignatureField({ value: savedAnswers.__signature, error: errors.__signature }) : ""}
      </div>
      <div class="builder-actions">
        ${
          lastCompletedFormId
            ? `<button data-appointment-action="edit-last-completed" data-form-id="${lastCompletedFormId}">Back</button>`
            : ""
        }
        <button class="primary" data-appointment-action="save-response" data-form-id="${form.id}">${primaryLabel}</button>
      </div>
    </article>
  `;
}

function renderReviewOnlyForm(form) {
  const saved = clientProfile.savedResponses[form.id];

  return `
    <article class="client-form-card">
      <div class="form-card-header">
        <div>
          <h3>${escapeHtml(form.name)}</h3>
          <p class="eyebrow">Review saved information</p>
          <p>Completed on ${formatShortDate(saved.updatedAt)}. Review the information below and confirm whether anything has changed.</p>
        </div>
      </div>
      <div class="preview-card client-answer-card">
        ${form.questions.map((question, index) => renderSavedAnswer(question, index, saved.answers)).join("")}
        ${form.requireSignature ? renderSavedSignature(saved.answers.__signature) : ""}
      </div>
      <div class="builder-actions">
        <button data-appointment-action="open-form" data-form-id="${form.id}">Update answers</button>
        <button class="primary" data-appointment-action="reuse-response" data-form-id="${form.id}">Nothing has changed</button>
      </div>
    </article>
  `;
}

function renderSavedAnswer(question, index, savedAnswers) {
  const value = savedAnswers[question.id];
  const displayValue = Array.isArray(value) ? value.join(", ") : value || "No answer saved";

  return `
    <article class="preview-question">
      <label>
        <span>${index + 1}. ${escapeHtml(question.text || "Untitled question")}</span>
        <div class="saved-answer">${escapeHtml(displayValue)}</div>
      </label>
    </article>
  `;
}

function renderSavedSignature(value) {
  return `
    <article class="preview-question signature-block">
      <label>
        <span>Client signature</span>
        <div class="saved-answer">${escapeHtml(value || "No signature saved")}</div>
      </label>
    </article>
  `;
}

function renderClientQuestion(question, index, savedAnswers, errors) {
  return `
    <article class="preview-question">
      <label>
        <span>${index + 1}. ${escapeHtml(question.text || "Untitled question")}${question.required ? ` <em>*</em>` : ""}</span>
        ${renderClientAnswer(question, savedAnswers[question.id])}
        ${errors[question.id] ? `<span class="field-error">${escapeHtml(errors[question.id])}</span>` : ""}
      </label>
    </article>
  `;
}

function renderSignatureField({ value = "", error = "", mode = "client" } = {}) {
  return `
    <article class="preview-question signature-block">
      <label>
        <span>Client signature <em>*</em></span>
        <input
          ${mode === "preview" ? "" : `data-client-signature`}
          value="${escapeHtml(value || "")}"
          placeholder="Type your full name"
          ${mode === "preview" ? "" : ""}
        >
        <small>Type ${escapeHtml(confirmedAppointment.clientName)} to sign this form.</small>
        ${error ? `<span class="field-error">${escapeHtml(error)}</span>` : ""}
      </label>
    </article>
  `;
}

function renderClientAnswer(question, value) {
  if (question.type === "paragraph") {
    return `<textarea data-client-question="${question.id}" placeholder="Long answer text">${escapeHtml(value || "")}</textarea>`;
  }

  if (question.type === "short_answer") {
    return `<input data-client-question="${question.id}" value="${escapeHtml(value || "")}" placeholder="Short answer text">`;
  }

  if (question.type === "dropdown") {
    return `
      <select data-client-question="${question.id}">
        <option value="">Select an option</option>
        ${question.options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    `;
  }

  if (question.type === "checkboxes") {
    const selected = Array.isArray(value) ? value : [];

    return `
      <div class="preview-options">
        ${question.options.map((option) => `
          <label>
            <input type="checkbox" data-client-question="${question.id}" value="${escapeHtml(option)}" ${selected.includes(option) ? "checked" : ""}>
            <span>${escapeHtml(option)}</span>
          </label>
        `).join("")}
      </div>
    `;
  }

  return `
    <div class="preview-options">
      ${question.options.map((option) => `
        <label>
          <input type="radio" name="client-${question.id}" data-client-question="${question.id}" value="${escapeHtml(option)}" ${value === option ? "checked" : ""}>
          <span>${escapeHtml(option)}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function renderQuestionEditor(question, index) {
  const errors = formErrors.questions[question.id] || {};
  const showOptions = answerTypeNeedsOptions(question.type);

  return `
    <article class="question-card" data-question-id="${question.id}">
      <div class="question-header">
        <p class="eyebrow">Question ${index + 1}</p>
      </div>
      <div class="question-grid">
        <label>
          Question text
          <input data-question-field="text" data-question-id="${question.id}" value="${escapeHtml(question.text)}" placeholder="Ask a clear question">
          ${errors.text ? `<span class="field-error">${escapeHtml(errors.text)}</span>` : ""}
        </label>
        <label>
          Answer type
          <select data-question-field="type" data-question-id="${question.id}">
            ${answerTypes.map((type) => `<option value="${type.value}" ${type.value === question.type ? "selected" : ""}>${type.label}</option>`).join("")}
          </select>
        </label>
        <label class="toggle">
          <input type="checkbox" data-question-field="required" data-question-id="${question.id}" ${question.required ? "checked" : ""}>
          Required
        </label>
      </div>
      ${
        showOptions
          ? `
            <div class="options-list">
              <div class="options-header">
                <strong>Answer choices</strong>
                <span>Edit the choices clients can select from.</span>
              </div>
              ${question.options.map((option, optionIndex) => renderOptionEditor(question, option, optionIndex)).join("")}
              ${errors.options ? `<span class="field-error">${escapeHtml(errors.options)}</span>` : ""}
              <button data-action="add-option" data-question-id="${question.id}">Add another choice</button>
            </div>
          `
          : ""
      }
      <div class="question-card-actions">
        <button class="danger" data-action="remove-question" data-question-id="${question.id}">Remove</button>
      </div>
    </article>
  `;
}

function renderOptionEditor(question, option, optionIndex) {
  return `
    <div class="option-editor">
      <span>${optionIndex + 1}</span>
      <input data-option-index="${optionIndex}" data-question-id="${question.id}" value="${escapeHtml(option)}" placeholder="Choice ${optionIndex + 1}">
      <button class="danger" data-action="remove-option" data-question-id="${question.id}" data-option-index="${optionIndex}">Remove</button>
    </div>
  `;
}

function bindFormSetup() {
  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleSetupAction(button));
  });

  app.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
      updateDraftField(input.dataset.field, input.type === "checkbox" ? input.checked : input.value);
    });
  });

  const searchInput = app.querySelector("[data-search-forms]");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      setupSearchQuery = searchInput.value;
      render();
      const nextSearchInput = app.querySelector("[data-search-forms]");
      nextSearchInput?.focus();
      nextSearchInput?.setSelectionRange(setupSearchQuery.length, setupSearchQuery.length);
    });
  }

  app.querySelectorAll("[data-question-field]").forEach((input) => {
    input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
      updateQuestion(input.dataset.questionId, input.dataset.questionField, input.type === "checkbox" ? input.checked : input.value);
      if (input.dataset.questionField === "type") {
        render();
      }
    });
  });

  app.querySelectorAll("[data-option-index]").forEach((input) => {
    input.addEventListener("input", () => {
      updateOption(input.dataset.questionId, Number(input.dataset.optionIndex), input.value);
    });
  });
}

function bindAppointmentForms() {
  app.querySelectorAll("[data-appointment-action]").forEach((button) => {
    button.addEventListener("click", () => handleAppointmentAction(button));
  });
}

function handleAppointmentAction(button) {
  const action = button.dataset.appointmentAction;
  const formId = button.dataset.formId;
  const form = forms.find((item) => item.id === formId);

  if (action === "open-form") {
    updatingPreviousForms.add(formId);
    activeAppointmentFormId = formId;
    render();
  }

  if (action === "edit-last-completed" && form) {
    updatingPreviousForms.add(form.id);
    activeAppointmentFormId = form.id;
    appointmentErrors = {};
    render();
  }

  if (action === "reuse-response" && form) {
    const saved = clientProfile.savedResponses[form.id];
    const reviewedAt = new Date().toISOString();

    appointmentResponses = {
      ...appointmentResponses,
      [form.id]: {
        formId: form.id,
        answers: clone(saved.answers),
        reusedFromProfile: true,
        reviewedAt,
        submittedAt: reviewedAt,
      },
    };
    updatingPreviousForms.delete(form.id);
    activeAppointmentFormId = getNextIncompleteFormId(form.id);
    render();
  }

  if (action === "save-response" && form) {
    const answers = readClientAnswers(form);
    const errors = validateClientAnswers(form, answers);

    if (Object.keys(errors).length > 0) {
      appointmentErrors = { ...appointmentErrors, [form.id]: errors };
      render();
      return;
    }

    const response = {
      formId: form.id,
      answers,
      updatedAt: new Date().toISOString(),
    };

    clientProfile = {
      ...clientProfile,
      savedResponses: {
        ...clientProfile.savedResponses,
        [form.id]: response,
      },
    };
    appointmentResponses = {
      ...appointmentResponses,
      [form.id]: {
        ...response,
        submittedAt: response.updatedAt,
      },
    };
    updatingPreviousForms.delete(form.id);
    appointmentErrors = {};
    activeAppointmentFormId = getNextIncompleteFormId(form.id);
    render();
  }
}

function readClientAnswers(form) {
  const answers = form.questions.reduce((answers, question) => {
    const inputs = [...app.querySelectorAll(`[data-client-question="${question.id}"]`)];

    if (question.type === "checkboxes") {
      answers[question.id] = inputs.filter((input) => input.checked).map((input) => input.value);
    } else if (question.type === "multiple_choice") {
      answers[question.id] = inputs.find((input) => input.checked)?.value || "";
    } else {
      answers[question.id] = inputs[0]?.value || "";
    }

    return answers;
  }, {});

  if (form.requireSignature) {
    answers.__signature = app.querySelector("[data-client-signature]")?.value || "";
  }

  return answers;
}

function validateClientAnswers(form, answers) {
  const errors = form.questions.reduce((errors, question) => {
    if (!question.required) return errors;

    const value = answers[question.id];
    const isMissing = Array.isArray(value) ? value.length === 0 : !String(value || "").trim();

    if (isMissing) {
      errors[question.id] = "Required";
    }

    return errors;
  }, {});

  if (form.requireSignature) {
    const signature = String(answers.__signature || "").trim();
    const expectedSignature = normalizeSignature(confirmedAppointment.clientName);

    if (!signature) {
      errors.__signature = "Signature is required.";
    } else if (normalizeSignature(signature) !== expectedSignature) {
      errors.__signature = `Signature must match ${confirmedAppointment.clientName}.`;
    }
  }

  return errors;
}

function normalizeSignature(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function handleSetupAction(button) {
  const action = button.dataset.action;
  const formId = button.dataset.formId;
  const questionId = button.dataset.questionId;

  if (action === "add-form") {
    editingFormId = "";
    formDraft = createBlankForm();
    formErrors = { form: {}, questions: {} };
    setupMode = "builder";
    setupNotice = "";
    setupError = "";
    render();
  }

  if (action === "edit-form") {
    const form = forms.find((item) => item.id === formId);
    if (!form) {
      setupError = "We could not find that form.";
      render();
      return;
    }
    editingFormId = formId;
    formDraft = clone(form);
    formErrors = { form: {}, questions: {} };
    setupMode = "builder";
    setupNotice = "";
    setupError = "";
    render();
  }

  if (action === "preview-form") {
    const form = forms.find((item) => item.id === formId);
    if (!form) {
      setupError = "We could not find that form.";
      render();
      return;
    }
    previewForm = clone(form);
    previewReturnMode = "list";
    setupMode = "preview";
    setupNotice = "";
    setupError = "";
    render();
  }

  if (action === "delete-form") {
    const form = forms.find((item) => item.id === formId);
    if (form && window.confirm(`Delete "${form.name}"?`)) {
      forms = deleteFormTemplate(forms, formId);
      setupNotice = "Form deleted.";
      setupError = "";
      render();
    }
  }

  if (action === "back-to-list") {
    setupMode = "list";
    setupError = "";
    render();
  }

  if (action === "close-preview") {
    setupMode = previewReturnMode;
    previewForm = null;
    setupError = "";
    render();
  }

  if (action === "add-question") {
    formDraft.questions = [...formDraft.questions, createBlankQuestion()];
    render();
  }

  if (action === "remove-question") {
    formDraft.questions = formDraft.questions.filter((question) => question.id !== questionId);
    render();
  }

  if (action === "add-option") {
    const question = findQuestion(questionId);
    updateQuestion(questionId, "options", [
      ...question.options,
      `Choice ${question.options.length + 1}`,
    ]);
    render();
  }

  if (action === "remove-option") {
    const optionIndex = Number(button.dataset.optionIndex);
    const question = findQuestion(questionId);
    updateQuestion(
      questionId,
      "options",
      question.options.filter((_, index) => index !== optionIndex),
    );
    render();
  }

  if (action === "preview-draft") {
    previewForm = clone(formDraft);
    previewReturnMode = "builder";
    setupMode = "preview";
    setupError = "";
    render();
  }

  if (action === "save-form") {
    formErrors = validateFormTemplate(formDraft);

    if (hasValidationErrors(formErrors)) {
      setupError = "Please fix the highlighted fields before saving.";
      render();
      return;
    }

    forms = saveFormTemplate(forms, formDraft);
    setupMode = "list";
    editingFormId = "";
    formDraft = createBlankForm();
    formErrors = { form: {}, questions: {} };
    setupNotice = "Form saved.";
    setupError = "";
    render();
  }
}

function updateDraftField(field, value) {
  if (field === "form-name") formDraft.name = value;
  if (field === "form-description") formDraft.description = value;
  if (field === "require-only-once") formDraft.requireOnlyOnce = value;
  if (field === "require-signature") formDraft.requireSignature = value;
}

function findQuestion(questionId) {
  return formDraft.questions.find((question) => question.id === questionId);
}

function updateQuestion(questionId, field, value) {
  formDraft.questions = formDraft.questions.map((question) => {
    if (question.id !== questionId) return question;

    if (field === "type") {
      return {
        ...question,
        type: value,
        options: answerTypeNeedsOptions(value)
          ? question.options.length
            ? question.options
            : ["Choice 1", "Choice 2"]
          : [],
      };
    }

    return { ...question, [field]: value };
  });
}

function updateOption(questionId, optionIndex, value) {
  formDraft.questions = formDraft.questions.map((question) =>
    question.id === questionId
      ? {
          ...question,
          options: question.options.map((option, index) => (index === optionIndex ? value : option)),
        }
      : question,
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

render();
