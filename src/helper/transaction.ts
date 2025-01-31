import Utils from '../utils'
import Account from './account'
import Bytes from './bytes'
import Hash from './hash'
import Rlp from './rlp'
import Nat from './nat'

const ADD_TO_VALUE = 54

/**
 * sign transaction()
 * @return The signature
 */

export const signTransaction = (
  transactionData: TransactionData,
  privateKey: string,
  chainId: string = '0x01'
) => {
  const hashRlp = hashRlpTx({
    txData: transactionData,
    chainId
  })
  const signature = Account.makeSigner(Nat.toNumber(chainId) * 2 + ADD_TO_VALUE)
  return Account.decodeSignature(signature(hashRlp, privateKey))
}

export const getChainId = (v: string): string =>
  `0x${Math.round((Nat.toNumber(v) - ADD_TO_VALUE) / 2)}`

export const hashRlpTx = (tx: TransactionInput) => Hash.keccak256(rlpTx(tx))

export const rlpTx = (transactionInput: TransactionInput): string => {
  const { txData, chainId } = transactionInput
  const { nonce, to, hashLock, timeLock, value, fee, extraData } = txData
  return Rlp.encode([
    [
      Utils.formatNumberToHex(nonce),
      to,
      Bytes.fromNat(hashLock),
      Utils.formatNumberToHex(timeLock),
      Utils.formatNumberToHex(value),
      Utils.formatNumberToHex(fee),
      Utils.formatUtf8ToHex(extraData)
    ],
    Utils.formatNumberToHex(chainId)
  ])
}

export const rlpSignedTx = (transactionResult: TransactionResult): string => {
  const { txData, witness } = transactionResult
  const { nonce, to, hashLock, timeLock, value, fee, extraData } = txData
  const { r, s, v, hashKey } = witness
  return Rlp.encode([
    [
      Utils.formatNumberToHex(nonce),
      to,
      Bytes.fromNat(hashLock),
      Utils.formatNumberToHex(timeLock),
      Utils.formatNumberToHex(value),
      Utils.formatNumberToHex(fee),
      Utils.formatUtf8ToHex(extraData)
    ],
    [r, s, v, hashKey].map(item =>
      Bytes.fromNat(item ? Nat.cutZero(item) : item)
    )
  ])
}

export const getTransactionFromRaw = (raw: string): TransactionResult => {
  const tx = Rlp.decode(raw) as any[]
  const [
    [nonce, to, hashLock, timeLock, value, fee, extraData],
    [r, s, v, hashKey]
  ] = tx
  return {
    txData: {
      nonce: Utils.hexToNumberString(nonce),
      to,
      hashLock,
      timeLock: Utils.hexToNumber(timeLock),
      value: Utils.hexToNumberString(value),
      fee: Utils.hexToNumberString(fee),
      extraData: Utils.hexToUtf8(extraData)
    },
    witness: {
      r,
      s,
      v,
      hashKey
    }
  }
}

export const getTransactionId = (transactionData: TransactionData): string => {
  const {
    nonce,
    to,
    hashLock,
    timeLock,
    value,
    fee,
    extraData,
    from
  } = transactionData
  return Hash.keccak256(
    Rlp.encode([
      [
        Utils.formatNumberToHex(nonce),
        to,
        Bytes.fromNat(hashLock),
        Utils.formatNumberToHex(timeLock),
        Utils.formatNumberToHex(value),
        Utils.formatNumberToHex(fee),
        Utils.formatUtf8ToHex(extraData)
      ],
      from
    ])
  )
}

export interface Witness {
  r: string
  s: string
  v: string
  hashKey: string
}

export interface TransactionData {
  nonce: string
  value: string
  fee: string
  to: string
  hashLock?: string
  extraData?: string
  timeLock?: number
  from?: string
}

export interface TransactionInput {
  txData: TransactionData
  chainId: string
}

export interface TransactionResult {
  txData: TransactionData
  witness?: Witness
}

export interface SignedTransactionResult {
  raw: string
  hash: string
  tx: TransactionResult
}

export default {
  rlpTx,
  rlpSignedTx,
  hashRlpTx,
  signTransaction,
  getTransactionId,
  getTransactionFromRaw,
  getChainId
}
