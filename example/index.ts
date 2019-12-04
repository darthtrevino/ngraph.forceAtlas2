import { init } from './init'

let renderState = null

function getInputElement(id: string): HTMLInputElement {
	const result = document.querySelector(id) as HTMLInputElement
	if (!result) {
		throw new Error(`could not find element ${id}`)
	}
	return result
}

function getCommunitiesCount(): number {
	return parseInt(getInputElement('#communities').value)
}

function getNodesCount(): number {
	return parseInt(getInputElement('#nodesCount').value)
}

function getBridgeCount(): number {
	return parseInt(getInputElement('#bridgeCount').value)
}

function getIsAtlas(): boolean {
	return getInputElement('#force').checked
}

getInputElement('#setup').onsubmit = e => {
	try {
		if (renderState && typeof renderState.dispose == 'function') {
			renderState.dispose()
		}

		let communities = getCommunitiesCount()
		let nodesCount = getNodesCount()
		let bridgeCount = getBridgeCount()
		let isAtlas = getIsAtlas()
		;(document.querySelector(
			'[type=submit]',
		) as HTMLInputElement).disabled = true
		renderState = init(communities, nodesCount, bridgeCount, isAtlas)
		e.preventDefault()
	} catch (err) {
		console.log('caught error', err)
	}
}
