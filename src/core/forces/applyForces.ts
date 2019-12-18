import { ppn, NodeStore } from '../marshaling'
import { FA2Configuration } from '../../configuration'

export function applyForces(
	nodes: NodeStore,
	config: FA2Configuration,
): number {
	let force, swinging, traction, nodespeed
	let tension: number = 0

	// MATH: sqrt and square distances
	for (let n = 0; n < nodes.length; n += ppn) {
		if (!nodes.fixed(n)) {
			force = getNodeForce(nodes, n)
			tension += force

			if (config.adjustSizes) {
				if (force > config.maxForce) {
					nodes.setDx(n, (nodes.dx(n) * config.maxForce) / force)
					nodes.setDy(n, (nodes.dy(n) * config.maxForce) / force)
				}
				swinging = getNodeSwing(nodes, n)
				traction = getNodeTraction(nodes, n)
				nodespeed = getNodeSpeed(traction, swinging, 0.1)
			} else {
				swinging = getNodeSwing(nodes, n)
				traction = getNodeTraction(nodes, n)
				nodespeed = getNodeSpeed(traction, swinging, nodes.convergence(n))
				// Updating node convergence
				nodes.setConvergence(
					n,
					getNodeConvergence(nodes, n, swinging, nodespeed),
				)
			}

			moveNode(nodes, n, nodespeed / config.slowDown)
		}
	}
	return tension
}

function getNodeForce(nodes: NodeStore, n: number): number {
	return Math.sqrt(nodes.dx(n) ** 2 + nodes.dy(n) ** 2)
}

function getNodeSwing(nodes: NodeStore, n: number): number {
	return (
		nodes.mass(n) *
		Math.sqrt(
			(nodes.old_dx(n) - nodes.dx(n)) ** 2 +
				(nodes.old_dy(n) - nodes.dy(n)) ** 2,
		)
	)
}

function getNodeTraction(nodes: NodeStore, n: number): number {
	return (
		Math.sqrt(
			(nodes.old_dx(n) + nodes.dx(n)) ** 2 +
				(nodes.old_dy(n) + nodes.dy(n)) ** 2,
		) / 2
	)
}

function getNodeConvergence(
	nodes: NodeStore,
	n: number,
	swinging: number,
	speed: number,
): number {
	return Math.min(
		1,
		Math.sqrt(
			(speed * (nodes.dx(n) ** 2 + nodes.dy(n) ** 2)) /
				(1 + Math.sqrt(swinging)),
		),
	)
}

function getNodeSpeed(
	traction: number,
	swinging: number,
	convergence: number,
): number {
	return (convergence * Math.log(1 + traction)) / (1 + Math.sqrt(swinging))
}

function moveNode(nodes: NodeStore, n: number, factor: number): void {
	nodes.setX(n, nodes.x(n) + nodes.dx(n) * factor)
	nodes.setY(n, nodes.y(n) + nodes.dy(n) * factor)
}
