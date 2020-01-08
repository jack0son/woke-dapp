import React from 'react';

import Theming from '../../layouts/theming';
import PageContainer from '../../layouts/page-container';
import NavBar from '../../components/navbar';

export default function RootView(props) {
	return (
		<Theming>
			<PageContainer>
				<NavBar
					hideLogo={props.hideLogo}
				/>
				{props.children}
			</PageContainer>
		</Theming>
	);
}
