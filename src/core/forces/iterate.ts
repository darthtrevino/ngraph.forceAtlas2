import { Nodes, ppn } from '../data_structures/Nodes'
import { Edges } from '../data_structures/Edges'
import { FA2Configuration, DEFAULT_CONFIGURATION } from '../../configuration'
import { prepareBarnesHutOptimization } from './prepareBarnesHutOptimization'
import { computeRepulsionBarnesHut } from './computeRepulsionBarnesHut'
import { computeRepulsion } from './computeRepulsion'
import { computeAttraction } from './computeAttraction'
import { applyForces } from './applyForces'
import { computeGravity } from './computeGravity'

export function iterate(
	nodes: Nodes,
	edges: Edges,
	_config: Partial<FA2Configuration>,
) {
	const config: FA2Configuration = { ...DEFAULT_CONFIGURATION, ..._config }

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
