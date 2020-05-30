let none = [
	{
		amount: 0,
		followers: 1,
		balance: 50,
	},
]

let whale = [
	{
		amount: 50,
		followers: 100,
		balance: 50,
	},
	{
		amount: 5,
		followers: 300,
		balance: 15,
	},
	{
		amount: 55,
		followers: 57,
		balance: 50,
	},
	{
		amount: 100,
		followers: 143,
		balance: 105,
	},
	{
		amount: 500,
		followers: 70,
		balance: 1500,
	},
	{
		amount: 1000,
		followers: 50000,
		balance: 1500,
	},
];

let whaleBots = [
	{
		amount: 50,
		followers: 1,
		balance: 50,
	},
	{
		amount: 5,
		followers: 30,
		balance: 15,
	},
	{
		amount: 55,
		followers: 1,
		balance: 50,
	},
	{
		amount: 100,
		followers: 5,
		balance: 105,
	},
	{
		amount: 500,
		followers: 10,
		balance: 1500,
	},
	{
		amount: 1000,
		followers: 50000,
		balance: 1500,
	},
];

let whales = [
	{
		amount: 100,
		followers: 30000,
		balance: 1000,
	},
	{
		amount: 10,
		followers: 50000,
		balance: 20,
	},
	{
		amount: 1000,
		followers: 500000,
		balance: 1500,
	},
];

let average = [
	{
		amount: 50,
		followers: 240,
		balance: 150,
	},
	{
		amount: 502,
		followers: 140,
		balance: 1000,
	},
	{
		amount: 5,
		followers: 112,
		balance: 15,
	},
	{
		amount: 1000,
		followers: 95,
		balance: 1500,
	},
	{
		amount: 100,
		followers: 5,
		balance: 105,
	},
	{
		amount: 500,
		followers: 170,
		balance: 1500,
	},
	{
		amount: 50,
		followers: 160,
		balance: 50,
	},
];

let tributors = [
	{
		amount: 50,
		followers: 2000,
		balance: 150,
	},
	{
		amount: 502,
		followers: 200,
		balance: 1000,
	},
	{
		amount: 5,
		followers: 30,
		balance: 15,
	},
	{
		amount: 1000,
		followers: 50000,
		balance: 1500,
	},
	{
		amount: 100,
		followers: 5,
		balance: 105,
	},
	{
		amount: 500,
		followers: 90,
		balance: 1500,
	},
	{
		amount: 50,
		followers: 1,
		balance: 50,
	},
];

let user = {
		amount: 1000,
		followers: 100,
		balance: 50,
}

let symmetric = []
for(let i = 0; i < 180; i++) {
	symmetric.push({...user});
}

let scale = [];
for(let i = 0; i < 10; i++) {
	tributors.forEach(t => {
		scale.push({...t});
	});
	average.forEach(t => {
		scale.push({...t});
	});
	//scale = [...scale, ...tributors];
}

module.exports = {
	even: tributors,
	symmetric,
	average,
	whale,
	whaleBots,
	whales,
	scale,
}
