import { ppn, QuadTree, NodeStore } from '../../marshaling'

export function prepareBarnesHutOptimization(nodes: NodeStore): QuadTree {
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
