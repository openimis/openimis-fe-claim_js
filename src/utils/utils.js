import { getTimeDifferenceInDays } from "@openimis/fe-core";
import { DAYS } from "../constants";

export const calculateAge = (dob, dateClaimed, formatMessage) => {
  if (!dob) return `${formatMessage("calculateAge.util.dobNotProvided")}`;

  const dateToCalculate = dateClaimed ?? new Date();
  const birthDate = new Date(dob);

  const diffInDays = getTimeDifferenceInDays(dateToCalculate, birthDate);

  if (diffInDays < DAYS.IN_A_WEEK) {
    return `${diffInDays} ${formatMessage("calculateAge.util.days")}`;
  }

  if (diffInDays < DAYS.IN_A_MONTH) {
    return `${Math.floor(diffInDays / DAYS.IN_A_WEEK)} ${formatMessage("calculateAge.util.weeks")}`;
  }

  if (diffInDays < DAYS.IN_A_YEAR) {
    return `${Math.floor(diffInDays / DAYS.IN_A_MONTH)} ${formatMessage("calculateAge.util.months")}`;
  }

  return `${Math.floor(diffInDays / DAYS.IN_A_YEAR)} ${formatMessage("calculateAge.util.years")}`;
};

export const calculateDuration = (dateTo, dateFrom, formatMessage) => {
  const visitDuration = getTimeDifferenceInDays(dateTo ?? new Date(), dateFrom ?? new Date());

  const formattedDuration =
    visitDuration === 0
      ? `1 ${formatMessage("calculateAge.util.days")}`
      : `${visitDuration} ${formatMessage("calculateAge.util.days")}`;

  return formattedDuration;
};
