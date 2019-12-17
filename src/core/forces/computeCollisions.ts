import { NodeStore, EdgeStore, ppn, QuadTree } from '../marshaling'
import { FA2Configuration } from '../../configuration'
import { jiggle } from './helpers/jiggle'

export function computeCollisions(nodes: NodeStore, config: FA2Configuration) {
	if (config.collisionDetection) {
		const root = createQuadTree(nodes)
		for (let n1 = 0; n1 < nodes.length; n1 += ppn) {
			applyCollision(root, nodes, n1, config)
		}
	}
}

function createQuadTree(nodes: NodeStore): QuadTree {
	// Set up the root quad-tree region
	const [minX, maxX, minY, maxY] = nodes.getBounds(true)
	const width = maxX - minX
	const height = maxY - minY
	const centerX = minX + width / 2
	const centerY = minY + height / 2
	const root = new QuadTree(width, height, centerX, centerY)

	for (let n = 0; n < nodes.length; n += ppn) {
		root.insert(
			n,
			nodes.mass(n),
			nodes.x(n) + nodes.dx(n),
			nodes.y(n) + nodes.dy(n),
		)
	}

	return root
}

function applyCollision(
	root: QuadTree,
	nodes: NodeStore,
	i: number,
	config: FA2Configuration,
) {
	const strength = config.collisionStrength
	const xi = nodes.x(i) + nodes.dx(i)
	const yi = nodes.y(i) + nodes.dy(i)
	const ri = nodes.size(i)
	const ri2 = ri ** 2

	root.visit(qt => {
		let rj = qt.size
		let r = ri + rj
		const { x0, x1, y0, y1 } = qt

		if (!qt.node) {
			return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r
		}
		if (qt.node > i) {
			const j = qt.node
			rj = nodes.size(j)
			const xj = nodes.x(j) + nodes.dx(j)
			const yj = nodes.y(j) + nodes.dy(j)
			let x = xi - xj
			let y = yi - yj
			const r2 = r ** 2
			let l = x ** 2 + y ** 2

			if (l < r2) {
				if (x === 0) {
					x = jiggle()
					l += x ** 2
				}
				if (y === 0) {
					y = jiggle()
					l += y ** 2
				}
				l = Math.sqrt(l)
				l = ((r - l) / l) * strength

				nodes.addDy(i, (x *= l) * (r = (rj *= rj) / (ri2 + rj)))
				nodes.addDy(i, (y *= l) * r)
				nodes.subDx(j, x * (r = 1 - r))
				nodes.subDy(j, y * r)
			}
		}
		return false
	})
}
