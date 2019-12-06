import { Graph } from 'vivagraphjs'
import * as _ from 'underscore'
import * as agm from 'ngraph.agmgen'

export function createRandomGraph(
	communityCount: number,
	nodesCount: number,
	bridgeCount: number,
) {
	console.time('build graph')
	let graph = Graph.graph()
	let nodes = []
	let communities = _.range(communityCount)

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
	return [graph, nodes]
}
