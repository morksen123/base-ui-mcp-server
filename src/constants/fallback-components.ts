/**
 * Fallback list of Base UI components
 * Used when GitHub API is unavailable or rate-limited
 * This list should be periodically updated to match the actual components in the repository
 */
export const FALLBACK_COMPONENT_NAMES: readonly string[] = [
  // Accordion
  "accordion-root",
  "accordion-header",
  "accordion-item",
  "accordion-panel",
  "accordion-trigger",
  // Alert Dialog
  "alert-dialog-root",
  "alert-dialog-backdrop",
  "alert-dialog-close",
  "alert-dialog-description",
  "alert-dialog-popup",
  "alert-dialog-portal",
  "alert-dialog-title",
  "alert-dialog-trigger",
  // Avatar
  "avatar-root",
  "avatar-image",
  "avatar-fallback",
  // Checkbox
  "checkbox-root",
  "checkbox-indicator",
  // Collapsible
  "collapsible-root",
  "collapsible-trigger",
  "collapsible-content",
  // Dialog
  "dialog-root",
  "dialog-backdrop",
  "dialog-close",
  "dialog-description",
  "dialog-popup",
  "dialog-portal",
  "dialog-title",
  "dialog-trigger",
  // Field
  "field-root",
  "field-control",
  "field-description",
  "field-error",
  "field-label",
  "field-validity",
  // Input
  "input",
  // Menu
  "menu-root",
  "menu-trigger",
  "menu-portal",
  "menu-positioner",
  "menu-popup",
  "menu-item",
  "menu-arrow",
  // Popover
  "popover-root",
  "popover-trigger",
  "popover-portal",
  "popover-positioner",
  "popover-popup",
  "popover-arrow",
  "popover-backdrop",
  "popover-close",
  // Select
  "select-root",
  "select-trigger",
  "select-portal",
  "select-positioner",
  "select-popup",
  "select-option",
  "select-value",
  // Slider
  "slider-root",
  "slider-control",
  "slider-track",
  "slider-indicator",
  "slider-thumb",
  "slider-value",
  // Switch
  "switch-root",
  "switch-thumb",
  // Tabs
  "tabs-root",
  "tabs-list",
  "tabs-tab",
  "tabs-panel",
  // Tooltip
  "tooltip-root",
  "tooltip-trigger",
  "tooltip-portal",
  "tooltip-positioner",
  "tooltip-popup",
  "tooltip-arrow",
] as const;
