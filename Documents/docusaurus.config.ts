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
    locales: ["en"],
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
    image: "img/docusaurus-social-card.jpg",
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
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Current Not Available",
              href: "https://discordapp.com/invite/docusaurus",
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
