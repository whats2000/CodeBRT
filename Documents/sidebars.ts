import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "docs/introduction",
    {
      type: "category",
      label: "Getting Started",
      collapsed: true,
      items: [
        "docs/getting-started/installation",
        "docs/getting-started/configuration",
        "docs/getting-started/overview",
      ],
    },
    {
      type: "category",
      label: "Features",
      collapsed: true,
      items: [
        "docs/features/overview",
        {
          type: "category",
          label: "Voice Service",
          collapsed: true,
          items: [
            "docs/features/voice-service/installation",
            "docs/features/voice-service/configuration",
            "docs/features/voice-service/overview",
          ],
        },
        {
          type: "category",
          label: "Image Service",
          collapsed: true,
          items: ["docs/features/image-upload/image-upload"],
        },
        {
          type: "category",
          label: "Code Editor",
          collapsed: true,
          items: ["docs/features/code-editor/code-editor"],
        },
        {
          type: "category",
          label: "Automated Tasks",
          collapsed: true,
          items: ["docs/features/automated-tasks/automated-tasks"],
        },
      ],
    },
    {
      type: "category",
      label: "FAQ",
      collapsed: true,
      items: ["docs/faq/faq"],
    },
    {
      type: "category",
      label: "Troubleshooting",
      collapsed: true,
      items: ["docs/troubleshooting/troubleshooting"],
    },
    "docs/custom-styling",
  ],
};

export default sidebars;
