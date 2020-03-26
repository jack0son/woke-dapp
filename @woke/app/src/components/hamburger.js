import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { slide as Menu } from 'react-burger-menu';

const useStyles = makeStyles(theme => ({
    bmBurgerButton: {
        position: 'fixed',
        width: '36px',
        height: '30px',
        left: '36px',
        top: '36px'
      },
      bmBurgerBars: {
        background: '#373a47'
      },
      bmBurgerBarsHover: {
        background: '#a90000'
      },
      bmCrossButton: {
        height: '24px',
        width: '24px'
      },
      bmCross: {
        background: '#bdc3c7'
      },
      bmMenuWrap: {
        position: 'fixed',
        height: '100%'
      },
      bmMenu: {
        background: '#373a47',
        padding: '2.5em 1.5em 0',
        fontSize: '1.15em'
      },
      bmMorphShape: {
        fill: '#373a47'
      },
      bmItemList: {
        color: '#b8b7ad',
        padding: '0.8em'
      },
      bmItem: {
        display: 'inline-block'
      },
      bmOverlay: {
        background: 'rgba(0, 0, 0, 0.3)'
      }
}));


export default function Hamburger() {
    const classes = useStyles();

    const showSettings = (event) => {
        event.preventDefault();
    }

	return (
        <Menu right>
            <a id="home" className="menu-item" href="/">home</a>
            <a id="how" className="menu-item" href="/about">how</a>
            <a id="logout" className="menu-item" href="/contact">logout</a>
            <a onClick={ showSettings } className="menu-item--small" href="">Settings</a>
        </Menu>
  );
}
