import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar'; 
import Menu from './menu';
import LogoLink from './images/logo-link';

const gutterSize = '5%';

const useStyles = makeStyles(theme => ({
	appBar: {
		zIndex: 1000,
		background: 'transparent',
		boxShadow: 'none',
	},

	toolBar: {
		background: 'transparent',
	},

	navbar: {
		marginRight: gutterSize,
		marginLeft: gutterSize,
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		[theme.breakpoints.up('sm')]: {
			height: '12vh',
		}
	},
}));

export default function NavBar(props) {
	const classes = useStyles();

	const renderNavItems = () => {
		if(props.hideNavItems != true) {
			return (
				<>
				<LogoLink
					className={classes.logo}
					src='images/eye-logo.png'
					url='/'
				/>
				<Menu twitterSignin={props.twitterSignin}/>
				</>
			);
		}
	}

	return (
		<AppBar position="relative" className={classes.appBar}>
			<Toolbar className={classes.navbar}>
					{ renderNavItems() }
			</Toolbar>
		</AppBar>
  	);
}
