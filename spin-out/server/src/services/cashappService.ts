import crypto from 'crypto';
import { CASHAPP_CASHTAG, COIN_PACKAGES } from '../../../shared/src/constants';
import { recordTransaction } from './transactionService';
import { creditBalance } from './userService';

export const createPaymentRequest = (userId: string, packageId: string, amount: number) => ({
  paymentUrl: `https://cash.app/${CASHAPP_CASHTAG}/${amount.toFixed(2)}`,
  requestId: crypto.randomUUID(),
  metadata: { userId, packageId }
});

export const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

export const processPayment = async (userId: string, packageId: string) => {
  const coinPackage = COIN_PACKAGES.find((pkg) => pkg.id === packageId);
  if (!coinPackage) throw new Error('Invalid coin package.');
  const user = await creditBalance(userId, coinPackage.sweepsCoins, coinPackage.goldCoins);
  await recordTransaction(userId, 'purchase', coinPackage.price, 'GC', {
    packageId,
    goldCoins: coinPackage.goldCoins,
    sweepsCoins: coinPackage.sweepsCoins
  });
  return user;
};
