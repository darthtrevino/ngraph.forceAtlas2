import { Edge, BufferEdge, ppe } from './Edge'

export class EdgeStore {
	private _ary: Float32Array
	private _edges: Edge[] = []

	public constructor(ary: Float32Array) {
		if (ary.length % ppe !== 0) {
			throw new Error('edge buffer size must be a multiple of ppe (3)')
		}
		this.array = ary
	}

	public set array(ary: Float32Array) {
		this._ary = ary
		this._edges = []
		for (let i = 0; i < ary.length; i += ppe) {
			this._edges.push(new BufferEdge(i, this._ary))
		}
	}

	public get array(): Float32Array {
		return this._ary
	}

	public get bufferLength(): number {
		return this._ary.length
	}

	public get edgeCount(): number {
		return this._edges.length
	}

	public getEdge(index: number): Edge {
		return this._edges[index]
	}
}

export class PojoEdge implements Edge {
	public index: number = -1
	public source: number
	public target: number
	public weight: number
}
