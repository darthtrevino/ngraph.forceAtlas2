import { NodeStore } from '../marshaling/NodeStore'
import { EdgeStore } from '../marshaling/EdgeStore'
import { FA2Configuration } from '../../configuration'
import { computeAttraction } from './computeAttraction'
import { applyForces } from './applyForces'
import { computeGravity } from './computeGravity'
import { computeRepulsion } from './computeRepulsion'
import { ForceMetrics } from '../types'

export function iterate(
	nodes: NodeStore,
	edges: EdgeStore,
	config: FA2Configuration,
): ForceMetrics {
	nodes.resetDeltas()

	// Compute Forces
	computeRepulsion(nodes, config)
	computeGravity(nodes, config)
	computeAttraction(nodes, edges, config)

	return applyForces(nodes, config)
}
