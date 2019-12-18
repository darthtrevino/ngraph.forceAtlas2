import { DEFAULT_CONFIGURATION, FA2Configuration } from '../configuration'
import { EdgeStore, NodeStore } from './marshaling'
import { iterate } from './forces'

export class FA2Algorithm {
	private _config: FA2Configuration
	private _iterations = 0
	private _nodes: NodeStore
	private _edges: EdgeStore

	public constructor(
		nodes: NodeStore,
		edges: EdgeStore,
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

	public pass(): [number, number, number] {
		const result = iterate(this._nodes, this._edges, this.configuration)
		this.configuration.slowDown += 0.01
		this._iterations++
		return result
	}
}
