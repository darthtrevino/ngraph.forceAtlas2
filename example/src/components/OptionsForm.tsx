import * as React from 'react'
import { memo, useMemo, useCallback } from 'react'
import { ExecuteLayoutOptions } from '../types'

export interface OptionsFormProps {
	onClick: (options: ExecuteLayoutOptions) => void
}

export const OptionsForm: React.FC<OptionsFormProps> = memo(({ onClick }) => {
	const options = useMemo<ExecuteLayoutOptions>(
		() => ({
			numCommunities: 5,
			numNodes: 1000,
			numBridges: 100,
			useFa2: true,
		}),
		[],
	)

	const handleOnClick = useCallback(() => onClick(options), [onClick, options])
	const onNumCommunitiesChanged = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.numCommunities = ev.target.valueAsNumber
		},
		[options],
	)
	const onNumNodesChanged = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.numNodes = ev.target.valueAsNumber
		},
		[options],
	)
	const onNumBridgesChanged = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.numBridges = ev.target.valueAsNumber
		},
		[options],
	)

	const onUseFa2Changed = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			options.useFa2 = ev.target.checked
		},
		[options],
	)
	return (
		<div id="setup">
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
			<label htmlFor="force">forceAtlas2</label>
			<input
				type="checkbox"
				id="force"
				defaultChecked={true}
				onChange={onUseFa2Changed}
			/>
			<button onClick={handleOnClick}>Execute Layout</button>
		</div>
	)
})

OptionsForm.displayName = 'OptionsForm'
