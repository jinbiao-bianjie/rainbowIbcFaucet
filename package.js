#!/usr/bin/env node

let fs = require('fs');
let program = require('commander');

function list (val) {
	return val.split(',')
}
program
.option("-p, <items>","config list" ,list)
.parse(process.argv);

replaceEnv([
		"./config.json",
	],
	{
		"irisLcdUrl": program.P[0],
		"cosmosLcdUrl": program.P[1],
		"irisChainId": program.P[2],
		"cosmosChainId": program.P[3],
		"tokenNumber": program.P[4],
		"gasNumber": program.P[5],
		"irisMnemonicWord": program.P[6],
		"cosmosMnemonicWord": program.P[7]
	}
);


function replaceEnv(files, params) {
	files.forEach(function(file,index){
		let result = fs.readFileSync(file).toString();
		for (let key in params) {
			let r = "\\${"+key+"}";
			result = result.replace(new RegExp(r,"g"), params[key]);
		}
		
		fs.writeFileSync(file, result)
	});
}
