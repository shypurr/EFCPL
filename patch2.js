const fs = require('fs');
function patch(f, pairs) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [from, to] of pairs) {
    if (!s.includes(from)) { console.error('NO MATCH in ' + f + ':\n' + from); process.exit(1); }
    s = s.replace(from, to);
  }
  fs.writeFileSync(f, s);
  console.log(f + ' patched');
}

patch('src/actions/operations.ts', [
  [`import { revalidatePath } from 'next/cache';`,
   `import { revalidatePath } from 'next/cache';
import { syncRawMaterialStatusByCode } from '@/lib/inventory-utils';`],

  // Issuing consumes the operator-selected batch, but low-stock is material-level.
  [`      if (rm.stock < issuedQty) {
        throw new Error(\`Insufficient stock for \${rm.name}. Current batch stock: \${rm.stock}, requested: \${issuedQty}\`);
      }

      const updatedStock = rm.stock - issuedQty;
      const newStatus = updatedStock <= rm.reorderLevel ? 'Low Stock' : 'Active';

      await tx.rawMaterial.update({
        where: { id: rm.id },
        data: {
          stock: updatedStock,
          status: newStatus,
        },
      });`,
   `      if (rm.stock < issuedQty) {
        const materialTotal = await tx.rawMaterial.aggregate({
          where: { code: rm.code },
          _sum: { stock: true },
        });
        throw new Error(
          \`Insufficient stock in batch \${rm.batchNumber} for \${rm.name}. \` +
            \`Batch stock: \${rm.stock} \${rm.unit}, requested: \${issuedQty} \${rm.unit}. \` +
            \`Total across all batches: \${materialTotal._sum.stock ?? 0} \${rm.unit} — issue from another batch if needed.\`
        );
      }

      // Stock leaves the specific batch that was selected, for traceability.
      const updatedStock = rm.stock - issuedQty;

      await tx.rawMaterial.update({
        where: { id: rm.id },
        data: { stock: updatedStock },
      });`],
]);

// Re-sync material status after the transaction commits.
let ops = fs.readFileSync('src/actions/operations.ts', 'utf8');
const anchor = `      return issueLog;`;
if (!ops.includes(anchor)) { console.error('NO MATCH: issueLog return'); process.exit(1); }
ops = ops.replace(anchor, `      // Status is material-level: recompute it for every entry of this code.
      await syncRawMaterialStatusByCode(rm.code, tx);

      return issueLog;`);
fs.writeFileSync('src/actions/operations.ts', ops);
console.log('operations.ts status sync added');
