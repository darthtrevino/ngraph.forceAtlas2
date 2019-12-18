import { NodeStore, ppn } from '../marshaling'
import { FA2Configuration } from '../../configuration'

export function computeGravity(nodes: NodeStore, config: FA2Configuration) {
	for (let n = 0; n < nodes.bufferLength; n += ppn) {
		// Common to both methods
		const xDist = nodes.x(n)
		const yDist = nodes.y(n)
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
		const factor = getGravityFactor(nodes, n, distance, config)

		// Updating node's dx and dy
		nodes.subDx(n, xDist * factor)
		nodes.subDy(n, yDist * factor)
	}
}

function getGravityFactor(
	nodes: NodeStore,
	n: number,
	distance: number,
	config: FA2Configuration,
) {
	const scaledGravity = config.gravity / config.scalingRatio

	const coefficient = config.scalingRatio
	const g = scaledGravity

	let factor = 0
	if (config.strongGravityMode) {
		// strong gravity
		if (distance > 0) {
			factor = coefficient * nodes.mass(n) * g
		}
	} else {
		// linear anti-collision repulsion
		if (distance > 0) {
			factor = (coefficient * nodes.mass(n) * g) / distance
		}
	}
	return factor
}
