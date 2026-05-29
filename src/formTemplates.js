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
    requireSignature: false,
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
    requireSignature: false,
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
  {
    id: "form-haircut-consultation",
    name: "Haircut Consultation",
    description: "Style goals, maintenance preferences, and haircut history.",
    requireOnlyOnce: false,
    requireSignature: false,
    createdAt: "2026-05-22T10:00:00.000Z",
    updatedAt: "2026-05-27T09:20:00.000Z",
    questions: [
      {
        id: "q-haircut-goal",
        text: "What would you like to change about your haircut today?",
        type: "paragraph",
        required: true,
        options: [],
      },
      {
        id: "q-style-maintenance",
        text: "How much daily styling time do you prefer?",
        type: "dropdown",
        required: true,
        options: ["Less than 5 minutes", "5-15 minutes", "15-30 minutes", "30+ minutes"],
      },
      {
        id: "q-haircut-length",
        text: "Are you comfortable losing length today?",
        type: "multiple_choice",
        required: true,
        options: ["Yes", "No", "Only a small trim"],
      },
    ],
  },
  {
    id: "form-chemical-service-consent",
    name: "Chemical Service Consent",
    description: "Required consent and safety questions for chemical services.",
    requireOnlyOnce: false,
    requireSignature: false,
    createdAt: "2026-05-22T11:30:00.000Z",
    updatedAt: "2026-05-27T10:10:00.000Z",
    questions: [
      {
        id: "q-chemical-services",
        text: "Which chemical services have you received in the last 12 months?",
        type: "checkboxes",
        required: true,
        options: ["Color", "Lightener", "Perm", "Relaxer", "Keratin or smoothing treatment", "None"],
      },
      {
        id: "q-scalp-condition",
        text: "Do you currently have scalp irritation, cuts, or open sores?",
        type: "multiple_choice",
        required: true,
        options: ["Yes", "No"],
      },
      {
        id: "q-chemical-consent",
        text: "I understand chemical services may affect the condition of my hair.",
        type: "multiple_choice",
        required: true,
        options: ["I agree", "I do not agree"],
      },
    ],
  },
  {
    id: "form-texture-consultation",
    name: "Texture Consultation",
    description: "Curl, smoothing, perm, and relaxer service planning.",
    requireOnlyOnce: false,
    requireSignature: false,
    createdAt: "2026-05-23T14:00:00.000Z",
    updatedAt: "2026-05-27T11:45:00.000Z",
    questions: [
      {
        id: "q-texture-goal",
        text: "What texture result are you hoping for?",
        type: "paragraph",
        required: true,
        options: [],
      },
      {
        id: "q-heat-tools",
        text: "How often do you use hot tools?",
        type: "dropdown",
        required: true,
        options: ["Daily", "A few times per week", "A few times per month", "Rarely or never"],
      },
      {
        id: "q-prior-texture-service",
        text: "Have you had a perm, relaxer, or smoothing treatment before?",
        type: "multiple_choice",
        required: true,
        options: ["Yes", "No", "Not sure"],
      },
    ],
  },
  {
    id: "form-skin-waxing-intake",
    name: "Skin and Waxing Intake",
    description: "Skin sensitivity, medication, and waxing safety questions.",
    requireOnlyOnce: true,
    requireSignature: false,
    createdAt: "2026-05-24T12:00:00.000Z",
    updatedAt: "2026-05-27T12:30:00.000Z",
    questions: [
      {
        id: "q-skin-medications",
        text: "Are you currently using retinol, Accutane, acne medication, or prescription skin products?",
        type: "multiple_choice",
        required: true,
        options: ["Yes", "No", "Not sure"],
      },
      {
        id: "q-skin-sensitivities",
        text: "Do you have any skin sensitivities, allergies, or recent sunburn?",
        type: "paragraph",
        required: true,
        options: [],
      },
      {
        id: "q-waxing-history",
        text: "Have you been waxed before?",
        type: "multiple_choice",
        required: false,
        options: ["Yes", "No"],
      },
    ],
  },
  {
    id: "form-service-consent-signature",
    name: "Service Consent Signature",
    description: "Client acknowledgement and signature for the scheduled salon service.",
    requireOnlyOnce: false,
    requireSignature: true,
    createdAt: "2026-05-25T09:00:00.000Z",
    updatedAt: "2026-05-29T10:30:00.000Z",
    questions: [
      {
        id: "q-service-understanding",
        text: "I understand the planned service, expected result, and possible risks have been explained to me.",
        type: "multiple_choice",
        required: true,
        options: ["I agree", "I have questions"],
      },
      {
        id: "q-service-notes",
        text: "Is there anything else the service provider should know before starting?",
        type: "paragraph",
        required: false,
        options: [],
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
    requireSignature: false,
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
    requireSignature: Boolean(draft.requireSignature),
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
