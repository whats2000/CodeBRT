import React from "react";
import clsx from "clsx";
import Translate, { translate } from "@docusaurus/Translate";

import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: translate({
      id: "homepage.feature.multiple_models.title",
      message: "Multiple Models",
      description: "The multiple models feature of CodeBRT",
    }),
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <Translate
        id="homepage.feature.multiple_models.description"
        description="The multiple models feature of CodeBRT"
      >
        CodeBRT provides a variety of large language models for users to choose.
      </Translate>
    ),
  },
  {
    title: translate({
      id: "homepage.feature.high_degree_of_freedom.title",
      message: "High degree of freedom",
      description: "The high degree of freedom feature of CodeBRT",
    }),
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <Translate
        id="homepage.feature.high_degree_of_freedom.description"
        description="The high degree of freedom feature of CodeBRT"
      >
        CodeBRT has great freedom for users to customize their usage.
      </Translate>
    ),
  },
  {
    title: translate({
      id: "homepage.feature.based_on_vscode.title",
      message: "Based on VSCode",
      description: "The based on VSCode feature of CodeBRT",
    }),
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: (
      <Translate
        id="homepage.feature.based_on_vscode.description"
        description="The based on VSCode feature of CodeBRT"
      >
        The extension on VSCode, which allow you to use more efficiently.
      </Translate>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
