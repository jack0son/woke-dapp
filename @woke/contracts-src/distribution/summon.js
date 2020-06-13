//r_i = (a_i*mu)/sqrt(w_i * f_i)
//let tributeBonusRatio = (tributeAmount * meansScale)/sqrt(balance * followers);
const fs = require('fs');

const tributors = require('./data-tributors');
const log_normal_csv = fs.readFileSync('./log_normal_py.csv', 'utf8');

// Import log normal pdf function
const y_raw = log_normal_csv.split('\n').map(Number);
let y= y_raw;
y.forEach((v,i) => Number.isNaN(v) && console.log(i));
y = y.map(i => Number.isNaN(i) ? 0 : i);

function getTributeTable(tributors) {
	const w = 12;
	let rows = [`${'i'.padEnd(w/2)}${'amount'.padEnd(w)}${'balance'.padEnd(w)}${'followers'.padEnd(w)}${'weight'.padEnd(w)}${'dividend'.padEnd(w)}${'portion'.padEnd(w)}${'roi'.padEnd(w)}`];
	rows.push(''.padStart(rows[0].length-1, '-'));
	const p = (n, width = w) => n.toString().padEnd(width);

	tributors.forEach((t,i) => {
		rows.push(`${p(i,w/2)}${p(t.amount)}${p(t.balance)}${p(t.followers)}`);
		let roi = 0;
		if(t.b) roi = t.b/t.amount;
		rows[rows.length-1] += t.b ? `${p(t.r.toFixed(5))}${p(t.b)}${p(t.proportion.toFixed(5))}${p(roi.toFixed(5))}` : '';
	});
	return rows;
}

function getScenarioTable(scenario) {
	const w = 12;
	let rows = [`${'supply'.padEnd(w)}${'followers'.padEnd(w)}${'N_t'.padEnd(w/2)}${'tribute'.padEnd(w)}`];
	rows.push(
`${scenario.supply.toString().padEnd(w)}${scenario.followers.toString().padEnd(w)}${scenario.tributors.length.toString().padEnd(w/2)}${scenario.tributors.map(t => t.amount).reduce(getSum, 0).toString().padEnd(w)}`
	);
	return rows;
}

function getResultTable(supply, minted, tributeSum, userBonus, tributorRewards) {
	const w = 15;
	let rows = [`${'supply'.padEnd(w)}${'minted'.padEnd(w)}${'tributes'.padEnd(w)}${'user balance'.padEnd(w)}${'tributor rewards'.padEnd(w)}`];
	rows.push(
`${supply.toString().padEnd(w)}${minted.toString().padEnd(w)}${tributeSum.toString().padEnd(w)}${userBonus.toString().padEnd(w)}${tributorRewards.toString().padEnd(w)}`
	);
	return rows;
}

const joinEvents = {
	x: {
		followers: 100,
		supply: 1,
		tributors: [],
	},
	y: {
		followers: 100,
		supply: 1705,
		tributors: [],
	},
	z: {
		followers: 10,
		supply: 1705,
		tributors: [],
	},
	a: {
		followers: 10,
		supply: 1,
		tributors: [],
	},
	b: {
		followers: 10,
		supply: 0,
		tributors: tributors.even,
	},
	c: {
		followers: 1000,
		supply: 0,
		tributors: tributors.even,
	},
	d: {
		followers: 1000,
		supply: 100e3,
		tributors: tributors.even,
	},
	e: {
		followers: 1000,
		supply: 2.3e6,
		tributors: tributors.even,
	},
	f: {
		followers: 2000,
		supply: 2.3e6,
		tributors: tributors.whale,
	},
	g: {
		followers: 350,
		supply: 3.8e6,
		tributors: tributors.whale,
	},
	testFile: {
		followers: 30000,
		supply: 1,
		tributors: [],
	}
};

// Minting curve params
const a = 105;		// (max price)/2
const b = 2.72e6;	// linear price inflection
const c = 1.4e9;		// curve steepness

function mintingCurve (currentSupply, followers) {
	const s = currentSupply;
	const F = followers;
	let t = Math.sqrt(c+Math.pow(s-b,2));
	console.log('rootTerm:', t);
	let k = (Math.pow(F,2)+2*F*a*t)/(2* (Math.pow(a,2)*(s-b+t)+(a*F)))
	console.log(`k: ${k}`);
	return k;
}

