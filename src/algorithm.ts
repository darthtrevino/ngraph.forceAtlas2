import { DEFAULT_CONFIGURATION, FA2Configuration } from './configuration'
import { Nodes, ppn } from './core/nodes'
import { Edges, ppe } from './core/edges'
import { Regions, ppr } from './core/regions'
const MAX_FORCE = 10

export class FA2Algorithm {
	private _config: FA2Configuration
	private _iterations = 0
	private _converged = false
	private _nodes: Nodes
	private _edges: Edges
	private _regions: Regions = new Regions()

	private _scaledGravity: number

	public constructor(
		nodes: Nodes,
		edges: Edges,
		config: Partial<FA2Configuration>,
	) {
		this.configure(config)
		this._nodes = nodes
		this._edges = edges
	}

	public configure(config: Partial<FA2Configuration>) {
		this._config = { ...DEFAULT_CONFIGURATION, ...config }
		this._scaledGravity = this._config.gravity / this._config.scalingRatio
	}

	private get maxForce() {
		return MAX_FORCE
	}

	public get configuration() {
		return this._config
	}

	private get nodesLength() {
		return this._nodes.length
	}

	private get edgesLength() {
		return this._edges.length
	}

	public set nodes(value: Float32Array) {
		this._nodes.array = value
	}

	public get nodes(): Float32Array {
		return this._nodes.array
	}

	public get iterations(): number {
		return this._iterations
	}

	public pass() {
		// MATH: get distances stuff and power 2 issues
		this.resetDeltas()
		this.prepareBarnesHutOptimization()
		this.computeRepulsion()
		this.computeGravity()
		this.computeAttraction()
		this.applyForces()
		this._iterations++
	}

	private resetDeltas(): void {
		// Resetting positions & computing max values
		for (let n = 0; n < this.nodesLength; n += ppn) {
			this._nodes.setOldDx(n, this._nodes.dx(n))
			this._nodes.setOldDy(n, this._nodes.dy(n))
			this._nodes.setDx(n, 0)
			this._nodes.setDy(n, 0)
		}
	}

	private prepareBarnesHutOptimization(): void {
		// 1.bis) Barnes-Hut computation
		//------------------------------
		if (this._config.barnesHutOptimize) {
			this._regions.array = new Array((this.nodesLength / ppn) * 4 * ppr)

			// Setting up
			// Computing min and max values
			const [minX, maxX, minY, maxY] = this.getNodeBounds()

			// Build the Barnes Hut root region
			this.initRegion(
				0,
				(minX + maxX) / 2,
				(minY + maxY) / 2,
				Math.max(maxX - minX + maxY - minY),
				-1,
			)

			// Add each node in the tree
			let l = 1
			for (let n = 0; n < this.nodesLength; n += ppn) {
				// Current region, starting with root
				let r = 0

				while (true) {
					// Are there sub-regions?

					// We look at first child index
					if (this._regions.firstChild(r) >= 0) {
						// There are sub-regions

						// We just iterate to find a leaf of the tree
						// that is an empty region or a region with a single node
						// (see next case)

						// Find the quadrant of n
						const q = this.getQuadrantOfNodeInRegion(n, r)

						// Update center of mass and mass (we only do it for non-leaf regions)
						this._regions.setMassCenterX(
							r,
							(this._regions.massCenterX(r) * this._regions.mass(r) +
								this._nodes.x(n) * this._nodes.mass(n)) /
								(this._regions.mass(r) + this._nodes.mass(n)),
						)

						this._regions.setMassCenterY(
							r,
							(this._regions.massCenterY(r) * this._regions.mass(r) +
								this._nodes.y(n) * this._nodes.mass(n)) /
								(this._regions.mass(r) + this._nodes.mass(n)),
						)

						this._regions.addMass(r, this._nodes.mass(n))

						// Iterate on the correct quadrant
						r = q
						continue
					} else {
						// There are no sub-regions: we are in a leaf

						// Is there a node in this leaf?
						if (this._regions.node(r) < 0) {
							// There is no node in region;  we record node n and go on
							this._regions.setNode(r, n)
							break
						} else {
							// There is a node in this region

							// We will need to create sub-regions, stick the two
							// nodes (the old one r[0] and the new one n) in two
							// subregions. If they fall in the same quadrant,
							// we will iterate.

							// Create sub-regions
							this._regions.setFirstChild(r, l * ppr)
							let w = this._regions.size(r) / 2 // new size (half)

							// NOTE: we use screen coordinates
							// from Top Left to Bottom Right

							// Top Left sub-region
							let g = this._regions.firstChild(r)
							this.initRegion(
								g,
								this._regions.centerX(r) - w,
								this._regions.centerY(r) - w,
								w,
								g + ppr,
							)

							// Bottom Left sub-region
							g += ppr
							this.initRegion(
								g,
								this._regions.centerX(r) - w,
								this._regions.centerY(r) + w,
								w,
								g + ppr,
							)

							// Top Right sub-region
							g += ppr
							this.initRegion(
								g,
								this._regions.centerX(r) + w,
								this._regions.centerY(r) - w,
								w,
								g + ppr,
							)

							// Bottom Right sub-region
							g += ppr
							this.initRegion(
								g,
								this._regions.centerX(r) + w,
								this._regions.centerY(r) + w,
								w,
								this._regions.nextSibling(r),
							)

							l += 4

							// Now the goal is to find two different sub-regions
							// for the two nodes: the one previously recorded (r[0])
							// and the one we want to add (n)

							// Find the quadrant of the old node
							const q = this.getQuadrantOfNodeInRegion(this._regions.node(r), r)

							// We remove r[0] from the region r, add its mass to r and record it in q
							this._regions.setMass(r, this._nodes.mass(this._regions.node(r)))
							this._regions.setMassCenterX(
								r,
								this._nodes.x(this._regions.node(r)),
							)
							this._regions.setMassCenterY(
								r,
								this._nodes.y(this._regions.node(r)),
							)

							this._regions.setNode(q, this._regions.node(r))
							this._regions.setNode(r, -1)

							// Find the quadrant of n
							const q2 = this.getQuadrantOfNodeInRegion(n, r)

							if (q === q2) {
								// If both nodes are in the same quadrant,
								// we have to try it again on this quadrant
								r = q
								continue
							}

							// If both quadrants are different, we record n
							// in its quadrant
							this._regions.setNode(q, n)
							break
						}
					}
				}
			}
		}
	}

