/**
 * CSS Selectors for ReviewResponder Chrome Extension
 * Used for browser automation in demo video generation
 */

const SELECTORS = {
  // ===== RESPOND BUTTON (injected into review pages) =====
  respondBtn: '.rr-respond-btn',

  // ===== MAIN PANEL =====
  panel: '.rr-panel',
  panelHeader: '.rr-panel-header',
  closeBtn: '.rr-close-btn',
  logo: '.rr-logo',
  platformBadge: '.rr-platform-badge',

  // ===== BATCH MODE =====
  batchBtn: '.rr-batch-btn',
  batchCount: '.rr-batch-count',
  batchOverlay: '.rr-batch-overlay',
  batchHeader: '.rr-batch-header',
  batchStatus: '.rr-batch-status',
  batchFoundCount: '.rr-batch-found-count',
  batchToneSelect: '.rr-batch-tone',
  batchGenerateAll: '.rr-batch-generate-all',
  batchProgress: '.rr-batch-progress-bar',
  batchProgressFill: '.rr-batch-progress-fill',
  batchProgressText: '.rr-batch-progress-text',
  batchResults: '.rr-batch-results',
  batchTabs: '.rr-batch-tabs',
  batchTab: '.rr-batch-tab',
  batchCopyOne: '.rr-batch-copy-one',
  batchCopyAll: '.rr-batch-copy-all',
  batchExport: '.rr-batch-export',

  // ===== AI DETECTION =====
  reviewBox: '.rr-review-box',
  reviewText: '.rr-review-text',
  sentiment: '.rr-sentiment',
  language: '.rr-language',
  aiRecommendation: '.rr-ai-recommendation',
  aiRecEmoji: '.rr-ai-rec-emoji',
  aiRecLabel: '.rr-ai-rec-label',
  aiRecUse: '.rr-ai-rec-use',
  aiRecOther: '.rr-ai-rec-other',
  smartChips: '.rr-smart-chips',

  // ===== TONE SELECTION =====
  toneSliderContainer: '.rr-tone-slider-container',
  toneSlider: '.rr-tone-slider',
  toneCurrent: '.rr-tone-current',
  toneEmoji: '.rr-tone-emoji',
  toneName: '.rr-tone-name',

  // ===== GENERATE BUTTONS =====
  generateBtn: '.rr-generate-btn',
  btnLoading: '.rr-btn-loading',
  variationsBtn: '.rr-variations-btn',
  varLoading: '.rr-var-loading',

  // ===== RESPONSE SECTION =====
  responseSection: '.rr-response-section',
  variationsTabs: '.rr-variations-tabs',
  varTab: '.rr-var-tab',
  varTabA: '.rr-var-tab[data-var="a"]',
  varTabB: '.rr-var-tab[data-var="b"]',
  varTabC: '.rr-var-tab[data-var="c"]',
  responseTextarea: '.rr-response-textarea',

  // ===== QUALITY & METRICS =====
  qualityBadge: '.rr-quality-badge',
  qualityIndicator: '.rr-quality-indicator',
  qualityLabel: '.rr-quality-label',
  charCounter: '.rr-char-counter',
  charCount: '.rr-char-count',
  charLimit: '.rr-char-limit',

  // ===== QUICK ACTIONS =====
  quickTones: '.rr-quick-tones',
  quickTonePro: '.rr-quick-tone[data-tone="professional"]',
  quickToneFriendly: '.rr-quick-tone[data-tone="friendly"]',
  quickToneFormal: '.rr-quick-tone[data-tone="formal"]',
  quickToneSorry: '.rr-quick-tone[data-tone="apologetic"]',
  quickEdits: '.rr-quick-edits',
  editChipShorter: '.rr-edit-chip[data-edit="shorter"]',
  editChipLonger: '.rr-edit-chip[data-edit="longer"]',
  editChipEmoji: '.rr-edit-chip[data-edit="emoji"]',

  // ===== ACTION BUTTONS =====
  copyBtn: '.rr-copy-btn',
  doneBtn: '.rr-done-btn',
  pasteBtn: '.rr-paste-btn',
  submitBtn: '.rr-submit-btn',
  regenerateBtn: '.rr-regenerate-btn',

  // ===== TEMPLATES =====
  templatesBtn: '.rr-templates-btn',
  templatesOverlay: '.rr-templates-overlay',
  templatesHeader: '.rr-templates-header',
  tplTabMy: '.rr-tpl-tab[data-tab="my"]',
  tplTabLibrary: '.rr-tpl-tab[data-tab="library"]',
  templatesList: '.rr-templates-list',
  templateItem: '.rr-template-item',
  templateUse: '.rr-template-use',
  libraryList: '.rr-library-list',
  libraryItem: '.rr-library-item',
  librarySearch: '.rr-library-search',
  saveTemplate: '.rr-save-template',

  // ===== DRAFTS & HISTORY =====
  draftsBtn: '.rr-drafts-btn',
  draftsOverlay: '.rr-drafts-overlay',
  draftsList: '.rr-drafts-list',
  historyBtn: '.rr-history-btn',
  historyOverlay: '.rr-history-overlay',
  historyList: '.rr-history-list',

  // ===== SETTINGS =====
  settingsToggle: '.rr-settings-toggle',
  settingsOverlay: '.rr-settings-overlay',
  settingsBody: '.rr-settings-body',
  settingsEmojiToggle: '.rr-settings-emoji-toggle',
  settingsAutocopyToggle: '.rr-settings-autocopy-toggle',
  settingsTurboToggle: '.rr-settings-turbo-toggle',

  // ===== TURBO MODE =====
  turboBtn: '.rr-turbo-btn',
  turboPanel: '.rr-turbo-panel',

  // ===== THEME =====
  themeToggle: '.rr-theme-toggle',
  themeDropdown: '.rr-theme-dropdown',
  themeLight: '.rr-theme-option[data-theme="light"]',
  themeDark: '.rr-theme-option[data-theme="dark"]',
  themeAuto: '.rr-theme-option[data-theme="auto"]',

  // ===== ANALYTICS WIDGET =====
  analyticsWidget: '.rr-analytics-widget',
  analyticsHeader: '.rr-analytics-header',
  statWeek: '.rr-stat-week',
  statTotal: '.rr-stat-total',
  sparkline: '.rr-sparkline',

  // ===== HELP =====
  helpBtn: '.rr-help-btn',
  helpOverlay: '.rr-help-overlay',
  keyboardHelp: '.rr-keyboard-help',
  shortcutsHint: '.rr-shortcuts-hint',

  // ===== TOAST NOTIFICATIONS =====
  toast: '.rr-toast',

  // ===== GOOGLE MAPS SPECIFIC =====
  gmReviewReply: '[data-review-id] [aria-label*="Reply"]',
  gmReplyTextarea: 'textarea[aria-label*="Reply"]',
};

module.exports = SELECTORS;
