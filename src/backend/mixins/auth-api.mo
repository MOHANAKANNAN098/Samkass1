import Types "../types/auth";
import AuthLib "../lib/auth";
import Time "mo:core/Time";

mixin (users : AuthLib.UserMap) {
  /// Register a new user account with phone + hashed PIN.
  /// Role defaults to #admin for owner registrations; pass #staff to create staff accounts.
  public func register(
    phone : Text,
    hashedPin : Text,
    financierName : Text,
    businessName : Text,
    role : Types.UserRole,
  ) : async Types.SimpleResult {
    AuthLib.register(users, phone, hashedPin, financierName, businessName, role, Time.now());
  };

  /// Login with phone + hashed PIN. Returns user profile (including role) on success.
  public func login(
    phone : Text,
    hashedPin : Text,
  ) : async Types.AuthResult {
    AuthLib.login(users, phone, hashedPin);
  };

  /// Reset PIN after verifying the phone number exists.
  public func resetPin(
    phone : Text,
    newHashedPin : Text,
  ) : async Types.SimpleResult {
    AuthLib.resetPin(users, phone, newHashedPin);
  };

  /// Change PIN atomically: verify current PIN then set new PIN.
  public func changePin(
    phone : Text,
    currentHashedPin : Text,
    newHashedPin : Text,
  ) : async Types.SimpleResult {
    AuthLib.changePin(users, phone, currentHashedPin, newHashedPin);
  };

  /// Get the public profile for a phone number (includes role).
  public query func getUserProfile(
    phone : Text,
  ) : async ?Types.UserProfile {
    AuthLib.getProfile(users, phone);
  };

  /// Check if a phone number is already registered.
  public query func phoneExists(
    phone : Text,
  ) : async Bool {
    AuthLib.phoneExists(users, phone);
  };
};