function calculatePurchaseReturn(currentSupply, followers) {
	const scale = Math.pow(10,18);

	const precision = 127;
	let squareTerm = currentSupply < b ? b - currentSupply : currentSupply - b;
	console.log('\nsquareTerm: ', squareTerm);
	let baseN = c + Math.pow(squareTerm, 2);
	console.log('baseN: ', baseN);
	//console.log('baseN-scaled: ', baseN);
	let rootTerm = Math.sqrt(baseN);
	const powerScale = Math.pow(2, precision);

	let power = rootTerm * powerScale;
	console.log('rootTerm: ', rootTerm);
	console.log('rootTerm-power: ', power);

	const F = followers;
	//let numerator = Math.pow(F,2) + (2*F*a*rootTerm);
	let numerator = (Math.pow(F,2) * powerScale) + (2*F*a*power);
	console.log('numerator: ', numerator);

	let denom = a * ( a*((currentSupply - b)*powerScale + power) + (F * powerScale))
	console.log('denom: ', denom);

	let result = numerator/(denom * 2);
	console.log('purchase return: ', result);
	return result;
}

function priceIntegral(currentSupply, amount) {
	const s = currentSupply
	const k = amount;
	let costInFollowers = a * (k - Math.sqrt(c+(Math.pow(b-s,2))) + Math.sqrt(c+(Math.pow(-b+k+s,2))));
	return costInFollowers;
}

// @currentSupply:	tokens in existence
// @followers:			num followers of new user (minting 'fee')
// returns: price in followers per token
function priceCurve(currentSupply) {
	const x = currentSupply;
	const startingPrice = a*(((x-b)/Math.sqrt(c+Math.pow(x-b,2)))+1);
	return startingPrice;
}

function claimUser(claimer) {
}

const logNormalPDF = x => x > y.length - 2 ? y[y.length - 2] : y[x];

// Generosity weighted influence scale
function calcMeansScale(tributors){
	let mu = 0;
	let z = tributors.map(t => t.amount).reduce(getSum);
	tributors.forEach((t, i) => {
		t.c = logNormalPDF(t.followers);
		//t.c = t.amount/(t.balance + Math.sqrt(t.balance * t.followers));
		//t.c = t.amount/(t.followers + Math.sqrt(t.balance * t.followers));
		//t.c = t.amount/(t.balance * t.followers)
		//t.c = t.c / Math.cbrt(t.balance);
		//t.c = t.c * Math.sqrt(t.amount/(t.balance*z));
		//t.c *= t.balance;
		//z2 += t.amount;

		mu += t.c;
		//console.log(`${i}, C: ${t.c}`);
	});

	//mu = mu / (tributors.length);
	console.log(`Means scale (mu): ${mu}`);
	console.log(`Tribute pool: ${z} W`);
	return { mu, z };
}

function medianCeiling(xs){
  if(xs.length ===0) return 0;
	xs.sort((a,b) => a-b);
  let half = Math.floor(xs.length / 2);

  if (xs.length % 2)
    return xs[half];

  //return (xs[half - 1] + xs[half]) / 2.0;
  return xs[Math.ceil(half)];
}

function weightingFunction(tributor) {
	return logNormalPDF(tributor.followers);
}

// Calc new user ratio
function calcNewUserPortion(newUser, minted, tributors){
	let tributePool = tributors.map(t => t.amount).reduce(getSum);

	tributors.forEach(t => t.lnpdf = logNormalPDF(t.followers));
	const tf = tributors.reduce((max, t) => t.lnpdf > max.lnpdf ? t : max );

	const groups = [
		{
			// new user
			...newUser,
			amount: minted,
			balance: tributePool+minted,
		},
		{
			// tributors
			followers: tf.followers,
			amount: tributePool, 
			balance: tributePool + minted,
		}
	];
	let mu = 0;
	groups.forEach((t, i) => {
		t.c = weightingFunction(t);
		mu += t.c;
	});


	console.log(`New user scale (mu): ${mu}`);
	//console.log(`Bonus pool: ${z} W`);

	calcBonusRatios(groups, mu);
	calcBonuses(groups, minted);
	console.log(getTributeTable(groups).join('\n'), '\n');

	return groups;
}

function calcBonusRatios(tributors, mu) {
	let ratios = [];
	tributors.forEach((t, i) => {
		t.r = (t.c)/mu; //Math.sqrt(t.balance*t.followers)
		ratios.push(t.r);
		//console.log(`${i}, r: ${r}`);
	});
	return ratios;
}

