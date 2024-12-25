import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "CodeBRT",
  tagline:
    "A free and open-source tool for improved code quality and productivity with artificial intelligence.",
  favicon: "img/favicon.ico",

  // Production URL of your site
  url: "https://whats2000.github.io",
  // Set the base URL for GitHub Pages deployment
  baseUrl: "/CodeBRT/",

  // GitHub pages deployment config
  organizationName: "whats2000", // Your GitHub org/user name.
  projectName: "CodeBRT", // Your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh-TW", "zh-CN"],
    localeConfigs: {
      en: {
        label: "English",
        direction: "ltr",
      },
      "zh-TW": {
        label: "繁體中文",
        direction: "ltr",
      },
      "zh-CN": {
        label: "简体中文",
        direction: "ltr",
      },
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.ts"),
          routeBasePath: "/",
          editUrl: "https://github.com/whats2000/CodeBRT/tree/main/Documents",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/codebrt-social-card.png",
    metadata: [
      {
        name: "description",
        content:
          "CodeBRT is a free and open-source tool for improved code quality and productivity with artificial intelligence.",
      },
      {
        name: "keywords",
        content:
          "CodeBRT, Code, AI, Code Quality, Productivity, Open Source, Free, AI Code Editor, AI Code Completion, AI Code Generation",
      },
    ],
    navbar: {
      title: "CodeBRT",
      logo: {
        alt: "CodeBRT Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Documentation",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/whats2000/CodeBRT/",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs/introduction",
            },
            {
              label: "Getting Started",
              to: "/docs/getting-started/installation",
            },
            {
              label: "Features",
              to: "/docs/features/overview",
            },
          ],
        },
        {
          title: "Community and Support",
          items: [
            {
              label: "Bug Reports and Feature Requests",
              href: "https://github.com/whats2000/CodeBRT/issues",
            },
            {
              label: "GitHub Discussions Forum",
              href: "https://github.com/whats2000/CodeBRT/discussions",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/whats2000/CodeBRT",
            },
            {
              label: "Issues Board",
              href: "https://github.com/users/whats2000/projects/2/views/3",
            },
            {
              label: "VSCode Marketplace",
              href: "https://marketplace.visualstudio.com/items?itemName=whats2000.code-brt",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CodeBRT Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
