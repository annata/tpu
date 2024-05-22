import {TpuConnection} from "tpu-client";
import {Connection, Transaction, VersionedMessage, VersionedTransaction} from "@solana/web3.js";
import express from "express";
import bs58 from "bs58";

let url = process.env.url;
if (!url) {
    url = "https://api.mainnet-beta.solana.com"
}

const connection = new Connection(
    url
);

let prefix = process.env.prefix;
if (!prefix)
    prefix = '';

const tpuConnection = await TpuConnection.load(url,);

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const app = express()
app.use(express.json())

app.post('/' + prefix, async (req, res) => {
    try {
        const param = req.body;
        if (!"sendTransaction" === param?.method) {
            throw new Error("error method");
        }
        const tx = param?.params[0];
        if (!tx) {
            throw new Error("error tx");
        }
        const encode = param?.params[1]?.encoding;
        let transactionBuf;
        if ("base64" === encode) {
            transactionBuf = new Buffer(tx, 'base64');
        } else {
            transactionBuf = Buffer.from(bs58.decode(encode));
        }
        const transaction = VersionedTransaction.deserialize(transactionBuf);
        sendTwice(transactionBuf);
        const txid = bs58.encode(transaction.signatures[0]);
        const result = txid;
        res.json({result, jsonrpc: '2.0', id: param?.id})
    } catch (e) {
        console.log(e.toString());
        res.json({error: e.toString(),})
    }
});

async function sendTwice(rawTransaction) {
    send(rawTransaction);
    await sleep(2000);
    send(rawTransaction);
    await sleep(2000);
    send(rawTransaction);
}

async function send(rawTransaction) {
    const tpu_addresses = await tpuConnection.tpuClient.leaderTpuService.leaderTpuSockets(tpuConnection.tpuClient.fanoutSlots);
    tpu_addresses.forEach(tpu_address => {
        tpuConnection.tpuClient.sendSocket.send(rawTransaction, parseInt(tpu_address.split(':')[1]), tpu_address.split(':')[0], (error) => {
            if (!error) {
                // console.log("success")
            } else {
                console.error(error);
            }
        });
    });
    // const txid = await tpuConnection.sendRawTransaction(transaction);
    // sendTwice(transaction);
}

app.listen(11011)