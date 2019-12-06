import * as React from 'react'
import { memo, useRef, useCallback } from 'react'
import { OptionsForm } from './OptionsForm'
import { executeLayout } from '../executeLayout'
import { ExecuteLayoutOptions } from '../types'

export const App: React.FC = memo(() => {
	const graphContainerRef = useRef<HTMLDivElement>()
	const onLayoutClick = useCallback((options: ExecuteLayoutOptions) => {
		executeLayout(graphContainerRef.current, options)
	}, [])

	return (
		<>
			<OptionsForm onClick={onLayoutClick} />
			<div ref={graphContainerRef} className="graph-container"></div>
		</>
	)
})
App.displayName = 'App'
