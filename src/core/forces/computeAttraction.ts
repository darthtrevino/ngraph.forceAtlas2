import { Nodes, Edges, ppe, ppn } from '../data_structures'
import { FA2Configuration } from '../../configuration'

export function computeAttraction(
	nodes: Nodes,
	edges: Edges,
	config: FA2Configuration,
) {
	const coefficient =
		1 *
		(config.outboundAttractionDistribution
			? getOutboundAttCompensation(nodes, config)
			: 1)

	// TODO: simplify distance
	// TODO: coefficient is always used as -c --> optimize?
	for (let e = 0; e < edges.length; e += ppe) {
		const n1 = edges.source(e)
		const n2 = edges.target(e)
		const w = edges.weight(e)

		// Edge weight influence
		const ewc = Math.pow(w, config.edgeWeightInfluence)

		// Common measures
		const xDist = nodes.x(n1) - nodes.x(n2)
		const yDist = nodes.y(n1) - nodes.y(n2)
		let distance, factor

		// Applying attraction to nodes
		if (config.adjustSizes) {
			distance = Math.sqrt(
				xDist ** 2 + yDist ** 2 - nodes.size(n1) - nodes.size(n2),
			)

			if (config.linLogMode) {
				if (config.outboundAttractionDistribution) {
					//-- LinLog Degree Distributed Anti-collision Attraction
					if (distance > 0) {
						factor =
							(-coefficient * ewc * Math.log(1 + distance)) /
							distance /
							nodes.mass(n1)
					}
				} else {
					//-- LinLog Anti-collision Attraction
					if (distance > 0) {
						factor = (-coefficient * ewc * Math.log(1 + distance)) / distance
					}
				}
			} else {
				if (config.outboundAttractionDistribution) {
					//-- Linear Degree Distributed Anti-collision Attraction
					if (distance > 0) {
						factor = (-coefficient * ewc) / nodes.mass(n1)
					}
				} else {
					//-- Linear Anti-collision Attraction
					if (distance > 0) {
						factor = -coefficient * ewc
					}
				}
			}
		} else {
			distance = Math.sqrt(xDist ** 2 + yDist ** 2)

			if (config.linLogMode) {
				if (config.outboundAttractionDistribution) {
					//-- LinLog Degree Distributed Attraction
					if (distance > 0) {
						factor =
							(-coefficient * ewc * Math.log(1 + distance)) /
							distance /
							nodes.mass(n1)
					}
				} else {
					//-- LinLog Attraction
					if (distance > 0)
						factor = (-coefficient * ewc * Math.log(1 + distance)) / distance
				}
			} else {
				if (config.outboundAttractionDistribution) {
					//-- Linear Attraction Mass Distributed
					// NOTE: Distance is set to 1 to override next condition
					distance = 1
					factor = (-coefficient * ewc) / nodes.mass(n1)
				} else {
					//-- Linear Attraction
					// NOTE: Distance is set to 1 to override next condition
					distance = 1
					factor = -coefficient * ewc
				}
			}
		}

		// Updating nodes' dx and dy
		// TODO: if condition or factor = 1?
		if (distance > 0) {
			// Updating nodes' dx and dy
			nodes.addDx(n1, xDist * factor)
			nodes.addDy(n1, yDist * factor)
			nodes.subDx(n2, xDist * factor)
			nodes.subDy(n2, yDist * factor)
		}
	}
}

function getOutboundAttCompensation(nodes: Nodes, config: FA2Configuration) {
	let outboundAttCompensation = 0
	// If outbound attraction distribution, compensate
	if (config.outboundAttractionDistribution) {
		outboundAttCompensation = 0
		for (let n = 0; n < nodes.length; n += ppn) {
			outboundAttCompensation += nodes.mass(n)
		}

		outboundAttCompensation /= nodes.length
	}
	return outboundAttCompensation
}
