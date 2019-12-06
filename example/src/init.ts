import { Graph } from 'vivagraphjs'
import { colors } from './colors'
import { createRandomGraph, createJsonGraph } from './createGraph'
import { createLayout } from './createLayout'

export function init(
	communities: number,
	nodesCount: number,
	bridgeCount: number,
	fa2: boolean,
) {
	const container = document.querySelector('#cont')
	const [graph, nodes] = createRandomGraph(communities, nodesCount, bridgeCount)
	// const [graph, nodes] = createJsonGraph()
	console.log('using graph', graph)

	const layout = createLayout(fa2, graph)

	const graphics = Graph.View.webglGraphics()
	const drawSquare = Graph.View.webglSquare
	const drawLine = Graph.View.webglLine

	/**
	 * Set up node rendering
	 */
	graphics.node(({ id, data }) => {
		const size = (data && data.size) || DEFAULT_SIZE
		const category = (data && data.category) || nodes[id.slice(1)]
		return drawSquare(size, colors[category])
	})
	graphics.link(() => drawLine('#FFFFFF0C'))

	let renderer = Graph.View.renderer(graph, {
		renderLinks: false,
		layout,
		graphics,
		container,
	})

	renderer.run(Infinity)
	return renderer
}

const DEFAULT_SIZE = 15
