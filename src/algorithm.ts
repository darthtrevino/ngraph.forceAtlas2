import { DEFAULT_CONFIGURATION, FA2Configuration } from './configuration'

export const ppn = 10
export const ppe = 3
export const ppr = 9
const MAX_FORCE = 10

export enum N {
	x = 0,
	y = 1,
	dx = 2,
	dy = 3,
	old_dx = 4,
	old_dy = 5,
	mass = 6,
	convergence = 7,
	size = 8,
	fixed = 9,
}

export enum E {
	source = 0,
	target = 1,
	weight = 2,
}

export enum R {
	node = 0,
	centerX = 1,
	centerY = 2,
	size = 3,
	nextSibling = 4,
	firstChild = 5,
	mass = 6,
	massCenterX = 7,
	massCenterY = 8,
}

export class FA2Algorithm {
	private _config: FA2Configuration
	private _iterations = 0
	private _converged = false
	private _nodes: Float32Array
	private _edges: Float32Array
	private _regions: number[] = []

	private _scaledGravity: number

	public constructor(
		nodes: Float32Array,
		edges: Float32Array,
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
		this._nodes = value
	}

	public get nodes(): Float32Array {
		return this._nodes
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
			this._nodes[n + N.old_dx] = this._nodes[n + N.dx]
			this._nodes[n + N.old_dy] = this._nodes[n + N.dy]
			this._nodes[n + N.dx] = 0
			this._nodes[n + N.dy] = 0
		}
	}

	private prepareBarnesHutOptimization(): void {
		// 1.bis) Barnes-Hut computation
		//------------------------------
		if (this._config.barnesHutOptimize) {
			this._regions = [] //new Float32Array(this.nodesLength / ppn * 4 * ppr)

			// Setting up
			// Computing min and max values
			const [minX, maxX, minY, maxY] = this.getNodeBounds()

			// Build the Barnes Hut root region
			this._regions[R.node] = -1
			this._regions[R.centerX] = (minX + maxX) / 2
			this._regions[R.centerY] = (minY + maxY) / 2
			this._regions[R.size] = Math.max(maxX - minX + maxY - minY)
			this.clearRegion(0, -1)

			// Add each node in the tree
			let l = 1
			for (let n = 0; n < this.nodesLength; n += ppn) {
				// Current region, starting with root
				let r = 0

				while (true) {
					// Are there sub-regions?

					// We look at first child index
					if (this._regions[r + R.firstChild] >= 0) {
						// There are sub-regions

						// We just iterate to find a leaf of the tree
						// that is an empty region or a region with a single node
						// (see next case)

						// Find the quadrant of n
						const q = this.getQuadrantOfNodeInRegion(n, r)

						// Update center of mass and mass (we only do it for non-leaf regions)
						this._regions[r + R.massCenterX] =
							(this._regions[r + R.massCenterX] * this._regions[r + R.mass] +
								this._nodes[n + N.x] * this._nodes[n + N.mass]) /
							(this._regions[r + R.mass] + this._nodes[n + N.mass])

						this._regions[r + R.massCenterY] =
							(this._regions[r + R.massCenterY] * this._regions[r + R.mass] +
								this._nodes[n + N.y] * this._nodes[n + N.mass]) /
							(this._regions[r + R.mass] + this._nodes[n + N.mass])

						this._regions[r + R.mass] += this._nodes[n + N.mass]

						// Iterate on the right quadrant
						r = q
						continue
					} else {
						// There are no sub-regions: we are in a leaf

						// Is there a node in this leaf?
						if (this._regions[r + R.node] < 0) {
							// There is no node in region:
							// we record node n and go on
							this._regions[r + R.node] = n
							break
						} else {
							// There is a node in this region

							// We will need to create sub-regions, stick the two
							// nodes (the old one r[0] and the new one n) in two
							// subregions. If they fall in the same quadrant,
							// we will iterate.

							// Create sub-regions
							this._regions[r + R.firstChild] = l * ppr
							let w = this._regions[r + R.size] / 2 // new size (half)

							// NOTE: we use screen coordinates
							// from Top Left to Bottom Right

							// Top Left sub-region
							let g = this._regions[r + R.firstChild]

							this._regions[g + R.node] = -1
							this._regions[g + R.centerX] = this._regions[r + R.centerX] - w
							this._regions[g + R.centerY] = this._regions[r + R.centerY] - w
							this._regions[g + R.size] = w
							this.clearRegion(g, g + ppr)

							// Bottom Left sub-region
							g += ppr
							this._regions[g + R.node] = -1
							this._regions[g + R.centerX] = this._regions[r + R.centerX] - w
							this._regions[g + R.centerY] = this._regions[r + R.centerY] + w
							this._regions[g + R.size] = w
							this.clearRegion(g, g + ppr)

							// Top Right sub-region
							g += ppr
							this._regions[g + R.node] = -1
							this._regions[g + R.centerX] = this._regions[r + R.centerX] + w
							this._regions[g + R.centerY] = this._regions[r + R.centerY] - w
							this._regions[g + R.size] = w
							this.clearRegion(g, g + ppr)

							// Bottom Right sub-region
							g += ppr
							this._regions[g + R.node] = -1
							this._regions[g + R.centerX] = this._regions[r + R.centerX] + w
							this._regions[g + R.centerY] = this._regions[r + R.centerY] + w
							this._regions[g + R.size] = w
							this._regions[g + R.nextSibling] = this._regions[
								r + R.nextSibling
							]
							this.clearRegion(g, r + R.nextSibling)

							l += 4

							// Now the goal is to find two different sub-regions
							// for the two nodes: the one previously recorded (r[0])
							// and the one we want to add (n)

							// Find the quadrant of the old node
							const q = this.getQuadrantOfNodeInRegion(
								this._regions[r + R.node],
								r,
							)

							// We remove r[0] from the region r, add its mass to r and record it in q
							this._regions[r + R.mass] = this._nodes[
								this._regions[r + R.node] + N.mass
							]
							this._regions[r + R.massCenterX] = this._nodes[
								this._regions[r + R.node] + N.x
							]
							this._regions[r + R.massCenterY] = this._nodes[
								this._regions[r + R.node] + N.y
							]

							this._regions[q + R.node] = this._regions[r + R.node]
							this._regions[r + R.node] = -1

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
							this._regions[q + R.node] = n
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
					if (this._regions[r + R.firstChild] >= 0) {
						let factor
						// The region has sub-regions

						// We run the Barnes Hut test to see if we are at the right distance
						let distance = Math.sqrt(
							this._nodes[n + N.x] -
								this._regions[r + R.massCenterX] ** 2 +
								this._nodes[n + N.y] -
								this._regions[r + R.massCenterY] ** 2,
						)

						if (
							(2 * this._regions[r + R.size]) / distance <
							this._config.barnesHutTheta
						) {
							// We treat the region as a single body, and we repulse
							let xDist =
								this._nodes[n + N.x] - this._regions[r + R.massCenterX]
							let yDist =
								this._nodes[n + N.y] - this._regions[r + R.massCenterY]

							if (this._config.adjustSize) {
								//-- Linear Anti-collision Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[n + N.mass] *
											this._regions[r + R.mass]) /
										distance /
										distance

									this._nodes[n + N.dx] += xDist * factor
									this._nodes[n + N.dy] += yDist * factor
								} else if (distance < 0) {
									factor =
										(-coefficient *
											this._nodes[n + N.mass] *
											this._regions[r + R.mass]) /
										distance

									this._nodes[n + N.dx] += xDist * factor
									this._nodes[n + N.dy] += yDist * factor
								}
							} else {
								//-- Linear Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[n + N.mass] *
											this._regions[r + R.mass]) /
										distance /
										distance

									this._nodes[n + N.dx] += xDist * factor
									this._nodes[n + N.dy] += yDist * factor
								}
							}

							// When this is done, we iterate. We have to look at the next sibling.
							if (this._regions[r + R.nextSibling] < 0) break // No next sibling: we have finished the tree
							r = this._regions[r + R.nextSibling]
							continue
						} else {
							// The region is too close and we have to look at sub-regions
							r = this._regions[r + R.firstChild]
							continue
						}
					} else {
						let xDist
						let yDist
						let distance
						let factor
						// The region has no sub-region
						// If there is a node r[0] and it is not n, then repulse

						if (
							this._regions[r + R.node] >= 0 &&
							this._regions[r + R.node] !== n
						) {
							xDist =
								this._nodes[n + N.x] -
								this._nodes[this._regions[r + R.node] + N.x]
							yDist =
								this._nodes[n + N.y] -
								this._nodes[this._regions[r + R.node] + N.y]

							distance = Math.sqrt(xDist * xDist + yDist * yDist)

							if (this._config.adjustSize) {
								//-- Linear Anti-collision Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[n + N.mass] *
											this._nodes[this._regions[r + R.node] + N.mass]) /
										distance /
										distance

									this._nodes[n + N.dx] += xDist * factor
									this._nodes[n + N.dy] += yDist * factor
								} else if (distance < 0) {
									factor =
										(-coefficient *
											this._nodes[n + N.mass] *
											this._nodes[this._regions[r + R.node] + N.mass]) /
										distance

									this._nodes[n + N.dx] += xDist * factor
									this._nodes[n + N.dy] += yDist * factor
								}
							} else {
								//-- Linear Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[n + N.mass] *
											this._nodes[this._regions[r + R.node] + N.mass]) /
										distance /
										distance

									this._nodes[n + N.dx] += xDist * factor
									this._nodes[n + N.dy] += yDist * factor
								}
							}
						}

						// When this is done, we iterate. We have to look at the next sibling.
						if (this._regions[r + R.nextSibling] < 0) break // No next sibling: we have finished the tree
						r = this._regions[r + R.nextSibling]
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
					let xDist = this._nodes[n1 + N.x] - this._nodes[n2 + N.x]
					let yDist = this._nodes[n1 + N.y] - this._nodes[n2 + N.y]
					let factor

					if (this._config.adjustSize) {
						//-- Anticollision Linear Repulsion
						let distance =
							Math.sqrt(xDist * xDist + yDist * yDist) -
							this._nodes[n1 + N.size] -
							this._nodes[n2 + N.size]

						if (distance > 0) {
							factor =
								(coefficient *
									this._nodes[n1 + N.mass] *
									this._nodes[n2 + N.mass]) /
								distance /
								distance

							// Updating nodes' dx and dy
							this._nodes[n1 + N.dx] += xDist * factor
							this._nodes[n1 + N.dy] += yDist * factor

							this._nodes[n2 + N.dx] += xDist * factor
							this._nodes[n2 + N.dy] += yDist * factor
						} else if (distance < 0) {
							factor =
								100 *
								coefficient *
								this._nodes[n1 + N.mass] *
								this._nodes[n2 + N.mass]

							// Updating nodes' dx and dy
							this._nodes[n1 + N.dx] += xDist * factor
							this._nodes[n1 + N.dy] += yDist * factor

							this._nodes[n2 + N.dx] -= xDist * factor
							this._nodes[n2 + N.dy] -= yDist * factor
						}
					} else {
						//-- Linear Repulsion
						let distance = Math.sqrt(xDist * xDist + yDist * yDist)

						if (distance > 0) {
							factor =
								(coefficient *
									this._nodes[n1 + N.mass] *
									this._nodes[n2 + N.mass]) /
								distance /
								distance

							// Updating nodes' dx and dy
							this._nodes[n1 + N.dx] += xDist * factor
							this._nodes[n1 + N.dy] += yDist * factor

							this._nodes[n2 + N.dx] -= xDist * factor
							this._nodes[n2 + N.dy] -= yDist * factor
						}
					}
				}
			}
		}
	}

	private computeGravity() {
		for (let n = 0; n < this.nodesLength; n += ppn) {
			// Common to both methods
			const xDist = this._nodes[n + N.x]
			const yDist = this._nodes[n + N.y]
			const distance = Math.sqrt(xDist ** 2 + yDist ** 2)
			const factor = this.getGravityFactor(n, distance)

			// Updating node's dx and dy
			this._nodes[n + N.dx] -= xDist * factor
			this._nodes[n + N.dy] -= yDist * factor
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
			const n1 = this._edges[e + E.source]
			const n2 = this._edges[e + E.target]
			const w = this._edges[e + E.weight]

			// Edge weight influence
			const ewc = Math.pow(w, this._config.edgeWeightInfluence)

			// Common measures
			const xDist = this._nodes[n1 + N.x] - this._nodes[n2 + N.x]
			const yDist = this._nodes[n1 + N.y] - this._nodes[n2 + N.y]
			let distance, factor

			// Applying attraction to nodes
			if (this._config.adjustSizes) {
				distance = Math.sqrt(
					Math.pow(xDist, 2) +
						Math.pow(yDist, 2) -
						this._nodes[n1 + N.size] -
						this._nodes[n2 + N.size],
				)

				if (this._config.linLogMode) {
					if (this._config.outboundAttractionDistribution) {
						//-- LinLog Degree Distributed Anti-collision Attraction
						if (distance > 0) {
							factor =
								(-coefficient * ewc * Math.log(1 + distance)) /
								distance /
								this._nodes[n1 + N.mass]
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
							factor = (-coefficient * ewc) / this._nodes[n1 + N.mass]
						}
					} else {
						//-- Linear Anti-collision Attraction
						if (distance > 0) {
							factor = -coefficient * ewc
						}
					}
				}
			} else {
				distance = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2))

				if (this._config.linLogMode) {
					if (this._config.outboundAttractionDistribution) {
						//-- LinLog Degree Distributed Attraction
						if (distance > 0) {
							factor =
								(-coefficient * ewc * Math.log(1 + distance)) /
								distance /
								this._nodes[n1 + N.mass]
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
						factor = (-coefficient * ewc) / this._nodes[n1 + N.mass]
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
				this._nodes[n1 + N.dx] += xDist * factor
				this._nodes[n1 + N.dy] += yDist * factor

				this._nodes[n2 + N.dx] -= xDist * factor
				this._nodes[n2 + N.dy] -= yDist * factor
			}
		}
	}

	private applyForces() {
		let force, swinging, traction, nodespeed

		// MATH: sqrt and square distances
		if (this._config.adjustSizes) {
			for (let n = 0; n < this.nodesLength; n += ppn) {
				if (!this._nodes[n + N.fixed]) {
					force = Math.sqrt(
						Math.pow(this._nodes[n + N.dx], 2) +
							Math.pow(this._nodes[n + N.dy], 2),
					)

					if (force > this.maxForce) {
						this._nodes[n + N.dx] =
							(this._nodes[n + N.dx] * this.maxForce) / force
						this._nodes[n + N.dy] =
							(this._nodes[n + N.dy] * this.maxForce) / force
					}

					swinging =
						this._nodes[n + N.mass] *
						Math.sqrt(
							(this._nodes[n + N.old_dx] - this._nodes[n + N.dx]) *
								(this._nodes[n + N.old_dx] - this._nodes[n + N.dx]) +
								(this._nodes[n + N.old_dy] - this._nodes[n + N.dy]) *
									(this._nodes[n + N.old_dy] - this._nodes[n + N.dy]),
						)

					traction =
						Math.sqrt(
							(this._nodes[n + N.old_dx] + this._nodes[n + N.dx]) *
								(this._nodes[n + N.old_dx] + this._nodes[n + N.dx]) +
								(this._nodes[n + N.old_dy] + this._nodes[n + N.dy]) *
									(this._nodes[n + N.old_dy] + this._nodes[n + N.dy]),
						) / 2

					nodespeed = (0.1 * Math.log(1 + traction)) / (1 + Math.sqrt(swinging))

					// Updating node's positon
					this._nodes[n + N.x] =
						this._nodes[n + N.x] +
						this._nodes[n + N.dx] * (nodespeed / this._config.slowDown)
					this._nodes[n + N.y] =
						this._nodes[n + N.y] +
						this._nodes[n + N.dy] * (nodespeed / this._config.slowDown)
				}
			}
		} else {
			for (let n = 0; n < this.nodesLength; n += ppn) {
				if (!this._nodes[n + N.fixed]) {
					swinging =
						this._nodes[n + N.mass] *
						Math.sqrt(
							(this._nodes[n + N.old_dx] - this._nodes[n + N.dx]) *
								(this._nodes[n + N.old_dx] - this._nodes[n + N.dx]) +
								(this._nodes[n + N.old_dy] - this._nodes[n + N.dy]) *
									(this._nodes[n + N.old_dy] - this._nodes[n + N.dy]),
						)

					traction =
						Math.sqrt(
							(this._nodes[n + N.old_dx] + this._nodes[n + N.dx]) *
								(this._nodes[n + N.old_dx] + this._nodes[n + N.dx]) +
								(this._nodes[n + N.old_dy] + this._nodes[n + N.dy]) *
									(this._nodes[n + N.old_dy] + this._nodes[n + N.dy]),
						) / 2

					nodespeed =
						(this._nodes[n + N.convergence] * Math.log(1 + traction)) /
						(1 + Math.sqrt(swinging))

					// Updating node convergence
					this._nodes[n + N.convergence] = Math.min(
						1,
						Math.sqrt(
							(nodespeed *
								(Math.pow(this._nodes[n + N.dx], 2) +
									Math.pow(this._nodes[n + N.dy], 2))) /
								(1 + Math.sqrt(swinging)),
						),
					)

					// Updating node's positon
					this._nodes[n + N.x] =
						this._nodes[n + N.x] +
						this._nodes[n + N.dx] * (nodespeed / this._config.slowDown)
					this._nodes[n + N.y] =
						this._nodes[n + N.y] +
						this._nodes[n + N.dy] * (nodespeed / this._config.slowDown)
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
				outboundAttCompensation += this._nodes[n + N.mass]
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
			minX = Math.min(minX, this._nodes[n + N.x])
			maxX = Math.max(maxX, this._nodes[n + N.x])
			minY = Math.min(minY, this._nodes[n + N.y])
			maxY = Math.max(maxY, this._nodes[n + N.y])
		}
		return [minX, maxX, minY, maxY]
	}

	private getQuadrantOfNodeInRegion(n: number, r: number): number {
		// Find the quadrant of n
		if (this._nodes[n + N.x] < this._regions[r + R.centerX]) {
			if (this._nodes[n + N.y] < this._regions[r + R.centerY]) {
				// Top Left quarter
				return this._regions[r + R.firstChild]
			} else {
				// Bottom Left quarter
				return this._regions[r + R.firstChild] + ppr
			}
		} else {
			if (this._nodes[n + N.y] < this._regions[r + R.centerY]) {
				// Top Right quarter
				return this._regions[r + R.firstChild] + ppr * 2
			} else {
				// Bottom Right quarter
				return this._regions[r + R.firstChild] + ppr * 3
			}
		}
	}

	private getGravityFactor(n: number, distance: number) {
		const coefficient = this._config.scalingRatio
		const g = this._scaledGravity

		let factor = 0
		if (this._config.strongGravityMode) {
			//-- Strong gravity
			if (distance > 0) {
				factor = coefficient * this._nodes[n + N.mass] * g
			}
		} else {
			//-- Linear Anti-collision Repulsion n
			if (distance > 0) {
				factor = (coefficient * this._nodes[n + N.mass] * g) / distance
			}
		}
		return factor
	}

	private clearRegion(r: number, nextSibling: number) {
		this._regions[r + R.nextSibling] = nextSibling
		this._regions[r + R.firstChild] = -1
		this._regions[r + R.mass] = 0
		this._regions[r + R.massCenterX] = 0
		this._regions[r + R.massCenterY] = 0
	}
}
