import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';

import LogoLink from './images/logo-link';

const useStyles = makeStyles(theme => ({
	appBar: {
		//height: '18vh',
		//minHeight: '8vh',
    //flexGrow: 1,
		//width: '100%',
		background: 'transparent',
		boxShadow: 'none',
	},

	toolBar: {
		height: '100%',
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
		<AppBar position="static"className={classes.appBar}>
			<Toolbar>
					{ renderLogo() }
					<Typography variant="h6" className={classes.title}>
          </Typography>
					<IconButton 
						edge="end"
						className={classes.menuButton} 
						color="inherit" 
						aria-label="menu" 
					>
						<MenuIcon/>
					</IconButton>
			</Toolbar>
		</AppBar>
  );
}
