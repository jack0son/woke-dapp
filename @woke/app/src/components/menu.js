import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import FlexColumn from '../layouts/flex-column';
import FlexRow from '../layouts/flex-row'
import Link from '@material-ui/core/Link';
import onClickOutside from 'react-onclickoutside'; //TODO
import MenuIcon from '@material-ui/icons/Menu';
import MenuOpenIcon from '@material-ui/icons/MenuOpen';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const useStyles = makeStyles(theme => ({
	showMenu: {
    display: 'flex',
    width: '100vw',
    position: 'absolute',
    flexDirection: 'column',
    top: '10vh',
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
      top: 'unset',
      position: 'unset'
		}
  },

  hideMenu: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
			display: 'block'
		},
  },

  hamburger: {
    [theme.breakpoints.up('sm')]: {
			display: 'none'
		},
  }
}));


export default function Menu() {
    const classes = useStyles();

    const [showMenu, setShowMenu] = useState(false);
    const toggleMenu = () => setShowMenu(!showMenu);

    //TODO:Handle click outside
    //Menu.handleClickOutside = () => setShowMenu(false);


	return (
      <FlexColumn>
        { showMenu ? (
          <MenuOpenIcon className={classes.hamburger} onClick={toggleMenu} >
            Show menu
          </MenuOpenIcon> )
          : (
            <MenuIcon className={classes.hamburger} onClick={toggleMenu} >
            Show menu
          </MenuIcon> )
        }
        <FlexRow className={showMenu ? classes.showMenu : classes.hideMenu}>
          <Link href="/">home </Link>
          <Link href="/about">about </Link>
          <Link href="/how">how </Link>
        </FlexRow>
      </FlexColumn>
  );
}
