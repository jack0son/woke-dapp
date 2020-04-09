import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';

import FlexRow from './flex-row';

import { makeStyles } from '@material-ui/styles';

// Theme is default first arg to make styles
// No need to call useTheme
const useStyles = makeStyles(theme => ({
	rootColumn: {
		position: 'static',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'stretch',

		background: theme.background,

		width: '100%',
		height: '100%',
		minHeight: '100vh',
		maxHeight: 'unset',
	},

	container: {
		height: '100%',
		//background: theme.palette.background.paper,
		paddingLeft: 0,
		paddingRight: 0,
	},

	footer: {
		flexShrink: 1,
		flexGrow: 0,
		height: '5%',
		[theme.breakpoints.down('sm')]: {
		},
	}
}));


export default function RootContainer(props) {
	const { NavBar, gutterSizeP, children, headerChildren } = props;
	const classes = useStyles();

	//const width = 100 - (gutterSizeP*2);

	return (
		<>
			<CssBaseline />
			<div className={classes.container}>
				<div component="div" position="relative" className={classes.rootColumn}>
					{ NavBar }
					{ headerChildren }
					<FlexRow> 
						{ children }
					</FlexRow>
					<div className={classes.footer}/>
				</div>
			</div>
		</>
  );
}