	private computeRepulsion() {
		// 2) Repulsion
		//--------------
		// NOTES: adjustSize = antiCollision & scalingRatio = coefficient

		if (this._config.barnesHutOptimize) {
			let coefficient = this._config.scalingRatio

			// Applying repulsion through regions
			for (let n = 0; n < this.nodesLength; n += ppn) {
				// Computing leaf quad nodes iteration

				let r = 0 // Starting with root region
				while (true) {
					if (this._regions.firstChild(r) >= 0) {
						let factor
						// The region has sub-regions

						// We run the Barnes Hut test to see if we are at the right distance
						let distance = Math.sqrt(
							this._nodes.x(n) -
								this._regions.massCenterX(r) ** 2 +
								this._nodes.y(n) -
								this._regions.massCenterY(r) ** 2,
						)

						if (
							(2 * this._regions.size(r)) / distance <
							this._config.barnesHutTheta
						) {
							// We treat the region as a single body, and we repulse
							let xDist = this._nodes.x(n) - this._regions.massCenterX(r)
							let yDist = this._nodes.y(n) - this._regions.massCenterY(r)

							if (this._config.adjustSize) {
								//-- Linear Anti-collision Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes.mass(n) *
											this._regions.mass(r)) /
										distance ** 2

									this._nodes.addDx(n, xDist * factor)
									this._nodes.addDy(n, yDist * factor)
								} else if (distance < 0) {
									factor =
										(-coefficient *
											this._nodes.mass(n) *
											this._regions.mass(r)) /
										distance

									this._nodes.addDx(n, xDist * factor)
									this._nodes.addDy(n, yDist * factor)
								}
							} else {
								//-- Linear Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes.mass(n) *
											this._regions.mass(r)) /
										distance ** 2

									this._nodes.addDx(n, xDist * factor)
									this._nodes.addDy(n, yDist * factor)
								}
							}

							// When this is done, we iterate. We have to look at the next sibling.
							if (this._regions.nextSibling(r) < 0) break // No next sibling: we have finished the tree
							r = this._regions.nextSibling(r)
							continue
						} else {
							// The region is too close and we have to look at sub-regions
							r = this._regions.firstChild(r)
							continue
						}
					} else {
						let xDist
						let yDist
						let distance
						let factor
						// The region has no sub-region
						// If there is a node r[0] and it is not n, then repulse

						if (this._regions.node(r) >= 0 && this._regions.node(r) !== n) {
							xDist = this._nodes.x(n) - this._nodes.x(this._regions.node(r))
							yDist = this._nodes.y(n) - this._nodes.y(this._regions.node(r))

							distance = Math.sqrt(xDist ** 2 + yDist ** 2)

							if (this._config.adjustSize) {
								//-- Linear Anti-collision Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes.mass(n) *
											this._nodes.mass(this._regions.node(r))) /
										distance ** 2

									this._nodes.addDx(n, xDist * factor)
									this._nodes.addDy(n, yDist * factor)
								} else if (distance < 0) {
									factor =
										(-coefficient *
											this._nodes.mass(n) *
											this._nodes.mass(this._regions.node(r))) /
										distance

									this._nodes.addDx(n, xDist * factor)
									this._nodes.addDy(n, yDist * factor)
								}
							} else {
								//-- Linear Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes.mass(n) *
											this._nodes.mass(this._regions.node(r))) /
										distance ** 2

