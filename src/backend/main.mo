import Map "mo:core/Map";
import Types "types/auth";
import AuthMixin "mixins/auth-api";



actor {
  let users : Map.Map<Text, Types.UserAccount> = Map.empty<Text, Types.UserAccount>();
  include AuthMixin(users);
};
