import {TpuConnection} from "tpu-client";
import {Connection, Transaction} from "@solana/web3.js";
import express from "express";
import base58 from "bs58";

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
        if (!"sendTransaction" === param.method) {
            throw new Error("error method");
        }
        const tx = param.params[0];
        if (!tx) {
            throw new Error("error tx");
        }
        const encode = param.params[1]?.encoding;
        let transaction;
        if ("base64" === encode) {
            transaction = tx;
        } else {
            transaction = Buffer.from(base58.decode(encode)).toString("base64");
        }
        const result = await send(transaction);
        res.json({result, jsonrpc: '2.0', id: param.id})
    } catch (e) {
        console.log(e.toString());
        res.json({error: e.toString(),})
    }
});

async function send(transaction) {
    const txid = await tpuConnection.sendEncodedTransaction(transaction);
    sendTwice(transaction);
    return txid;
}

async function sendTwice(transaction) {
    await sleep(2000);
    tpuConnection.sendEncodedTransaction(transaction);
    await sleep(2000);
    tpuConnection.sendEncodedTransaction(transaction);
}

app.listen(11011)