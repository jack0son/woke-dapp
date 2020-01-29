// src/ui/theme/index.js

import { createMuiTheme } from '@material-ui/core/styles';

const palette = {
  primary: { main: '#350e47', contrastText: '#edf5f9' },
  secondary: { main: '#de57f3', contrastText: '#000000' }
};
const themeName = 'Valentino Heliotrope Tarantula';

export default createMuiTheme({ palette, themeName });
