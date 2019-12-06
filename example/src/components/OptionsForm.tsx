import * as React from 'react'
import { memo, useMemo, useCallback, useState } from 'react'
import { ExecuteLayoutOptions } from '../types'

export interface OptionsFormProps {
	onClick: (options: ExecuteLayoutOptions) => void
}

export const OptionsForm: React.FC<OptionsFormProps> = memo(({ onClick }) => {
	const [useRandomGraph, setUseRandomGraph] = useState(true)
	const options = useMemo<ExecuteLayoutOptions>(
		() => ({
			numCommunities: 5,
			numNodes: 1000,
			numBridges: 100,
			useFa2: true,
			useRandomGraph: true,
		}),
		[],
	)

	const handleOnClick = useCallback(() => onClick(options), [onClick, options])
	const onNumCommunitiesChanged = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.numCommunities = parseInt(ev.target.value)
		},
		[options],
	)
	const onNumNodesChanged = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.numNodes = parseInt(ev.target.value)
		},
		[options],
	)
	const onNumBridgesChanged = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.numBridges = parseInt(ev.target.value)
		},
		[options],
	)

	const onUseFa2Changed = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.useFa2 = ev.target.checked
		},
		[options],
	)

	const onUseRandomGraphChanged = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.useRandomGraph = ev.target.checked
			// trigger a re-render
			setUseRandomGraph(options.useRandomGraph)
		},
		[options],
	)
	return (
		<div id="setup">
			<label htmlFor="randomGraph">random</label>
			<input
				type="checkbox"
				id="randomGraph"
				defaultChecked={true}
				onChange={onUseRandomGraphChanged}
			/>
			<label htmlFor="force">forceAtlas2</label>
			<input
				type="checkbox"
				id="force"
				defaultChecked={true}
				onChange={onUseFa2Changed}
			/>
			{options.useRandomGraph ? (
				<>
					<label htmlFor="communities">communities </label>
					<input
						id="communities"
						type="text"
						defaultValue={options.numCommunities}
						onChange={onNumCommunitiesChanged}
					/>
					<label htmlFor="nodesCount">nodesCount</label>
					<input
						id="nodesCount"
						type="text"
						defaultValue={options.numNodes}
						onChange={onNumNodesChanged}
					/>
					<label htmlFor="bridgeCount">bridgeCount</label>
					<input
						id="bridgeCount"
						type="text"
						defaultValue={options.numBridges}
						onChange={onNumBridgesChanged}
					/>
				</>
			) : null}
			<button onClick={handleOnClick}>Execute Layout</button>
		</div>
	)
})

OptionsForm.displayName = 'OptionsForm'
