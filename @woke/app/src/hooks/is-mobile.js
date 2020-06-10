import React from 'react';
import { useTheme } from '@material-ui/styles';
import { useMediaQuery } from "@material-ui/core";

export default function useIsMobile() {
	const theme = useTheme();
	return useMediaQuery(theme.breakpoints.down("sm"));
}