// @param funds: minted + tributed
function calcBonuses(tributors, funds) {
	let bonuses = [];
	tributors.forEach((t, i) => {
		let b = Math.floor(funds*t.r); //Math.sqrt(t.balance*t.followers)
		//console.log(`${i}, b: ${b.toString().padEnd(20,' ')} ${(b*100/funds).toFixed(5)}%`);

		bonuses.push(b);
		t.b = b;
		t.proportion = b*100/funds;
	});
	let smallest = tributors.reduce((min, t) => t.b < min.b ? t : min);
	let smallIdx = tributors.indexOf(smallest)
	smallest.b += funds - bonuses.reduce(getSum, 0);
	//console.log(`Smallest: ${smallIdx}, gets dust: ${smallest.b} W`);
	bonuses[smallIdx] = smallest.b;

	tributors.forEach(t => t.proportion = t.b*100/funds);

	return bonuses;
}

function getSum(total, num) {
	return total + num;
}

function getMin(min, num) {
	return num < min ? num : min;
}

function distribution(newUser, minted, tributors) {
	let T = tributors;

	const bonusDistribution = calcNewUserPortion(newUser, minted, tributors);
	const userBonus = bonusDistribution[0].b;
	const tributeBonusPool = bonusDistribution[1].b;
	console.log(`User bonus: ${userBonus} W`);
	console.log(`Tribute bonus pool: ${tributeBonusPool} W\n`);

	const { mu, z } = calcMeansScale(T);
	const ratios = calcBonusRatios(T, mu);
	let one = 0;
	ratios.forEach(r => one += r);
	one !== 1.0 && console.log(`One: ${one}\n`);

	const bonuses = calcBonuses(T, tributeBonusPool);
	let totalBonuses = bonuses.reduce(getSum);
	console.log(`Total bonuses: ${totalBonuses} W\n`);

	console.log(getTributeTable(tributors).join('\n'), '\n');

	return { userBonus, tributeBonusPool, bonuses };
}

const printTable = rows => console.log(rows.join('\n'));

function joinEvent(scenario) {

	const tributePool = scenario.tributors.length ? scenario.tributors.map(t => t.amount).reduce(getSum) : 0;
	if(scenario.tributors.length && scenario.supply < tributePool) 
		scenario.supply += tributePool;

	console.log(getScenarioTable(scenario).join('\n'), '\n');
	const { tributors, supply, followers } = scenario;

	let amountToMint = Math.floor(mintingCurve(supply, followers));
	console.log(`Minted: ${amountToMint}`);

	let contractCalc = calculatePurchaseReturn(supply, followers);

	let tokensPerFollower = priceIntegral(supply, amountToMint);
	console.log(`Price integral: ${tokensPerFollower}`);

	entryPrice = priceCurve(supply);
	console.log(`Entry summoning rate: ${1/entryPrice} W/f, Price: ${entryPrice} followers per token\n`);

	function assertSupply(name, actual, expected) {
		console.log(`${name}:`.padEnd(12), expected === actual);
	}

	const minted = amountToMint;
	const newSupply = supply + minted;

	if(scenario.tributors.length) {
		const { userBonus, tributeBonusPool, bonuses } = distribution({followers: followers}, amountToMint, tributors);
		const balance = userBonus + tributePool;
		printTable(getResultTable(newSupply, minted, tributePool, balance, tributeBonusPool));

		// shim for solidity
		if(true) {
			console.log();
			assertSupply('supply', supply + minted, newSupply);
			assertSupply('bonuses', tributeBonusPool + userBonus, minted);
			assertSupply('balance', tributePool + userBonus, balance);
			assertSupply('tributes', bonuses.reduce(getSum), tributeBonusPool);
		}

	}

	console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++');



	return amountToMint;
}

function cumulativeJoins(scenarios) {
	let supply = 0;
	scenarios.forEach(s => {
		s.supply = supply;
		supply += joinEvent(s);
	})
}

joinEvent(joinEvents.g);
//joinEvent(joinEvents.testFile);
//joinEvent(joinEvents.a);
//joinEvent(joinEvents.z);
//joinEvent(joinEvents.y);

//cumulativeJoins(Object.values(joinEvents));
//joinEvent(joinEvents.d);
//joinEvent(joinEvents.e);
//joinEvent(joinEvents.f);