									this._nodes.addDx(n, xDist * factor)
									this._nodes.addDy(n, yDist * factor)
								}
							}
						}

						// When this is done, we iterate. We have to look at the next sibling.
						if (this._regions.nextSibling(r) < 0) break // No next sibling: we have finished the tree
						r = this._regions.nextSibling(r)
						continue
					}
				}
			}
		} else {
			let coefficient = this._config.scalingRatio

			// Square iteration
			for (let n1 = 0; n1 < this.nodesLength; n1 += ppn) {
				for (let n2 = 0; n2 < n1; n2 += ppn) {
					// Common to both methods
					let xDist = this._nodes.x(n1) - this._nodes.x(n2)
					let yDist = this._nodes.y(n1) - this._nodes.y(n2)
					let factor

					if (this._config.adjustSize) {
						//-- Anticollision Linear Repulsion
						let distance =
							Math.sqrt(xDist * xDist + yDist * yDist) -
							this._nodes.size(n1) -
							this._nodes.size(n2)

						if (distance > 0) {
							factor =
								(coefficient * this._nodes.mass(n1) * this._nodes.mass(n2)) /
								distance /
								distance

							// Updating nodes' dx and dy
							this._nodes.addDx(n1, xDist * factor)
							this._nodes.addDy(n1, yDist * factor)
							this._nodes.addDx(n2, xDist * factor)
							this._nodes.addDy(n2, yDist * factor)
						} else if (distance < 0) {
							factor =
								100 * coefficient * this._nodes.mass(n1) * this._nodes.mass(n2)

							// Updating nodes' dx and dy
							this._nodes.addDx(n1, xDist * factor)
							this._nodes.addDy(n1, yDist * factor)

							this._nodes.subDx(n2, xDist * factor)
							this._nodes.subDy(n2, yDist * factor)
						}
					} else {
						//-- Linear Repulsion
						let distance = Math.sqrt(xDist * xDist + yDist * yDist)

						if (distance > 0) {
							factor =
								(coefficient * this._nodes.mass(n1) * this._nodes.mass(n2)) /
								distance /
								distance

							// Updating nodes' dx and dy
							this._nodes.addDx(n1, xDist * factor)
							this._nodes.addDy(n1, yDist * factor)

							this._nodes.subDx(n2, xDist * factor)
							this._nodes.subDy(n2, yDist * factor)
						}
					}
				}
			}
		}
	}

	private computeGravity() {
		for (let n = 0; n < this.nodesLength; n += ppn) {
			// Common to both methods
			const xDist = this._nodes.x(n)
			const yDist = this._nodes.y(n)
			const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
			const factor = this.getGravityFactor(n, distance)

			// Updating node's dx and dy
			this._nodes.subDx(n, xDist * factor)
			this._nodes.subDy(n, yDist * factor)
		}
	}

	private computeAttraction() {
		const coefficient =
			1 *
			(this._config.outboundAttractionDistribution
				? this.outboundAttCompensation
				: 1)

		// TODO: simplify distance
		// TODO: coefficient is always used as -c --> optimize?
		for (let e = 0; e < this.edgesLength; e += ppe) {
			const n1 = this._edges.source(e)
			const n2 = this._edges.target(e)
			const w = this._edges.weight(e)

			// Edge weight influence
			const ewc = Math.pow(w, this._config.edgeWeightInfluence)

			// Common measures
			const xDist = this._nodes.x(n1) - this._nodes.x(n2)
			const yDist = this._nodes.y(n1) - this._nodes.y(n2)
			let distance, factor

			// Applying attraction to nodes
			if (this._config.adjustSizes) {
				distance = Math.sqrt(
					xDist ** 2 + yDist ** 2 - this._nodes.size(n1) - this._nodes.size(n2),
				)

				if (this._config.linLogMode) {
					if (this._config.outboundAttractionDistribution) {
						//-- LinLog Degree Distributed Anti-collision Attraction
						if (distance > 0) {
							factor =
								(-coefficient * ewc * Math.log(1 + distance)) /
								distance /
								this._nodes.mass(n1)
						}
					} else {
						//-- LinLog Anti-collision Attraction
						if (distance > 0) {
							factor = (-coefficient * ewc * Math.log(1 + distance)) / distance
						}
					}
				} else {
					if (this._config.outboundAttractionDistribution) {
						//-- Linear Degree Distributed Anti-collision Attraction
						if (distance > 0) {
							factor = (-coefficient * ewc) / this._nodes.mass(n1)
						}
					} else {
						//-- Linear Anti-collision Attraction
						if (distance > 0) {
							factor = -coefficient * ewc
						}
					}
				}
			} else {
				distance = Math.sqrt(xDist ** 2 + yDist ** 2)

				if (this._config.linLogMode) {
					if (this._config.outboundAttractionDistribution) {
						//-- LinLog Degree Distributed Attraction
						if (distance > 0) {
							factor =
								(-coefficient * ewc * Math.log(1 + distance)) /
								distance /
								this._nodes.mass(n1)
						}
					} else {
						//-- LinLog Attraction
						if (distance > 0)
							factor = (-coefficient * ewc * Math.log(1 + distance)) / distance
					}
				} else {
					if (this._config.outboundAttractionDistribution) {
						//-- Linear Attraction Mass Distributed
						// NOTE: Distance is set to 1 to override next condition
						distance = 1
						factor = (-coefficient * ewc) / this._nodes.mass(n1)
					} else {
						//-- Linear Attraction
						// NOTE: Distance is set to 1 to override next condition
						distance = 1
						factor = -coefficient * ewc
					}
				}
			}

			// Updating nodes' dx and dy
			// TODO: if condition or factor = 1?
			if (distance > 0) {
				// Updating nodes' dx and dy
				this._nodes.addDx(n1, xDist * factor)
				this._nodes.addDy(n1, yDist * factor)
				this._nodes.subDx(n2, xDist * factor)
				this._nodes.subDy(n2, yDist * factor)
			}
		}
	}

	private applyForces() {
		let force, swinging, traction, nodespeed

		// MATH: sqrt and square distances
		if (this._config.adjustSizes) {
			for (let n = 0; n < this.nodesLength; n += ppn) {
				if (!this._nodes.fixed(n)) {
					force = Math.sqrt(this._nodes.dx(n) ** 2 + this._nodes.dy(n) ** 2)

					if (force > this.maxForce) {
						this._nodes.setDx(n, (this._nodes.dx(n) * this.maxForce) / force)
						this._nodes.setDy(n, (this._nodes.dy(n) * this.maxForce) / force)
					}

					swinging =
						this._nodes.mass(n) *
						Math.sqrt(
							(this._nodes.old_dx(n) - this._nodes.dx(n)) ** 2 +
								(this._nodes.old_dy(n) - this._nodes.dy(n)) ** 2,
						)

					traction =
						Math.sqrt(
							(this._nodes.old_dx(n) + this._nodes.dx(n)) ** 2 +
								(this._nodes.old_dy(n) + this._nodes.dy(n)) ** 2,
						) / 2

					nodespeed = (0.1 * Math.log(1 + traction)) / (1 + Math.sqrt(swinging))

					// Updating node's positon
					this._nodes.setX(
						n,
						this._nodes.x(n) +
							this._nodes.dx(n) * (nodespeed / this._config.slowDown),
					)
					this._nodes.setY(
						n,
						this._nodes.y(n) +
							this._nodes.dy(n) * (nodespeed / this._config.slowDown),
					)
				}
			}
		} else {
			for (let n = 0; n < this.nodesLength; n += ppn) {
				if (!this._nodes.fixed(n)) {
					swinging =
						this._nodes.mass(n) *
						Math.sqrt(
							(this._nodes.old_dx(n) - this._nodes.dx(n)) ** 2 +
								(this._nodes.old_dy(n) - this._nodes.dy(n)) ** 2,
						)

					traction =
						Math.sqrt(
							(this._nodes.old_dx(n) + this._nodes.dx(n)) ** 2 +
								(this._nodes.old_dy(n) + this._nodes.dy(n)) ** 2,
						) / 2

					nodespeed =
						(this._nodes.convergence(n) * Math.log(1 + traction)) /
						(1 + Math.sqrt(swinging))

					// Updating node convergence
					this._nodes.setConvergence(
						n,
						Math.min(
							1,
							Math.sqrt(
								(nodespeed *
									(this._nodes.dx(n) ** 2 + this._nodes.dy(n) ** 2)) /
									(1 + Math.sqrt(swinging)),
							),
						),
					)

					// Updating node's positon
					this._nodes.setX(
						n,
						this._nodes.x(n) +
							this._nodes.dx(n) * (nodespeed / this._config.slowDown),
					)
					this._nodes.setY(
						n,
						this._nodes.y(n) +
							this._nodes.dy(n) * (nodespeed / this._config.slowDown),
					)
				}
			}
		}
	}

	private get outboundAttCompensation() {
		let outboundAttCompensation = 0
		// If outbound attraction distribution, compensate
		if (this._config.outboundAttractionDistribution) {
			outboundAttCompensation = 0
			for (let n = 0; n < this.nodesLength; n += ppn) {
				outboundAttCompensation += this._nodes.mass(n)
			}

			outboundAttCompensation /= this.nodesLength
		}
		return outboundAttCompensation
	}

	private getNodeBounds(): [number, number, number, number] {
		let minX = Infinity
		let maxX = -Infinity
		let minY = Infinity
		let maxY = -Infinity

		// Setting up
		// Computing min and max values
		for (let n = 0; n < this.nodesLength; n += ppn) {
			minX = Math.min(minX, this._nodes.x(n))
			maxX = Math.max(maxX, this._nodes.x(n))
			minY = Math.min(minY, this._nodes.y(n))
			maxY = Math.max(maxY, this._nodes.y(n))
		}
		return [minX, maxX, minY, maxY]
	}

	private getQuadrantOfNodeInRegion(n: number, r: number): number {
		// Find the quadrant of n
		if (this._nodes.x(n) < this._regions.centerX(r)) {
			if (this._nodes.y(n) < this._regions.centerY(r)) {
				// Top Left quarter
				return this._regions.firstChild(r)
			} else {
				// Bottom Left quarter
				return this._regions.firstChild(r) + ppr
			}
		} else {
			if (this._nodes.y(n) < this._regions.centerY(r)) {
				// Top Right quarter
				return this._regions.firstChild(r) + ppr * 2
			} else {
				// Bottom Right quarter
				return this._regions.firstChild(r) + ppr * 3
			}
		}
	}

	private getGravityFactor(n: number, distance: number) {
		const coefficient = this._config.scalingRatio
		const g = this._scaledGravity

		let factor = 0
		if (this._config.strongGravityMode) {
			// strong gravity
			if (distance > 0) {
				factor = coefficient * this._nodes.mass(n) * g
			}
		} else {
			// linear anti-collision repulsion
			if (distance > 0) {
				factor = (coefficient * this._nodes.mass(n) * g) / distance
			}
		}
		return factor
	}

	private initRegion(
		r: number,
		centerX: number,
		centerY: number,
		size: number,
		nextSibling: number,
	) {
		this._regions.setNextSibling(r, nextSibling)
		this._regions.setCenterX(r, centerX)
		this._regions.setCenterY(r, centerY)
		this._regions.setSize(r, size)
		this._regions.setNode(r, -1)
		this._regions.setFirstChild(r, -1)
		this._regions.setMass(r, 0)
		this._regions.setMassCenterX(r, 0)
		this._regions.setMassCenterY(r, 0)
	}
}
