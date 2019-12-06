import { forceAtlas2 } from '../src/Layout'
import { Graph } from 'vivagraphjs'

export function createLayout(fa2: boolean, graph: any) {
	if (fa2) {
		console.log('using forceatlas2 layout')
		return forceAtlas2(graph, {
			gravity: 1,
			linLogMode: false,
			strongGravityMode: false,
			slowDown: 1,
			outboundAttractionDistribution: false,
			iterationsPerRender: 1,
			barnesHutOptimize: false,
			barnesHutTheta: 0.5,
			worker: true,
		})
	} else {
		console.log('using built-in force-directed')
		return Graph.Layout.forceDirected(graph, {
			springLength: 30,
			springCoeff: 0.0008,
			dragCoeff: 0.01,
			gravity: -1.2,
			theta: 1,
		})
	}
}
