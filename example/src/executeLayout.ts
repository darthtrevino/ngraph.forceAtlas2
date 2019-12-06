import { createLayout } from './createLayout'
import { createRandomGraph, createJsonGraph } from './createGraph'
import { Graph } from 'vivagraphjs'
import { colors } from './colors'
import { ExecuteLayoutOptions } from './types'

export function executeLayout(
	container: HTMLDivElement,
	{ numCommunities, numNodes, numBridges, useFa2 }: ExecuteLayoutOptions,
) {
	console.log(
		`execute ${
			useFa2 ? 'fa2' : 'built-in'
		} layout with ${numNodes} nodes, ${numCommunities} communities, ${numBridges} bridges`,
	)
	// flush out the container's content
	container.innerHTML = ''
	const [graph, nodes] = createRandomGraph(numCommunities, numNodes, numBridges)
	const layout = createLayout(useFa2, graph)

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
