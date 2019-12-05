import { FA2Algorithm } from './algorithm/FA2Algorithm'
import { Nodes, Edges, FA2Configuration } from './algorithm'

let algorithm: FA2Algorithm

/**
 * Message reception & sending
 */

// Sending data back to the supervisor
function sendNewCoords() {
	const nodes = algorithm.nodes.buffer
	self.postMessage({ nodes })
}

// Algorithm run
function run(iterations: number) {
	for (let i = 0; i < iterations; i++) {
		algorithm.tick()
		sendNewCoords()
	}
	sendNewCoords()
}

// On supervisor message
function listener(e: {
	data: {
		action: string
		edges?: SharedArrayBuffer
		nodes?: SharedArrayBuffer
		config?: FA2Configuration
	}
}) {
	switch (e.data.action) {
		case 'start':
			algorithm = new FA2Algorithm(
				new Nodes(new Uint32Array(e.data.nodes)),
				new Edges(new Uint32Array(e.data.edges)),
				e.data.config,
			)
			// First iteration(s)
			run(algorithm.configuration.startingIterations)
			break

		case 'loop':
			algorithm.nodes = new Uint32Array(e.data.nodes)
			run(algorithm.configuration.iterationsPerRender)
			break

		case 'config':
			// Merging new settings
			algorithm.configure(e.data.config)
			break

		case 'kill':
			// Deleting context for garbage collection
			algorithm = undefined
			self.removeEventListener('message', listener)
			break

		default:
	}
}

// Adding event listener
self.addEventListener('message', listener)
