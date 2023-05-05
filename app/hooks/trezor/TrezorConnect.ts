import TrezorConnect from '@trezor/connect-web';
import { BigNumber } from 'bignumber.js';
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import transformTrezorTransaction from '@trezor/connect-plugin-stellar';
import {Networks, Memo} from 'stellar-sdk';

import { Transaction} from '@ethereumjs/tx';
var StellarSdk = require('stellar-sdk');

const _ = require('lodash');
const {
  UI,
  UI_EVENT,
} = require('@trezor/connect');


export const signTransactionSync = async (coin: string, fromAccount: any, toAddress: string, toAmount : string) => {
    //@ts-ignore
    let response: any = await TrezorConnect['composeTransaction']({
          path: fromAccount.path,
          //decriptor: 'xpub6H2egAkcZTeGXJ3fsBpWn9FfrKpA8WMBT9iFPa3DAfjkXrg2StqyqewzMbt9Ci2optzv5TNjYYe56V7ktk7fty1JaBNUTmVjd3A4qWXVnqr',
          //account: fromAccount,  
          showOnTrezor: true,
          coin: coin,
          useEmptyPassphrase: true,
          outputs: [
              { amount: toAmount, address: toAddress }
          ],
          push: false,
         // defaultAccountType: 'segwit'
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);
    return response;  
};

/*
export const getAccountSync = async (coin: string, fromAccount: any, toAddress: string, toAmount : string) => {
    //@ts-ignore
    let response: any = await TrezorConnect['getAccountInfo']({
          path: fromAccount.path,
          showOnTrezor: true,
          //decriptor: 'xpub6H2egAkcZTeGXJ3fsBpWn9FfrKpA8WMBT9iFPa3DAfjkXrg2StqyqewzMbt9Ci2optzv5TNjYYe56V7ktk7fty1JaBNUTmVjd3A4qWXVnqr',
          coin: coin,
          useEmptyPassphrase: true,
            details: 'txs',
            //defaultAccountType: 'segwit'
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);
    return response;  
};
*/
export const signStellarTransactionSync = async (fromAccount: any, recipient : any , amount: any , tag: any) => {
    var server = new StellarSdk.Server('https://horizon.stellar.org');

    const account = await server.loadAccount(fromAccount.source);
    const fee = 100000;
    let memo;
    if(tag)
    {
      memo = Memo.text(tag);
    }
    else{
      memo = Memo.none();
    }

    const transaction = new StellarSdk.TransactionBuilder(account, {
      memo,
      fee,
      networkPassphrase: Networks.PUBLIC
    })
    // Add a payment operation to the transaction
        .addOperation(StellarSdk.Operation.payment({
          destination: recipient,
          // The term native asset refers to lumens
          asset: StellarSdk.Asset.native(),
          // Specify 350.1234567 lumens. Lumens are divisible to seven digits past
          // the decimal. They are represented in JS Stellar SDK in string format
          // to avoid errors from the use of the JavaScript Number data structure.
          amount: amount.toFixed(),
        }))
        // Make this transaction valid for the next 30 seconds only
        .setTimeout(120)
        // Uncomment to add a memo (https://www.stellar.org/developers/learn/concepts/transactions.html)
        // .addMemo(StellarSdk.Memo.text('Hello world!'))
        .build();
    const params: any = transformTrezorTransaction(fromAccount.path, transaction);
    params['useEmptyPassphrase'] = true;
    //@ts-ignore
    let response: any = await TrezorConnect['stellarSignTransaction'](params);
    let signature;    
    if (response.success) {
        signature = Buffer.from(response.payload.signature, "hex").toString("base64");
        transaction.addSignature(fromAccount.source, signature);
    }
    console.log(`Response received ${JSON.stringify(response)}`);
    return transaction.toXDR();  
};

export const signRippleTransactionSync = async (fromAccount: any, unsignedTx : any) => {
    let txJSON = JSON.parse(unsignedTx.txJSON);
    let instructions = unsignedTx.instructions;
    
    //@ts-ignore
    let response: any = await TrezorConnect['rippleSignTransaction']({
          path: fromAccount.path,
          useEmptyPassphrase: true,
          transaction: {
             fee: txJSON.Fee,
             sequence: instructions.sequence,
             payment : {
                amount : txJSON.Amount,
                destination: txJSON.Destination,
                destinationTag: txJSON.DestinationTag
             },
             flags: txJSON.Flags
          } 
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);
    return response;  
};

export const signEthereumTransactionSync = async (fromAccount: any, toAddress: string, unsignedTx : any , nonce: any) => {
    let rawTx = {
        to: toAddress,
        value: `0x${BigNumber(unsignedTx.amount).toString(16)}`,
        chainId: 1,
        gasPrice: !unsignedTx.gasPrice ? '0x00' : `0x${BigNumber(unsignedTx.gasPrice).toString(16)}`,
        gasLimit: `0x${BigNumber(unsignedTx.gasLimit).toString(16)}`, nonce
    };
    //@ts-ignore
    let response: any = await TrezorConnect['ethereumSignTransaction']({
        path: fromAccount.path,
        useEmptyPassphrase: true,
        transaction: rawTx
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);

    let tx = {
        ...rawTx,
        r: response.payload.r,
        s: response.payload.s,
        v: response.payload.v,
    };

    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Istanbul })
    //@ts-ignore
    const ethTx = Transaction.fromTxData(tx, { common })
    response.payload.serializedTx = `0x${ethTx.serialize().toString('hex')}`;
    return response;  
};

export const signERC20TransactionSync = async (fromAccount: any, toAddress: string, unsignedTx : any , nonce: any) => {
    let rawTx = {
        to: toAddress,
        value: `0x0`,
        chainId: 1,
        data: unsignedTx.data,
        gasPrice: !unsignedTx.gasPrice ? '0x00' : `0x${BigNumber(unsignedTx.gasPrice).toString(16)}`,
        gasLimit: `0x${BigNumber(unsignedTx.gasLimit).toString(16)}`, nonce
    };
    //@ts-ignore
    let response: any = await TrezorConnect['ethereumSignTransaction']({
        path: fromAccount.path,
        useEmptyPassphrase: true,
        transaction: rawTx
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);

    let tx = {
        ...rawTx,
        r: response.payload.r,
        s: response.payload.s,
        v: response.payload.v,
    };

    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Istanbul })
    //@ts-ignore
    const ethTx = Transaction.fromTxData(tx, { common })
    response.payload.serializedTx = `0x${ethTx.serialize().toString('hex')}`;
    return response;  
};

