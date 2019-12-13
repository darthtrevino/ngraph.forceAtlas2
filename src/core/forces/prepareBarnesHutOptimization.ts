import { ppn, ppr, Regions, Nodes } from '../data_structures'

export function prepareBarnesHutOptimization(nodes: Nodes): Regions {
	// 1.bis) Barnes-Hut computation
	//------------------------------
	const regions = new Regions(new Array((nodes.length / ppn) * 4 * ppr))

	// Setting up
	// Computing min and max values
	const [minX, maxX, minY, maxY] = nodes.getBounds()

	// Build the Barnes Hut root region
	initRegion(
		regions,
		0,
		(minX + maxX) / 2,
		(minY + maxY) / 2,
		Math.max(maxX - minX + maxY - minY),
		-1,
	)

	// Add each node in the tree
	let l = 1
	for (let n = 0; n < nodes.length; n += ppn) {
		// Current region, starting with root
		let r = 0

		while (true) {
			// Are there sub-regions?

			// We look at first child index
			if (regions.firstChild(r) >= 0) {
				// There are sub-regions

				// We just iterate to find a leaf of the tree
				// that is an empty region or a region with a single node
				// (see next case)

				// Find the quadrant of n
				const q = getQuadrantOfNodeInRegion(nodes, regions, n, r)

				// Update center of mass and mass (we only do it for non-leaf regions)
				regions.setMassCenterX(
					r,
					(regions.massCenterX(r) * regions.mass(r) +
						nodes.x(n) * nodes.mass(n)) /
						(regions.mass(r) + nodes.mass(n)),
				)

				regions.setMassCenterY(
					r,
					(regions.massCenterY(r) * regions.mass(r) +
						nodes.y(n) * nodes.mass(n)) /
						(regions.mass(r) + nodes.mass(n)),
				)

				regions.addMass(r, nodes.mass(n))

				// Iterate on the correct quadrant
				r = q
				continue
			} else {
				// There are no sub-regions: we are in a leaf

				// Is there a node in this leaf?
				if (regions.node(r) < 0) {
					// There is no node in region;  we record node n and go on
					regions.setNode(r, n)
					break
				} else {
					// There is a node in this region

					// We will need to create sub-regions, stick the two
					// nodes (the old one r[0] and the new one n) in two
					// subregions. If they fall in the same quadrant,
					// we will iterate.

					// Create sub-regions
					regions.setFirstChild(r, l * ppr)
					let w = regions.size(r) / 2 // new size (half)

					// NOTE: we use screen coordinates
					// from Top Left to Bottom Right

					// Top Left sub-region
					let g = regions.firstChild(r)
					initRegion(
						regions,
						g,
						regions.centerX(r) - w,
						regions.centerY(r) - w,
						w,
						g + ppr,
					)

					// Bottom Left sub-region
					g += ppr
					initRegion(
						regions,
						g,
						regions.centerX(r) - w,
						regions.centerY(r) + w,
						w,
						g + ppr,
					)

					// Top Right sub-region
					g += ppr
					initRegion(
						regions,
						g,
						regions.centerX(r) + w,
						regions.centerY(r) - w,
						w,
						g + ppr,
					)

					// Bottom Right sub-region
					g += ppr
					initRegion(
						regions,
						g,
						regions.centerX(r) + w,
						regions.centerY(r) + w,
						w,
						regions.nextSibling(r),
					)

					l += 4

					// Now the goal is to find two different sub-regions
					// for the two nodes: the one previously recorded (r[0])
					// and the one we want to add (n)

					// Find the quadrant of the old node
					const q = getQuadrantOfNodeInRegion(
						nodes,
						regions,
						regions.node(r),
						r,
					)

					// We remove r[0] from the region r, add its mass to r and record it in q
					regions.setMass(r, nodes.mass(regions.node(r)))
					regions.setMassCenterX(r, nodes.x(regions.node(r)))
					regions.setMassCenterY(r, nodes.y(regions.node(r)))

					regions.setNode(q, regions.node(r))
					regions.setNode(r, -1)

					// Find the quadrant of n
					const q2 = getQuadrantOfNodeInRegion(nodes, regions, n, r)

					if (q === q2) {
						// If both nodes are in the same quadrant,
						// we have to try it again on this quadrant
						r = q
						continue
					}

					// If both quadrants are different, we record n
					// in its quadrant
					regions.setNode(q, n)
					break
				}
			}
		}
	}

	return regions
}

function initRegion(
	regions: Regions,
	r: number,
	centerX: number,
	centerY: number,
	size: number,
	nextSibling: number,
) {
	regions.setNextSibling(r, nextSibling)
	regions.setCenterX(r, centerX)
	regions.setCenterY(r, centerY)
	regions.setSize(r, size)
	regions.setNode(r, -1)
	regions.setFirstChild(r, -1)
	regions.setMass(r, 0)
	regions.setMassCenterX(r, 0)
	regions.setMassCenterY(r, 0)
}

function getQuadrantOfNodeInRegion(
	nodes: Nodes,
	regions: Regions,
	n: number,
	r: number,
): number {
	// Find the quadrant of n
	if (nodes.x(n) < regions.centerX(r)) {
		if (nodes.y(n) < regions.centerY(r)) {
			// Top Left quarter
			return regions.firstChild(r)
		} else {
			// Bottom Left quarter
			return regions.firstChild(r) + ppr
		}
	} else {
		if (nodes.y(n) < regions.centerY(r)) {
			// Top Right quarter
			return regions.firstChild(r) + ppr * 2
		} else {
			// Bottom Right quarter
			return regions.firstChild(r) + ppr * 3
		}
	}
}
