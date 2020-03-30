import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import FilledInput from '@material-ui/core/FilledInput';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';


export default function NumberFieldOutlined(props) {

	return (
		<div>
			<TextField
				label="With normal TextField"
				id="outlined-start-adornment"
				className={clsx(classes.margin, classes.textField)}
				InputProps={{
					startAdornment: <InputAdornment position="start">Kg</InputAdornment>,
				}}
				variant="outlined"
			/>
			<FormControl className={clsx(classes.margin, classes.textField)} variant="outlined">
				<OutlinedInput
					id="outlined-adornment-weight"
					value={values.weight}
					onChange={handleChange('weight')}
					endAdornment={<InputAdornment position="end">Kg</InputAdornment>}
					aria-describedby="outlined-weight-helper-text"
					inputProps={{
						'aria-label': 'weight',
					}}
					labelWidth={0}
				/>
				<FormHelperText id="outlined-weight-helper-text">Weight</FormHelperText>
			</FormControl>
			<FormControl className={clsx(classes.margin, classes.textField)} variant="outlined">
				<InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
				<OutlinedInput
					id="outlined-adornment-password"
					type={values.showPassword ? 'text' : 'password'}
					value={values.password}
					onChange={handleChange('password')}
					endAdornment={
						<InputAdornment position="end">
							<IconButton
								aria-label="toggle password visibility"
								onClick={handleClickShowPassword}
								onMouseDown={handleMouseDownPassword}
								edge="end"
							>
								{values.showPassword ? <Visibility /> : <VisibilityOff />}
							</IconButton>
						</InputAdornment>
					}
					labelWidth={70}
				/>
			</FormControl>
			<FormControl fullWidth className={classes.margin} variant="outlined">
				<InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
				<OutlinedInput
					id="outlined-adornment-amount"
					value={values.amount}
					onChange={handleChange('amount')}
					startAdornment={<InputAdornment position="start">$</InputAdornment>}
					labelWidth={60}
				/>
			</FormControl>
		</div>
		</div>
	);
}
