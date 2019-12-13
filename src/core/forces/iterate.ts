import { Nodes } from '../data_structures/Nodes'
import { Edges } from '../data_structures/Edges'
import { FA2Configuration } from '../../configuration'
import { prepareBarnesHutOptimization } from './prepareBarnesHutOptimization'
import { computeRepulsionBarnesHut } from './computeRepulsionBarnesHut'
import { computeRepulsion } from './computeRepulsion'
import { computeAttraction } from './computeAttraction'
import { applyForces } from './applyForces'
import { computeGravity } from './computeGravity'

export function iterate(nodes: Nodes, edges: Edges, config: FA2Configuration) {
	nodes.resetDeltas()
	if (config.barnesHutOptimize) {
		const regions = prepareBarnesHutOptimization(nodes)
		computeRepulsionBarnesHut(nodes, regions, config)
	} else {
		computeRepulsion(nodes, config)
	}
	computeGravity(nodes, config)
	computeAttraction(nodes, edges, config)
	applyForces(nodes, config)
}
