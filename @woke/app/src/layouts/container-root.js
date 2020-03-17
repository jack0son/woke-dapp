import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import FlexRow from './flex-row';

import { makeStyles, useTheme} from '@material-ui/styles';

// Theme is default first arg to make styles
// No need to call useTheme
const useStyles = makeStyles(theme => ({
	root: {
		background: theme.background,
		height: '100vh',
	},

	container: {
		background: theme.palette.background.paper,
		paddingLeft: 0,
		maxWidth: 'unset',
		paddingRight: 0,
	},
}));


export default function RootContainer(props) {
	const { navBar, children } = props;
	const styles = useStyles();
	const theme = useTheme();

	return (
		<>
			<CssBaseline />
			<Container className={styles.container}>
				<Box component="div" position="relative" className={styles.root}>
					{ navBar }
					<FlexRow>
						{ children }
					</FlexRow>
				</Box>
			</Container>
		</>
  );
}

//<Typography component="div" className={styles.root} />
//<Container maxWidth={theme.breakpoints.sm}>
//<Typography component="div" style={{ backgroundColor: '#cfe8fc', height: '100vh' }} />
