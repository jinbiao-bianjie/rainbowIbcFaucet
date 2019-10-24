const express = require('express')
const Crypto = require('irisnet-crypto')
const request = require('request')
const http = require('http');
const qs = require('querystring');
const app = express()
const config = require("./config")




// let addressInformation = Crypto.getCrypto('iris','testnet').recover('surprise absurd mind pitch soccer foil zone orange type recall butter wisdom cigar situate grab ladder display loyal impose curtain syrup great retire best',"english");
//iris 水龙头地址信息
let irisAddressInformation = Crypto.getCrypto('iris','testnet').recover(`${config.app.irisMnemonicWord}`);
//cosmos 水龙头地址信息
let commosAddressInformation = Crypto.getCrypto('cosmos','testnet').recover(`${config.app.cosmosMnemonicWord}`);

let iris_account_number,iris_sequence,cosmos_account_number,cosmos_sequence;
function getAccountNumberaAndSequence(){
	let irisUrl = `${config.app.irisLcdUrl}/auth/accounts/${irisAddressInformation.address}`;
	let cosmosUrl = `${config.app.cosmosLcdUrl}/auth/accounts/${commosAddressInformation.address}`;
	request.get(irisUrl,(error, response, body) => {
			let parseBody = JSON.parse(body)
			iris_account_number = Number(parseBody.result.value.account_number)
			iris_sequence = Number(parseBody.result.value.sequence)
		})
	request.get(cosmosUrl,(error, response, body) => {
		let parseBody = JSON.parse(body)
		cosmos_account_number = Number(parseBody.result.value.account_number)
		cosmos_sequence = Number(parseBody.result.value.sequence)
	})
}
getAccountNumberaAndSequence()
app.get('/api/faucet',(req,res) => {
	let chainId,from,gas,fees,memo,account_number,sequence,denom,AddressInformationPrivateKey,url;
	if(req.query.chainName === "iris"){
		chainId = `${config.app.irisChainId}`,
		from = irisAddressInformation.address,
		gas = 250000,
		fees = {denom: "uiris", amount: 50000}
		memo = '';
		account_number = iris_account_number
		sequence = iris_sequence
		denom = 'uiris'
		AddressInformationPrivateKey = irisAddressInformation.privateKey
		url = `${config.app.irisLcdUrl}/txs`
	}else if(req.query.chainName === "cosmos"){
		chainId = `${config.app.cosmosChainId}`,
		from = commosAddressInformation.address,
		gas = `${config.app.gasNumber}`,
		fees = {denom: "uatom", amount: 50000}
		memo = '';
		account_number = cosmos_account_number
		sequence = cosmos_sequence
		denom = 'uatom'
		AddressInformationPrivateKey = commosAddressInformation.privateKey
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
			to: req.query.address,
			coins: [
				{
					denom: denom,
					amount: `${config.app.tokenNumber}`
				}
			]
		}
	};
	let builder = Crypto.getBuilder(req.query.chainName,'testnet');
	let signTx = builder.buildAndSignTx(tx,AddressInformationPrivateKey);
	let postTx = signTx.GetData();
	postTx.mode='block'
	request({
		url: url,
		method: "POST",
		json:true,
		body: postTx
	}, (error, response, body) => {
		if (!error && response.statusCode == 200) {
			getAccountNumberaAndSequence()
			if(body && body.logs && body.logs[0].success){
				res.send({
					code: 1,
					msg:'success'
				})
				getAccountNumberaAndSequence()
			}else {
				res.send({
					code: 0,
					msg:'failed'
				})
				getAccountNumberaAndSequence()
			}
		}
	})

})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
