import indy from 'indy-sdk';
import { Message } from './types';

export async function sign(wh: WalletHandle, message: Message, field: string, signer: Verkey): Promise<Message> {
  const { [field]: data, ...originalMessage } = message;

  const dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');
  const signatureBuffer = await indy.cryptoSign(wh, signer, dataBuffer);

  const signedMessage = {
    // TypeScript is not able to infer mandatory type and id attribute, so we have to write it specifically.
    '@type': message['@type'],
    '@id': message['@id'],
    ...originalMessage,
    [`${field}~sig`]: {
      '@type': 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/signature/1.0/ed25519Sha512_single',
      signature: signatureBuffer.toString('base64'),
      sig_data: dataBuffer.toString('base64'),
      signers: signer,
    },
  };

  return signedMessage;
}

export async function verify(message: Message, field: string) {
  const { [`${field}~sig`]: data, ...signedMessage } = message;

  const signerVerkey = data.signers;
  const signedData = Buffer.from(data.sig_data, 'base64');
  const signature = Buffer.from(data.signature, 'base64');

  // check signature
  const valid = await indy.cryptoVerify(signerVerkey, signedData, signature);

  if (!valid) {
    throw new Error('Signature is not valid!');
  }

  const originalMessage = {
    // TypeScript is not able to infer mandatory type and id attribute, so we have to write it specifically.
    '@type': message['@type'],
    '@id': message['@id'],
    ...signedMessage,
    [`${field}`]: JSON.parse(signedData.toString('utf-8')),
  };

  return originalMessage;
}