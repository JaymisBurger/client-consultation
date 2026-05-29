import test from "node:test";
import assert from "node:assert/strict";
import {
  createBlankForm,
  createBlankQuestion,
  deleteFormTemplate,
  initialFormTemplates,
  renderFormsListHtml,
  saveFormTemplate,
  validateFormTemplate,
} from "./formTemplates.js";

test("renders the forms list content", () => {
  const html = renderFormsListHtml(initialFormTemplates);
  assert.match(html, /Client Intake/);
  assert.match(html, /Color Consultation/);
});

test("renders the empty forms state", () => {
  assert.equal(
    renderFormsListHtml([]),
    "No forms created yet. Create your first consultation form.",
  );
});

test("adds a new form", () => {
  const draft = {
    ...createBlankForm(),
    name: "Facial Consultation",
    questions: [{ ...createBlankQuestion(), text: "What are your skin goals?" }],
  };
  const forms = saveFormTemplate([], draft, "2026-05-27T12:00:00.000Z");

  assert.equal(forms.length, 1);
  assert.equal(forms[0].name, "Facial Consultation");
  assert.equal(forms[0].createdAt, "2026-05-27T12:00:00.000Z");
});

test("edits an existing form", () => {
  const edited = {
    ...initialFormTemplates[0],
    name: "Updated Intake",
  };
  const forms = saveFormTemplate(initialFormTemplates, edited, "2026-05-27T13:00:00.000Z");

  assert.equal(forms.length, initialFormTemplates.length);
  assert.equal(forms[0].name, "Updated Intake");
  assert.equal(forms[0].updatedAt, "2026-05-27T13:00:00.000Z");
});

test("saves the require only once setting", () => {
  const draft = {
    ...createBlankForm(),
    name: "Reusable Intake",
    requireOnlyOnce: true,
  };
  const forms = saveFormTemplate([], draft, "2026-05-27T14:00:00.000Z");

  assert.equal(forms[0].requireOnlyOnce, true);
});

test("saves the request signature setting", () => {
  const draft = {
    ...createBlankForm(),
    name: "Consent Form",
    requireSignature: true,
  };
  const forms = saveFormTemplate([], draft, "2026-05-27T14:30:00.000Z");

  assert.equal(forms[0].requireSignature, true);
});

test("includes a signature-required example form", () => {
  const signatureForm = initialFormTemplates.find((form) => form.id === "form-service-consent-signature");

  assert.equal(signatureForm.name, "Service Consent Signature");
  assert.equal(signatureForm.requireSignature, true);
});

test("deletes a form after confirmation path calls delete helper", () => {
  const forms = deleteFormTemplate(initialFormTemplates, "form-client-intake");
  assert.equal(forms.some((form) => form.id === "form-client-intake"), false);
});

test("validates required form name and question text", () => {
  const question = createBlankQuestion();
  const errors = validateFormTemplate({
    ...createBlankForm(),
    questions: [question],
  });

  assert.equal(errors.form.name, "Form name is required.");
  assert.equal(errors.questions[question.id].text, "Question text is required.");
});

test("validates choice-based questions requiring options", () => {
  const question = {
    ...createBlankQuestion(),
    text: "Choose a service goal",
    type: "multiple_choice",
    options: [""],
  };
  const errors = validateFormTemplate({
    ...createBlankForm(),
    name: "Color Form",
    questions: [question],
  });

  assert.equal(errors.questions[question.id].options, "Add at least one answer option.");
});
