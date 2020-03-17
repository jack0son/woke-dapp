import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles(theme => ({
	button: styles => ({
    margin: theme.spacing(1),
		display: 'block',
		textTransform: 'none', // remove capitalization
		//maxWidth: '100px',
		//marginTop: '15%',
		paddingRight: '25px',
		paddingLeft: '25px',
		borderRadius: '2px',
		//backgroundColor: '#46dc9e',
		boxShadow: `1px 1px 5px 0 ${theme.palette.secondary.main}`,
		fontSize: '16px',
		fontWeight: 700,
		textAlign: 'center',
		whiteSpace: 'nowrap',
		typography: theme.typography,
		...styles
  }),

}));

export default function ContainedButton(props) {
	const {text, styles, color,  ...innerProps} = props;
  const classes = useStyles(styles);

  return (
		<Button 
			variant="contained"
			color={color || "primary"}
			className={classes.button}
			{...innerProps}
		>
			{text}
		</Button>
	);
}
