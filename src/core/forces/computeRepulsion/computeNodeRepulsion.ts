import { Node } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'

export function computeNodeRepulsion(
	n1: Node,
	n2: Node,
	config: FA2Configuration,
) {
	const coefficient = config.scalingRatio

	// Common to both methods
	const xDist = n1.x - n2.x
	const yDist = n1.y - n2.y
	const massCoeff = coefficient * n1.mass * n2.mass

	if (config.adjustSize) {
		//-- Anticollision Linear Repulsion
		let distance = Math.sqrt(xDist ** 2 + yDist ** 2) - n1.size - n2.size

		if (distance > 0) {
			// Updating nodes' dx and dy
			let factor = massCoeff / distance ** 2
			n1.dx += xDist * factor
			n1.dy += yDist * factor
			n2.dx -= xDist * factor
			n2.dy -= yDist * factor
		} else if (distance < 0) {
			// Updating nodes' dx and dy
			let factor = 100 * massCoeff
			n1.dx += xDist * factor
			n1.dy += yDist * factor
			n2.dx -= xDist * factor
			n2.dy -= yDist * factor
		} else {
			console.log('Zero Distance 2')
		}
	} else {
		//-- Linear Repulsion
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
		if (distance > 0) {
			// Updating nodes' dx and dy
			const factor = massCoeff / distance ** 2
			n1.dx += xDist * factor
			n1.dy += yDist * factor
			n2.dx -= xDist * factor
			n2.dy -= yDist * factor
		} else {
			// hit often
			// console.log("Zero Distance 1")
		}
	}
}
