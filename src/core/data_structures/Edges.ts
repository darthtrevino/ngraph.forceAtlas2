export enum E {
	source = 0,
	target = 1,
	weight = 2,
}

export const ppe = 3

export class Edges {
	private _ary: Float32Array

	public constructor(ary: Float32Array) {
		this._ary = ary
	}

	public set array(ary: Float32Array) {
		this._ary = ary
	}

	public get array() {
		return this._ary
	}

	public get length() {
		return this._ary.length
	}

	public source(index: number): number {
		return this._ary[index + E.source]
	}

	public target(index: number) {
		return this._ary[index + E.target]
	}

	public weight(index: number) {
		return this._ary[index + E.weight]
	}

	public setSource(index: number, value: number) {
		this._ary[index + E.source] = value
	}

	public setTarget(index: number, value: number) {
		this._ary[index + E.target] = value
	}

	public setWeight(index: number, value: number) {
		this._ary[index + E.weight] = value
	}
}