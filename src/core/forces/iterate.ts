import { NodeStore } from '../marshaling/NodeStore'
import { EdgeStore } from '../marshaling/EdgeStore'
import { FA2Configuration } from '../../configuration'
import { computeAttraction } from './computeAttraction'
import { applyForces } from './applyForces'
import { computeGravity } from './computeGravity'
import { computeRepulsion } from './computeRepulsion'
import { computeCollisions } from './computeCollisions'

export function iterate(
	nodes: NodeStore,
	edges: EdgeStore,
	config: FA2Configuration,
): [
	// system tension
	number,
	// system swing
	number,
	// system traction
	number,
] {
	nodes.resetDeltas()

	// Compute Forces
	computeRepulsion(nodes, config)
	computeGravity(nodes, config)
	computeAttraction(nodes, edges, config)
	computeCollisions(nodes, config)

	return applyForces(nodes, config)
}
