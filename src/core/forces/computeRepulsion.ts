import { prepareBarnesHutOptimization } from './prepareBarnesHutOptimization'
import { FA2Configuration } from '../../configuration'
import { Nodes } from '../data_structures'
import { computeRepulsionBarnesHut } from './computeRepulsionBarnesHut'

export function computeRepulsion(nodes: Nodes, config: FA2Configuration) {
	if (config.barnesHutOptimize) {
		const regions = prepareBarnesHutOptimization(nodes)
		computeRepulsionBarnesHut(nodes, regions, config)
	} else {
		computeRepulsion(nodes, config)
	}
}
