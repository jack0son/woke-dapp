import React from 'react';

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';

// Theme assets 
import * as mainPalette from './colors/main-palette';
import { accentPalette } from './colors/blue-green';
import Nervous from '../components/fonts/nervous';
import 'typeface-inconsolata';

const palette = mainPalette.palette;
palette.accents = accentPalette;

const purpleDarkest = '#090117'
const purpleLightGradient = '#350e47'

const theme = createMuiTheme({
  background: `linear-gradient(135deg, ${purpleDarkest}, ${purpleLightGradient})`,

	spacing: 8,

	palette: palette,
	typography: {
      useNextVariants: true
  },

	breakpoints: {
		values: {
			xs: 0,
			sm: 300,
			md: 364,
			lg: 488,
			xl: 504,
		}
	},

	typography: {
		fontFamily: 'Inconsolata',
		h1: {
			fontFamily: 'Nervous',
			fontWeight: 400,
			fontSize: '38px',
			lineHeight: '48px',
			color: accentPalette.primary.main
		},
		h4: {
			fontFamily: 'Inconsolata',
			fontWeight: 700,
			fontSize: '18px',
			lineHeight: '24px',
		},
		body1: {
			fontFamily: 'Inconsolata',
			fontWeight: 400,
			fontSize: '0.875rem',
			//color: 'primary'
			//lineHeight: '24px',
		},
		body2: {
			fontFamily: 'Inconsolata',
			fontWeight: 400,
			fontSize: '0.875rem',
			//color: 'secondary',
		},
	},

	overrides: {
		// Include custom fonts
		MuiCssBaseline: {
			'@global': {
				'@font-face': [Nervous],

				'*::-webkit-scrollbar': {
					width: '4px',
					color:	palette.background.light,
					backgroundColor: palette.background.dark,
				},
				'*::-webkit-scrollbar-track': {
					width: '2px',
					'-webkit-box-shadow': `inset 0 0 6px ${palette.background.dark}`
				},
				'*::-webkit-scrollbar-thumb': {
					width: '4px',
					backgroundColor: palette.background.paper,
					outline: '1px solid slategrey'
				}
			},
    },
  }
});

export default function Theming(props) {
	return ThemeProvider({...props, theme: theme});
}
