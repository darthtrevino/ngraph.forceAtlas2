const createGraph = require('ngraph.graph')
const yeast = require('./yeast.json')

export function createJsonGraph() {
	let graph = createGraph()
	console.log(`adding ${yeast.graph.nodes.length} nodes`)
	yeast.graph.nodes.forEach(({ id, size, category }) => {
		graph.addNode(id, { category, size })
	})
	console.log(`adding ${yeast.graph.edges.length} edges`)
	yeast.graph.edges.forEach(({ source, target, weight }) => {
		graph.addLink(source, target, { weight })
	})
	return [graph, []]
}
