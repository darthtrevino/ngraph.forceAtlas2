import { Node, NodeStore, QuadTree } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'
import { computeNodeRepulsion } from './computeNodeRepulsion'

export function computeRepulsionBarnesHut(
	nodes: NodeStore,
	qt: QuadTree,
	config: FA2Configuration,
) {
	for (let n = 0; n < nodes.nodeCount; n++) {
		applyQuadTreeRepulsion(qt, nodes.getNode(n), config)
	}
}

function applyQuadTreeRepulsion(
	root: QuadTree,
	n1: Node,
	config: FA2Configuration,
) {
	root.visit(qt => {
		if (qt.isLeaf) {
			if (qt.node) {
				computeNodeRepulsion(n1, qt.node, config)
			}
			return true
		}
		const xDist = n1.x - qt.centerOfMassX
		const yDist = n1.y - qt.centerOfMassY
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
		const applyQuadForce = qt.size / distance < config.barnesHutTheta

		if (applyQuadForce) {
			const coefficient = config.scalingRatio
			const massCoeff = coefficient * n1.mass * qt.mass

			//-- Linear Repulsion
			if (distance > 0) {
				// Updating nodes' dx and dy
				const factor = massCoeff / distance ** 2
				n1.dx += xDist * factor
				n1.dy += yDist * factor
			} else {
				console.log('Zero Distance 3')
			}
		}

		return applyQuadForce
	})
}
