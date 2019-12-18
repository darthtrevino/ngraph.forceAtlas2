import { QuadTree, NodeStore } from '../../marshaling'

export function prepareBarnesHutOptimization(nodes: NodeStore): QuadTree {
	// Set up the root quad-tree region
	const [minX, maxX, minY, maxY] = nodes.getBounds()
	const width = maxX - minX
	const height = maxY - minY
	const centerX = minX + width / 2
	const centerY = minY + height / 2
	const root = new QuadTree(width, height, centerX, centerY)

	for (let i = 0; i < nodes.nodeCount; ++i) {
		root.insert(nodes.getNode(i))
	}

	return root
}
