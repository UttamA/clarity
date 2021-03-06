/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import {Injectable} from "@angular/core";

import {
    BIG_ENDIAN,
    DEFAULT_LOCALE_FORMAT,
    InputDateDisplayFormat,
    LITTLE_ENDIAN,
    LITTLE_ENDIAN_REGEX,
    MIDDLE_ENDIAN,
    MIDDLE_ENDIAN_REGEX,
    NON_NEGATIVE_NUMBER,
    SEPARATORS
} from "../utils/constants";
import {getNumberOfDaysInTheMonth, parseToFourDigitYear} from "../utils/date-utils";

import {LocaleHelperService} from "./locale-helper.service";

@Injectable()
export class DateIOService {
    public cldrLocaleDateFormat: string = DEFAULT_LOCALE_FORMAT;
    private localeDisplayFormat: InputDateDisplayFormat = LITTLE_ENDIAN;

    constructor(private _localeHelperService: LocaleHelperService) {
        this.cldrLocaleDateFormat = this._localeHelperService.localeDateFormat;
        this.initializeLocaleDisplayFormat();
    }

    private initializeLocaleDisplayFormat(): void {
        const format: string = this.cldrLocaleDateFormat.toLocaleLowerCase();
        if (LITTLE_ENDIAN_REGEX.test(format)) {
            this.localeDisplayFormat = LITTLE_ENDIAN;
        } else if (MIDDLE_ENDIAN_REGEX.test(format)) {
            this.localeDisplayFormat = MIDDLE_ENDIAN;
        } else {
            // everything else is set to BIG-ENDIAN FORMAT
            this.localeDisplayFormat = BIG_ENDIAN;
        }
    }

    toLocaleDisplayFormatString(date: Date): string {
        if (date) {
            if (isNaN(date.getTime())) {
                return "";
            }
            const dateNo: number = date.getDate();
            const monthNo: number = date.getMonth() + 1;
            const dateStr: string = dateNo > 9 ? dateNo.toString() : "0" + dateNo;
            const monthStr: string = monthNo > 9 ? monthNo.toString() : "0" + monthNo;
            if (this.localeDisplayFormat === LITTLE_ENDIAN) {
                return dateStr + "/" + monthStr + "/" + date.getFullYear();
            } else if (this.localeDisplayFormat === MIDDLE_ENDIAN) {
                return monthStr + "/" + dateStr + "/" + date.getFullYear();
            } else {
                return date.getFullYear() + "/" + monthStr + "/" + dateStr;
            }
        }
        return "";
    }

    get placeholderText(): string {
        return this.localeDisplayFormat.format;
    }

    /**
     * Detects if the input date string contains any one
     * of the separators from the SEPARTORS array.
     */
    private detectSeparator(date: string): string {
        let separatorUsed: string;
        for (const separator of SEPARATORS) {
            if (date.indexOf(separator) > -1) {
                separatorUsed = separator;
                break;
            }
        }
        return separatorUsed;
    }

    /**
     * Checks if the string is a non negative number.
     * Credit: https://stackoverflow.com/a/24457420/8960224
     */
    private isNonNegativeNumber(num: string): boolean {
        return NON_NEGATIVE_NUMBER.test(num);
    }

    /**
     * Checks if the date parts are numbers
     */
    private areDatePartsNumbers(dateParts: string[]): boolean {
        for (const part of dateParts) {
            if (!this.isNonNegativeNumber(part)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if the month entered by the user is valid or not.
     * Note: Month is 0 based.
     */
    private isValidMonth(month: number): boolean {
        return (month > -1 && month < 12);
    }

    /**
     * Checks if the date is valid depending on the year and month provided.
     */
    private isValidDate(year: number, month: number, date: number): boolean {
        return (date > 0 && date <= getNumberOfDaysInTheMonth(year, month));
    }

    /**
     * Validates the parameters provided and returns the date.
     * If the parameters are not
     * valid then return null.
     * NOTE: (Month here is 1 based since the user has provided that as an input)
     */
    private validateAndGetDate(year: string, month: string, date: string): Date {
        // I don't know whats wrong with the TS compiler. It throws an error if I write
        // the below if statement. The error is:
        // Operator '!==' cannot be applied to types '2' and '4'
        // More info here: https://github.com/Microsoft/TypeScript/issues/12794#issuecomment-270342936
        /*
        if (year.length !== 2 || year.length !== 4) {
            return null;
        }
        */

        // Instead I have to write the logic like this x-(
        const y: number = +year;
        const m: number = +month - 1;  // month is 0 based
        const d: number = +date;
        if (!this.isValidMonth(m) || !this.isValidDate(y, m, d)) {
            return null;
        }
        const result: number = parseToFourDigitYear(y);
        return result !== -1 ? (new Date(result, m, d)) : null;
    }

    /**
     * Checks if the input provided by the user is valid.
     */
    isValidInput(date: string): Date {
        if (!date) {
            return null;
        }
        const separator: string = this.detectSeparator(date);
        if (!separator) {
            return null;
        }
        const dateParts: string[] = date.split(separator);
        if (dateParts.length !== 3 || !this.areDatePartsNumbers(dateParts)) {
            return null;
        }
        const [firstPart, secondPart, thirdPart] = dateParts;
        if (this.localeDisplayFormat === LITTLE_ENDIAN) {
            // secondPart is month && firstPart is date
            return this.validateAndGetDate(thirdPart, secondPart, firstPart);
        } else if (this.localeDisplayFormat === MIDDLE_ENDIAN) {
            // firstPart is month && secondPart is date
            return this.validateAndGetDate(thirdPart, firstPart, secondPart);
        } else {
            // secondPart is month && thirdPart is date
            return this.validateAndGetDate(firstPart, secondPart, thirdPart);
        }
    }
}
