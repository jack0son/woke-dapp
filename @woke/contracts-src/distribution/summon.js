//r_i = (a_i*mu)/sqrt(w_i * f_i)
//let tributeBonusRatio = (tributeAmount * meansScale)/sqrt(balance * followers);
const fs = require('fs');

const tributors = require('./data');
const log_normal_csv = fs.readFileSync('./log_normal_py.csv', 'utf8');


// Import log normal pdf function
const y_raw = log_normal_csv.split('\n').map(Number);
let y= y_raw;
y.forEach((v,i) => Number.isNaN(v) && console.log(i));
//let y = y_raw.slice(10,y_raw.length);
//console.log(y.slice(0,10));
//y = y_raw;
//y = y.map(i => Number.isNaN(i) ? 0 : i);

function getTributeTable(tributors) {
	const w = 12;
	let rows = [`${'i'.padEnd(w/2)}${'amount'.padEnd(w)}${'balance'.padEnd(w)}${'followers'.padEnd(w)}${'dividend'.padEnd(w)}${'portion'.padEnd(w)}\n`];
	rows.push('\n'.padStart(rows[0].length-1, '-'));
	const p = (n, width = w) => n.toString().padEnd(width);

	tributors.forEach((t,i) => {
		rows.push(`${p(i,w/2)}${p(t.amount)}${p(t.balance)}${p(t.followers)}`);
		rows[rows.length-1] += t.b ? `${p(t.b)}${p(t.proportion.toFixed(5))}\n` : '\n';
	});
	return rows;
}

function getScenarioTable(scenario) {
	const w = 12;
	let rows = [`${'supply'.padEnd(w)}${'followers'.padEnd(w)}${'k_t'.padEnd(w/2)}${'tribute'.padEnd(w)}`];
	rows.push(
`${scenario.supply.toString().padEnd(w)}${scenario.followers.toString().padEnd(w)}${scenario.tributors.length.toString().padEnd(w/2)}${scenario.tributors.map(t => t.amount).reduce(getSum, 0).toString().padEnd(w)}`
	);
	return rows;
}

const joinEvents = {
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
	}
};

// Curve params
a = 105;		// (max price)/2
b = 2.23e6;	// linear price inflection
c = 1e9;		// curve steepness

function priceIntegral(currentSupply, amount) {
	const s = currentSupply
	const k = amount;
	/*
	let temp = Math.sqrt(c+(Math.pow(-b+k+s,2)))
	console.log(temp);
	let temp3 = Math.sqrt(c+(Math.pow(b-s,2)));
	console.log(temp3);
	let temp4 = k - temp3 + temp;
	console.log(temp4);
	//let costInFollowers = a * temp4;
	*/

	let costInFollowers = a * (k - Math.sqrt(c+(Math.pow(b-s,2))) + Math.sqrt(c+(Math.pow(-b+k+s,2))));
	console.log(`Cost in followers: ${costInFollowers}`);

	return costInFollowers;
}

function mintingCurve (currentSupply, followers) {
	const s = currentSupply;
	const F = followers;
	const pow = Math.pow;

	let t = Math.sqrt(c+pow(s-b,2));

	let k = ((pow(F,2)/pow(a,2))+(2*F*t/a))/((2*F/a)+(s-(2*b)+(2*t)));
	console.log(`Amount to mint: ${k}`);

	return k;
}

// @currentSupply:	tokens in existence
// @followers:			num followers of new user (minting 'fee')
// returns: price in followers per token
function priceCurve(currentSupply) {
	const x = currentSupply;
	/*
	let temp = (x-b);
	console.log(temp);
	let temp2 = Math.sqrt(Math.pow(x-b,2)+c);
	console.log(temp2);
	let temp3 = (temp/temp2) + 1;
	console.log(temp3);
	let temp4 = temp3*a;
	console.log(temp4);
	*/

	const startingPrice = a*(((x-b)/Math.sqrt(c+Math.pow(x-b,2)))+1);
	//const startingPrice = a*(((x+b)/Math.sqrt(c+((x+b)^2)))-1);
	return startingPrice;
}

