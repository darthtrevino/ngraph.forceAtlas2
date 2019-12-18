export enum E {
	source = 0,
	target = 1,
	weight = 2,
}

export const ppe = 3

export interface Edge {
	readonly index: number
	source: number
	target: number
	weight: number
}

export class BufferEdge implements Edge {
	private _ary: Float32Array
	private _offset: number

	public constructor(offset: number, ary: Float32Array) {
		this._ary = ary
		this._offset = offset
	}

	public get index(): number {
		return this._offset
	}

	public get source(): number {
		return this._ary[this._offset + E.source]
	}

	public get target(): number {
		return this._ary[this._offset + E.target]
	}

	public get weight(): number {
		return this._ary[this._offset + E.weight]
	}

	public set source(value: number) {
		this._ary[this._offset + E.source] = value
	}

	public set target(value: number) {
		this._ary[this._offset + E.target] = value
	}

	public set weight(value: number) {
		this._ary[this._offset + E.weight] = value
	}
}

export class PojoEdge implements Edge {
	public index: number = -1
	public source: number
	public target: number
	public weight: number
}
