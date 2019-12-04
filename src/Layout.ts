import { random } from 'ngraph.random'
import * as centrality from 'ngraph.centrality'
import { Supervisor } from './supervisor'
import { Rect } from './Rect'

export interface UserSettings {
	maxX: number
	maxY: number
	seed: string
}

const DEFAULT_USER_SETTINGS: UserSettings = {
	maxX: 1024,
	maxY: 1024,
	seed: 'Deterministic randomness made me do this',
}

/**
 * Does not really perform any layouting algorithm but is compliant
 * with renderer interface. Allowing clients to provide specific positioning
 * callback and get static layout of the graph
 *
 * @param {Viva.Graph.graph} graph to layout
 * @param config
 * @param {Object} userSettings
 */
export function forceAtlas2(
	graph,
	config,
	userSettings: Partial<UserSettings> = {},
) {
	userSettings = {
		...DEFAULT_USER_SETTINGS,
		...userSettings,
	}

	const rand = random(userSettings.seed)
	const layoutLinks = {}

	function generateRandomPosition() {
		return {
			x: rand.next(userSettings.maxX / 2) - rand.next(userSettings.maxX / 2),
			y: rand.next(userSettings.maxY / 2) - rand.next(userSettings.maxY / 2),
			isPinned: false,
			changed: false,
		}
	}

	const layoutNodes = Object.create(null)
	const layoutNodesArray = []
	const layoutLinksArray = []

	function initNode(node) {
		const position = generateRandomPosition()
		const nodeBody = {
			...position,
			id: node.id,
		}
		layoutNodesArray.push(nodeBody)
		layoutNodes[node.id] = nodeBody
	}

	function initLink(link) {
		layoutLinks[link.id] = link
		layoutLinksArray.push(link)
	}

	function onGraphChanged(changes) {
		console.warn('Not implemented')
		/*for (var i = 0; i < changes.length; ++i) {
             var change = changes[i];
             if (change.node) {
             if (change.changeType === 'add') {
             initNode(change.node);
             } else {
             delete layoutNodes[change.node.id];
             }
             }
             if (change.link) {
             if (change.changeType === 'add') {
             initLink(change.link);
             } else {
             delete layoutLinks[change.link.id];
             }
             }
             }*/
	}

	function getNodePosition(nodeId) {
		return layoutNodes[nodeId]
	}

	graph.forEachNode(initNode)
	graph.forEachLink(initLink)

	const degreeCentrality = centrality.degree(graph)
	graph.on('changed', onGraphChanged)

	const supervisor = new Supervisor(
		{
			nodes: layoutNodesArray,
			edges: layoutLinksArray,
			degree: degreeCentrality,
		},
		config,
	)

	return {
		config(c) {
			supervisor.configure(c)
		},

		/**
		 * Attempts to layout graph within given number of iterations.
		 *
		 * @param {integer} [iterationsCount] number of algorithm's iterations.
		 *  The constant layout ignores this parameter.
		 */
		run(iterationsCount) {
			throw new Error('not implemented')
		},

		/**
		 * One step of layout algorithm
		 */
		step() {
			if (supervisor.isPending) return
			supervisor.step()

			return false
		},

		/**
		 * Returns rectangle structure {x1, y1, x2, y2}, which represents
		 * current space occupied by graph.
		 */
		getGraphRect(): Rect {
			return supervisor.graphRect
		},

		/**
		 * Request to release all resources
		 */
		dispose(): void {
			graph.off('change', onGraphChanged)
			supervisor.kill()
		},

		isNodePinned(node): boolean {
			return layoutNodes[node.id].isPinned
		},

		/**
		 * Requests layout algorithm to pin/unpin node to its current position
		 * Pinned nodes should not be affected by layout algorithm and always
		 * remain at their position
		 */
		pinNode(node, isPinned: boolean) {
			var body = layoutNodes[node.id]
			if (body.isPinned !== isPinned) {
				body.isPinned = isPinned
				body.changed = true
			}
		},

		/**
		 * Gets position of a node by its id. If node was not seen by this
		 * layout algorithm undefined value is returned;
		 */
		getNodePosition: getNodePosition,

		/**
		 * Returns {from, to} position of a link.
		 */
		getLinkPosition(linkId) {
			var link = layoutLinks[linkId]
			return {
				from: getNodePosition(link.fromId),
				to: getNodePosition(link.toId),
			}
		},

		/**
		 * Sets position of a node to a given coordinates
		 */
		setNodePosition(nodeId, x, y) {
			var body = layoutNodes[nodeId]
			if (body) {
				body.x = x
				body.y = y
			}
			body.changed = true
		},
	}
}
