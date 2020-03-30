import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar'; 
import Typography from '@material-ui/core/Typography';
import Menu from './menu';

import LogoLink from './images/logo-link';

const gutterSize = '5%';
const useStyles = makeStyles(theme => ({
	appBar: {
		background: 'transparent',
		boxShadow: 'none',
	},

	toolBar: {
		background: 'transparent',
	},

  navbar: {
	marginRight: gutterSize,
	marginLeft: gutterSize,
	flexWrap: 'wrap'
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
						className={classes.logo}
						src='images/eye-logo.png'
						url='https://getwoke.me'
					/>
			);
		}
	}

	return (
		<AppBar position="static"className={classes.appBar}>
			<Toolbar className={classes.navbar}>
					{ renderLogo() }
					<Typography variant="h6" className={classes.title}>
          			</Typography>
					<Menu />
			</Toolbar>
		</AppBar>
  );
}
