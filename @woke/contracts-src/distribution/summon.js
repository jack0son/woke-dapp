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
	const w = 9;
	let rows = [`${'i'.padEnd(w/2)}${'amount'.padEnd(w)}${'balance'.padEnd(w)}${'followers'.padEnd(w)}\n`];
	rows.push('\n'.padStart(rows[0].length-1, '-'));
	tributors.forEach((t,i) => {
		rows.push(`${i.toString().padEnd(w/2)}${t.amount.toString().padEnd(w)}${t.balance.toString().padEnd(w)}${t.followers.toString().padEnd(w)}\n`);
	});
	return rows;
}

const joinEvents = {
	a: {
		followers: 10000,
		currentSuppy: 100e3,
		tributors: tributors.even,
	}
};

// Curve params
a = 500;		// (max price)/2
b = 42e6;	// linear price inflection
c = 7e9;		// curve steepness

function priceIntegral(currentSupply, amount) {
	const s = currentSupply
	const k = amount;
	let temp = Math.sqrt(c+(Math.pow(-b+k+s,2)))
	console.log(temp);

	let temp3 = Math.sqrt(c+(Math.pow(b-s,2)));
	console.log(temp3);

	let temp4 = k - temp3 + temp;
	console.log(temp4);

	let costInFollowers = a * temp4;
	console.log(`Cost in followers: ${costInFollowers}`);
	return costInFollowers;
}

// @currentSupply:	tokens in existence
// @followers:			num followers of new user (minting 'fee')
// returns: amount tokens to mint
function tokenPriceCurve(currentSupply) {
	const x = currentSupply;
	let temp = (x-b);
	console.log(temp);
	let temp2 = Math.sqrt(Math.pow(x-b,2)+c);
	console.log(temp2);
	let temp3 = (temp/temp2) + 1;
	console.log(temp3);
	let temp4 = temp3*a;
	console.log(temp4);

	const startingPrice = a*(((x-b)/Math.sqrt(c+Math.pow(x-b,2)))+1);
	//const startingPrice = a*(((x+b)/Math.sqrt(c+((x+b)^2)))-1);
	return startingPrice;
}

function claimUser(claimer) {
}

// Generosity weighted influence scale
function calcMeansScale(tributors){
	let mu = 0;
	let z = 0;
	tributors.forEach((t, i) => {
		//t.c = t.amount/(t.balance + Math.sqrt(t.balance * t.followers));
		//t.c = t.amount/(t.followers + Math.sqrt(t.balance * t.followers));
		//t.c = t.amount/(t.balance * t.followers)
		t.c = t.followers > y.length - 1 ? y[y.length - 1] : y[t.followers];
		//t.c = t.c / Math.cbrt(t.balance);
		//t.c *= t.balance;
		mu += t.c;
		z += t.amount;
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

function calcBonuses(tributors, z) {
	let bonuses = [];
	tributors.forEach((t, i) => {
		let b = Math.floor(z*t.r); //Math.sqrt(t.balance*t.followers)
		console.log(`${i}, b: ${b.toString().padEnd(20,' ')} ${(b*100/z).toFixed(5)}%`);
		bonuses.push(b);
		t.b = b;
	});
	let smallest = tributors.reduce((min, t) => t.b < min.b ? t : min);
	let smallIdx = tributors.indexOf(smallest)
	smallest.b = z - bonuses.reduce(getSum, 0);
	console.log(`Smallest: ${smallIdx}, gets dust: ${smallest.b} W`);
	bonuses[smallIdx] = smallest.b;

	return bonuses;
}

function getSum(total, num) {
	return total + num;
}

function joinEvent(scenario) {
	const { tributors, supply, followers } = scenario;

	let amountToMint = priceIntegral(0, 1);

	let entryPrice = tokenPriceCurve(100);
	console.log(`Entry price ${entryPrice} followers per token`);
	console.log(`Summoning rate ${1/entryPrice} W/f`);

	entryPrice = tokenPriceCurve(followers);
	console.log(`Entry price ${entryPrice} followers per token`);
	console.log(`Summoning rate ${1/entryPrice} W/f`);


	let T = tributors;
	console.log(getTributeTable(T).reduce(getSum, ''));

	const { mu, z } = calcMeansScale(T);
	const ratios = calcBonusRatios(T, mu);
	let one = 0;
	ratios.forEach(r => one += r);
	console.log(`One: ${one}\n`);

	const bonuses = calcBonuses(T, z);
	let totalBonuses = bonuses.reduce(getSum, 0);
	console.log(`Total bonuses: ${totalBonuses} W`);
}

joinEvent(joinEvents.a);


