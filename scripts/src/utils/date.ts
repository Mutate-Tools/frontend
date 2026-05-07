import { isValid } from "date-fns";
import { format } from "date-fns/format";

namespace DateUtils {
  export const DateFormat = {
    date: "MM/dd/yyyy",
    dateTime: "MMM dd, yyyy 'at' hh:mm a",
  };

  export function dateToString(
    date: Date,
    formatStr: string = DateFormat.date
  ): string {
    if (!date) return "";
    if (isValid(date)) {
      return format(date, formatStr);
    }
    return "";
  }

  export function convertDateStringToFormattedDate(
    dateString: string,
    formatStr: string = DateFormat.dateTime
  ): string {
    let date = new Date(dateString);

    return isValid(date) ? format(date, formatStr) : "";
  }

  export function dateToCustomFormat(
    date: Date,
    formatStr: string = DateFormat.dateTime
  ): string {
    return isValid(date) ? format(date, formatStr) : "";
  }

  export function unixTimestampToString(timestamp: number): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };

    return new Date(timestamp * 1000).toLocaleString("en-US", options);
  }

  export function dateFormattedPlusDays(
    dateInSeconds: number,
    daysToAdd: number
  ): string {
    const date = new Date(dateInSeconds * 1000);
    const futureDate = new Date(date);

    futureDate.setDate(date.getDate() + daysToAdd);

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    const formattedDate = futureDate.toLocaleDateString("en-US", options);
    return formattedDate;
  }

  export function secondsToUtcTime(seconds: number): number {
    const date = new Date(seconds * 1000);
    const utcSeconds = date.getTime() / 1000 - date.getTimezoneOffset() * 60;

    return utcSeconds;
  }
  export function formatUnixTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const formattedDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}, ${formatTime(date)}`;
    return formattedDate;
  }
  export function formatTime(date: Date): string {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    return formattedTime;
  }
}

export default DateUtils;
