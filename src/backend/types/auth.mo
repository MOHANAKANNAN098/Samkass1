module {
  /// User role: #admin has full access, #staff has collection-only access.
  public type UserRole = { #admin; #staff };

  /// A registered user account stored in canister state.
  public type UserAccount = {
    phone : Text;
    hashedPin : Text;
    financierName : Text;
    businessName : Text;
    role : UserRole;
    createdAt : Int;
  };

  /// Public-facing profile returned to callers (no sensitive fields).
  public type UserProfile = {
    phone : Text;
    financierName : Text;
    businessName : Text;
    role : UserRole;
  };

  /// Result variants for auth operations.
  public type AuthResult = {
    #ok : UserProfile;
    #err : Text;
  };

  /// Simple result for operations that don't return a profile.
  public type SimpleResult = {
    #ok;
    #err : Text;
  };
};
