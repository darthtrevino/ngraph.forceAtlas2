import { ppn, NodeStore } from '../marshaling'
import { FA2Configuration } from '../../configuration'

/**
 * O(n^2) repulsion - check force against all nodes
 */
export function computeRepulsionUnoptimized(
	nodes: NodeStore,
	config: FA2Configuration,
) {
	let coefficient = config.scalingRatio
	let xDist, yDist, factor, distance, massCoeff

	// Square iteration
	for (let n1 = 0; n1 < nodes.length; n1 += ppn) {
		for (let n2 = 0; n2 < n1; n2 += ppn) {
			// Common to both methods
			xDist = nodes.x(n1) - nodes.x(n2)
			yDist = nodes.y(n1) - nodes.y(n2)
			massCoeff = coefficient * nodes.mass(n1) * nodes.mass(n2)

			if (config.adjustSize) {
				//-- Anticollision Linear Repulsion
				distance =
					Math.sqrt(xDist ** 2 + yDist ** 2) - nodes.size(n1) - nodes.size(n2)

				if (distance > 0) {
					// Updating nodes' dx and dy
					factor = massCoeff / distance ** 2
					nodes.addDx(n1, xDist * factor)
					nodes.addDy(n1, yDist * factor)
					nodes.addDx(n2, xDist * factor)
					nodes.addDy(n2, yDist * factor)
				} else if (distance < 0) {
					// Updating nodes' dx and dy
					factor = 100 * massCoeff
					nodes.addDx(n1, xDist * factor)
					nodes.addDy(n1, yDist * factor)
					nodes.subDx(n2, xDist * factor)
					nodes.subDy(n2, yDist * factor)
				}
			} else {
				//-- Linear Repulsion
				distance = Math.sqrt(xDist ** 2 + yDist ** 2)
				if (distance > 0) {
					// Updating nodes' dx and dy
					factor = massCoeff / distance ** 2
					nodes.addDx(n1, xDist * factor)
					nodes.addDy(n1, yDist * factor)
					nodes.subDx(n2, xDist * factor)
					nodes.subDy(n2, yDist * factor)
				}
			}
		}
	}
}
