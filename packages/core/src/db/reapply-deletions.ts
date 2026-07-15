import { createHash } from 'node:crypto';
import postgres from 'postgres';

const ledgerUrl = process.env.DELETION_LEDGER_URL;
const restoreUrl = process.env.RESTORE_DATABASE_URL;
if (!ledgerUrl || !restoreUrl) {
  throw new Error('DELETION_LEDGER_URL and RESTORE_DATABASE_URL are required.');
}

async function main() {
  const ledger = postgres(ledgerUrl!, { max: 1 });
  const restored = postgres(restoreUrl!, { max: 1 });
  try {
    const receipts = await ledger<{ subjectHash: string }[]>`
      select "subjectHash" from "account_deletion_receipt"
    `;
    const receiptHashes = new Set(receipts.map(receipt => receipt.subjectHash));
    const restoredUsers = await restored<{ id: string }[]>`select id from "user"`;
    const resurrectedIds = restoredUsers
      .filter(user => receiptHashes.has(createHash('sha256').update(user.id).digest('hex')))
      .map(user => user.id);

    if (resurrectedIds.length > 0) {
      await restored.begin(async tx => {
        await tx`delete from "user" where id in ${tx(resurrectedIds)}`;
      });
    }
    console.info(JSON.stringify({
      operation: 'reapply_account_deletions',
      outcome: 'success',
      receipt_count: receiptHashes.size,
      deleted_account_count: resurrectedIds.length,
    }));
  } finally {
    await Promise.all([ledger.end(), restored.end()]);
  }
}

void main();
