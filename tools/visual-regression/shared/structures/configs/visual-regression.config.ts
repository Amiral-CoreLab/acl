export type VisualRegressionConfig = Record<
  string,
  Record<
    string,
    {
      browserName: string;
      percentage: number;
      base: string;
      spec: string | undefined;
      diff: string | undefined;
    }[]
  >
>;
