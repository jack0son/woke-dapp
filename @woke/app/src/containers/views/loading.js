import React, { useEffect } from 'react';
import { useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import BodyLarge from '../../components/text/body-large';

import FlexColumn from '../../layouts/flex-column';
import CentreHolder from '../../layouts/holder-centre';
import Logo from '../../components/images/logo';
 
// View hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context'

export default function LoadingView(props) {
	const theme = useTheme();
	const { setLoading } = useRootContext();

	useEffect(() => {
		setLoading(true);
		return () => {
			setLoading(false);
		}
	}, [])

	return (

			<FlexColumn
				//height='5vh'
				styles={{
					minWidth: '40vh',
					justifyContent: 'space-between',
					height: '20vh',
					marginBottom: '20%',
					small: {
						width: '85%',
						height: '25vh',
					}
				}}
			>
					<Logo
						src='images/eye-logo.png'
					/>
			{ props.children ? props.children : (
				<BodyLarge gutterBottom>
					{props.message ? props.message : ''}
				</BodyLarge>
			)}
			</FlexColumn>
	);
}
