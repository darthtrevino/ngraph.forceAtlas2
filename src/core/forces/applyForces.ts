import { NodeStore, Node } from '../marshaling'
import { FA2Configuration } from '../../configuration'
import { ForceMetrics } from '../types'

export function applyForces(
	nodes: NodeStore,
	config: FA2Configuration,
): ForceMetrics {
	let force, swinging, traction, nodespeed
	let totalTension: number = 0
	let totalSwing: number = 0
	let totalTraction: number = 0
	let node: Node
	let forceScale: number

	// MATH: sqrt and square distances
	for (let n = 0; n < nodes.nodeCount; n++) {
		node = nodes.getNode(n)
		if (!node.fixed) {
			force = node.force
			swinging = node.swing
			traction = node.traction

			// track global metrics
			totalTension += force
			totalSwing += swinging
			totalTraction += traction

			if (config.adjustSizes) {
				if (force > config.maxForce) {
					forceScale = config.maxForce / force
					node.dx *= forceScale
					node.dy *= forceScale
				}
				nodespeed = getNodeSpeed(0.1, traction, swinging)
			} else {
				nodespeed = getNodeSpeed(node.convergence, traction, swinging)
				// Updating node convergence
				node.convergence = getNodeConvergence(node, swinging, nodespeed)
			}

			moveNode(node, nodespeed / config.slowDown)
		}
	}
	return [totalTension, totalSwing, totalTraction]
}

function getNodeConvergence(
	node: Node,
	swinging: number,
	speed: number,
): number {
	return Math.min(
		1,
		Math.sqrt(
			(speed * (node.dx ** 2 + node.dy ** 2)) / (1 + Math.sqrt(swinging)),
		),
	)
}

function getNodeSpeed(
	convergence: number,
	traction: number,
	swinging: number,
): number {
	return (convergence * Math.log(1 + traction)) / (1 + Math.sqrt(swinging))
}

function moveNode(node: Node, factor: number): void {
	node.x += node.dx * factor
	node.y += node.dy * factor
}
