import React from 'react';
import PropTypes from 'prop-types';
import deburr from 'lodash/deburr';
import Downshift from 'downshift';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import Chip from '@material-ui/core/Chip';

function renderInput(inputProps) {
  const { FieldComponent, InputProps, onChange, classes, ref, ...other } = inputProps;
	const Component = FieldComponent ? FieldComponent : TextField;

  return (
    <Component
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput,
        },
        ...InputProps,
      }}
      {...other}
    />
  );
}

renderInput.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object.isRequired,
  InputProps: PropTypes.object,
};

function renderSuggestion(suggestionProps) {
  const { Suggestion, theme, suggestion, index, itemProps, highlightedIndex, selectedItem } = suggestionProps;
  const isHighlighted = highlightedIndex === index;
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

  return (
    <MenuItem
      {...itemProps}
      key={suggestion.label}
      selected={isHighlighted}
      component="div"
      style={{
				paddingTop: 0,
				backgroundColor: theme.palette.background.default,
				paddingBottom: 0,
				minHeight: '32px',
				height: '6vh',
        fontWeight: isSelected ? 500 : 400,
				fontSize: '14px',
				zIndex: '2000',
      }}
			disableGutters
    >
			{ Suggestion ?
					<Suggestion
						suggestion={suggestion}
					/>
				: suggestion.label
			}
    </MenuItem>
  );
}

renderSuggestion.propTypes = {
  highlightedIndex: PropTypes.oneOfType([PropTypes.oneOf([null]), PropTypes.number]).isRequired,
  index: PropTypes.number.isRequired,
  itemProps: PropTypes.object.isRequired,
  selectedItem: PropTypes.string.isRequired,
  suggestion: PropTypes.shape({
    label: PropTypes.string.isRequired,
  }).isRequired,
};


const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
		width: '100%',
    //height: 250,
  },
  container: {
    flexGrow: 1,
		width: '100%',
    position: 'relative',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
		//marginTop: theme.spacing(1),
		height: theme.spacing(4),
		minHeight: theme.spacing(4),
    left: 0,
    right: 0,
  },
  chip: {
    margin: theme.spacing(0.5, 0.25),
  },
  inputRoot: {
		width: '100%',
    flexWrap: 'wrap',
  },
  inputInput: {
		width: '100%',
    flexGrow: 1,
  },
  divider: {
    height: theme.spacing(2),
  },
}));

let popperNode;

export default function IntegrationDownshift(props) {
	const {FieldComponent, Suggestion, suggestions, handleFieldChange, ...innerProps} = props;
	const theme = useTheme();
  const classes = useStyles();

	function getSuggestions(value, { showEmpty = false } = {}) {
		const inputValue = deburr(value.trim()).toLowerCase();
		const inputLength = inputValue.length;
		let count = 0;

		return inputLength === 0 && !showEmpty
			? []
			: suggestions.filter(suggestion => {
					const keep =
						count < 5 && suggestion.label.slice(0, inputLength).toLowerCase() === inputValue;

					if (keep) {
						count += 1;
					}

					return keep;
				});
	}


	const itemToString = (item) => {
		return item;
	}

	const renderSimple = () => (
      <Downshift id="downshift-simple" itemToString={itemToString}>
        {({
          getInputProps,
          getItemProps,
          getLabelProps,
          getMenuProps,
          highlightedIndex,
          inputValue,
          isOpen,
          selectedItem,
					selectItem,
					clearSelection,
        }) => {
					//const {onFocus, ...inputProps } = getInputProps({
					const inputProps = getInputProps({
						onBlur: (event) =>  {
							let label = event.target.value;
							//event.preventDefault();
							if (selectedItem) {
								if (selectedItem.label === label) {
									return;
								}
							}

							handleFieldChange(event);
							selectItem(label);
						},

            placeholder: props.placeholder,
          });

          return ( <div className={classes.container}> {renderInput({
								FieldComponent: FieldComponent,
								//fullWidth: true,
                classes,
                label: 'User',
                InputLabelProps: getLabelProps({ shrink: true }),
								//InputProps: { onBlur, onFocus },
								inputProps//: {onBlur, onFocus, onChange}, 
              })}

              <div {...getMenuProps()}>
                {isOpen ? (
                  <Paper className={classes.paper} square>
                    {getSuggestions(inputValue).map((suggestion, index) =>
                      renderSuggestion({
												Suggestion,
                        suggestion,
                        index,
												theme,
                        itemProps: getItemProps({ item: suggestion.label }),
                        highlightedIndex,
                        selectedItem,
                      }),
                    )}
                  </Paper>
                ) : null}
              </div>
            </div>
          );
        }}
      </Downshift>
	);

  return (
    <div className={classes.root}>
			{ 
				renderSimple() 
				//renderWithOptions() 
			}
      <div className={classes.divider} />
      <div className={classes.divider} />
    </div>
  );
}
