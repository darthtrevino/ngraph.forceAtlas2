export interface FA2Configuration {
  adjustSize: boolean;
  linLogMode: boolean;
  outboundAttractionDistribution: boolean;
  adjustSizes: boolean;
  edgeWeightInfluence: number;
  scalingRatio: number;
  strongGravityMode: boolean;
  gravity: number;
  slowDown: number;
  barnesHutOptimize: boolean;
  barnesHutTheta: number;
  startingIterations: number;
  iterationsPerRender: number;
}

export const DEFAULT_CONFIGURATION: FA2Configuration = {
  adjustSize: false,
  linLogMode: false,
  outboundAttractionDistribution: false,
  adjustSizes: false,
  edgeWeightInfluence: 0,
  scalingRatio: 1,
  strongGravityMode: false,
  gravity: 1,
  slowDown: 1,
  barnesHutOptimize: false,
  barnesHutTheta: 0.5,
  startingIterations: 1,
  iterationsPerRender: 1
};
