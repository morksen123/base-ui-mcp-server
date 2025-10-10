export interface SetupChecklist {
  items: Array<{
    id: string;
    title: string;
    description: string;
    required: boolean;
    checkCommand?: string;
  }>;
  troubleshooting: Array<{
    issue: string;
    solution: string;
  }>;
}

export async function getSetupChecklist(): Promise<SetupChecklist> {
  return {
    items: [
      {
        id: "quick-start",
        title: "Base UI Quick Start Guide",
        description:
          "Follow the official Base UI quick start guide for installation and setup instructions.",
        required: true,
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
