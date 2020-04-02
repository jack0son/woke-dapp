import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import FlexColumn from '../layouts/flex-column';
import Link from '@material-ui/core/Link';
import MenuIcon from '@material-ui/icons/Menu';
import MenuOpenIcon from '@material-ui/icons/MenuOpen';
import OutsideClickHandler from 'react-outside-click-handler';

const useStyles = makeStyles(theme => ({
	showMenu: {
		'& > div': {
			display: 'flex',
			flexDirection: 'column',
			width: '85vw',
			alignItems: 'center',
			justifyContent: 'center',
			height: '20vh',

			// @fix broken window
			// To compensate for absolute position avatar-header on wallet
			paddingTop: '2vh',
			paddingBottom: '2vh',
			marginBottom: '8vh',

			[theme.breakpoints.up('sm')]: {
				height: 'unset',
				display: 'flex',
				flexDirection: 'row',
				width: '25vw',
				justifyContent: 'space-evenly',
			},
		}
	},

	hideMenu: {
		zIndex: 2000,
		display: 'none',
		[theme.breakpoints.up('sm')]: {
			display: 'block',
			'& > div': {
				display: 'flex',
				flexDirection: 'row',
				width: '25vw',
				justifyContent: 'space-evenly',
			}
		},

	},

	hamburger: {
		zIndex: 2000,
		[theme.breakpoints.up('sm')]: {
			display: 'none'
		},
	},

	menuItem: {
		[theme.breakpoints.down('xs')]: {
			padding: '10px 0px 10px 0px',
			width: '100%',
			textAlign: 'center',
			borderLeft: '2px dashed',
			borderRight: '2px dashed',
			borderTop: '2px dashed',
			'&:nth-of-type(3)': {
				borderBottom: '2px dashed',
			}
		},
		[theme.breakpoints.up('sm')]: {
			marginRight: '20px',
		},
	}
}));


export default function Menu() {
	const classes = useStyles();

	const [showMenu, setShowMenu] = useState(false);
	const toggleMenu = () => setShowMenu(!showMenu);
	const hideMenu = () => {
		if (showMenu == true) {
			toggleMenu();
		}
	}
	const toggleBurgerIcon = () => {
		return showMenu ? 
			<MenuOpenIcon className={classes.hamburger} onClick={toggleMenu} /> :
			<MenuIcon className={classes.hamburger} onClick={toggleMenu} />
	}

	return (
		<>   
			{ toggleBurgerIcon() }
			<FlexColumn className={showMenu ? classes.showMenu : classes.hideMenu}>
				<OutsideClickHandler
					onOutsideClick={() => {
						hideMenu();
					}}
				>
					<Link className={classes.menuItem} variant="h3" href="/how">how</Link>
					<Link className={classes.menuItem} variant="h3" href="https://about.getwoke.me">about</Link>
					<Link className={classes.menuItem} variant="h3" href="/logout">logout</Link>
				</OutsideClickHandler>
			</FlexColumn>
		</>
	);
}
