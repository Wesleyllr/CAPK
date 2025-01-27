import { CONSTANTS } from "@/constants/constants";
import { Timestamp } from "firebase/firestore";

export const formatCurrency = (value: number) => {
  if (value === 0 || value === undefined) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat(CONSTANTS.DATE_LOCALE, {
    style: "currency",
    currency: CONSTANTS.CURRENCY,
  }).format(value);
};

export const formatDate = (date: Date | Timestamp) => {
  const formattedDate = date instanceof Timestamp ? date.toDate() : date;
  return formattedDate.toLocaleDateString(CONSTANTS.DATE_LOCALE);
};

export const formatDateHour = (date: Date | Timestamp) => {
  const formattedDate = date instanceof Timestamp ? date.toDate() : date;
  return `${formattedDate.toLocaleDateString(
    CONSTANTS.DATE_LOCALE
  )} ${formattedDate.toLocaleTimeString(CONSTANTS.DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export const formatHourMinute = (date: Date | Timestamp) => {
  const formattedDate = date instanceof Timestamp ? date.toDate() : date;
  return formattedDate.toLocaleTimeString(CONSTANTS.DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
};
