import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';

import FlexRow from './flex-row';

import { makeStyles } from '@material-ui/styles';

// Theme is default first arg to make styles
// No need to call useTheme
const useStyles = makeStyles(theme => ({
	root: {
		minHeight: '100vh',
		//height: '100%',
		//width: '100vw',
		background: theme.background,
		height: '100%',
		maxHeight: 'unset',
	},

	container: {
		height: '100%',
		//background: theme.palette.background.paper,
		paddingLeft: 0,
		paddingRight: 0,
	},
}));


export default function RootContainer(props) {
	const { navBar, gutterSizeP, children } = props;
	const styles = useStyles();

	const width = 100 - (gutterSizeP*2);

	return (
		<>
			<CssBaseline />
			<Container className={styles.container}>
				<Box component="div" position="relative" className={styles.root}>
					{ navBar }
					<FlexRow styles={{
						width,
						small: {
							width: `${gutterSizeP}%`,
						}
						// Pass gutter sizes here
					}}>
						{ children }
					</FlexRow>
				</Box>
			</Container>
		</>
  );
}
