import { NodeStore, ppn, QuadTree } from '../marshaling'
import { FA2Configuration } from '../../configuration'
import { applyNodeRepulsion } from './applyNodeRepulsion'

export function computeRepulsionBarnesHut(
	nodes: NodeStore,
	qt: QuadTree,
	config: FA2Configuration,
) {
	for (let n1 = 0; n1 < nodes.length; n1 += ppn) {
		applyQuadTreeRepulsion(qt, nodes, n1, config)
	}
}

function applyQuadTreeRepulsion(
	qt: QuadTree,
	nodes: NodeStore,
	n1: number,
	config: FA2Configuration,
) {
	if (qt.isLeaf) {
		applyNodeRepulsion(config, nodes, n1, qt.node)
	} else {
		const xDist = nodes.x(n1) - qt.centerOfMassX
		const yDist = nodes.y(n1) - qt.centerOfMassY
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)

		if (qt.size / distance < config.barnesHutTheta) {
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
		} else {
			applyQuadTreeRepulsion(qt.nwChild, nodes, n1, config)
			applyQuadTreeRepulsion(qt.neChild, nodes, n1, config)
			applyQuadTreeRepulsion(qt.swChild, nodes, n1, config)
			applyQuadTreeRepulsion(qt.seChild, nodes, n1, config)
		}
	}
}
