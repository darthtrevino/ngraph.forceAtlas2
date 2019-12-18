import { Node } from './Node'
import { jiggle } from '../helpers/jiggle'
export class QuadTree {
	public node: Node | undefined

	public nwChild: QuadTree | undefined
	public neChild: QuadTree | undefined
	public swChild: QuadTree | undefined
	public seChild: QuadTree | undefined

	public centerOfMassX: number
	public centerOfMassY: number
	public mass: number

	public centerX: number
	public centerY: number

	public width: number
	public height: number

	public x0: number
	public x1: number
	public y0: number
	public y1: number

	public constructor(
		width: number,
		height: number,
		centerX: number,
		centerY: number,
	) {
		this.width = width
		this.height = height
		this.centerX = this.centerOfMassX = centerX
		this.centerY = this.centerOfMassY = centerY
		this.mass = 0
		this.x0 = this.centerX - width / 2
		this.x1 = this.centerX + width / 2
		this.y0 = this.centerY - height / 2
		this.y1 = this.centerY + height / 2
	}

	public get size() {
		return this.width
	}

	public get isLeaf(): boolean {
		return !this.nwChild && !this.neChild && !this.swChild && !this.seChild
	}

	public get depth() {
		if (this.isLeaf) {
			return 0
		} else {
			return (
				Math.max(
					this.nwChild.depth,
					this.neChild.depth,
					this.swChild.depth,
					this.seChild.depth,
				) + 1
			)
		}
	}

	public insert(node: Node, depth = 0) {
		if (!this.isLeaf) {
			//
			// Current quad is interior, push the node down
			//
			this.pushDownNode(node)
		} else {
			if (this.node) {
				// Infinite recursion protection
				if (this.node.x === node.x && this.node.y === node.y) {
					const jx = jiggle(1e-1)
					const jy = jiggle(1e-1)
					node.x += jx
					node.y += jy
				}

				//
				// Current quad is a leaf with a current node
				//
				this.subdivide()
				let curNode = this.node
				this.node = undefined

				// reinsert current node and insert the new node
				this.pushDownNode(curNode, depth)
				this.pushDownNode(node, depth)
			} else {
				//
				// Current quad is a leaf without a node
				//
				this.node = node
			}
		}
		this.addNodeMass(node)
	}

	private getQuadrant(node: Node): QuadTree {
		const { x, y } = node
		if (y > this.centerY) {
			if (x > this.centerX) {
				return this.neChild
			} else {
				return this.nwChild
			}
		} else {
			if (x > this.centerX) {
				return this.seChild
			} else {
				return this.swChild
			}
		}
	}

	private addNodeMass(node: Node) {
		const newMass = this.mass + node.mass
		this.centerOfMassX =
			(node.x * node.mass + this.centerOfMassX * this.mass) / newMass
		this.centerOfMassY =
			(node.y * node.mass + this.centerOfMassY * this.mass) / newMass
		this.mass = newMass
	}

	private pushDownNode(node: Node, depth = 0) {
		const quadrant = this.getQuadrant(node)
		quadrant.insert(node, depth + 1)
	}

	private subdivide() {
		const cx = this.centerX
		const cy = this.centerY
		const w = this.width / 2
		const h = this.height / 2
		const hh = h / 2
		const hw = w / 2
		this.neChild = new QuadTree(w, h, cx + hw, cy + hh)
		this.nwChild = new QuadTree(w, h, cx - hw, cy + hh)
		this.seChild = new QuadTree(w, h, cx + hw, cy - hh)
		this.swChild = new QuadTree(w, h, cx - hw, cy - hh)
	}

	public visit(callback: (qt: QuadTree) => boolean) {
		const queue: QuadTree[] = [this]
		while (queue.length > 0) {
			const qt = queue.pop()
			const halt = callback(qt)
			if (!halt) {
				if (!qt.isLeaf) {
					queue.push(qt.nwChild, qt.neChild, qt.swChild, qt.seChild)
				}
			}
		}
	}
}
