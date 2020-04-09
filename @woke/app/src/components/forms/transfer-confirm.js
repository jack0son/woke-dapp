import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import { useTheme } from '@material-ui/styles';

import Button from '../buttons/button-contained';
import BodyStandard from '../text/body-standard';
import Avatar from '../../layouts/avatar';
import FlexRow from '../../layouts/flex-row';
import BodyLarge from '../text/body-large';
import WokeSpan from '../text/span-woke';

const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});

export default function ConfirmTransferDialog({open, recipient, amount, onConfirm, onCancel, handleClose, ...props}) {
	const theme = useTheme();

	const renderContent = () => (
				<DialogContent>
					<DialogContentText id="alert-dialog-slide-description">
					</DialogContentText>
					<FlexRow styles={{marginTop: 0, marginBottom: '10%'}}>
						<Avatar
							align='center'
							alt={recipient.handle}
							src={recipient.avatar}
							styles={{
								height: '12vh', 
								width: '12vh', 
								borderWidth: '1px',
								borderRadius: '50%',
								marginLeft: '2%',
								marginRight: '2%',
							}}
						/>
					</FlexRow>
				</DialogContent>
	);

	return (
		<div>
			<Dialog
				style={{
					//width: '80vw',
				}}
				open={open}
				TransitionComponent={Transition}
				keepMounted
				onClose={handleClose}
				aria-labelledby="alert-dialog-slide-title"
				aria-describedby="alert-dialog-slide-description"
			>
				{ open ? <>
				<DialogTitle id="alert-dialog-slide-title">
					<BodyLarge>
						Send <span style={{color: theme.palette.secondary.main}}>{amount}</span><WokeSpan> W</WokeSpan> to @{recipient.handle}?
					</BodyLarge>
				</DialogTitle>
				{ renderContent() }
				</> : null }
				<DialogActions >
					<FlexRow styles={{
						height: '8vh',
						flexWrap: 'nowrap',
						marginBottom: '5%',
					}}>
					<Button text={"YES"} onClick={onConfirm} color="secondary" styles={{
						flexGrow: 1,
					}}/>
					<Button text={"NO"} onClick={onCancel} styles={{
						flexGrow: 1,
						//alignSelf: 'center',
						background: theme.palette.common.black,
						textAlign: 'center',
					}}/>
					</FlexRow>
				</DialogActions>
			</Dialog>
		</div>
	);
}
