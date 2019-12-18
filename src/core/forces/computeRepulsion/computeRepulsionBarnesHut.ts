import { NodeStore, ppn, QuadTree } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'
import { computeNodeRepulsion } from './computeNodeRepulsion'

export function computeRepulsionBarnesHut(
	nodes: NodeStore,
	qt: QuadTree,
	config: FA2Configuration,
) {
	for (let n1 = 0; n1 < nodes.bufferLength; n1 += ppn) {
		applyQuadTreeRepulsion(qt, nodes, n1, config)
	}
}

function applyQuadTreeRepulsion(
	root: QuadTree,
	nodes: NodeStore,
	n1: number,
	config: FA2Configuration,
) {
	root.visit(qt => {
		if (qt.isLeaf) {
			if (qt.node) {
				computeNodeRepulsion(config, nodes, n1, qt.node.index)
			}
			return true
		}
		const xDist = nodes.x(n1) - qt.centerOfMassX
		const yDist = nodes.y(n1) - qt.centerOfMassY
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
		const applyQuadForce = qt.size / distance < config.barnesHutTheta

		if (applyQuadForce) {
			const coefficient = config.scalingRatio
			const massCoeff = coefficient * nodes.mass(n1) * qt.mass

			//-- Linear Repulsion
			if (distance > 0) {
				// Updating nodes' dx and dy
				const factor = massCoeff / distance ** 2
				nodes.addDx(n1, xDist * factor)
				nodes.addDy(n1, yDist * factor)
			} else {
				console.log('Zero Distance 3')
			}
		}

		return applyQuadForce
	})
}
