import React, { useEffect } from 'react';
import { useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';

import FlexRow from '../../layouts/flex-row';
import FlexColumn from '../../layouts/flex-column';
import Brain from '../../components/images/brain';

// View hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context'


export default function ErrorView(props) {
	const theme = useTheme();
	const {setLoading} = useRootContext();

	useEffect(() => {
		setLoading(true);
		return () => {
			setLoading(false);
		}
	}, [])

	return (
		<FlexRow>
			<FlexColumn>
				{ props.children ? props.children : (
					<Typography variant="h4" align="center" gutterBottom>
						{props.message ? props.message : 'F&!K'} 
					</Typography>
				)}
				<Brain/>
			</FlexColumn>
		</FlexRow>
	);
}
