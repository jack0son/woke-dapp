import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import useScrollTrigger from '@material-ui/core/useScrollTrigger';

import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Icon from '@material-ui/core/Icon';

import Avatar from './avatar';
import TransactionAmount from '../components/text/transaction-amount';
import StandardBody from '../components/text/body-standard';
import WokeSpan from '../components/text/span-woke';

const useStyles = makeStyles(theme => ({
	transactionList: styles => ({
		width: '100%',
		display: 'block',
		position: 'relative',
		overflow: 'hidden',
		paddingRight: theme.spacing(0),
		paddingLeft: theme.spacing(0),
		backgroundColor: 'transparent',
		...styles
	}),

	listItem: {
		width: '100%',
		maxHeight: theme.spacing(5),
		position: 'relative',
		paddingRight: theme.spacing(1),
		paddingLeft: theme.spacing(1),
		paddingTop: theme.spacing(0.5),
		paddingBottom: theme.spacing(0.5),
		marginBottom: '3px',
		backgroundColor: theme.palette.background.dark,
		boxShadow: '0 1px 7px 0 #090117',
	},

	avatar: {
		height: '100%',
	},

	transWokenAmount: {
		right: '20%',
	}


}));

export default function TransactionList (props) {
	const {styles, listItems, ...innerProps} = props;
	const theme = useTheme();
	const dense = true;

	const [scrollTarget, setScrollTarget] = useState(undefined)
	const scrollTrigger = useScrollTrigger({ target: scrollTarget });
	const classes = useStyles({scrollTrigger, ...styles});

	const handleProps = {
		style: {
			fontSize: '14px',
			lineHeight: '14px',
		}
	}

	const timeSinceProps = {
		style: {
			fontSize: '12px',
			color: theme.palette.primary.contrastText,
			lineHeight: '12px',
			opacity: 0.5
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

	const renderTransactions = () => listItems.map((tx, i) => (
			<ListItem key={i} className={classes.listItem}>
			<ListItemAvatar className={classes.avatar}>
				<Avatar
					alt={tx.counterParty ? tx.counterParty.handle : 'loading'}
					src={tx.counterParty ? tx.counterParty.avatar : 'loading'}
					styles={{
						//height: '100%', 
						height: '32px', 
						width: '32px', 
						//borderStyle: 'solid',
						borderWidth: '1px',
						borderColor: theme.palette.background.dark,
						borderRadius: '50%',
					}}
				/>
			</ListItemAvatar>
			<ListItemText
				primary={`@${tx.counterParty ? tx.counterParty.handle : 'loading'}`}
				primaryTypographyProps={handleProps}

				secondary={tx.timeSince ? `${tx.timeSince}` : `...`}
				secondaryTypographyProps={timeSinceProps}
			/>
			<ListItemSecondaryAction className={classes.transWokenAmount}>
				<TransactionAmount type={tx.type} amount={tx.returnValues.amount}/>
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
