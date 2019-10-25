const express = require('express');
const Crypto = require('irisnet-crypto');
const request = require('request');
const http = require('http');
const qs = require('querystring');
const app = express();
const config = require("./config");


let IRISArrayAddress = [],cosmosArrayAddress = [],isIrisPostedSuccess = true,isCosmosPostedSuccess = true;

// let addressInformation = Crypto.getCrypto('iris','testnet').recover('surprise absurd mind pitch soccer foil zone orange type recall butter wisdom cigar situate grab ladder display loyal impose curtain syrup great retire best',"english");
//iris 水龙头地址信息
let irisAddressInformation = Crypto.getCrypto('iris','testnet').recover(`${config.app.irisMnemonicWord}`);
//cosmos 水龙头地址信息
let commosAddressInformation = Crypto.getCrypto('cosmos','testnet').recover(`${config.app.cosmosMnemonicWord}`);
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
	let cosmosUrl = `${config.app.cosmosLcdUrl}/auth/accounts/${commosAddressInformation.address}`;
	request.get(cosmosUrl,(error, response, body) => {
		console.log(error,'cosmosLcd error')
		console.log(cosmosArrayAddress,'cosmosLcd response')
		let parseBody = JSON.parse(body);
		cosmos_account_number = Number(parseBody.result.value.account_number);
		cosmos_sequence = Number(parseBody.result.value.sequence)
	})
}
getIrisAccountNumberAndSequence();
getCosmosAccountNumberAndSequence();
app.get('/api/faucet',(req,res) => {
	if(req.query.chainName === 'iris'){
		IRISArrayAddress.push(req.query);
	}else if(req.query.chainName === 'cosmos') {
		cosmosArrayAddress.push(req.query);
	}
	
	res.send({
		code: 1,
		msg:'success',
	});
	let chainId,from,gas,fees,memo,account_number,sequence,denom,AddressInformationPrivateKey,url;
	var timer = setInterval(() => {
		console.log(IRISArrayAddress.length,"iris address count");
		console.log(cosmosArrayAddress.length,"cosmos address count");
		if(IRISArrayAddress.length !== 0){
			if(isIrisPostedSuccess){
				isIrisPostedSuccess = false;
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
						to: IRISArrayAddress[IRISArrayAddress.length -1].address,
						coins: [
							{
								denom: denom,
								amount: `${config.app.tokenNumber}`
							}
						]
					}
				};
				let builder = Crypto.getBuilder(IRISArrayAddress[IRISArrayAddress.length -1].chainName,'testnet');
				let signTx = builder.buildAndSignTx(tx,AddressInformationPrivateKey);
				let postTx = signTx.GetData();
				postTx.mode='block';
				return request({
					url: url,
					method: "POST",
					json:true,
					body: postTx
				}, (error, response, body) => {
					console.log(error,"postTx error")
					console.log(response,"postTx response")
					isIrisPostedSuccess = true;
					getIrisAccountNumberAndSequence();
					if(error){
						console.log(error)
					}else if (!error && response.statusCode == 200) {
						if(body && body.logs && body.logs[0].success){
							IRISArrayAddress.pop(IRISArrayAddress.length - 1);
						}
					}
				})
			}
		}
		if(cosmosArrayAddress.length !== 0){
			if(isCosmosPostedSuccess){
				isCosmosPostedSuccess = false;
				chainId = `${config.app.cosmosChainId}`;
				from = commosAddressInformation.address;
				gas = `${config.app.gasNumber}`;
				fees = {denom: "uatom", amount: 100000};
				memo = '';
				account_number = cosmos_account_number;
				sequence = cosmos_sequence;
				denom = 'uatom';
				AddressInformationPrivateKey = commosAddressInformation.privateKey;
				url = `${config.app.cosmosLcdUrl}/txs`
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
						to: cosmosArrayAddress[cosmosArrayAddress.length - 1].address,
						coins: [
							{
								denom: denom,
								amount: `${config.app.tokenNumber}`
							}
						]
					}
				};
				let builder = Crypto.getBuilder(cosmosArrayAddress[cosmosArrayAddress.length - 1].chainName,'testnet');
				let signTx = builder.buildAndSignTx(tx,AddressInformationPrivateKey);
				let postTx = signTx.GetData();
				postTx.mode='block';
				return request({
					url: url,
					method: "POST",
					json:true,
					body: postTx
				}, (error, response, body) => {
					console.log(error,"cosmosPostTx error")
					console.log(response,"cosmosPostTx response")
					isCosmosPostedSuccess = true;
					getCosmosAccountNumberAndSequence();
					if(error){
						console.log(error)
					}else if (!error && response.statusCode == 200) {
						if(body && body.logs && body.logs[0].success){
							cosmosArrayAddress.pop(cosmosArrayAddress.length - 1);
						}
					}
				})
			}
		}
		if(IRISArrayAddress.length === 0 && cosmosArrayAddress.length === 0){
			clearInterval(timer)
		}
	},3000)
})
app.listen(3000, () => console.log('Example app listening on port 3000!'));
