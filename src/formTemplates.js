export const answerTypes = [
  { value: "multiple_choice", label: "Multiple choice", needsOptions: true },
  { value: "dropdown", label: "Dropdown", needsOptions: true },
  { value: "checkboxes", label: "Checkboxes", needsOptions: true },
  { value: "short_answer", label: "Short answer", needsOptions: false },
  { value: "paragraph", label: "Paragraph", needsOptions: false },
];

export const initialFormTemplates = [
  {
    id: "form-client-intake",
    name: "Client Intake",
    description: "Basic contact, allergies, and first-visit details.",
    requireOnlyOnce: true,
    createdAt: "2026-05-20T16:00:00.000Z",
    updatedAt: "2026-05-24T18:30:00.000Z",
    questions: [
      {
        id: "q-phone",
        text: "What is your phone number?",
        type: "short_answer",
        required: true,
        options: [],
      },
      {
        id: "q-allergies",
        text: "Do you have any allergies or sensitivities?",
        type: "paragraph",
        required: true,
        options: [],
      },
    ],
  },
  {
    id: "form-color-consultation",
    name: "Color Consultation",
    description: "Color history and service goals for color appointments.",
    requireOnlyOnce: false,
    createdAt: "2026-05-21T15:15:00.000Z",
    updatedAt: "2026-05-26T13:45:00.000Z",
    questions: [
      {
        id: "q-box-color",
        text: "Have you used box color in the last year?",
        type: "multiple_choice",
        required: true,
        options: ["Yes", "No", "Not sure"],
      },
    ],
  },
];

export function createBlankForm() {
  return {
    id: "",
    name: "",
    description: "",
    requireOnlyOnce: false,
    createdAt: "",
    updatedAt: "",
    questions: [],
  };
}

export function createBlankQuestion() {
  return {
    id: createId("question"),
    text: "",
    type: "short_answer",
    required: false,
    options: [],
  };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function answerTypeNeedsOptions(type) {
  return answerTypes.some((answerType) => answerType.value === type && answerType.needsOptions);
}

export function formatUpdatedDate(value) {
  if (!value) return "Not updated yet";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function validateFormTemplate(form) {
  const errors = {
    form: {},
    questions: {},
  };

  if (!form.name.trim()) {
    errors.form.name = "Form name is required.";
  }

  form.questions.forEach((question) => {
    const questionErrors = {};

    if (!question.text.trim()) {
      questionErrors.text = "Question text is required.";
    }

    if (answerTypeNeedsOptions(question.type)) {
      const usableOptions = question.options.filter((option) => option.trim());

      if (usableOptions.length === 0) {
        questionErrors.options = "Add at least one answer option.";
      }
    }

    if (Object.keys(questionErrors).length > 0) {
      errors.questions[question.id] = questionErrors;
    }
  });

  return errors;
}

export function hasValidationErrors(errors) {
  return Object.keys(errors.form).length > 0 || Object.keys(errors.questions).length > 0;
}

export function saveFormTemplate(forms, draft, now = new Date().toISOString()) {
  const cleanDraft = {
    ...draft,
    name: draft.name.trim(),
    description: draft.description.trim(),
    requireOnlyOnce: Boolean(draft.requireOnlyOnce),
    questions: draft.questions.map((question) => ({
      ...question,
      text: question.text.trim(),
      options: answerTypeNeedsOptions(question.type)
        ? question.options.map((option) => option.trim()).filter(Boolean)
        : [],
    })),
  };
  const existing = forms.find((form) => form.id === cleanDraft.id);
  const saved = {
    ...cleanDraft,
    id: cleanDraft.id || createId("form"),
    createdAt: existing?.createdAt || cleanDraft.createdAt || now,
    updatedAt: now,
  };

  return existing
    ? forms.map((form) => (form.id === saved.id ? saved : form))
    : [...forms, saved];
}

export function deleteFormTemplate(forms, formId) {
  return forms.filter((form) => form.id !== formId);
}

export function renderFormsListHtml(forms) {
  if (forms.length === 0) {
    return "No forms created yet. Create your first consultation form.";
  }

  return forms.map((form) => `${form.name} ${form.description || ""}`).join(" ");
}
