import React, {useEffect} from 'react'

// Layout
import Theming from '../../layouts/theming'
import PageContainer from '../../layouts/page-container'
import NavBar from '../../components/navbar'

// Hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context'

export default function RootView({children}) {
	const {loading} = useRootContext();
	useEffect(() => {
		console.log('Loading: ', loading);
	}, [loading]);
	return (
		<Theming>
			<PageContainer>
				<NavBar
					hideLogo={loading}
				/>
				{children}
			</PageContainer>
		</Theming>
	);
}

				//{props && props.children ? props.children : null}
