import React, { useEffect } from 'react';
import { useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';

import ContentWrapper from '../../layouts/wrapper-content';
import CentreHolder from '../../layouts/holder-centre';
import Brain from '../../components/images/brain';

// View hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context'


export default function LoadingView(props) {
	const theme = useTheme();
	const {setLoading} = useRootContext();

	useEffect(() => {
		setLoading(true);
		return () => {
			setLoading(false);
		}
	}, [])

	return (
		<CentreHolder>
			<CentreHolder
				mt='0 !important'
				mb={theme.spacing(0.5)}
			>
				<Brain/>
			</CentreHolder>

			<ContentWrapper
				align='center'
				styles={{
					paddingLeft: theme.spacing(5),
					paddingRight: theme.spacing(5)
				}}
			>
			{ props.children ? props.children : (
				<Typography variant="h4" align="center" gutterBottom>
					{props.message ? props.message : 'REEEEEEEEEEE'} 
				</Typography>
			)}
			</ContentWrapper>
		</CentreHolder>
	);
}
