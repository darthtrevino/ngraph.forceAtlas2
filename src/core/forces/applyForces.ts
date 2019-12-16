import { ppn, NodeStore } from '../marshaling'
import { FA2Configuration } from '../../configuration'

export function applyForces(nodes: NodeStore, config: FA2Configuration) {
	let force, swinging, traction, nodespeed

	// MATH: sqrt and square distances
	if (config.adjustSizes) {
		for (let n = 0; n < nodes.length; n += ppn) {
			if (!nodes.fixed(n)) {
				force = Math.sqrt(nodes.dx(n) ** 2 + nodes.dy(n) ** 2)

				if (force > config.maxForce) {
					nodes.setDx(n, (nodes.dx(n) * config.maxForce) / force)
					nodes.setDy(n, (nodes.dy(n) * config.maxForce) / force)
				}

				swinging =
					nodes.mass(n) *
					Math.sqrt(
						(nodes.old_dx(n) - nodes.dx(n)) ** 2 +
							(nodes.old_dy(n) - nodes.dy(n)) ** 2,
					)

				traction =
					Math.sqrt(
						(nodes.old_dx(n) + nodes.dx(n)) ** 2 +
							(nodes.old_dy(n) + nodes.dy(n)) ** 2,
					) / 2

				nodespeed = (0.1 * Math.log(1 + traction)) / (1 + Math.sqrt(swinging))

				// Updating node's positon
				nodes.setX(n, nodes.x(n) + nodes.dx(n) * (nodespeed / config.slowDown))
				nodes.setY(n, nodes.y(n) + nodes.dy(n) * (nodespeed / config.slowDown))
			}
		}
	} else {
		for (let n = 0; n < nodes.length; n += ppn) {
			if (!nodes.fixed(n)) {
				swinging =
					nodes.mass(n) *
					Math.sqrt(
						(nodes.old_dx(n) - nodes.dx(n)) ** 2 +
							(nodes.old_dy(n) - nodes.dy(n)) ** 2,
					)

				traction =
					Math.sqrt(
						(nodes.old_dx(n) + nodes.dx(n)) ** 2 +
							(nodes.old_dy(n) + nodes.dy(n)) ** 2,
					) / 2

				nodespeed =
					(nodes.convergence(n) * Math.log(1 + traction)) /
					(1 + Math.sqrt(swinging))

				// Updating node convergence
				nodes.setConvergence(
					n,
					Math.min(
						1,
						Math.sqrt(
							(nodespeed * (nodes.dx(n) ** 2 + nodes.dy(n) ** 2)) /
								(1 + Math.sqrt(swinging)),
						),
					),
				)

				// Updating node's positon
				nodes.setX(n, nodes.x(n) + nodes.dx(n) * (nodespeed / config.slowDown))
				nodes.setY(n, nodes.y(n) + nodes.dy(n) * (nodespeed / config.slowDown))
			}
		}
	}
}
