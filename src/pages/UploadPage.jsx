import React, { useState } from "react";
import Uploader from "../components/Uploader.jsx";
import { COMMON_REGEX_SCENARIOS, getRegexValidationState } from "../lib/regexHelpers.js";

const TEMPLATE_OPTIONS = [
  { id: "passport", label: "Passport Number", ruleLabel: "Passport Number", pattern: "^[A-Z]{2}\\d{7}$", example: "AB1234567" },
  { id: "project", label: "Internal Project Code", ruleLabel: "Project Code", pattern: "^PROJ-\\d{4}$", example: "PROJ-1234" },
  { id: "employee", label: "Employee ID", ruleLabel: "Employee ID", pattern: "^[A-Z]{3}-\\d{4}$", example: "EMP-4821" },
  { id: "advanced", label: "Advanced (blank)", ruleLabel: "", pattern: "", example: "" },
];

export default function UploadPage({
  onFiles,
  customRules,
  onAddCustomRule,
  onRemoveCustomRule,
  status,
  progress,
  progressStage,
  error,
  scanIndex,
  scanTotal,
  scanQueue,
  currentScan,
  ocrLanguage,
  setOcrLanguage,
}) {
  const [templateId, setTemplateId] = useState("advanced");
  const [ruleLabel, setRuleLabel] = useState("");
  const [pattern, setPattern] = useState("");
  const [sample, setSample] = useState("");

  const validation = getRegexValidationState(pattern, sample);

  const applyTemplate = (template) => {
    setTemplateId(template.id);
    setRuleLabel(template.ruleLabel);
    setPattern(template.pattern);
    setSample(template.example);
  };

  return (
    <div className="page page--narrow">
      <p className="hero__eyebrow mono">STEP 1 OF 2</p>
      <h1 className="page-title">Upload screenshots or PDFs</h1>
      <p className="page-sub">
        JPG, JPEG, PNG, or PDF. Upload one or more files. The scan runs fully offline once the page and models are cached — you can test this by switching to airplane mode after the first scan.
      </p>

      <Uploader onFiles={onFiles} disabled={status === "processing"} />

      {error && <p className="upload-error">{error}</p>}

      {status === "processing" && (
        <div className="progress-card">
          <p className="page-sub mono" style={{ marginTop: 0 }}>
            Scanning image {scanIndex} of {scanTotal}
          </p>
          {scanQueue?.length > 1 && (
            <p className="queue-summary mono">Queued scans: {scanQueue.length}. Next: {scanQueue[currentScan] || scanQueue[0]}</p>
          )}
          <div className="progress-stack">
            <ProgressRow label="Reading text (OCR)" active={progressStage === "ocr"} pct={progress.ocr} />
            <ProgressRow label="Scanning for QR codes" active={progressStage === "qr"} pct={progress.qr} />
            <ProgressRow label="Detecting faces" active={progressStage === "faces"} pct={progress.faces} />
            <ProgressRow label="Matching sensitive patterns" active={progressStage === "pii"} pct={progress.pii} />
          </div>
        </div>
      )}

      <CustomRulePanel
        rules={customRules}
        onAddCustomRule={onAddCustomRule}
        templateId={templateId}
        pattern={pattern}
        ruleLabel={ruleLabel}
        sample={sample}
        validation={validation}
        applyTemplate={applyTemplate}
        onRuleLabelChange={setRuleLabel}
        onPatternChange={setPattern}
        onSampleChange={setSample}
        onRemoveCustomRule={onRemoveCustomRule}
      />

      <div className="ocr-row">
        <label className="ocr-field">
          OCR language
          <select value={ocrLanguage} onChange={(e) => setOcrLanguage(e.target.value)} className="input">
            <option value="eng">English (eng)</option>
            <option value="hin">Hindi (hin)</option>
            <option value="tam">Tamil (tam)</option>
            <option value="spa">Spanish (spa)</option>
            <option value="fra">French (fra)</option>
            <option value="deu">German (deu)</option>
            <option value="ita">Italian (ita)</option>
            <option value="por">Portuguese (por)</option>
            <option value="rus">Russian (rus)</option>
            <option value="ara">Arabic (ara)</option>
            <option value="chi_sim">Chinese Simplified (chi_sim)</option>
            <option value="jpn">Japanese (jpn)</option>
            <option value="kor">Korean (kor)</option>
          </select>
        </label>
      </div>

    </div>
  );
}

