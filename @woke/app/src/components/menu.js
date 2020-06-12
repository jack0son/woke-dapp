import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import FlexColumn from '../layouts/flex-column';
import Link from '@material-ui/core/Link';
import MenuIcon from '@material-ui/icons/Menu';
import MenuOpenIcon from '@material-ui/icons/MenuOpen';
import OutsideClickHandler from 'react-outside-click-handler';

import { useRootContext } from '../hooks/root-context';

const overlapPredicate = (styles, size) => styles && styles.headerOverlap && size;

const useStyles = makeStyles(theme => ({
	showMenu: styles => ({
		'& > div': {
			display: 'flex',
			flexDirection: 'column',
			width: '85vw',
			alignItems: 'center',
			justifyContent: 'center',
			height: '20vh',

			paddingTop: '2vh',
			// @fix broken window
			// To compensate for absolute position avatar-header on wallet
			paddingBottom: overlapPredicate(styles, '2vh') || '0',
			marginBottom: overlapPredicate(styles, '8vh') || '0',

			[theme.breakpoints.up('sm')]: {
				height: 'unset',
				display: 'flex',
				flexDirection: 'row',
				width: '25vw',
				justifyContent: 'space-evenly',
			},
			...styles,
		}
	}),

	hideMenu: {
		position: 'relative',
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

export default function Menu({ twitterSignin, ...props }) {
	const { headerChildren, hedgehog } = useRootContext();
	const headerOverlap = headerChildren && headerChildren.length > 0;
	const classes = useStyles({ ...props.styles, headerOverlap });

	const [showMenu, setShowMenu] = useState(false);
	const toggleMenu = () => setShowMenu(!showMenu);
	const hideMenu = () => {
		if(showMenu == true) {
			toggleMenu();
		}
	};

	const toggleBurgerIcon = () => {
		return showMenu ? 
			<MenuOpenIcon className={classes.hamburger} onClick={toggleMenu} /> :
			<MenuIcon className={classes.hamburger} onClick={toggleMenu} />
	};

	const handleLogout = () => {
		hedgehog.api.logout();
	};

	const handleSignOut = () => {
		twitterSignin.signOut();
		hedgehog.api.forgetUser();
	};

	// ------------- Auth option states -------------
	// Scenario 1
	const previouslySignedIn = () => {
		// We have the user's ID cached, or the twitter access tokens indicating
		// auth was successful. More stringently the 

		// This needs to come from the twitter context, which does not exist in
		// design mode. For other situations like this I generally create a dummy
		// version of the 'live' state.
		// Because of where the menu sits in the component hierarchy we can't just
		// pass in the usualy dummy state (linear-fsm).
		return twitterSignin && twitterSignin.haveUser();
	};

	// Scenario 2
	const isLoggedIn = () => hedgehog.state.loggedIn;
	// Scenario 3,  redundant don't need to specify
	const notAuthenticated = () => !isLoggedIn() && !previouslySignedIn(); 

	const renderAuthOption = () => {
		// Note the ordering of if statements set's the precendence of the different
		// auth option states
		if(isLoggedIn()) { 
			// Logout will always be displayed if logged in
			return <Link className={classes.menuItem} variant="h3"
				href="/"
				onClick={handleLogout}
			>logout</Link>;

		/*} else if(previouslySignedIn()) { //
			// Otherwise, we can log in if we have the user id.
			return <Link className={classes.menuItem} variant="h3"
				href="/login"
				//onClick={goToLogin}
			>login</Link>;
			*/
		} else if(previouslySignedIn()) { //
			// Otherwise, we can log in if we have the user id.
			return <Link className={classes.menuItem} variant="h3"
				onClick={handleSignOut}
			>sign out</Link>;

		} else { // Not logged in, and not signed in
			// By default, root container will route to the sign in page, no need to
			// link to sign in page, but display an option anyway so it's more obvious
			// how to get back from the How page or any future routes.
			return <Link className={classes.menuItem} variant="h3" href="/">sign in</Link>;
		}
	};

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
					{ renderAuthOption() }
				</OutsideClickHandler>
			</FlexColumn>
		</>
	);
}
