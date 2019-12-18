import { Node, BufferNode, ppn, N } from './Node'

export class NodeStore {
	private _ary: Float32Array
	private _nodes: Node[] = []

	public constructor(ary: Float32Array) {
		if (ary.length % ppn !== 0) {
			throw new Error('node buffer size must be a multiple of ppn (10)')
		}
		// this initializes the node array
		this.array = ary
	}

	public set array(ary: Float32Array) {
		this._ary = ary
		this._nodes = []
		for (let i = 0; i < ary.length; i += ppn) {
			this._nodes.push(new BufferNode(i, this._ary))
		}
	}

	public get array(): Float32Array {
		return this._ary
	}

	public get bufferLength(): number {
		return this._ary.length
	}

	public get nodeCount(): number {
		return this._nodes.length
	}

	public getNode(index: number): Node {
		return this._nodes[index]
	}

	public x(index: number): number {
		return this._ary[index + N.x]
	}

	public y(index: number) {
		return this._ary[index + N.y]
	}

	public dx(index: number) {
		return this._ary[index + N.dx]
	}

	public dy(index: number) {
		return this._ary[index + N.dy]
	}

	public old_dx(index: number) {
		return this._ary[index + N.old_dx]
	}

	public old_dy(index: number) {
		return this._ary[index + N.old_dy]
	}

	public mass(index: number) {
		return this._ary[index + N.mass]
	}

	public convergence(index: number) {
		return this._ary[index + N.convergence]
	}

	public size(index: number) {
		return this._ary[index + N.size]
	}

	public fixed(index: number): boolean {
		return Boolean(this._ary[index + N.fixed])
	}

	public setX(index: number, value: number) {
		this._ary[index + N.x] = value
	}

	public setY(index: number, value: number) {
		this._ary[index + N.y] = value
	}

	public setDx(index: number, value: number) {
		this._ary[index + N.dx] = value
	}

	public setDy(index: number, value: number) {
		this._ary[index + N.dy] = value
	}

	public addDx(index: number, value: number) {
		this._ary[index + N.dx] += value
	}

	public addDy(index: number, value: number) {
		this._ary[index + N.dy] += value
	}

	public subDx(index: number, value: number) {
		this._ary[index + N.dx] -= value
	}

	public subDy(index: number, value: number) {
		this._ary[index + N.dy] -= value
	}

	public setOldDx(index: number, value: number) {
		this._ary[index + N.old_dx] = value
	}

	public setOldDy(index: number, value: number) {
		this._ary[index + N.old_dy] = value
	}

	public setMass(index: number, value: number) {
		this._ary[index + N.mass] = value
	}

	public setConvergence(index: number, value: number) {
		this._ary[index + N.convergence] = value
	}

	public setSize(index: number, value: number) {
		this._ary[index + N.size] = value
	}

	public setFixed(index: number, value: boolean) {
		this._ary[index + N.fixed] = value ? 1 : 0
	}

	public resetDeltas() {
		// Resetting positions & computing max values
		for (let n = 0; n < this.nodeCount; n++) {
			this._nodes[n].resetDelta()
		}
	}

	public getBounds(useDelta = false): [number, number, number, number] {
		let minX = Infinity
		let maxX = -Infinity
		let minY = Infinity
		let maxY = -Infinity
		let node: Node

		// Setting up
		// Computing min and max values
		for (let n = 0; n < this.nodeCount; n++) {
			node = this._nodes[n]
			const x = node.x + (useDelta ? node.dx : 0)
			const y = node.y + (useDelta ? node.dy : 0)
			minX = Math.min(minX, x)
			maxX = Math.max(maxX, x)
			minY = Math.min(minY, y)
			maxY = Math.max(maxY, y)
		}
		return [minX, maxX, minY, maxY]
	}
}
