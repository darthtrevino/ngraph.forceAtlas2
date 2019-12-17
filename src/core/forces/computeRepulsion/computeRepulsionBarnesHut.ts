import { NodeStore, ppn, QuadTree } from '../../marshaling'
import { FA2Configuration } from '../../../configuration'
import { computeNodeRepulsion } from './computeNodeRepulsion'

export function computeRepulsionBarnesHut(
	nodes: NodeStore,
	config: FA2Configuration,
) {
	const qt = createQuadTree(nodes)
	for (let n1 = 0; n1 < nodes.length; n1 += ppn) {
		applyQuadTreeRepulsion(qt, nodes, n1, config)
	}
}

export function createQuadTree(nodes: NodeStore): QuadTree {
	// Set up the root quad-tree region
	const [minX, maxX, minY, maxY] = nodes.getBounds()
	const width = maxX - minX
	const height = maxY - minY
	const centerX = minX + width / 2
	const centerY = minY + height / 2
	const root = new QuadTree(width, height, centerX, centerY)

	for (let n = 0; n < nodes.length; n += ppn) {
		root.insert(n, nodes.mass(n), nodes.x(n), nodes.y(n))
	}

	return root
}

function applyQuadTreeRepulsion(
	root: QuadTree,
	nodes: NodeStore,
	n1: number,
	config: FA2Configuration,
) {
	root.visit(qt => {
		if (qt.isLeaf) {
			computeNodeRepulsion(config, nodes, n1, qt.node)
			return true
		}
		const xDist = nodes.x(n1) - qt.centerOfMassX
		const yDist = nodes.y(n1) - qt.centerOfMassY
		const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
		const applyQuadForce = qt.size / distance < config.barnesHutTheta

		if (applyQuadForce) {
			const coefficient = config.scalingRatio
			const massCoeff = coefficient * nodes.mass(n1) * qt.mass

			//-- Linear Repulsion
			if (distance > 0) {
				// Updating nodes' dx and dy
				const factor = massCoeff / distance ** 2
				nodes.addDx(n1, xDist * factor)
				nodes.addDy(n1, yDist * factor)
			} else {
				console.log('Zero Distance 3')
			}
		}

		return applyQuadForce
	})
}
