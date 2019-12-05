import { Graph } from 'vivagraphjs'
import { forceAtlas2 } from '../src/Layout'
import { colors } from './colors'
import * as _ from 'underscore'
const createGraph = require('ngraph.graph')
const yeast = require('./yeast.json')

export function init(communities, nodesCount, bridgeCount, force2) {
	communities = _.range(communities)
	let nodes = []
	console.time('build graph')
	let graph = createGraph()
	console.log(`adding ${yeast.graph.nodes.length} nodes`)
	yeast.graph.nodes.forEach(({ id, category }) => {
		graph.addNode(id, { category })
	})
	console.log(`adding ${yeast.graph.edges.length} edges`)
	yeast.graph.edges.forEach(({ source, target, weight }) => {
		graph.addLink(source, target, { weight })
	})
	console.timeEnd('build graph')

	let layout
	if (force2) {
		console.log('using forceatlas2 layout')
		layout = forceAtlas2(graph, {
			gravity: 1,
			linLogMode: false,
			strongGravityMode: false,
			slowDown: 1,
			outboundAttractionDistribution: false,
			iterationsPerRender: 500,
			barnesHutOptimize: false,
			barnesHutTheta: 0.5,
			worker: true,
		})
	} else {
		console.log('using built-in force-directed')
		layout = Graph.Layout.forceDirected(graph, {
			springLength: 30,
			springCoeff: 0.0008,
			dragCoeff: 0.01,
			gravity: -1.2,
			theta: 1,
		})
	}

	const graphics = Graph.View.webglGraphics()
	const squareNode = Graph.View.webglSquare

	graphics.node(({ id, data: { category } }) =>
		squareNode(15, colors[category]),
	)

	let renderer = Graph.View.renderer(graph, {
		renderLinks: false,
		layout: layout,
		graphics: graphics,
		container: document.querySelector('#cont'),
	})

	renderer.run(Infinity)
	return renderer
}

const NODE_ALPHA = 'FF'
