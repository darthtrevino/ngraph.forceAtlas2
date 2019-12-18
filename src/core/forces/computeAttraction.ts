import { NodeStore, EdgeStore, ppn, Edge, Node } from '../marshaling'
import { FA2Configuration } from '../../configuration'

export function computeAttraction(
	nodes: NodeStore,
	edges: EdgeStore,
	config: FA2Configuration,
) {
	const coefficient =
		1 *
		(config.outboundAttractionDistribution
			? getOutboundAttCompensation(nodes, config)
			: 1)

	// TODO: simplify distance
	// TODO: coefficient is always used as -c --> optimize?
	let edge: Edge
	let source: Node
	let target: Node
	// edge weight
	let w: number
	// edge weight influence
	let ewc: number
	let xDist: number
	let yDist: number
	let distance: number
	let factor: number

	for (let e = 0; e < edges.edgeCount; e++) {
		// Get the edge and nodes on the edge
		edge = edges.getEdge(e)
		source = nodes.getNode(edge.source)
		target = nodes.getNode(edge.target)

		// Compute necessary values
		w = edge.weight
		ewc = Math.pow(w, config.edgeWeightInfluence)
		xDist = source.x - target.x
		yDist = source.y - target.y

		// Applying attraction to nodes
		if (config.adjustSizes) {
			distance = Math.sqrt(xDist ** 2 + yDist ** 2 - source.size - target.size)

			if (config.linLogMode) {
				if (config.outboundAttractionDistribution) {
					//-- LinLog Degree Distributed Anti-collision Attraction
					if (distance > 0) {
						factor =
							(-coefficient * ewc * Math.log(1 + distance)) /
							distance /
							source.mass
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
						factor = (-coefficient * ewc) / source.mass
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
							source.mass
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
					factor = (-coefficient * ewc) / source.mass
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
			source.dx += xDist * factor
			source.dy += yDist * factor
			target.dx -= xDist * factor
			target.dy -= yDist * factor
		}
	}
}

function getOutboundAttCompensation(
	nodes: NodeStore,
	config: FA2Configuration,
) {
	let outboundAttCompensation = 0
	// If outbound attraction distribution, compensate
	if (config.outboundAttractionDistribution) {
		outboundAttCompensation = 0
		for (let n = 0; n < nodes.nodeCount; n++) {
			outboundAttCompensation += nodes.getNode(n).mass
		}
		outboundAttCompensation /= nodes.nodeCount
	}
	return outboundAttCompensation
}
