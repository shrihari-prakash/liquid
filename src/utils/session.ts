import moment from "moment";

export function isTokenInvalidated(globalLogoutAt: string, currentEntityRegisteredAt: string | Date): boolean {
  if (!globalLogoutAt) {
    return false;
  }
  const isInvalid = moment(globalLogoutAt).isAfter(moment(currentEntityRegisteredAt));
  return isInvalid;
}
