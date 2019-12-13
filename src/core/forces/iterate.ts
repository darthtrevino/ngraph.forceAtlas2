import { Nodes } from '../data_structures/Nodes'
import { Edges } from '../data_structures/Edges'
import { FA2Configuration } from '../../configuration'
import { computeAttraction } from './computeAttraction'
import { applyForces } from './applyForces'
import { computeGravity } from './computeGravity'
import { computeRepulsion } from './computeRepulsion'

export function iterate(nodes: Nodes, edges: Edges, config: FA2Configuration) {
	nodes.resetDeltas()

	// Compute Forces
	computeRepulsion(nodes, config)
	computeGravity(nodes, config)
	computeAttraction(nodes, edges, config)

	applyForces(nodes, config)
}
