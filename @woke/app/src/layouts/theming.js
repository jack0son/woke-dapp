import React from 'react';

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import createBreakpoints from '@material-ui/core/styles/createBreakpoints'

// Theme assets 
import * as mainPalette from './colors/main-palette';
import { accentPalette } from './colors/blue-green';
import Nervous from '../components/fonts/nervous';
import 'typeface-inconsolata';

const breakpoints = createBreakpoints({})

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
			sm: 700,
			md: 960,
			lg: 1280,
			xl: 1920,
		}
	},

	typography: {
		fontFamily: 'Inconsolata',
		h1: {
			fontFamily: 'Nervous',
			fontWeight: 400,
			fontSize: '38px',
			lineHeight: '48px',
			color: accentPalette.primary.main,
			[breakpoints.up('sm')]: {
				fontSize: '62px',
				lineHeight: '85px',
			},
			[breakpoints.up('lg')]: {
				fontSize: '88px',
				lineHeight: '100px',
			}
		},
		h3: {
			fontFamily: 'Inconsolata',
			fontWeight: 500,
			fontSize: '18px',
			lineHeight: '24px',
			[breakpoints.up('sm')]: {
				fontSize: '26px',
			},
			[breakpoints.up('lg')]: {
				fontSize: '28px',
			},
		},
		h4: {
			fontFamily: 'Inconsolata',
			fontWeight: 700,
			fontSize: '18px',
			lineHeight: '24px',
			[breakpoints.up('sm')]: {
				fontSize: '32px',
			},
			[breakpoints.up('lg')]: {
				fontSize: '38px',
			}
		},
		body1: {
			fontFamily: 'Inconsolata',
			fontWeight: 400,
			fontSize: '0.875rem',
			[breakpoints.up('sm')]: {
				fontSize: '1rem',
			},
			[breakpoints.up('lg')]: {
				fontSize: '1.15rem',
			}
		},
		body2: {
			fontFamily: 'Inconsolata',
			fontWeight: 400,
			fontSize: '0.875rem',
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
