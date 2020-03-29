import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
// import Toolbar from '@material-ui/core/Toolbar'; 
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from './menu';
import FlexRow from '../layouts/flex-row'

import LogoLink from './images/logo-link';

const useStyles = makeStyles(theme => ({
	appBar: {
    flexGrow: 1,
		width: '100%',
		height: theme.spacing(6),
		background: 'transparent',
		boxShadow: 'none',
	},

  menuButton: {
    marginRight: '5%'
  },

  title: {
    flexGrow: 1,
  },
}));

export default function NavBar(props) {
	const classes = useStyles();

	const renderLogo = () => {
		if(props.hideLogo != true) {
			return (
					<LogoLink
						src='images/eye-logo.png'
						url='https://getwoke.me'
					/>
			);
		}
	}

	return (
		<AppBar position="relative" overflow="auto" className={classes.appBar}>
			<FlexRow position="relative" disableGutters={true} height="100%">
					{ renderLogo() }
					<Typography variant="h6" className={classes.title}>
          			</Typography>
					<Menu />
			</FlexRow>
		</AppBar>
  );
}
