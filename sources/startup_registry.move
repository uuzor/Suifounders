/// Module: startup_registry
/// On-chain registry for managing startup registrations with Walrus storage integration.
module startup_fund::startup_registry;

use std::string::String;
use std::option::{Self, Option};
use sui::object::{UID, ID};
use sui::tx_context::TxContext;
use sui::dynamic_field as df;
use sui::event::emit;
use sui::transfer;
use sui::tx_context;

// Errors
const ENotOwner: u64 = 0;
const EInvalidBlobId: u64 = 1;
const ENotInTrial: u64 = 2;
const EAlreadyActive: u64 = 3;
const EAlreadyRejected: u64 = 4;
const EStartupNotFound: u64 = 5;
const EInvalidStatus: u64 = 6;

// Status constants
const PENDING: u8 = 0;
const TRIAL: u8 = 1;
const ACTIVE: u8 = 2;
const REJECTED: u8 = 3;

/// Trial period in epochs (~7 days)
const TRIAL_DURATION_EPOCHS: u64 = 7;

/// Maximum lengths
const MAX_NAME_LENGTH: u64 = 100;
const MAX_DESCRIPTION_LENGTH: u64 = 1000;

// ============ Events ============

/// Emitted when a new startup is registered
public struct StartupRegistered has copy, drop {
    startup_id: ID,
    owner: address,
    name: String,
    whitepaper_blob_id: String,
    pitch_deck_blob_id: String,
}

/// Emitted when a startup enters trial period
public struct StartupValidated has copy, drop {
    startup_id: ID,
    trial_start_epoch: u64,
}

/// Emitted when a startup becomes active
public struct StartupActivated has copy, drop {
    startup_id: ID,
    activation_epoch: u64,
}

/// Emitted when a startup is rejected
public struct StartupRejected has copy, drop {
    startup_id: ID,
    reason: String,
}

/// Emitted when startup metadata is updated
public struct StartupMetadataUpdated has copy, drop {
    startup_id: ID,
    new_name: Option<String>,
    new_description: Option<String>,
}

// ============ Structs ============

/// Represents a registered startup
public struct Startup has key, store {
    id: UID,
    /// The founder's address
    owner: address,
    /// Startup name
    name: String,
    /// Brief description of the startup
    description: String,
    /// Walrus blob ID for whitepaper
    whitepaper_blob_id: String,
    /// Walrus blob ID for pitch deck
    pitch_deck_blob_id: String,
    /// Current status: 0=Pending, 1=Trial, 2=Active, 3=Rejected
    status: u8,
    /// Epoch when trial period started (0 if not in trial)
    trial_start_epoch: u64,
    /// Total revenue share tokens available
    total_shares: u64,
    /// Timestamp when registered
    created_at: u64,
}

/// The registry that tracks all registered startups
public struct StartupRegistry has key {
    id: UID,
    /// Counter for total startups registered
    total_startups: u64,
}

/// Capability that allows managing a specific startup
public struct StartupOwnerCap has key, store {
    id: UID,
    startup_id: ID,
}

// ============ Initializer ============

/// Create the shared StartupRegistry (called once during package publishing)
fun init(ctx: &mut TxContext) {
    let registry = StartupRegistry {
        id: sui::object::new(ctx),
        total_startups: 0,
    };
    transfer::share_object(registry);
}

/// Create a new StartupRegistry (for testing)
public fun create_registry(ctx: &mut TxContext): StartupRegistry {
    StartupRegistry {
        id: sui::object::new(ctx),
        total_startups: 0,
    }
}

// ============ Entry Functions ============

/// Register a new startup with the registry
public fun register_startup(
    registry: &mut StartupRegistry,
    name: String,
    description: String,
    whitepaper_blob_id: String,
    pitch_deck_blob_id: String,
    ctx: &mut TxContext,
): StartupOwnerCap {
    // Validate inputs
    assert!(std::string::length(&name) <= MAX_NAME_LENGTH, EInvalidBlobId);
    assert!(std::string::length(&description) <= MAX_DESCRIPTION_LENGTH, EInvalidBlobId);
    assert!(!std::string::is_empty(&whitepaper_blob_id), EInvalidBlobId);
    
    let sender = tx_context::sender(ctx);
    let id = sui::object::new(ctx);
    let startup_id = sui::object::uid_to_inner(&id);
    let created_at = tx_context::epoch(ctx);
    
    let startup = Startup {
        id,
        owner: sender,
        name,
        description,
        whitepaper_blob_id,
        pitch_deck_blob_id,
        status: PENDING,
        trial_start_epoch: 0,
        total_shares: 0,
        created_at,
    };
    
    // Store startup in registry using dynamic field
    df::add(&mut registry.id, startup_id, startup);
    registry.total_startups = registry.total_startups + 1;
    
    // Emit registration event
    emit(StartupRegistered {
        startup_id,
        owner: sender,
        name,
        whitepaper_blob_id,
        pitch_deck_blob_id,
    });
    
    // Return owner capability
    StartupOwnerCap {
        id: sui::object::new(ctx),
        startup_id,
    }
}

