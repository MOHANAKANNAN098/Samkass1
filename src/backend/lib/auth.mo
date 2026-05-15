import Map "mo:core/Map";
import Types "../types/auth";

module {
  public type UserMap = Map.Map<Text, Types.UserAccount>;

  /// Register a new user. Returns #err if phone already exists.
  public func register(
    users : UserMap,
    phone : Text,
    hashedPin : Text,
    financierName : Text,
    businessName : Text,
    role : Types.UserRole,
    now : Int,
  ) : Types.SimpleResult {
    if (users.containsKey(phone)) {
      return #err("Phone number already registered");
    };
    let account : Types.UserAccount = {
      phone;
      hashedPin;
      financierName;
      businessName;
      role;
      createdAt = now;
    };
    users.add(phone, account);
    #ok;
  };

  /// Authenticate a user by phone + hashedPin. Returns profile on success.
  public func login(
    users : UserMap,
    phone : Text,
    hashedPin : Text,
  ) : Types.AuthResult {
    switch (users.get(phone)) {
      case null { #err("Invalid credentials") };
      case (?account) {
        if (account.hashedPin == hashedPin) {
          #ok({
            phone = account.phone;
            financierName = account.financierName;
            businessName = account.businessName;
            role = account.role;
          });
        } else {
          #err("Invalid credentials");
        };
      };
    };
  };

  /// Reset PIN for an existing account (verify phone exists first).
  public func resetPin(
    users : UserMap,
    phone : Text,
    newHashedPin : Text,
  ) : Types.SimpleResult {
    switch (users.get(phone)) {
      case null { #err("Phone number not found") };
      case (?account) {
        users.add(phone, { account with hashedPin = newHashedPin });
        #ok;
      };
    };
  };

  /// Change PIN atomically: verify current PIN then set new PIN.
  public func changePin(
    users : UserMap,
    phone : Text,
    currentHashedPin : Text,
    newHashedPin : Text,
  ) : Types.SimpleResult {
    switch (users.get(phone)) {
      case null { #err("Phone number not found") };
      case (?account) {
        if (account.hashedPin != currentHashedPin) {
          return #err("Invalid current PIN");
        };
        users.add(phone, { account with hashedPin = newHashedPin });
        #ok;
      };
    };
  };

  /// Retrieve public profile by phone number.
  public func getProfile(
    users : UserMap,
    phone : Text,
  ) : ?Types.UserProfile {
    switch (users.get(phone)) {
      case null { null };
      case (?account) {
        ?{
          phone = account.phone;
          financierName = account.financierName;
          businessName = account.businessName;
          role = account.role;
        };
      };
    };
  };

  /// Check whether a phone number is already registered.
  public func phoneExists(
    users : UserMap,
    phone : Text,
  ) : Bool {
    users.containsKey(phone);
  };
};
