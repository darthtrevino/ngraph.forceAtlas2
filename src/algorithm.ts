import { DEFAULT_CONFIGURATION, FA2Configuration } from './configuration'

export const ppn = 10
export const ppe = 3
export const ppr = 9
const MAX_FORCE = 10

export enum NP {
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

export enum EP {
	source = 0,
	target = 1,
	weight = 2,
}

export enum RP {
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

function np(i: number, p: NP) {
	// DEBUG: safeguards
	if (i % ppn !== 0) {
		throw new Error(`np: non correct (${i})`)
	}
	return i + p
}

function ep(i: number, p: EP) {
	// DEBUG: safeguards
	if (i % ppe !== 0) {
		throw new Error(`ep: non correct (${i})`)
	}
	return i + p
}

export class FA2Algorithm {
	private _config: FA2Configuration
	private _iterations = 0
	private _converged = false
	private _nodes: Float32Array
	private _edges: Float32Array
	private _regions: number[] = []

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
		var a, i, j, l, r, n, n1, n2, e, w, g, k, m

		var outboundAttCompensation = this.outboundAttCompensation,
			coefficient,
			xDist,
			yDist,
			ewc,
			mass,
			distance,
			size,
			factor

		this.resetDeltas()
		this.prepareBarnesHutOptimization()

		// 2) Repulsion
		//--------------
		// NOTES: adjustSize = antiCollision & scalingRatio = coefficient

		if (this.configuration.barnesHutOptimize) {
			coefficient = this.configuration.scalingRatio

			// Applying repulsion through regions
			for (n = 0; n < this.nodesLength; n += ppn) {
				// Computing leaf quad nodes iteration

				r = 0 // Starting with root region
				while (true) {
					if (this._regions[r + RP.firstChild] >= 0) {
						// The region has sub-regions

						// We run the Barnes Hut test to see if we are at the right distance
						distance = Math.sqrt(
							Math.pow(
								this._nodes[np(n, NP.x)] - this._regions[r + RP.massCenterX],
								2,
							) +
								Math.pow(
									this._nodes[np(n, NP.y)] - this._regions[r + RP.massCenterY],
									2,
								),
						)

						if (
							(2 * this._regions[r + RP.size]) / distance <
							this.configuration.barnesHutTheta
						) {
							// We treat the region as a single body, and we repulse

							xDist =
								this._nodes[np(n, NP.x)] - this._regions[r + RP.massCenterX]
							yDist =
								this._nodes[np(n, NP.y)] - this._regions[r + RP.massCenterY]

							if (this.configuration.adjustSize) {
								//-- Linear Anti-collision Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[np(n, NP.mass)] *
											this._regions[r + RP.mass]) /
										distance /
										distance

									this._nodes[np(n, NP.dx)] += xDist * factor
									this._nodes[np(n, NP.dy)] += yDist * factor
								} else if (distance < 0) {
									factor =
										(-coefficient *
											this._nodes[np(n, NP.mass)] *
											this._regions[r + RP.mass]) /
										distance

									this._nodes[np(n, NP.dx)] += xDist * factor
									this._nodes[np(n, NP.dy)] += yDist * factor
								}
							} else {
								//-- Linear Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[np(n, NP.mass)] *
											this._regions[r + RP.mass]) /
										distance /
										distance

									this._nodes[np(n, NP.dx)] += xDist * factor
									this._nodes[np(n, NP.dy)] += yDist * factor
								}
							}

							// When this is done, we iterate. We have to look at the next sibling.
							if (this._regions[r + RP.nextSibling] < 0) break // No next sibling: we have finished the tree
							r = this._regions[r + RP.nextSibling]
							continue
						} else {
							// The region is too close and we have to look at sub-regions
							r = this._regions[r + RP.firstChild]
							continue
						}
					} else {
						// The region has no sub-region
						// If there is a node r[0] and it is not n, then repulse

						if (
							this._regions[r + RP.node] >= 0 &&
							this._regions[r + RP.node] !== n
						) {
							xDist =
								this._nodes[np(n, NP.x)] -
								this._nodes[np(this._regions[r + RP.node], NP.x)]
							yDist =
								this._nodes[np(n, NP.y)] -
								this._nodes[np(this._regions[r + RP.node], NP.y)]

							distance = Math.sqrt(xDist * xDist + yDist * yDist)

							if (this.configuration.adjustSize) {
								//-- Linear Anti-collision Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[np(n, NP.mass)] *
											this._nodes[np(this._regions[r + RP.node], NP.mass)]) /
										distance /
										distance

									this._nodes[np(n, NP.dx)] += xDist * factor
									this._nodes[np(n, NP.dy)] += yDist * factor
								} else if (distance < 0) {
									factor =
										(-coefficient *
											this._nodes[np(n, NP.mass)] *
											this._nodes[np(this._regions[r + RP.node], NP.mass)]) /
										distance

									this._nodes[np(n, NP.dx)] += xDist * factor
									this._nodes[np(n, NP.dy)] += yDist * factor
								}
							} else {
								//-- Linear Repulsion
								if (distance > 0) {
									factor =
										(coefficient *
											this._nodes[np(n, NP.mass)] *
											this._nodes[np(this._regions[r + RP.node], NP.mass)]) /
										distance /
										distance

									this._nodes[np(n, NP.dx)] += xDist * factor
									this._nodes[np(n, NP.dy)] += yDist * factor
								}
							}
						}