function CustomRulePanel({
  rules,
  onAddCustomRule,
  templateId,
  pattern,
  ruleLabel,
  sample,
  validation,
  applyTemplate,
  onRuleLabelChange,
  onPatternChange,
  onSampleChange,
  onRemoveCustomRule,
}) {
  const [color, setColor] = useState("#ff5d5d");
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const addRule = () => {
    if (!ruleLabel.trim() || !pattern.trim()) return;

    let regexp;
    try {
      regexp = new RegExp(pattern, "i");
    } catch (err) {
      return;
    }

    onAddCustomRule({
      id: `CUSTOM_${Date.now()}`,
      label: ruleLabel.trim(),
      color,
      maxWindow: 1,
      test: (joined) => regexp.test(joined),
      lowPriority: false,
    });
    onRuleLabelChange("");
    onPatternChange("");
    onSampleChange("");
    setColor("#ff5d5d");
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario.id);
    onPatternChange(scenario.pattern);
    onSampleChange(scenario.example);
  };

  return (
    <div className="custom-rules-panel">
      <div className="custom-rules-panel__header">
        <h3 className="section-title" style={{ marginBottom: 12, marginTop: 28 }}>
          Create a Custom Filter
        </h3>
        <p className="page-sub">Add a rule to catch additional IDs or values before sharing.</p>
      </div>

      <div className="inline-row">
        <label className="template-label">Quick Templates</label>
        <select
          className="template-select"
          value={templateId}
          onChange={(e) => applyTemplate(TEMPLATE_OPTIONS.find((opt) => opt.id === e.target.value))}
        >
          {TEMPLATE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <p className="micro-copy">Use the quick templates to prefill a rule label, regex, and sample text. Then test it before adding.</p>

      <div className="custom-rules-panel__form">
        <label>
          Rule label
          <input
            className="input"
            placeholder="e.g. Passport number"
            value={ruleLabel}
            onChange={(e) => onRuleLabelChange(e.target.value)}
          />
        </label>

        <label>
          <span className="field-label-row">
            <span>Pattern to match (Regular Expression)</span>
            <button
              className="icon-button"
              type="button"
              onClick={() => setShowCheatSheet((open) => !open)}
              aria-label="Toggle regex cheat sheet"
            >
              ⓘ
            </button>
          </span>
          <div className="label-inline">
            <input
              className="input"
              placeholder="e.g. ^[A-Z]{2}\d{7}$"
              value={pattern}
              onChange={(e) => onPatternChange(e.target.value)}
            />
          </div>
        </label>
      </div>

      <div className="scenario-picker" role="listbox" aria-label="Common regex scenarios">
        {COMMON_REGEX_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={`scenario-pill ${selectedScenario === scenario.id ? "selected" : ""}`}
            onClick={() => handleScenarioSelect(scenario)}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {showCheatSheet && (
        <div className="cheat-sheet">
          <p className="cheat-sheet__title">Common regex shortcuts</p>
          <ul>
            <li><strong>\\d</strong> — any digit</li>
            <li><strong>\\w</strong> — letters, digits, or underscore</li>
            <li><strong>\\s</strong> — whitespace</li>
            <li><strong>{"{4}"}</strong> — repeat the previous item 4 times</li>
            <li><strong>^</strong> and <strong>$</strong> — start and end of the string</li>
            <li><strong>[A-Z]</strong> — any uppercase letter</li>
          </ul>
        </div>
      )}

      <p className="micro-copy">Not sure how to write regex? Select a quick template above or tap a common scenario to fill a starter pattern.</p>

      <div className="custom-rules-panel__test">
        <label>
          Test pattern sample
          <input
            className="input"
            placeholder="Type sample text to test your rule"
            value={sample}
            onChange={(e) => onSampleChange(e.target.value)}
          />
        </label>
        {validation && (
          <div className={`validation-message ${validation.status}`}>
            {validation.message}
          </div>
        )}
      </div>

      <div className="custom-rules-panel__form">
        <input className="color-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button className="btn btn--primary" type="button" onClick={addRule}>
          Add rule
        </button>
      </div>

      {rules.length > 0 && (
        <div className="custom-rules-panel__list">
          {rules.map((rule) => (
            <div key={rule.id} className="custom-rule-chip" style={{ borderColor: rule.color }}>
              <span>{rule.label}</span>
              <button type="button" className="chip-remove" onClick={() => onRemoveCustomRule(rule.id)} aria-label={`Remove ${rule.label}`}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, pct = 0, active }) {
  return (
    <div className={`progress-row ${active ? "progress-row--active" : ""}`}>
      <span className="progress-row__label mono">{label}</span>
      <div className="progress-row__track">
        <div className="progress-row__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-row__pct mono">{pct}%</span>
    </div>
  );
}
