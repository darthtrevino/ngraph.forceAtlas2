import { FA2Configuration } from '../../../configuration'
import { NodeStore } from '../../marshaling'
import { computeRepulsionBarnesHut } from './computeRepulsionBarnesHut'
import { computeRepulsionUnoptimized } from './computeRepulsionUnoptimized'

export function computeRepulsion(nodes: NodeStore, config: FA2Configuration) {
	if (config.barnesHutOptimize) {
		computeRepulsionBarnesHut(nodes, config)
	} else {
		computeRepulsionUnoptimized(nodes, config)
	}
}
