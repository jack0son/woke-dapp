import React from 'react'

// Layout
import Theming from '../../layouts/theming'
import RootContainer from '../../layouts/container-root'
import NavBar from '../../components/navbar'

// Hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context'

export default function RootView({children}) {
	const { loading } = useRootContext();

	const makeNavBar = () => (
		<NavBar
			hideNavItems={loading}
		/>
	);

	return (
		<Theming>
			<RootContainer navBar={makeNavBar()}>
				{children}
			</RootContainer>
		</Theming>
	);
}
