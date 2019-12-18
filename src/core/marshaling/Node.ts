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

export const ppn = 10

export interface Node {
	readonly index: number

	x: number
	y: number
	dx: number
	dy: number
	old_dx: number
	old_dy: number
	mass: number
	convergence: number
	size: number
	fixed: boolean

	readonly swing: number
	readonly traction: number
	readonly force: number
	resetDelta(): void
	move(factor: number): void
}

export abstract class BaseNode implements Node {
	public abstract readonly index: number
	public abstract x: number
	public abstract y: number
	public abstract dx: number
	public abstract dy: number
	public abstract old_dx: number
	public abstract old_dy: number
	public abstract mass: number
	public abstract convergence: number
	public abstract size: number
	public abstract fixed: boolean

	public get swing(): number {
		return (
			this.mass *
			Math.sqrt((this.old_dx - this.dx) ** 2 + (this.old_dy - this.dy) ** 2)
		)
	}

	public get traction(): number {
		return (
			Math.sqrt((this.old_dx + this.dx) ** 2 + (this.old_dy + this.dy) ** 2) / 2
		)
	}

	public get force(): number {
		return Math.sqrt(this.dx ** 2 + this.dy ** 2)
	}

	public move(factor: number): void {
		this.x += this.dx * factor
		this.y += this.dy * factor
	}

	public resetDelta() {
		this.old_dx = this.dx
		this.old_dy = this.dy
		this.dx = 0
		this.dy = 0
	}

	public toString() {
		return `node[idx=${this.index}, pos=(${this.x}, ${this.y})]`
	}
}

/**
 * A utility class that provides a node interface over a bufferized node list
 */
export class BufferNode extends BaseNode implements Node {
	private _offset: number
	private _ary: Float32Array

	public constructor(offset: number, ary: Float32Array) {
		super()
		this._ary = ary
		this._offset = offset
	}

	public get index(): number {
		return this._offset
	}

	public get x(): number {
		return this._ary[this._offset + N.x]
	}

	public get y() {
		return this._ary[this._offset + N.y]
	}

	public get dx() {
		return this._ary[this._offset + N.dx]
	}

	public get dy() {
		return this._ary[this._offset + N.dy]
	}

	public get old_dx() {
		return this._ary[this._offset + N.old_dx]
	}

	public get old_dy() {
		return this._ary[this._offset + N.old_dy]
	}

	public get mass() {
		return this._ary[this._offset + N.mass]
	}

	public get convergence() {
		return this._ary[this._offset + N.convergence]
	}

	public get size() {
		return this._ary[this._offset + N.size]
	}

	public get fixed(): boolean {
		return Boolean(this._ary[this._offset + N.fixed])
	}

	public set x(value: number) {
		if (Number.isNaN(value)) {
			throw new Error("don't set NaN!")
		}
		this._ary[this._offset + N.x] = value
	}

	public set y(value: number) {
		if (Number.isNaN(value)) {
			throw new Error("don't set NaN!")
		}
		this._ary[this._offset + N.y] = value
	}

	public set dx(value: number) {
		this._ary[this._offset + N.dx] = value
	}

	public set dy(value: number) {
		this._ary[this._offset + N.dy] = value
	}

	public set old_dx(value: number) {
		this._ary[this._offset + N.old_dx] = value
	}

	public set old_dy(value: number) {
		this._ary[this._offset + N.old_dy] = value
	}

	public set mass(value: number) {
		this._ary[this._offset + N.mass] = value
	}

	public set convergence(value: number) {
		this._ary[this._offset + N.convergence] = value
	}

	public set size(value: number) {
		this._ary[this._offset + N.size] = value
	}

	public set fixed(value: boolean) {
		this._ary[this._offset + N.fixed] = value ? 1 : 0
	}
}

/**
 * A plain-class node implementation for testing and utility purposes
 */
export class PojoNode extends BaseNode implements Node {
	public index: number = -1
	public x: number
	public y: number
	public dx: number
	public dy: number
	public old_dx: number
	public old_dy: number
	public mass: number
	public convergence: number
	public size: number
	public fixed: boolean
}
