import { NodeStore } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'

export function computeNodeRepulsion(
	config: FA2Configuration,
	nodes: NodeStore,
	n1: number,
	n2: number,
) {
	const coefficient = config.scalingRatio

	// Common to both methods
	const xDist = nodes.x(n1) - nodes.x(n2)
	const yDist = nodes.y(n1) - nodes.y(n2)
	const massCoeff = coefficient * nodes.mass(n1) * nodes.mass(n2)

	if (config.adjustSize) {
		//-- Anticollision Linear Repulsion
		let distance =
			Math.sqrt(xDist ** 2 + yDist ** 2) - nodes.size(n1) - nodes.size(n2)

		if (distance > 0) {
			// Updating nodes' dx and dy
			let factor = massCoeff / distance ** 2
			nodes.addDx(n1, xDist * factor)
			nodes.addDy(n1, yDist * factor)
			nodes.addDx(n2, xDist * factor)
			nodes.addDy(n2, yDist * factor)
		} else if (distance < 0) {
			// Updating nodes' dx and dy
			let factor = 100 * massCoeff
			nodes.addDx(n1, xDist * factor)
			nodes.addDy(n1, yDist * factor)
			nodes.subDx(n2, xDist * factor)
			nodes.subDy(n2, yDist * factor)
		} else {
			console.log('Zero Distance 2')
		}
	} else {
		//-- Linear Repulsion
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
		if (distance > 0) {
			// Updating nodes' dx and dy
			const factor = massCoeff / distance ** 2
			nodes.addDx(n1, xDist * factor)
			nodes.addDy(n1, yDist * factor)
			nodes.subDx(n2, xDist * factor)
			nodes.subDy(n2, yDist * factor)
		} else {
			// hit often
			// console.log("Zero Distance 1")
		}
	}
}
