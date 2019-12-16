import { prepareBarnesHutOptimization } from './prepareBarnesHutOptimization'
import { FA2Configuration } from '../../configuration'
import { NodeStore } from '../marshaling'
import { computeRepulsionBarnesHut } from './computeRepulsionBarnesHut'
import { computeRepulsionUnoptimized } from './computeRepulsionUnoptimized'

export function computeRepulsion(nodes: NodeStore, config: FA2Configuration) {
	if (config.barnesHutOptimize) {
		const regions = prepareBarnesHutOptimization(nodes)
		computeRepulsionBarnesHut(nodes, regions, config)
	} else {
		computeRepulsionUnoptimized(nodes, config)
	}
}
