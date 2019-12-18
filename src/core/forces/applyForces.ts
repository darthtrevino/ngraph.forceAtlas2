import { NodeStore, Node } from '../marshaling'
import { FA2Configuration } from '../../configuration'

export function applyForces(nodes: NodeStore, config: FA2Configuration) {
	let force, swinging, traction, nodespeed
	let node: Node
	// MATH: sqrt and square distances
	if (config.adjustSizes) {
		for (let n = 0; n < nodes.nodeCount; n++) {
			node = nodes.getNode(n)
			if (!node.fixed) {
				force = Math.sqrt(node.dx ** 2 + node.dy ** 2)

				if (force > config.maxForce) {
					node.dx *= config.maxForce / force
					node.dy *= config.maxForce / force
				}

				swinging =
					node.mass *
					Math.sqrt((node.old_dx - node.dx) ** 2 + (node.old_dy - node.dy) ** 2)

				traction =
					Math.sqrt(
						(node.old_dx + node.dx) ** 2 + (node.old_dy + node.dy) ** 2,
					) / 2

				nodespeed = (0.1 * Math.log(1 + traction)) / (1 + Math.sqrt(swinging))

				// Updating node's positon
				node.x += node.dx * (nodespeed / config.slowDown)
				node.y += node.dy * (nodespeed / config.slowDown)
			}
		}
	} else {
		for (let n = 0; n < nodes.nodeCount; n++) {
			node = nodes.getNode(n)
			if (!node.fixed) {
				swinging =
					node.mass *
					Math.sqrt((node.old_dx - node.dx) ** 2 + (node.old_dy - node.dy) ** 2)

				traction =
					Math.sqrt(
						(node.old_dx + node.dx) ** 2 + (node.old_dy + node.dy) ** 2,
					) / 2

				nodespeed =
					(node.convergence * Math.log(1 + traction)) /
					(1 + Math.sqrt(swinging))

				// Updating node convergence
				node.convergence = Math.min(
					1,
					Math.sqrt(
						(nodespeed * (node.dx ** 2 + node.dy ** 2)) /
							(1 + Math.sqrt(swinging)),
					),
				)

				// Updating node's positon
				node.x += node.dx * (nodespeed / config.slowDown)
				node.y += node.dy * (nodespeed / config.slowDown)
			}
		}
	}
}