/// Validate a startup and move it to trial period
/// Any address can call this to validate a pending startup
public fun validate_startup(
    registry: &mut StartupRegistry,
    startup_id: ID,
    ctx: &mut TxContext,
) {
    let startup = df::borrow_mut<ID, Startup>(&mut registry.id, startup_id);
    assert!(startup.status == PENDING, EInvalidStatus);
    
    let trial_start_epoch = tx_context::epoch(ctx);
    startup.status = TRIAL;
    startup.trial_start_epoch = trial_start_epoch;
    
    emit(StartupValidated {
        startup_id,
        trial_start_epoch,
    });
}

/// Activate a startup (promote from trial to active)
/// Called after trial period ends
public fun activate_startup(
    registry: &mut StartupRegistry,
    startup_id: ID,
    ctx: &mut TxContext,
) {
    let startup = df::borrow_mut<ID, Startup>(&mut registry.id, startup_id);
    assert!(startup.status == TRIAL, ENotInTrial);
    
    let current_epoch = tx_context::epoch(ctx);
    let trial_duration = current_epoch - startup.trial_start_epoch;
    assert!(trial_duration >= TRIAL_DURATION_EPOCHS, ENotInTrial);
    
    startup.status = ACTIVE;
    
    emit(StartupActivated {
        startup_id,
        activation_epoch: current_epoch,
    });
}

/// Reject a startup during trial period
public entry fun reject_startup(
    _cap: &StartupOwnerCap,
    registry: &mut StartupRegistry,
    startup_id: ID,
    reason: String,
    _ctx: &mut TxContext,
) {
    let startup = df::borrow_mut<ID, Startup>(&mut registry.id, startup_id);
    assert!(startup.status == TRIAL, ENotInTrial);
    
    startup.status = REJECTED;
    
    emit(StartupRejected {
        startup_id,
        reason,
    });
}

/// Update startup metadata (name/description)
public entry fun update_metadata(
    _cap: &StartupOwnerCap,
    registry: &mut StartupRegistry,
    startup_id: ID,
    new_name: Option<String>,
    new_description: Option<String>,
    _ctx: &mut TxContext,
) {
    let startup = df::borrow_mut<ID, Startup>(&mut registry.id, startup_id);
    
    if (new_name.is_some()) {
        let name = new_name.destroy_some();
        assert!(std::string::length(&name) <= MAX_NAME_LENGTH, EInvalidBlobId);
        startup.name = name;
    };
    
    if (new_description.is_some()) {
        let desc = new_description.destroy_some();
        assert!(std::string::length(&desc) <= MAX_DESCRIPTION_LENGTH, EInvalidBlobId);
        startup.description = desc;
    };
    
    emit(StartupMetadataUpdated {
        startup_id,
        new_name,
        new_description,
    });
}

/// Set the total shares for a startup (callable by owner)
public entry fun set_total_shares(
    _cap: &StartupOwnerCap,
    registry: &mut StartupRegistry,
    startup_id: ID,
    total_shares: u64,
    _ctx: &mut TxContext,
) {
    let startup = df::borrow_mut<ID, Startup>(&mut registry.id, startup_id);
    assert!(startup.status == ACTIVE, EInvalidStatus);
    startup.total_shares = total_shares;
}

// ============ View Functions ============

/// Get a startup's owner address
public fun get_startup_owner(registry: &StartupRegistry, startup_id: ID): address {
    let startup = df::borrow<ID, Startup>(&registry.id, startup_id);
    startup.owner
}

/// Get a startup's status
public fun get_startup_status(registry: &StartupRegistry, startup_id: ID): u8 {
    let startup = df::borrow<ID, Startup>(&registry.id, startup_id);
    startup.status
}

/// Get the total number of registered startups
public fun get_total_startups(registry: &StartupRegistry): u64 {
    registry.total_startups
}

/// Check if a startup is active
public fun is_active(registry: &StartupRegistry, startup_id: ID): bool {
    let startup = df::borrow<ID, Startup>(&registry.id, startup_id);
    startup.status == ACTIVE
}