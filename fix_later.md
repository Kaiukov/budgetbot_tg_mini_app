• Findings

  - source_account_id / destination_account_id are captured in the transfer form (src/machines/types.ts:249-257) but are never sent to
    Firefly: the payload built in TransferConfirmScreen only passes account names (exit_account, entry_account) and the API type lacks any
    id fields (src/components/TransferConfirmScreen.tsx:93-105, src/services/sync/types.ts:77-89). If the backend expects IDs, transfers
    are currently ambiguous and the required variables are effectively dropped.
  - exchange_rate is stored in the form and enforced for validation (src/machines/types.ts:259-263, src/machines/actions.ts:646-650) but
    it is omitted from the transaction payload (TransferConfirmScreen payload lines 93-105 and TransferTransactionData lines 77-89). The
    recorded transfer therefore cannot reproduce the rate that produced destination_amount, leaving the variable unfulfilled.
  - The “notes” template you described is generated in the UI (buildTransferNotes, src/BudgetMiniApp.tsx:200-205) but is sent as
    description in the payload (src/components/TransferConfirmScreen.tsx:93-105). The backend then builds its own notes string around
    that comment (src/services/sync/transactions.ts:516-567), so the stored notes field will not match the specified template; it becomes
    “Transfer from … Comment: <template> Added by <user>”.
  - user_name selected with the source account is stored in the transfer slice (src/machines/actions.ts:146-154) but ignored
    when submitting; the payload always uses the global user from context (src/BudgetMiniApp.tsx:932, src/components/
    TransferConfirmScreen.tsx:94). If accounts can belong to another user or if the UI user changes mid-flow, the submitted user_name
    variable may be wrong.
  - The form’s date field (src/machines/types.ts:268-270) is never written via UPDATE_TRANSFER_DATE and never validated.
    TransferConfirmScreen keeps a local date string and sends it, but the machine state remains blank, so the “date” variable in the flow
    isn’t actually tracked or validated.

  Next steps (if you want fixes)

  1. Add source_account_id, destination_account_id, and exchange_rate to TransferTransactionData and include them in
     TransferConfirmScreen’s payload; adjust Firefly request builders accordingly.
  2. Send the generated notes string as the API notes (keep description as the short comment), matching the required template.
  3. Use transfer.user_name in the payload, and dispatch UPDATE_TRANSFER_DATE from the confirm screen so the machine state reflects the
     chosen date.