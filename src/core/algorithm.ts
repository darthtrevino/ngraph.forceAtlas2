import { DEFAULT_CONFIGURATION, FA2Configuration } from '../configuration'
import { Edges, Nodes, ppn, Regions } from './data_structures'
import { iterate } from './forces'

const MAX_FORCE = 10

export class FA2Algorithm {
	private _config: FA2Configuration
	private _iterations = 0
	private _nodes: Nodes
	private _edges: Edges

	public constructor(
		nodes: Nodes,
		edges: Edges,
		config: Partial<FA2Configuration>,
	) {
		this.configure(config)
		this._nodes = nodes
		this._edges = edges
	}

	public configure(config: Partial<FA2Configuration>) {
		this._config = { ...DEFAULT_CONFIGURATION, ...config }
	}

	public get configuration() {
		return this._config
	}

	public set nodes(value: Float32Array) {
		this._nodes.array = value
	}

	public get nodes(): Float32Array {
		return this._nodes.array
	}

	public get iterations(): number {
		return this._iterations
	}

	public pass() {
		iterate(this._nodes, this._edges, this.configuration)
		this._iterations++
	}
}
