import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const { useState } = React;

const useStyles = makeStyles(theme => ({
    menuButton: {
        width: "60px",
        height: "45px",
        position: "relative",
        margin: "50px auto",
        WebkitTransform: "rotate(0deg)",
        MozTransform: "rotate(0deg)",
        OTransform: "rotate(0deg)",
        transform: "rotate(0deg)",
        WebkitTransition: ".5s ease-in-out",
        MozTransition: ".5s ease-in-out",
        OTransition: ".5s ease-in-out",
        transition: ".5s ease-in-out",
        cursor: "pointer",
        '& > span': {
            display: "block",
            position: "absolute",
            height: "9px",
            width: "100%",
            background: "#d3531a",
            borderRadius: "9px",
            opacity: "1",
            left: "0",
            WebkitTransform: "rotate(0deg)",
            MozTransform: "rotate(0deg)",
            OTransform: "rotate(0deg)",
            transform: "rotate(0deg)",
            WebkitTransition: ".25s ease-in-out",
            MozTransition: ".25s ease-in-out",
            OTransition: ".25s ease-in-out",
            transition: ".25s ease-in-out"
        }
    },
    span1: {
        top: "0px"
    },
    span2: {
        top: "18px"
    },
    span3: {
        top: "36px"
    },
    toggled: {
        width: "60px",
        height: "45px",
        position: "relative",
        margin: "50px auto",
        WebkitTransform: "rotate(0deg)",
        MozTransform: "rotate(0deg)",
        OTransform: "rotate(0deg)",
        transform: "rotate(0deg)",
        WebkitTransition: ".5s ease-in-out",
        MozTransition: ".5s ease-in-out",
        OTransition: ".5s ease-in-out",
        transition: ".5s ease-in-out",
        cursor: "pointer",
        '& > span': {
            top: "18px",
            WebkitTransform: "rotate(135deg)",
            MozTransform: "rotate(135deg)",
            OTransform: "rotate(135deg)",
            transform: "rotate(135deg)"
        },
        '& > span2': {
            opacity: "0",
            left: "-60px"
        },
        '& > span3': {
            top: "18px",
            WebkitTransform: "rotate(-135deg)",
            MozTransform: "rotate(-135deg)",
            OTransform: "rotate(-135deg)",
            transform: "rotate(-135deg)"
        },   
    },
}));

export default function Hamburger() {
    const classes = useStyles();
    const [condition, setCondition] = useState(false);

	return (
        <div onClick={() => setCondition(!condition)}
        className={condition ? classes.toggled : classes.menuButton}>
            <span className={classes.span1}></span>
            <span className={classes.span2}></span>
            <span className={classes.span3}></span>
        </div>
  );
}
