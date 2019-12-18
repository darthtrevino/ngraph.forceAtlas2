import { ppn, NodeStore, Node } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'
import { computeNodeRepulsion } from './computeNodeRepulsion'
/**
 * O(n^2) repulsion - check force against all nodes
 */
export function computeRepulsionUnoptimized(
	nodes: NodeStore,
	config: FA2Configuration,
) {
	let node1: Node
	let node2: Node
	// O(n^2) iteration
	for (let n1 = 0; n1 < nodes.nodeCount; n1++) {
		node1 = nodes.getNode(n1)
		for (let n2 = 0; n2 < n1; n2++) {
			node2 = nodes.getNode(n2)
			computeNodeRepulsion(node1, node2, config)
		}
	}
}
