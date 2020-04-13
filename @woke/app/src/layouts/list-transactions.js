import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/styles'; import useScrollTrigger from '@material-ui/core/useScrollTrigger';

import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Icon from '@material-ui/core/Icon';

import FlexRow from './flex-row';
import Avatar from './avatar';
import Spinner from '../components/progress/spinner-indeterminate';
import ProgressBar from '../components/progress/linear-continuous';
import TransactionAmount from '../components/text/transaction-amount';
import StandardBody from '../components/text/body-standard';
import WokeSpan from '../components/text/span-woke';

const useStyles = makeStyles(theme => ({
	transactionList: styles => ({
		width: '100%',
		height: 'inherit',
		maxHeight: 'inherit',
		position: 'relative',
		[theme.breakpoints.down('sm')]: {
			width: '100%',
		},
		backgroundColor: 'transparent',
		...styles
	}),

	avatarItem: {
		height: '100%',
		width: 'auto',
		marginRight: '14%',
		marginLeft: '5%',
		[theme.breakpoints.down('sm')]: {
			marginRight: '5%',
		},
	},

	listItem: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		minHeight: theme.spacing(5),
		//height: '8vh',
		paddingRight: theme.spacing(1),
		paddingLeft: '0', // theme.spacing(1),
		paddingTop: theme.spacing(0.5),
		paddingBottom: theme.spacing(0.5),
		marginBottom: '2%',
		backgroundColor: theme.palette.background.dark,
		//backgroundColor: theme.palette.common.black,
		boxShadow: '0 1px 7px 0 #090117',
	},

	handleLabel: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		minWidth: '40%',
	},

}));

export default function TransactionList ({ listItems, ...props }) {
	const {sendTransfers, recipient, styles, itemHeightVH, itemHeightVHSmall, fontSize, ...innerProps} = props;
	const theme = useTheme();
	const dense = false;

	const [scrollTarget, setScrollTarget] = useState(undefined)
	const scrollTrigger = useScrollTrigger({ target: scrollTarget });
	const classes = useStyles({scrollTrigger, ...styles});

	const handleProps = {
		style: {
			//paddingTop: '5%',
			fontSize: fontSize || '1.5rem',
			lineHeight: '1.0',
		}
	}

	const timeSinceProps = {
		style: {
			fontSize: '1.0rem',
			color: theme.palette.primary.contrastText,
			lineHeight: '1.0rem',
			opacity: 0.7
		}
	}


	//TODO render inner border on scroll down 
	const WithScrollTarget = props => (
		<div ref={node => {
			if (node) {
				setScrollTarget(node);
			}
		}}>
			{props.children}
		</div>
	);

	const defaultAvatarHeight = 7;

	const isCurrentTransaction = (i, tx) => {
		return sendTransfers ?
			i == 0 && sendTransfers.pending && tx.transactionHash == sendTransfers.txHash :
			false;
	}

	const renderProgress = () => {
		if(sendTransfers) {
			return (
				<ProgressBar organic
					value={sendTransfers.timer.value}
					endValue={sendTransfers.timer.transferTime}
					styles={{
						position: 'absolute',
						bottom: '0',
						left: '0',
						paddingTop: '2vh',
					}}
				/>
			);
		}
	}

	const renderTransactions = () => listItems.map((tx, i) => (
		<ListItem key={i} alignItems='flex-start' className={classes.listItem}>
			{ (tx.pending || isCurrentTransaction(i, tx)) && renderProgress() }
			<div className={classes.handleLabel}>
				<ListItemAvatar className={classes.avatarItem}>
					<Avatar
						alt={tx.counterParty ? tx.counterParty.handle : 'loading'}
						src={tx.counterParty ? tx.counterParty.avatar : 'loading'}
						m={0}
						styles={{
							//marginTop: '10%',
							//marginBottom: '10%',
							//paddingLeft: '10%',
							//paddingRight: '10%',
							height: `${itemHeightVH || defaultAvatarHeight}vh`, 
							width:  `${itemHeightVH || defaultAvatarHeight}vh`,
							small: {
								//height: `${itemHeightVHSmall || itemHeightVH*0.8}vh`, 
								//width:  `${itemHeightVHSmall || itemHeightVH*0.8}vh`,
							},
							minHeight: '32px', 
							//borderStyle: 'solid',
							borderWidth: '1px',
							borderColor: theme.palette.background.dark,
							borderRadius: '50%',
						}}
					/>
				</ListItemAvatar>
				<ListItemText style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly'}}
					primary={`@${tx.counterParty ? tx.counterParty.handle : 'loading'}`}
					primaryTypographyProps={handleProps}

					secondary={tx.timeSince ? `${tx.timeSince}` : `...`}
					secondaryTypographyProps={timeSinceProps}
				/>
			</div>
			<ListItemSecondaryAction>
				<TransactionAmount type={tx.type} amount={tx.amount || tx.returnValues.amount}/>
			</ListItemSecondaryAction>
		</ListItem>
	));

	return (
		<>
			{ 
				listItems.length > 0 ? (
					<List dense={dense} className={classes.transactionList} disablePadding>
						{ renderTransactions() }
					</List>
				) : (
					props.label == 'Transfers' ? <StandardBody align="center">Start sending <WokeSpan>WOKENs</WokeSpan></StandardBody> : null
				)
			}
		</>
	);
}