export const getAddressSync =  async (path : string, coin: string) => {
    let response: any = await TrezorConnect['getAddress']({
        bundle: [
            { path, showOnTrezor: false, coin },
        ],
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);
    return response;  
};

export default class TConnect {
    connected: boolean;
    static intialized = false; 
    static TrezorConnect = TrezorConnect
    static mintWalletAccounts = [];

    constructor() {
        this.connected = false;
    }

    init = () => {
        if(!TConnect.intialized){
            TConnect.intialized = true;
            // Listen to UI_EVENT
            // most common requests
            TrezorConnect.on(UI_EVENT, event => {
                console.log(`Sending UI_EVENT ${JSON.stringify(event)}`);
                //sender.send('trezor-connect', event);
    
                if (event.type === UI.REQUEST_PIN) {
                    // example how to respond to pin request
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: '1234' });
                }
    
                if (event.type === UI.REQUEST_PASSPHRASE) {
                        TrezorConnect.uiResponse({
                            type: UI.RECEIVE_PASSPHRASE,
                            payload: { passphraseOnDevice: true, value: '' },
                        });
                }
    
                
                if (event.type === UI.SELECT_DEVICE) {
                    // @ts-ignore
                    if (event.payload.devices.length > 0) {
                        // more then one device connected
                        // example how to respond to select device
                        TrezorConnect.uiResponse({
                            type: UI.RECEIVE_DEVICE,
                            // @ts-ignore
                            payload: event.payload.devices[0],
                        });
                    } else {
                        // no devices connected, waiting for connection
                    }
                }
    
                if (event.type === UI.SELECT_ACCOUNT) {
                    // @ts-ignore
                    if (event.payload?.accounts?.length > 0) {
                        // more then one device connected
                        // example how to respond to select device
                        // check if any of the account has balance > 0
                        // @ts-ignore
                        let accounts = event.payload?.accounts;
                        let i=0;
                        let isAccountMatched = false;
                        for(let account of accounts) {
                            if (account.balance) { 
                                console.log(`Printing Account details ${JSON.stringify(account)}`);
                                let balance = account.balance.split(' ')[0];
                               let balanceNum = parseFloat(balance);
                               if(balanceNum > 0){
                                    //match descriptors with store.walletAccount
                                    for(let mintWalletAccount of TConnect.mintWalletAccounts){
                                        /*if(account.descriptor === mintWalletAccount.pubKey || account.legacyXpub === mintWalletAccount.pubKey){
                                            //this is matched 
                                            isAccountMatched = true;
                                            TrezorConnect.uiResponse({
                                                type: UI.RECEIVE_ACCOUNT,
                                                payload: i,
                                            });
                                            break;
                                        } */
                                    }    
                               } 
                            }
                            if(isAccountMatched){
                                break;
                            }
                            i++;
                        }
                    } else {
                        // no devices connected, waiting for connection
                    }
                }
                else if(event.type === UI.SELECT_FEE){
                    // Using the _.delay() method
                    // with its parameter
                    _.delay(function(_event: any) {
                        console.log('Calling seelct fee ');
                        if (_event.payload?.feeLevels ) {
                            TrezorConnect.uiResponse({
                                type: UI.RECEIVE_FEE,
                                payload: {type : 'send' , value: 'normal'},
                            });
                        }
                        }, 100, event);
    
                }
    
                // getAddress from device which is not backed up
                // there is a high risk of coin loss at this point
                // warn user about it
                if (event.type === UI.REQUEST_CONFIRMATION) {
                    // payload: true - user decides to continue anyway
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_CONFIRMATION, payload: true });
                }
            });

            TrezorConnect.init({
                lazyLoad: false, // this param will prevent iframe injection until TrezorConnect.method will be called
                popup: false, // render your own UI
                webusb: false, // webusb is not supported in electron
                debug: true, // see what's going on inside connect
                manifest: {
                    email: 'developer@xyz.com',
                    appUrl: 'http://your.application.com',
                },
            });
        }        
    }

    getTrezorConnect = () =>{
        return TrezorConnect;
    }
}