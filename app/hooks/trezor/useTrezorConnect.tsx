
import { useCallback, useRef, useState, useEffect } from 'react';
import TConnect from './TrezorConnect';

const _ = require('lodash');
const {
  TRANSPORT_EVENT,
  DEVICE_EVENT,
  TRANSPORT,
  DEVICE,
} = require('@trezor/connect');

export default function useTrezorConnect() {
  let TC : any = useRef(null);
  const isClient = typeof window !== 'undefined';
  const [hydrated, setHydrated] = useState(false);
  const [connected, setConnected] = useState(false);
  let TrezorConnect; 
  let tc;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {

    if(!TC.current && isClient) {
        console.log(`TC.current ${TC.current}`);
        tc = new TConnect();
        tc.init();
        TrezorConnect = tc.getTrezorConnect();
        TC.current = TrezorConnect;

        // Listen to TRANSPORT_EVENT
        TrezorConnect.on(TRANSPORT_EVENT, event => {
            //sender.send('trezor-connect', event.type);
            console.log(`Receiving TRANSPORT_EVENT ${JSON.stringify(event)}`);
            if (event.type === TRANSPORT.ERROR) {
                // trezor-bridge not installed
                //sender.send('trezor-connect', 'Transport is missing');
            }
            if (event.type === TRANSPORT.START) {
                //sender.send('trezor-connect', event);
            }
            });
        
            // Listen to DEVICE_EVENT
            TrezorConnect.on(DEVICE_EVENT, event => {
                //sender.send('trezor-connect', event.type);
                console.log(`Receiving DEVICE_EVENT ${JSON.stringify(event)}`);
    
                if(event.type === DEVICE.CONNECT){
                    //dispatch(updateTrezorStatus({connected : true}));
                    //setConnected(true);
                }
                else if(event.type === DEVICE.DISCONNECT){
                    //dispatch(updateTrezorStatus({connected : false}));
                    //setConnected(false);
                }
                // not obvious event
                if (event.type === DEVICE.CONNECT_UNACQUIRED) {
                    // connected device is unknown or busy
                    // most common reasons is that either device is currently used somewhere else
                    // or app refreshed during call and trezor-bridge didn't managed to release the session
                    // render "Acquire device" button and after click try to fetch device features using:
                    // TrezorConnect.getFeatures();
                }
            });
    
    
    
        console.log(`Calling trezor connect on TrezorConnect 1`);
    }
  }, [hydrated]);

  const sendTransactionSync =  useCallback( async (coin: string, fromAccount: any, toAddress: string, toAmount : string) => {
    let response: any = await TC.current['composeTransaction']({
          path: fromAccount.path,
          showOnTrezor: true,
          coin: coin,
          useEmptyPassphrase: true,
          outputs: [
              { amount: toAmount, address: toAddress }
          ],
          push: false,
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);

  },[]);

  const getAddressSync =  useCallback( async (path : string, coin: string) => {
    let response: any = await TC.current['getAddress']({
        bundle: [
            { path, showOnTrezor: false, coin },
        ],
      }
    );

    console.log(`Response received ${JSON.stringify(response)}`);
    return response;  
  },[]);

  return {
    TConnect: tc,
    sendTransactionSync,
    getAddressSync,
    connected
  };
}
