### CLAUDE.md

budgetMachine.ts - XState v5 hierarchy for the mini app.
    - budgetMachine "Handles loading → ready flows for withdrawal/deposit/transfer/transactions/debug"

actors.ts - Async actors with centralized timeouts.
    - telegramInitActor "Initializes Telegram context"
    - dataLoadingOrchestratorActor "Parallel fetch for accounts/categories/transactions"
    - accountsFetchActor "Loads account usage via syncService"
    - categoriesFetchActor "Loads category usage"
    - depositSourceNameFetchActor "Loads source name suggestions"
    - transactionsFetchActor "Loads transaction list"
    - transactionDetailFetchActor "Fetches single transaction by id"
    - transactionCreateActor "Creates transaction via service"
    - transactionEditActor "Updates transaction via service"
    - transactionDeleteActor "Deletes transaction via service"
    - syncServiceHealthActor "Checks Sync API health"
    - fireflyServiceHealthActor "Checks Firefly API health"

actions.ts - State reducers, guards, and log helpers.
    - actions "Mutation handlers for context updates"
    - guards "Transition guards for flow navigation"
    - validationGuards "Reusable guard set for screen validation"
    - logActions "Debug logging helpers"
    - validateAccountPage/validateAmountPage/... "Per-screen validation functions"

helpers/actionFactory.ts - Factory for resource action triplets.
    - createResourceActions "Generates loading/success/error setters"

errorHandling.ts - Standardized actor error pipeline.
    - ErrorCategory "Enum for timeout/network/validation/auth/etc"
    - classifyError "Maps thrown errors to ErrorCategory"
    - withTimeout "Wraps async ops with configurable timeout"
    - createActorWithErrorHandling "Builds actors with classification + logging"
    - logActorEvent/logActorError "Console loggers for actor lifecycle"

types.ts - Machine context, events, and defaults.
    - initialContext "Bootstraps user/data/ui/transaction state"
    - initialWithdrawalForm/initialDepositForm/initialTransferForm "Form defaults"
    - isTransactionEvent/isTransferEvent "Type guards for event unions"
    - BudgetMachineEvent/BudgetMachineContext/... "Core discriminated unions and interfaces"

index.ts - Barrel for machine exports.
    - budgetMachine "Primary machine export"
    - actions/guards/logActions "Re-exported from actions"
    - BudgetMachineEvent/BudgetMachineContext/etc. "Type re-exports"
