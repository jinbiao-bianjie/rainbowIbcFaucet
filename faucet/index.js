const express = require('express');
const Crypto = require('irisnet-crypto');
const request = require('request');
const http = require('http');
const qs = require('querystring');
const app = express();
const config = require("./config");

let allArrayAddress = [],isPostedSuccess = true;
//iris 水龙头地址信息
let irisAddressInformation = Crypto.getCrypto('iris',config.app.network).recover(`${config.app.irisMnemonicWord}`);
//cosmos 水龙头地址信息
let cosmosAddressInformation = Crypto.getCrypto('cosmos',config.app.network).recover(`${config.app.cosmosMnemonicWord}`);
let iris_account_number,iris_sequence,cosmos_account_number,cosmos_sequence;
function getIrisAccountNumberAndSequence () {
	let irisUrl = `${config.app.irisLcdUrl}/auth/accounts/${irisAddressInformation.address}`;
	request.get(irisUrl,(error, response, body) => {
		console.log(error,'irisLcd error')
		console.log(response,'irisLcd  response')
		let parseBody = JSON.parse(body);
		iris_account_number = Number(parseBody.result.value.account_number);
		iris_sequence = Number(parseBody.result.value.sequence)
	});
}
function getCosmosAccountNumberAndSequence(){
	let cosmosUrl = `${config.app.cosmosLcdUrl}/auth/accounts/${cosmosAddressInformation.address}`;
	request.get(cosmosUrl,(error, response, body) => {
		console.log(error,'cosmosLcd error')
		let parseBody = JSON.parse(body);
		cosmos_account_number = Number(parseBody.result.value.account_number);
		cosmos_sequence = Number(parseBody.result.value.sequence)
	})
}
getIrisAccountNumberAndSequence();
getCosmosAccountNumberAndSequence();
setInterval(() => {
	console.log(allArrayAddress.length,'address count');
	if(allArrayAddress.length !== 0){
		if(isPostedSuccess){
			let chainId,from,gas,fees,memo,account_number,sequence,denom,AddressInformationPrivateKey,url;
			isPostedSuccess = false;
			if(allArrayAddress[allArrayAddress.length -1].chainName === 'iris'){
				chainId = `${config.app.irisChainId}`;
				from = irisAddressInformation.address;
				gas = `${config.app.gasNumber}`;
				fees = {denom: "uiris", amount: 100000};
				memo = '';
				account_number = iris_account_number;
				sequence = iris_sequence;
				denom = 'uiris';
				AddressInformationPrivateKey = irisAddressInformation.privateKey;
				url = `${config.app.irisLcdUrl}/txs`
			}else if(allArrayAddress[allArrayAddress.length -1].chainName === 'cosmos'){
				chainId = `${config.app.cosmosChainId}`;
				from = cosmosAddressInformation.address;
				gas = `${config.app.gasNumber}`;
				fees = {denom: "uatom", amount: 100000};
				memo = '';
				account_number = cosmos_account_number;
				sequence = cosmos_sequence;
				denom = 'uatom';
				AddressInformationPrivateKey = cosmosAddressInformation.privateKey;
				url = `${config.app.cosmosLcdUrl}/txs`
			}
			let tx = {
				chain_id: chainId,
				from: from,
				account_number: account_number,
				sequence: sequence,
				fees: fees,
				gas: gas,
				memo:'',
				type: 'transfer',
				msg: {
					to: allArrayAddress[allArrayAddress.length - 1].address,
					coins: [
						{
							denom: denom,
							amount: `${config.app.tokenNumber}`
						}
					]
				}
			};
			let builder = Crypto.getBuilder(allArrayAddress[allArrayAddress.length -1].chainName,config.app.network);
			let signTx = builder.buildAndSignTx(tx,AddressInformationPrivateKey);
			let postTx = signTx.GetData();
			postTx.mode='block';
			return request({
				url: url,
				method: "POST",
				json:true,
				body: postTx
			}, (error, response, body) => {
				// console.log(response.request.body,"postTx response")
				isPostedSuccess = true;
				getIrisAccountNumberAndSequence();
				getCosmosAccountNumberAndSequence();
				if(error){
					console.log(error)
				}else if (!error && response.statusCode == 200) {
					// console.log(response.query.body,"post Tx response query body")
					if(body && body.logs && body.logs[0].success){
						allArrayAddress.pop(allArrayAddress.length - 1);
					}
				}
			})
		}
	}
},3000)
app.get('/api/faucet',(req,res) => {
	allArrayAddress.unshift(req.query)
	res.send({
		code: 1,
		msg:'success',
	});
})

app.listen(3000, () => console.log('Example app listening on port 3000!'));
