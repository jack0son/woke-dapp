import { parse_bool } from './utils';
const enabled = parse_bool(process.env.REACT_APP_CONSOLE_DEBUG);
export const applyConsoleDebugMethod = (enable = enabled) =>
	enabled
		? (console.debug = (...args) => console.log('dg:', ...args));
		: (console.debug = () => {})

applyConsoleDebugMethod();
