import { makeArrayRange } from "./utils";

export default class IntlDate {
    constructor (registry, data) {
        this.localize = registry.subscribe('localize');
        this.locale = this.localize.getLocale();
        this.dataCache = registry.subscribe('data-cache');
        this.makeLocaleData()
        if (data instanceof IntlDate) {
            this.value = data.value;
        } else if (data instanceof Date) {
            if (isNan(data.getTime())) this.setData()
            else this.setData(data.getUTCDate(), data.getUTCMonth() + 1, data.getUTCFullYear())
        } else if (typeof data === 'string') {
            this.parse(data);
        } else if (typeof data === 'number') {
            let date = new Date(data);
            this.setData(date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear())
        } else {
            this.setData();
        }
    }

    get config() {
        return this.dataCache.getData('config');
    }

    set config(value) {
        this.dataCache.setData('config', value);
    }

    setData(date = 0, month = 0, year = 0) {
        this.value = {date, month, year};
    }

    update(which, value) {
        this.value[which] = value || 0;
    }

    daysInMonth() {
        // assume the fewest days
        let {year = 2001, month = 2} = this.value;

        // setting the date to 0 wraps to the end of the previous month.
        // months are zero based, so to know the number of days in the given
        // month there is no need to subtract one, because we want to wrap to
        // the last day in this month.
        let date = new Date(year, month, 0);

        return date.getDate();
    }

    yearRange() {
        let minimumAllowedAge = this.config.minimumAllowedAge || 18;
        let maxYear = new Date().getFullYear() - minimumAllowedAge;

        return {start: 1900, stop: maxYear};
    }

    dayRange() {
        return {start: 1, stop: this.daysInMonth()};
    }

    makeLocaleData() {
        this.separator = this.localize.getDateSeparator(),
        this.order =  this.localize.getDateOrder(),
        this.format = this.makeFormat();
        this.sizes = this.makeSizes();
    }

    makeFormat() {
        let formatParts = {
            month: 'MM',
            date: 'DD',
            year: 'YYYY',
        }
        let { order, separator } = this;
        let format = order.map(function(part) {
            return formatParts[part];
        })

        return format.join(separator);
    }

    makeSizes() {
        let sizeParts = {
            month: 2,
            date: 2,
            year: 4,
        }

        let { order } = this;
        let sizes = order.map(function(part) {
            return sizeParts[part];
        })

        return sizes;
    }

    parseInput(value) {
        this.setData();

        let { separator } = this;
        let endSlash = value.endsWith(separator)

        // remove invalid characters
        let chars = [...'0123456789'];
        chars.push(separator);
        let valueChars = [...value];
        valueChars = valueChars.filter(function(value) {
            return chars.includes(value);
        })

        // if there is nothing left, return an empty string
        if (valueChars.length === 0) {
            return '';
        }

        // get at most three segments of the given date, ignore the rest
        let parts = valueChars.join('').split(separator);
        parts = parts.slice(0, 3);

        // constrain and expand all but the last segment
        let partsCount = parts.length;
        let lastPart = parts.pop();
        let sizes = this.makeSizes();

        let formatted = parts.map(function(part, idx) {
            part = part.slice(0, sizes[idx]);
            if (part.length < sizes[idx])
                part = part.padStart(sizes[idx], '0');

            return part;
        });

        // add slashes to the last segment when there are more chars than will
        // fit in the given date part. This is used to break up a large paste,
        // as well as insert a separator during typing.
        for (let idx = parts.length; idx < 3 && lastPart.length > 0; idx++) {
            let next = lastPart.slice(0, sizes[idx]);
            lastPart = lastPart.slice(sizes[idx])

            formatted.push(next);
        }

        // put it all back together, remove a trailing separator when the number
        // of segments has been reached
        let str = formatted.join(separator) + (value.endsWith(separator) && partsCount < 3 ? separator : '');

        // add the trailing separator if needed
        this.parse(str);
        let newParts = str.split(separator);
        if (endSlash && !str.endsWith(separator) && newParts.length < 3) str += separator;

        return str;
    }

    parse(value) {
        this.setData();

        let { order, separator } = this;

        let parts = value.split(separator);
        parts = parts.slice(0, 3);

        parts.forEach(function(part, idx) {
            if (part === '') return;

            this.value[order[idx]] = parseInt(part, 10);
        }, this);

        return this.value;
    }

    stringify() {
        if (this.locale !== this.localize.getLocale()) {
            this.makeLocaleData();
            this.locale = this.localize.getLocale();
        }

        let { order, separator } = this;
        let sizes = this.makeSizes();

        return order.reduceRight(function(str, name, idx) {
            let value = this.value[name]
            if (value === 0 && str === '') return str;
            let segment = idx !== 0 ? separator : '';
            segment += String(value).padStart(sizes[idx], '0');
            str = segment + str;

            return str;
        }.bind(this), '');
    }

    getValue() {
        return value;
    }

    getDate() {
        let {year = 0, month = 0, date = 0} = this.value;
        if (year === 0 && month === 0 && date === 0) return undefined;
        if (year === 0 || month === 0 || date === 0) return new Date(NaN);
        let valueDate = new Date(Date.UTC(year, month - 1, date));

        if (isNaN(valueDate.getTime())) return valueDate;
        if (valueDate.getUTCFullYear() !== year || (valueDate.getUTCMonth() + 1) !== month || valueDate.getUTCDate() !== date) return new Date(NaN);

        return valueDate;
    }

    getLongForm() {
        let date = this.getDate();
        let language = this.locale.split('-u-')[0];

        if (isNaN(date.getTime()) || date === undefined) return this.toString();
        let options = { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric'};
        return date.toLocaleDateString(language, options);
    }

    toString() {
        return this.stringify();
    }
}
