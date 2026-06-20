/// Module: types
/// Defines shared types, constants, and error codes for the startup fund platform.
module startup_fund::types;

/// Startup status constants representing lifecycle stages
const PENDING: u8 = 0;
const TRIAL: u8 = 1;
const ACTIVE: u8 = 2;
const REJECTED: u8 = 3;

/// Trial period duration in Sui epochs (approximately 24 hours each)
const TRIAL_DURATION_EPOCHS: u64 = 7;

/// Maximum lengths for string fields
const MAX_NAME_LENGTH: u64 = 100;
const MAX_DESCRIPTION_LENGTH: u64 = 1000;

/// Error codes using Sui's error handling pattern
const ENotOwner: u64 = 0;
const EInvalidStatus: u64 = 1;
const EInvalidBlobId: u64 = 2;
const ENotInTrial: u64 = 3;
const EAlreadyActive: u64 = 4;
const EAlreadyRejected: u64 = 5;
const EStartupNotFound: u64 = 6;
const EInvalidAddress: u64 = 7;
const ETokenAlreadyCreated: u64 = 8;
const EStartupNotActive: u64 = 9;
const EExceededMaxSupply: u64 = 10;
const EUnauthorized: u64 = 11;