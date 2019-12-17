import { NodeStore } from './NodeStore'
import { FA2Configuration } from '../../configuration'

export class QuadTree {
	public node: number | undefined

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
	}

	public get size() {
		return this.width
	}

	public get isLeaf(): boolean {
		return !this.nwChild && !this.neChild && !this.swChild && !this.seChild
	}

	public insert(index: number, mass: number, x: number, y: number) {
		// If node x is an external node, say containing a body named c, then there are two
		// bodies b and c in the same region. Subdivide the region further by creating four children.
		// Then, recursively insert both b and c into the appropriate quadrant(s). Since b and c may still end up in the same quadrant, there may be several subdivisions during a single insertion. Finally, update the center-of-mass and total mass of x.
		if (this.isLeaf) {
			if (this.node != null) {
				this.subdivide()
				this.node = undefined

				// reinsert current node
				this.insertIntoQuadrant(
					this.node,
					this.mass,
					this.centerOfMassX,
					this.centerOfMassY,
				)
				// insert new node
				this.insertIntoQuadrant(index, mass, x, y)
			} else {
				this.node = index
			}
		} else {
			this.insertIntoQuadrant(index, mass, x, y)
		}
		this.addMass(x, y, mass)
	}

	private getQuadrant(x: number, y: number): QuadTree {
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

	private addMass(x: number, y: number, mass: number) {
		const newMass = this.mass + mass
		this.centerOfMassX = (x * mass + this.centerOfMassX * this.mass) / newMass
		this.centerOfMassY = (y * mass + this.centerOfMassY * this.mass) / newMass
		this.mass = newMass
	}

	private insertIntoQuadrant(
		index: number,
		mass: number,
		x: number,
		y: number,
	) {
		const quadrant = this.getQuadrant(x, y)
		quadrant.insert(index, mass, x, y)
	}

	private subdivide() {
		const w = this.width / 2
		const h = this.height / 2
		const hh = h / 2
		const hw = w / 2
		const cx = this.centerX
		const cy = this.centerY
		this.neChild = new QuadTree(w, h, cx + hw, cy + hh)
		this.nwChild = new QuadTree(w, h, cx - hw, cy + hh)
		this.seChild = new QuadTree(w, h, cx + hw, cy - hh)
		this.swChild = new QuadTree(w, h, cx - hw, cy - hh)
	}

	public applyRepulsion(
		config: FA2Configuration,
		nodes: NodeStore,
		n1: number,
	) {
		let coefficient = config.scalingRatio
		let xDist, yDist, factor, distance, massCoeff

		if (this.isLeaf) {
			const n2 = this.node
			// Common to both methods
			xDist = nodes.x(n1) - nodes.x(n2)
			yDist = nodes.y(n1) - nodes.y(n2)
			massCoeff = coefficient * nodes.mass(n1) * nodes.mass(n2)

			if (config.adjustSize) {
				//-- Anticollision Linear Repulsion
				distance =
					Math.sqrt(xDist ** 2 + yDist ** 2) - nodes.size(n1) - nodes.size(n2)

				if (distance > 0) {
					// Updating nodes' dx and dy
					factor = massCoeff / distance ** 2
					nodes.addDx(n1, xDist * factor)
					nodes.addDy(n1, yDist * factor)
					nodes.addDx(n2, xDist * factor)
					nodes.addDy(n2, yDist * factor)
				} else if (distance < 0) {
					// Updating nodes' dx and dy
					factor = 100 * massCoeff
					nodes.addDx(n1, xDist * factor)
					nodes.addDy(n1, yDist * factor)
					nodes.subDx(n2, xDist * factor)
					nodes.subDy(n2, yDist * factor)
				}
			} else {
				//-- Linear Repulsion
				distance = Math.sqrt(xDist ** 2 + yDist ** 2)
				if (distance > 0) {
					// Updating nodes' dx and dy
					factor = massCoeff / distance ** 2
					nodes.addDx(n1, xDist * factor)
					nodes.addDy(n1, yDist * factor)
					nodes.subDx(n2, xDist * factor)
					nodes.subDy(n2, yDist * factor)
				}
			}
		} else {
			xDist = nodes.x(n1) - this.centerOfMassX
			yDist = nodes.y(n1) - this.centerOfMassY
			distance = Math.sqrt(xDist ** 2 + yDist ** 2)

			if (this.size / distance < config.barnesHutTheta) {
				//-- Linear Repulsion
				if (distance > 0) {
					// Updating nodes' dx and dy
					factor = massCoeff / distance ** 2
					nodes.addDx(n1, xDist * factor)
					nodes.addDy(n1, yDist * factor)
				}
			} else {
				this.nwChild.applyRepulsion(config, nodes, n1)
				this.neChild.applyRepulsion(config, nodes, n1)
				this.swChild.applyRepulsion(config, nodes, n1)
				this.seChild.applyRepulsion(config, nodes, n1)
			}
		}
	}
}
