import React from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

export default function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Box
			//maxHeight='100%'
			display="flex"
			flexDirection="row"
			styles={{
				height: 'inherit',
				maxHeight: 'inherit',
			}}
			overflow='hidden'
      component="div"
      role="tabpanel"
      hidden={value !== index}
      //id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
			{children}
    </Box>
  );
	//<Box>{children}</Box>
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}
