export async function getSetupChecklist() {
  return {
    items: [
      {
        id: "install",
        title: "Install Base UI",
        description:
          "Install Base UI using: npm i @base-ui-components/react\n\nAll components are included in a single package. Base UI is tree-shakeable, so your app bundle will contain only the components that you actually use.\n\n@https://base-ui.com/react/overview/quick-start for more info",
        required: true,
        checkCommand: "npm i @base-ui-components/react",
      },
      {
        id: "react-version",
        title: "Ensure React is Installed",
        description:
          "Ensure React 17+ is installed and available in your project",
        required: true,
        checkCommand: "npm list react",
      },
    ],
    troubleshooting: [
      {
        issue: "Need installation help?",
        solution:
          "Visit the Base UI quick start guide at https://base-ui.com/react/overview/quick-start for complete setup instructions.",
      },
    ],
  };
}
