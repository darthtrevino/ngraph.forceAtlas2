import { QuadTree } from '../QuadTree'
import { PojoNode } from '../Node'

describe('The QuadTree Data Structure', () => {
	it('can be constructed empty', () => {
		const qt = new QuadTree(10, 10, 5, 5)
		expect(qt).toBeDefined()
		expect(qt.width).toEqual(10)
		expect(qt.height).toEqual(10)
		expect(qt.node).toBeUndefined()
		expect(qt.centerX).toEqual(5)
		expect(qt.centerY).toEqual(5)
		expect(qt.centerOfMassX).toEqual(5)
		expect(qt.centerOfMassY).toEqual(5)
		expect(qt.mass).toEqual(0)
		expect(qt.isLeaf).toEqual(true)
	})

	it('can add a single node', () => {
		const qt = new QuadTree(10, 10, 5, 5)
		const node = new PojoNode()
		node.mass = 3
		node.x = 7
		node.y = 7

		qt.insert(node)

		// node swings mass & center
		expect(qt.mass).toEqual(3)
		expect(qt.centerOfMassX).toEqual(7)
		expect(qt.centerOfMassY).toEqual(7)
		expect(qt.isLeaf).toEqual(true)
	})

	it('can add two nodes', () => {
		const qt = new QuadTree(10, 10, 5, 5)
		const n1 = new PojoNode()
		n1.mass = 3
		n1.x = 7
		n1.y = 7
		const n2 = new PojoNode()
		n2.mass = 2
		n2.x = 2
		n2.y = 2
		qt.insert(n1)
		qt.insert(n2)

		// node swings mass & center
		expect(qt.mass).toEqual(5)
		expect(qt.centerOfMassX).toEqual(5)
		expect(qt.centerOfMassY).toEqual(5)
		expect(qt.isLeaf).toEqual(false)
		expect(qt.neChild.mass).toEqual(3)
		expect(qt.swChild.mass).toEqual(2)
	})

	it('can add two nodes at the same point', () => {
		const qt = new QuadTree(10, 10, 5, 5)
		const n1 = new PojoNode()
		n1.mass = 3
		n1.x = 2
		n1.y = 2
		const n2 = new PojoNode()
		n2.mass = 2
		n2.x = 2
		n2.y = 2
		qt.insert(n1)
		qt.insert(n2)

		// node swings mass & center
		expect(qt.mass).toEqual(5)
		expect(qt.centerOfMassX).toBeCloseTo(2, 0.1)
		expect(qt.centerOfMassY).toBeCloseTo(2, 0.1)
		expect(qt.isLeaf).toEqual(false)
		expect(qt.depth).toBeLessThan(10)
	})
})
