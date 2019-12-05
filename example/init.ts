import { Graph } from 'vivagraphjs'
import { forceAtlas2 } from '../src/Layout'
import { colors } from './colors'
import * as agm from 'ngraph.agmgen'
import * as _ from 'underscore'
const createGraph = require('ngraph.graph')
const yeast = require('./yeast.json')

export function init(communities, nodesCount, bridgeCount, force2) {
	communities = _.range(communities)
	let nodes = []
	console.time('build graph')
	let graph = createGraph()
	yeast.graph.nodes.forEach(({ id, size, category }) => {
		console.log('add-v')
		graph.addNode(id)
	})
	yeast.graph.edges.forEach(({ source, target, weight }) => {
		console.log('add-e')
		graph.addLink(source, target, { weight })
	})
	console.timeEnd('build graph')

	let layout
	if (force2)
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
	else
		layout = Graph.Layout.forceDirected(graph, {
			springLength: 30,
			springCoeff: 0.0008,
			dragCoeff: 0.01,
			gravity: -1.2,
			theta: 1,
		})

	let graphics = Graph.View.webglGraphics(),
		squareNode = Graph.View.webglSquare

	graphics.node(function(node) {
		return squareNode(
			15,
			Number('0x' + colors[nodes[node.id.slice(1)]].slice(1) + 'FF'),
		)
	})

	let renderer = Graph.View.renderer(graph, {
		renderLinks: false,
		layout: layout,
		graphics: graphics,
		container: document.querySelector('#cont'),
	})

	renderer.run(Infinity)
	return renderer
}
