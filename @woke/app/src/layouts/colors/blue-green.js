// src/ui/theme/index.js

import { createMuiTheme } from '@material-ui/core/styles';

export const accentPalette = {
  primary: { main: '#02f0f0' },
	//secondary: { main: '#02f079' }
	secondary: { main: '#46dc9e' }
};
const themeName = 'Cyan / Aqua Spring Green Goose';

export default createMuiTheme({ palette: accentPalette, themeName });


