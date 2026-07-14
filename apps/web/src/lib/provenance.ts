import type { provenance } from '@pathfinder/core';
import { sha256 } from './integrity';

type ProvenanceRow = typeof provenance.$inferSelect;

export function provenanceIntegrityHash(
  record: Pick<
    ProvenanceRow,
    | 'userId'
    | 'factId'
    | 'sourceType'
    | 'sourceReference'
    | 'documentId'
    | 'pageReference'
    | 'sectionReference'
    | 'ruleId'
    | 'extractionMetadata'
    | 'retentionPolicy'
    | 'derivedFromFactId'
  >
) {
  return sha256({
    userId: record.userId,
    factId: record.factId,
    sourceType: record.sourceType,
    sourceReference: record.sourceReference,
    documentId: record.documentId,
    pageReference: record.pageReference,
    sectionReference: record.sectionReference,
    ruleId: record.ruleId,
    extractionMetadata: record.extractionMetadata,
    retentionPolicy: record.retentionPolicy,
    derivedFromFactId: record.derivedFromFactId,
  });
}
