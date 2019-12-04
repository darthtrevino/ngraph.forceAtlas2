import { Graph } from 'vivagraphjs'
import { forceAtlas2 } from '../src/Layout'
import { colors } from './colors'
import * as agm from 'ngraph.agmgen'
import * as _ from 'underscore'

export function init(communities, nodesCount, bridgeCount, force2) {
	communities = _.range(communities)
	let nodes = []
	let graph = Graph.graph()

	console.time('build graph')
	for (let i = 0, c; i < nodesCount; i++) {
		c = _.random(communities.length - 1)
		graph.addLink('n' + i, 'community' + c)
		nodes[i] = c
	}
	for (let j = 0, n, cs; j < bridgeCount; j++) {
		n = _.random(nodesCount - 1)
		cs = _.difference(communities, [nodes[n]])
		graph.addLink('n' + n, 'community' + cs[_.random(cs.length)])
	}
	console.time('build graphEnd')

	console.time('agm')
	graph = agm(graph, {
		coefficient: 0.3,
		scale: 1,
	})
	console.time('agm')

	let layout
	if (force2)
		layout = forceAtlas2(graph, {
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
