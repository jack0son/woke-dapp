import React from 'react';
import Typography from '@material-ui/core/Typography';
import TwitterIcon from '@material-ui/icons/Twitter';
import FlexColumn from '../../layouts/flex-column';
import ButtonGroup from '../../layouts/button-group';
import BodyStandard from '../../components/text/body-standard';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
	title: {
		fontSize: '8rem',
		lineHeight: '8.5rem',
		[theme.breakpoints.down('sm')]: {
			fontSize: '4rem',
			lineHeight: '4.5rem',
			marginBottom: '20%',
		},
	},
}));

const SHL = (props) => BodyStandard({ component: 'span', color: 'secondary', ...props });
const SHL_p = (props) => BodyStandard({ component: 'span', color: 'primary', ...props });

const Message = () => (
	<BodyStandard
		order={2}
		styles={{
			paddingLeft: '0',
			paddingRight: '0',
			small: {
				paddingLeft: '10%',
				paddingRight: '10%',
			},
		}}
	>
		Sign in with <SHL_p>twitter</SHL_p> to get your <SHL>$WOKENS</SHL>.
	</BodyStandard>
);

export default function SigninView(props) {
	const { triggerSignIn } = props;
	const classes = useStyles();

	return (
		<>
			<FlexColumn
				styles={{
					alignSelf: 'center',
					marginBottom: '10%',
					small: {
						alignSelf: 'flex-start',
						marginTop: '18%',
					},
					justifyContent: 'space-evenly',
				}}
			>
				<Typography variant="h1" className={classes.title} align="center" gutterBottom>
					WOKE NETWORK
				</Typography>

				<Typography variant="h4" align="center" gutterBottom>
					Your clout power-up 🍄
				</Typography>
				<ButtonGroup
					reverse
					message="Sign in with twitter to get your Wokens."
					Message={Message}
					buttonProps={{
						onClick: triggerSignIn,
						text: 'sign in',
						color: 'primary',
						iconLeft: <TwitterIcon />,
					}}
				/>
			</FlexColumn>
		</>
	);
}
