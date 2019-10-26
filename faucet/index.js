const express = require('express');
const Crypto = require('irisnet-crypto');
const request = require('request');
const http = require('http');
const qs = require('querystring');
const app = express();
const config = require("./config");

const irisFaucetAccount = Crypto.getCrypto('iris',config.app.network).recover(`${config.app.irisMnemonicWord}`);
const cosmosFaucetAccount = Crypto.getCrypto('cosmos',config.app.network).recover(`${config.app.cosmosMnemonicWord}`);
const [irisAddr, irisPk] = [irisFaucetAccount.address, irisFaucetAccount.privateKey];
const [cosmosAddr, cosmosPk] = [cosmosFaucetAccount.address, cosmosFaucetAccount.privateKey];
const reqQueue = [];

app.get('/api/faucet',(req,res) => {
	reqQueue.push(req);
	if(reqQueue.length === 1){
		syncExecuteQueue(reqQueue)
	}
	res.send({
		code: 1,
		msg:'success',
	});
});

function syncExecuteQueue (reqList){
	if(Array.isArray(reqList) && reqList.length > 0){
		getSequence({
			req:reqList[0].req,
			reqList,
		})
	}
}

function getSequence({req,reqList}){
	const url = `${req.query.chainName === 'iris' ? config.app.irisLcdUrl : config.app.cosmosLcdUrl}/auth/accounts/${req.query.chainName === 'iris' ? irisAddr : cosmosAddr}`;
	request.get(url,(error, response, body) => {
		if(error){
			console.log(error,'irisLcd error')
		}else{
			let parseBody = JSON.parse(body);
			PostTx({req, reqList, account_number: Number(parseBody.result.value.account_number), sequence: Number(parseBody.result.value.sequence)});
		}
		
		
	});
}

function PostTx({req, reqList, account_number, sequence}){
	let tx = {
		chain_id: req.query.chainName === 'iris' ? config.app.irisChainId : config.app.cosmosChainId,
		from: req.query.chainName === 'iris' ? irisAddr : cosmosAddr,
		account_number: account_number,
		sequence: sequence,
		fees: req.query.chainName === 'iris' ? {denom: "uiris", amount: 100000} : {denom: "uatom", amount: 100000},
		gas: config.app.gasNumber,
		memo:'',
		type: 'transfer',
		msg: {
			to: req.query.address,
			coins: [
				{
					denom: req.query.chainName === 'iris' ? 'uiris' : 'uatom',
					amount: config.app.tokenNumber,
				}
			]
		}
	};
	let builder = Crypto.getBuilder(req.query.chainName,config.app.network);
	let signTx = builder.buildAndSignTx(tx,req.query.chainName === 'iris' ? irisPk : cosmosPk);
	let postTx = signTx.GetData();
	postTx.mode='block';
	const url = `${req.query.chainName === 'iris' ? config.app.irisLcdUrl : config.app.cosmosLcdUrl}/txs`;
	return request({
		url: url,
		method: "POST",
		json:true,
		body: postTx
	}, (error, response, body) => {
		reqList.shift();
		syncExecuteQueue(reqList);
		if(error){
			throw Error(error);
			throw Error(response);
		}else{
			throw Error(response);
		}
	})
}

app.listen(3000, () => console.log('Example app listening on port 3000!'));
