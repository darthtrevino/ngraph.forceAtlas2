import { NodeStore } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'
import { computeNodeRepulsion } from './computeNodeRepulsion'
/**
 * O(n^2) repulsion - check force against all nodes
 */
export function computeRepulsionUnoptimized(
	nodes: NodeStore,
	config: FA2Configuration,
) {
	// O(n^2) iteration
	for (let n1 = 0; n1 < nodes.nodeCount; ++n1) {
		for (let n2 = 0; n2 < n1; ++n2) {
			computeNodeRepulsion(nodes.getNode(n1), nodes.getNode(n2), config)
		}
	}
}
