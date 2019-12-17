import { prepareBarnesHutOptimization } from '../computeRepulsion/prepareBarnesHutOptimization'
import { NodeStore } from '../../marshaling'

describe('prepareBarnesHutOptimization', () => {
	it('sets up an empty root quadtree if no nodes are present', () => {
		const nodes = new NodeStore(new Float32Array())
		const qt = prepareBarnesHutOptimization(nodes)
		expect(qt).toBeDefined()

		// Dimensions are invalid with no nodes
		expect(qt.centerX).toBeNaN()
		expect(qt.centerY).toBeNaN()
	})

	it('sets up a root quadtree with a single node', () => {
		// prettier-ignore
		const nodes = new NodeStore(new Float32Array([
      // Node @ (5,5)
      5, 5, 0, 0, 0, 0, 1, 0, 0, 0,
    ]))
		const qt = prepareBarnesHutOptimization(nodes)
		expect(qt).toBeDefined()
		expect(qt.width).toEqual(0)
		expect(qt.height).toEqual(0)
		expect(qt.centerX).toEqual(5)
		expect(qt.centerY).toEqual(5)

		expect(qt.mass).toEqual(1)
		expect(qt.centerOfMassX).toEqual(5)
		expect(qt.centerOfMassY).toEqual(5)
		expect(qt.isLeaf).toEqual(true)
	})

	it('sets up a root quadtree with dimensions', () => {
		// prettier-ignore
		const nodes = new NodeStore(new Float32Array([
      // Node @ (5,5)
      5, 5, 0, 0, 0, 0, 1, 0, 0, 0,
      // Node @ (0,0)
      0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    ]))
		const qt = prepareBarnesHutOptimization(nodes)
		expect(qt).toBeDefined()
		expect(qt.width).toEqual(5)
		expect(qt.height).toEqual(5)
		expect(qt.centerX).toEqual(2.5)
		expect(qt.centerY).toEqual(2.5)

		expect(qt.mass).toEqual(2)
		expect(qt.isLeaf).toEqual(false)
		// inspect leaves
	})
})
