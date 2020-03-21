import React, { useEffect } from 'react';
import { useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';

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
		<CentreHolder height='85vh'>
			<CentreHolder
				mt='0 !important'
				mb={theme.spacing(0.5)}
				height='5vh'
			>
					<Logo
						src='images/eye-logo.png'
					/>
			</CentreHolder>

			<FlexColumn
				align='center'
				height='5vh'
				styles={{
					paddingLeft: theme.spacing(5),
					paddingRight: theme.spacing(5)
				}}
			>
			{ props.children ? props.children : (
				<Typography variant="h4" align="center" gutterBottom>
					{props.message ? props.message : 'loading ...'}
				</Typography>
			)}
			</FlexColumn>
		</CentreHolder>
	);
}