						// When this is done, we iterate. We have to look at the next sibling.
						if (this._regions[r + RP.nextSibling] < 0) break // No next sibling: we have finished the tree
						r = this._regions[r + RP.nextSibling]
						continue
					}
				}
			}
		} else {
			coefficient = this.configuration.scalingRatio

			// Square iteration
			for (n1 = 0; n1 < this.nodesLength; n1 += ppn) {
				for (n2 = 0; n2 < n1; n2 += ppn) {
					// Common to both methods
					xDist = this._nodes[np(n1, NP.x)] - this._nodes[np(n2, NP.x)]
					yDist = this._nodes[np(n1, NP.y)] - this._nodes[np(n2, NP.y)]

					if (this.configuration.adjustSize) {
						//-- Anticollision Linear Repulsion
						distance =
							Math.sqrt(xDist * xDist + yDist * yDist) -
							this._nodes[np(n1, NP.size)] -
							this._nodes[np(n2, NP.size)]

						if (distance > 0) {
							factor =
								(coefficient *
									this._nodes[np(n1, NP.mass)] *
									this._nodes[np(n2, NP.mass)]) /
								distance /
								distance

							// Updating nodes' dx and dy
							this._nodes[np(n1, NP.dx)] += xDist * factor
							this._nodes[np(n1, NP.dy)] += yDist * factor

							this._nodes[np(n2, NP.dx)] += xDist * factor
							this._nodes[np(n2, NP.dy)] += yDist * factor
						} else if (distance < 0) {
							factor =
								100 *
								coefficient *
								this._nodes[np(n1, NP.mass)] *
								this._nodes[np(n2, NP.mass)]

							// Updating nodes' dx and dy
							this._nodes[np(n1, NP.dx)] += xDist * factor
							this._nodes[np(n1, NP.dy)] += yDist * factor

							this._nodes[np(n2, NP.dx)] -= xDist * factor
							this._nodes[np(n2, NP.dy)] -= yDist * factor
						}
					} else {
						//-- Linear Repulsion
						distance = Math.sqrt(xDist * xDist + yDist * yDist)

						if (distance > 0) {
							factor =
								(coefficient *
									this._nodes[np(n1, NP.mass)] *
									this._nodes[np(n2, NP.mass)]) /
								distance /
								distance

							// Updating nodes' dx and dy
							this._nodes[np(n1, NP.dx)] += xDist * factor
							this._nodes[np(n1, NP.dy)] += yDist * factor

							this._nodes[np(n2, NP.dx)] -= xDist * factor
							this._nodes[np(n2, NP.dy)] -= yDist * factor
						}
					}
				}
			}
		}

		// 3) Gravity
		//------------
		g = this.configuration.gravity / this.configuration.scalingRatio
		coefficient = this.configuration.scalingRatio
		for (n = 0; n < this.nodesLength; n += ppn) {
			factor = 0

			// Common to both methods
			xDist = this._nodes[np(n, NP.x)]
			yDist = this._nodes[np(n, NP.y)]
			distance = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2))

			if (this.configuration.strongGravityMode) {
				//-- Strong gravity
				if (distance > 0) factor = coefficient * this._nodes[np(n, NP.mass)] * g
			} else {
				//-- Linear Anti-collision Repulsion n
				if (distance > 0)
					factor = (coefficient * this._nodes[np(n, NP.mass)] * g) / distance
			}

			// Updating node's dx and dy
			this._nodes[np(n, NP.dx)] -= xDist * factor
			this._nodes[np(n, NP.dy)] -= yDist * factor
		}

		// 4) Attraction
		//---------------
		coefficient =
			1 *
			(this.configuration.outboundAttractionDistribution
				? outboundAttCompensation
				: 1)

		// TODO: simplify distance
		// TODO: coefficient is always used as -c --> optimize?
		for (e = 0; e < this.edgesLength; e += ppe) {
			n1 = this._edges[ep(e, EP.source)]
			n2 = this._edges[ep(e, EP.target)]
			w = this._edges[ep(e, EP.weight)]

			// Edge weight influence
			ewc = Math.pow(w, this.configuration.edgeWeightInfluence)

			// Common measures
			xDist = this._nodes[np(n1, NP.x)] - this._nodes[np(n2, NP.x)]
			yDist = this._nodes[np(n1, NP.y)] - this._nodes[np(n2, NP.y)]

			// Applying attraction to nodes
			if (this.configuration.adjustSizes) {
				distance = Math.sqrt(
					Math.pow(xDist, 2) +
						Math.pow(yDist, 2) -
						this._nodes[np(n1, NP.size)] -
						this._nodes[np(n2, NP.size)],
				)

				if (this.configuration.linLogMode) {
					if (this.configuration.outboundAttractionDistribution) {
						//-- LinLog Degree Distributed Anti-collision Attraction
						if (distance > 0) {
							factor =
								(-coefficient * ewc * Math.log(1 + distance)) /
								distance /
								this._nodes[np(n1, NP.mass)]
						}
					} else {
						//-- LinLog Anti-collision Attraction
						if (distance > 0) {
							factor = (-coefficient * ewc * Math.log(1 + distance)) / distance
						}
					}
				} else {
					if (this.configuration.outboundAttractionDistribution) {
						//-- Linear Degree Distributed Anti-collision Attraction
						if (distance > 0) {
							factor = (-coefficient * ewc) / this._nodes[np(n1, NP.mass)]
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

				if (this.configuration.linLogMode) {
					if (this.configuration.outboundAttractionDistribution) {
						//-- LinLog Degree Distributed Attraction
						if (distance > 0) {
							factor =
								(-coefficient * ewc * Math.log(1 + distance)) /
								distance /
								this._nodes[np(n1, NP.mass)]
						}
					} else {
						//-- LinLog Attraction
						if (distance > 0)
							factor = (-coefficient * ewc * Math.log(1 + distance)) / distance
					}
				} else {
					if (this.configuration.outboundAttractionDistribution) {
						//-- Linear Attraction Mass Distributed
						// NOTE: Distance is set to 1 to override next condition
						distance = 1
						factor = (-coefficient * ewc) / this._nodes[np(n1, NP.mass)]
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
				this._nodes[np(n1, NP.dx)] += xDist * factor
				this._nodes[np(n1, NP.dy)] += yDist * factor

				this._nodes[np(n2, NP.dx)] -= xDist * factor
				this._nodes[np(n2, NP.dy)] -= yDist * factor
			}
		}

		// 5) Apply Forces
		//-----------------
		var force, swinging, traction, nodespeed

		// MATH: sqrt and square distances
		if (this.configuration.adjustSizes) {
			for (n = 0; n < this.nodesLength; n += ppn) {
				if (!this._nodes[np(n, NP.fixed)]) {
					force = Math.sqrt(
						Math.pow(this._nodes[np(n, NP.dx)], 2) +
							Math.pow(this._nodes[np(n, NP.dy)], 2),
					)

					if (force > this.maxForce) {
						this._nodes[np(n, NP.dx)] =
							(this._nodes[np(n, NP.dx)] * this.maxForce) / force
						this._nodes[np(n, NP.dy)] =
							(this._nodes[np(n, NP.dy)] * this.maxForce) / force
					}

					swinging =
						this._nodes[np(n, NP.mass)] *
						Math.sqrt(
							(this._nodes[np(n, NP.old_dx)] - this._nodes[np(n, NP.dx)]) *
								(this._nodes[np(n, NP.old_dx)] - this._nodes[np(n, NP.dx)]) +
								(this._nodes[np(n, NP.old_dy)] - this._nodes[np(n, NP.dy)]) *
									(this._nodes[np(n, NP.old_dy)] - this._nodes[np(n, NP.dy)]),
						)

					traction =
						Math.sqrt(
							(this._nodes[np(n, NP.old_dx)] + this._nodes[np(n, NP.dx)]) *
								(this._nodes[np(n, NP.old_dx)] + this._nodes[np(n, NP.dx)]) +
								(this._nodes[np(n, NP.old_dy)] + this._nodes[np(n, NP.dy)]) *
									(this._nodes[np(n, NP.old_dy)] + this._nodes[np(n, NP.dy)]),
						) / 2

					nodespeed = (0.1 * Math.log(1 + traction)) / (1 + Math.sqrt(swinging))

					// Updating node's positon
					this._nodes[np(n, NP.x)] =
						this._nodes[np(n, NP.x)] +
						this._nodes[np(n, NP.dx)] *
							(nodespeed / this.configuration.slowDown)
					this._nodes[np(n, NP.y)] =
						this._nodes[np(n, NP.y)] +
						this._nodes[np(n, NP.dy)] *
							(nodespeed / this.configuration.slowDown)
				}
			}
		} else {
			for (n = 0; n < this.nodesLength; n += ppn) {
				if (!this._nodes[np(n, NP.fixed)]) {
					swinging =
						this._nodes[np(n, NP.mass)] *
						Math.sqrt(
							(this._nodes[np(n, NP.old_dx)] - this._nodes[np(n, NP.dx)]) *
								(this._nodes[np(n, NP.old_dx)] - this._nodes[np(n, NP.dx)]) +
								(this._nodes[np(n, NP.old_dy)] - this._nodes[np(n, NP.dy)]) *
									(this._nodes[np(n, NP.old_dy)] - this._nodes[np(n, NP.dy)]),
						)

					traction =
						Math.sqrt(
							(this._nodes[np(n, NP.old_dx)] + this._nodes[np(n, NP.dx)]) *
								(this._nodes[np(n, NP.old_dx)] + this._nodes[np(n, NP.dx)]) +
								(this._nodes[np(n, NP.old_dy)] + this._nodes[np(n, NP.dy)]) *
									(this._nodes[np(n, NP.old_dy)] + this._nodes[np(n, NP.dy)]),
						) / 2

					nodespeed =
						(this._nodes[np(n, NP.convergence)] * Math.log(1 + traction)) /
						(1 + Math.sqrt(swinging))

					// Updating node convergence
					this._nodes[np(n, NP.convergence)] = Math.min(
						1,
						Math.sqrt(
							(nodespeed *
								(Math.pow(this._nodes[np(n, NP.dx)], 2) +
									Math.pow(this._nodes[np(n, NP.dy)], 2))) /
								(1 + Math.sqrt(swinging)),
						),
					)

					// Updating node's positon
					this._nodes[np(n, NP.x)] =
						this._nodes[np(n, NP.x)] +
						this._nodes[np(n, NP.dx)] *
							(nodespeed / this.configuration.slowDown)
					this._nodes[np(n, NP.y)] =
						this._nodes[np(n, NP.y)] +
						this._nodes[np(n, NP.dy)] *
							(nodespeed / this.configuration.slowDown)
				}
			}
		}

		// Counting one more iteration
		this._iterations++
	}

	private resetDeltas(): void {
		// Resetting positions & computing max values
		for (let n = 0; n < this.nodesLength; n += ppn) {
			this._nodes[n + NP.old_dx] = this._nodes[n + NP.dx]
			this._nodes[n + NP.old_dy] = this._nodes[n + NP.dy]
			this._nodes[n + NP.dx] = 0
			this._nodes[n + NP.dy] = 0
		}
	}

	private get outboundAttCompensation() {
		let outboundAttCompensation = 0
		// If outbound attraction distribution, compensate
		if (this.configuration.outboundAttractionDistribution) {
			outboundAttCompensation = 0
			for (let n = 0; n < this.nodesLength; n += ppn) {
				outboundAttCompensation += this._nodes[n + NP.mass]
			}

			outboundAttCompensation /= this.nodesLength
		}
		return outboundAttCompensation
	}

	private prepareBarnesHutOptimization() {
		// 1.bis) Barnes-Hut computation
		//------------------------------
		if (this.configuration.barnesHutOptimize) {
			this._regions = [] //new Float32Array(this.nodesLength / ppn * 4 * ppr)
			var q, q0, q1, q2, q3

			// Setting up
			// Computing min and max values
			const [minX, maxX, minY, maxY] = this.getNodeBounds()

			// Build the Barnes Hut root region
			this._regions[0 + RP.node] = -1
			this._regions[0 + RP.centerX] = (minX + maxX) / 2
			this._regions[0 + RP.centerY] = (minY + maxY) / 2
			this._regions[0 + RP.size] = Math.max(maxX - minX + maxY - minY)
			this._regions[0 + RP.nextSibling] = -1
			this._regions[0 + RP.firstChild] = -1
			this._regions[0 + RP.mass] = 0
			this._regions[0 + RP.massCenterX] = 0
			this._regions[0 + RP.massCenterY] = 0

			// Add each node in the tree
			let l = 1
			for (let n = 0; n < this.nodesLength; n += ppn) {
				// Current region, starting with root
				let r = 0

				while (true) {
					// Are there sub-regions?

					// We look at first child index
					if (this._regions[r + RP.firstChild] >= 0) {
						// There are sub-regions

						// We just iterate to find a leaf of the tree
						// that is an empty region or a region with a single node
						// (see next case)

						// Find the quadrant of n
						const q = this.getQuadrantOfNodeInRegion(n, r)

						// Update center of mass and mass (we only do it for non-leaf regions)
						this._regions[r + RP.massCenterX] =
							(this._regions[r + RP.massCenterX] * this._regions[r + RP.mass] +
								this._nodes[np(n, NP.x)] * this._nodes[np(n, NP.mass)]) /
							(this._regions[r + RP.mass] + this._nodes[np(n, NP.mass)])

						this._regions[r + RP.massCenterY] =
							(this._regions[r + RP.massCenterY] * this._regions[r + RP.mass] +
								this._nodes[np(n, NP.y)] * this._nodes[np(n, NP.mass)]) /
							(this._regions[r + RP.mass] + this._nodes[np(n, NP.mass)])

						this._regions[r + RP.mass] += this._nodes[np(n, NP.mass)]

						// Iterate on the right quadrant
						r = q
						continue
					} else {
						// There are no sub-regions: we are in a leaf

						// Is there a node in this leaf?
						if (this._regions[r + RP.node] < 0) {
							// There is no node in region:
							// we record node n and go on
							this._regions[r + RP.node] = n
							break
						} else {
							// There is a node in this region

							// We will need to create sub-regions, stick the two
							// nodes (the old one r[0] and the new one n) in two
							// subregions. If they fall in the same quadrant,
							// we will iterate.

							// Create sub-regions
							this._regions[r + RP.firstChild] = l * ppr
							let w = this._regions[r + RP.size] / 2 // new size (half)

							// NOTE: we use screen coordinates
							// from Top Left to Bottom Right

							// Top Left sub-region
							let g = this._regions[r + RP.firstChild]

							this._regions[g + RP.node] = -1
							this._regions[g + RP.centerX] = this._regions[r + RP.centerX] - w
							this._regions[g + RP.centerY] = this._regions[r + RP.centerY] - w
							this._regions[g + RP.size] = w
							this._regions[g + RP.nextSibling] = g + ppr
							this._regions[g + RP.firstChild] = -1
							this._regions[g + RP.mass] = 0
							this._regions[g + RP.massCenterX] = 0
							this._regions[g + RP.massCenterY] = 0

							// Bottom Left sub-region
							g += ppr
							this._regions[g + RP.node] = -1
							this._regions[g + RP.centerX] = this._regions[r + RP.centerX] - w
							this._regions[g + RP.centerY] = this._regions[r + RP.centerY] + w
							this._regions[g + RP.size] = w
							this._regions[g + RP.nextSibling] = g + ppr
							this._regions[g + RP.firstChild] = -1
							this._regions[g + RP.mass] = 0
							this._regions[g + RP.massCenterX] = 0
							this._regions[g + RP.massCenterY] = 0

							// Top Right sub-region
							g += ppr
							this._regions[g + RP.node] = -1
							this._regions[g + RP.centerX] = this._regions[r + RP.centerX] + w
							this._regions[g + RP.centerY] = this._regions[r + RP.centerY] - w
							this._regions[g + RP.size] = w
							this._regions[g + RP.nextSibling] = g + ppr
							this._regions[g + RP.firstChild] = -1
							this._regions[g + RP.mass] = 0
							this._regions[g + RP.massCenterX] = 0
							this._regions[g + RP.massCenterY] = 0

							// Bottom Right sub-region
							g += ppr
							this._regions[g + RP.node] = -1
							this._regions[g + RP.centerX] = this._regions[r + RP.centerX] + w
							this._regions[g + RP.centerY] = this._regions[r + RP.centerY] + w
							this._regions[g + RP.size] = w
							this._regions[g + RP.nextSibling] = this._regions[
								r + RP.nextSibling
							]
							this._regions[g + RP.firstChild] = -1
							this._regions[g + RP.mass] = 0
							this._regions[g + RP.massCenterX] = 0
							this._regions[g + RP.massCenterY] = 0

							l += 4

							// Now the goal is to find two different sub-regions
							// for the two nodes: the one previously recorded (r[0])
							// and the one we want to add (n)

							// Find the quadrant of the old node
							const q = this.getQuadrantOfNodeInRegion(
								this._regions[r + RP.node],
								r,
							)

							// We remove r[0] from the region r, add its mass to r and record it in q
							this._regions[r + RP.mass] = this._nodes[
								np(this._regions[r + RP.node], NP.mass)
							]
							this._regions[r + RP.massCenterX] = this._nodes[
								np(this._regions[r + RP.node], NP.x)
							]
							this._regions[r + RP.massCenterY] = this._nodes[
								np(this._regions[r + RP.node], NP.y)
							]

							this._regions[q + RP.node] = this._regions[r + RP.node]
							this._regions[r + RP.node] = -1

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
							this._regions[q + RP.node] = n
							break
						}
					}
				}
			}
		}
	}

	private getNodeBounds(): [number, number, number, number] {
		let minX = Infinity
		let maxX = -Infinity
		let minY = Infinity
		let maxY = -Infinity

		// Setting up
		// Computing min and max values
		for (let n = 0; n < this.nodesLength; n += ppn) {
			minX = Math.min(minX, this._nodes[n + NP.x])
			maxX = Math.max(maxX, this._nodes[n + NP.x])
			minY = Math.min(minY, this._nodes[n + NP.y])
			maxY = Math.max(maxY, this._nodes[n + NP.y])
		}
		return [minX, maxX, minY, maxY]
	}

	private getQuadrantOfNodeInRegion(n: number, r: number): number {
		// Find the quadrant of n
		if (this._nodes[n + NP.x] < this._regions[r + RP.centerX]) {
			if (this._nodes[n + NP.y] < this._regions[r + RP.centerY]) {
				// Top Left quarter
				return this._regions[r + RP.firstChild]
			} else {
				// Bottom Left quarter
				return this._regions[r + RP.firstChild] + ppr
			}
		} else {
			if (this._nodes[n + NP.y] < this._regions[r + RP.centerY]) {
				// Top Right quarter
				return this._regions[r + RP.firstChild] + ppr * 2
			} else {
				// Bottom Right quarter
				return this._regions[r + RP.firstChild] + ppr * 3
			}
		}
	}
}
