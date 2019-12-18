import { NodeStore, QuadTree, Node } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'
import { computeNodeRepulsion } from './computeNodeRepulsion'

export function computeRepulsionBarnesHut(
	nodes: NodeStore,
	config: FA2Configuration,
) {
	const qt = createQuadTree(nodes)
	for (let n1 = 0; n1 < nodes.nodeCount; n1++) {
		applyQuadTreeRepulsion(qt, nodes.getNode(n1), config)
	}
}

export function createQuadTree(nodes: NodeStore): QuadTree {
	// Set up the root quad-tree region
	const [minX, maxX, minY, maxY] = nodes.getBounds()
	const width = maxX - minX
	const height = maxY - minY
	const centerX = minX + width / 2
	const centerY = minY + height / 2
	const root = new QuadTree(width, height, centerX, centerY)

	for (let n = 0; n < nodes.nodeCount; n++) {
		root.insert(nodes.getNode(n))
	}

	return root
}

function applyQuadTreeRepulsion(
	root: QuadTree,
	node: Node,
	config: FA2Configuration,
) {
	root.visit(qt => {
		if (qt.isLeaf && qt.node != null) {
			computeNodeRepulsion(node, qt.node, config)
			return true
		}
		const xDist = node.x - qt.centerOfMassX
		const yDist = node.y - qt.centerOfMassY
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
		const applyQuadForce = qt.size / distance < config.barnesHutTheta

		if (applyQuadForce) {
			const coefficient = config.scalingRatio
			const massCoeff = coefficient * node.mass * qt.mass

			//-- Linear Repulsion
			if (distance > 0) {
				// Updating nodes' dx and dy
				const factor = massCoeff / distance ** 2
				node.dx += xDist * factor
				node.dy += yDist * factor
			} else {
				console.log('Zero Distance 3')
			}
		}

		return applyQuadForce
	})
}
