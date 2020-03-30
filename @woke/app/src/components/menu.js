import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import FlexColumn from '../layouts/flex-column';
import Link from '@material-ui/core/Link';
import MenuIcon from '@material-ui/icons/Menu';
import MenuOpenIcon from '@material-ui/icons/MenuOpen';
import OutsideClickHandler from 'react-outside-click-handler';

const useStyles = makeStyles(theme => ({
	showMenu: {
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      width: '85vw',
      alignItems: 'center',
      [theme.breakpoints.up('sm')]: {
        display: 'block',
        width: 'unset'
      },
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
  },

  menuItem: {
    marginRight: '8px',
  }
}));


export default function Menu() {
    const classes = useStyles();

    const [showMenu, setShowMenu] = useState(false);
    const toggleMenu = () => setShowMenu(!showMenu);
    const hideMenu = () => {
      if (showMenu == true) {
        toggleMenu();
      }
    }
    const toggleBurgerIcon = () => {
      return ( showMenu ? <MenuOpenIcon className={classes.hamburger} onClick={toggleMenu} /> : <MenuIcon className={classes.hamburger} onClick={toggleMenu} /> )
    }

	return (
    <React.Fragment>    
    { toggleBurgerIcon() }
          <FlexColumn className={showMenu ? classes.showMenu : classes.hideMenu}>
            <OutsideClickHandler
              onOutsideClick={() => {
                hideMenu();
              }}>
              <Link className={classes.menuItem} variant="h3" href="/about">about</Link>
              <Link className={classes.menuItem} variant="h3" href="/how">how</Link>
              <Link className={classes.menuItem} variant="h3" href="/logout">logout</Link>
            </OutsideClickHandler>
          </FlexColumn>
        </React.Fragment>
  );
}
