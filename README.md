# rainbowIbcFaucet
# step
#1 npm install

#2 npm运行标签+参数

#参数顺序(参数顺序不能改变)
irisLcdUrl,cosmosLcdUrl,irisChainId,cosmosChainId,
tokenNumber,gasNumber,"irisMnemonicWord","cosmosMnemonicWord"

#例子
"irisLcdUrl": "http://192.0.0.0:1001",
"cosmosLcdUrl": "http://192.0.0.1:1002",
"irisChainId": "iris-ibc",
"cosmosChainId": "cosmos-ibc",
"tokenNumber": 1000000
"gasNumber": 250000
"irisMnemonicWord": "iris24个助记词"
"cosmosMnemonicWord": "cosmos24个助记词"

#命令行：
npm run tag http://192.0.0.0:1001,http://192.0.0.1:1002,
iris-ibc,cosmos-ibc,1000000,250000,"iris24个助记词","cosmos24个助记词"

#3 npm run dev

使用
http://192.0.0.2:端口/api/faucet?address=对应链的地址&chainName=对应链的名称