function claimUser(claimer) {
}

// Generosity weighted influence scale
function calcMeansScale(tributors){
	let mu = 0;
	let z = tributors.map(t => t.amount).reduce(getSum);
	tributors.forEach((t, i) => {
		//t.c = t.amount/(t.balance + Math.sqrt(t.balance * t.followers));
		//t.c = t.amount/(t.followers + Math.sqrt(t.balance * t.followers));
		//t.c = t.amount/(t.balance * t.followers)
		t.c = t.followers > y.length - 1 ? y[y.length - 1] : y[t.followers];
		//t.c = t.c / Math.cbrt(t.balance);
		//t.c = t.c * Math.sqrt(t.amount/(t.balance*z));
		//t.c *= t.balance;
		//z2 += t.amount;

		mu += t.c;
		console.log(`${i}, C: ${t.c}`);
	});

	//mu = mu / (tributors.length);
	console.log(`Means scale (mu): ${mu}`);
	console.log(`Tribute pool: ${z} W\n`);
	return { mu, z };
}

function calcBonusRatios(tributors, mu) {
	let ratios = [];
	tributors.forEach((t, i) => {
		let r = (t.c)/mu; //Math.sqrt(t.balance*t.followers)
		//let r = (t.c)/(mu*Math.sqrt(t.balance)); //Math.sqrt(t.balance*t.followers)
		console.log(`${i}, r: ${r}`);
		ratios.push(r);
		t.r = r;
	});
	return ratios;
}

// @param funds: minted + tributed
function calcBonuses(tributors, funds) {
	let bonuses = [];
	tributors.forEach((t, i) => {
		let b = Math.floor(funds*t.r); //Math.sqrt(t.balance*t.followers)
		console.log(`${i}, b: ${b.toString().padEnd(20,' ')} ${(b*100/funds).toFixed(5)}%`);
		bonuses.push(b);
		t.b = b;
		t.proportion = b*100/funds;
	});
	let smallest = tributors.reduce((min, t) => t.b < min.b ? t : min);
	let smallIdx = tributors.indexOf(smallest)
	smallest.b = funds - bonuses.reduce(getSum, 0);
	console.log(`Smallest: ${smallIdx}, gets dust: ${smallest.b} W`);
	bonuses[smallIdx] = smallest.b;

	tributors.forEach(t => t.proportion = t.b*100/funds);

	return bonuses;
}

function getSum(total, num) {
	return total + num;
}

function distribution(tributors, minted) {
	let T = tributors;
	const { mu, z } = calcMeansScale(T);
	const ratios = calcBonusRatios(T, mu);
	let one = 0;
	ratios.forEach(r => one += r);
	console.log(`One: ${one}\n`);

	const bonuses = calcBonuses(T, z + minted);
	let totalBonuses = bonuses.reduce(getSum, 0);
	console.log(`Total bonuses: ${totalBonuses} W`);
	console.log(getTributeTable(T).reduce(getSum, ''));
}

function joinEvent(scenario) {
	if(scenario.tributors.length) 
		scenario.supply += scenario.tributors.map(t => t.amount).reduce(getSum);

	console.log(getScenarioTable(scenario).join('\n'), '\n');
	const { tributors, supply, followers } = scenario;

	let amountToMint = Math.floor(mintingCurve(supply, followers));
	console.log(`Minted: ${amountToMint}`);

	let tokensPerFollower = priceIntegral(supply, amountToMint);
	console.log(`Price integral: ${tokensPerFollower}`);

	entryPrice = priceCurve(followers);
	console.log(`Entry summoning rate: ${1/entryPrice} W/f, Price: ${entryPrice} followers per token\n`);

	if(scenario.tributors.length) 
		distribution(tributors, amountToMint);
	console.log('____________________________________________________');
}


joinEvent(joinEvents.a);
joinEvent(joinEvents.z);


