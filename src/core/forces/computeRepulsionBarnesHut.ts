import { NodeStore, ppn, RegionStore } from '../marshaling'
import { FA2Configuration } from '../../configuration'

export function computeRepulsionBarnesHut(
	nodes: NodeStore,
	regions: RegionStore,
	config: FA2Configuration,
) {
	let coefficient = config.scalingRatio
	let distance, factor, factorCoeff

	// Applying repulsion through regions
	for (let n = 0; n < nodes.length; n += ppn) {
		// Computing leaf quad nodes iteration

		let r = 0 // Starting with root region
		while (true) {
			if (regions.firstChild(r) >= 0) {
				// The region has sub-regions

				// We run the Barnes Hut test to see if we are at the right distance
				distance = Math.sqrt(
					nodes.x(n) -
						regions.massCenterX(r) ** 2 +
						nodes.y(n) -
						regions.massCenterY(r) ** 2,
				)

				factorCoeff = coefficient * nodes.mass(n) * regions.mass(r)

				if ((2 * regions.size(r)) / distance < config.barnesHutTheta) {
					// We treat the region as a single body, and we repulse
					let xDist = nodes.x(n) - regions.massCenterX(r)
					let yDist = nodes.y(n) - regions.massCenterY(r)

					if (config.adjustSize) {
						//-- Linear Anti-collision Repulsion
						if (distance > 0) {
							factor = factorCoeff / distance ** 2
							nodes.addDx(n, xDist * factor)
							nodes.addDy(n, yDist * factor)
						} else if (distance < 0) {
							factor = -factorCoeff / distance
							nodes.addDx(n, xDist * factor)
							nodes.addDy(n, yDist * factor)
						}
					} else {
						//-- Linear Repulsion
						if (distance > 0) {
							factor = factorCoeff / distance ** 2
							nodes.addDx(n, xDist * factor)
							nodes.addDy(n, yDist * factor)
						}
					}

					// When this is done, we iterate. We have to look at the next sibling.
					if (regions.nextSibling(r) < 0) {
						// No next sibling: we have finished the tree
						break
					}
					r = regions.nextSibling(r)
					continue
				} else {
					// The region is too close and we have to look at sub-regions
					r = regions.firstChild(r)
					continue
				}
			} else {
				let xDist
				let yDist
				let distance
				let factor
				// The region has no sub-region
				// If there is a node r[0] and it is not n, then repulse

				if (regions.node(r) >= 0 && regions.node(r) !== n) {
					xDist = nodes.x(n) - nodes.x(regions.node(r))
					yDist = nodes.y(n) - nodes.y(regions.node(r))
					distance = Math.sqrt(xDist ** 2 + yDist ** 2)
					factorCoeff =
						coefficient * nodes.mass(n) * nodes.mass(regions.node(r))

					if (config.adjustSize) {
						//-- Linear Anti-collision Repulsion
						if (distance > 0) {
							factor = factorCoeff / distance ** 2
							nodes.addDx(n, xDist * factor)
							nodes.addDy(n, yDist * factor)
						} else if (distance < 0) {
							factor = -factorCoeff / distance
							nodes.addDx(n, xDist * factor)
							nodes.addDy(n, yDist * factor)
						}
					} else {
						//-- Linear Repulsion
						if (distance > 0) {
							factor = factorCoeff / distance ** 2
							nodes.addDx(n, xDist * factor)
							nodes.addDy(n, yDist * factor)
						}
					}
				}

				// When this is done, we iterate. We have to look at the next sibling.
				if (regions.nextSibling(r) < 0) {
					// No next sibling: we have finished the tree
					break
				}
				r = regions.nextSibling(r)
				continue
			}
		}
	}
}
