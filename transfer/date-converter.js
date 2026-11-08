import { Service } from "@polylith/core";
import IntlDate from "IntlDate.js";

export default class DateConverter extends Service {
    constructor(registry) {
        super('intl-date-converter', registry);

        this.implement(['ready', 'toData', 'fromData']);
    }

    async ready() {
        this.converterRegistry = this.registry.subscribe('converter-registry');
        this.converterRegistry.add('date', this.serviceName);
    }

    async toData(field, value = false) {
        var date = value ? value.getDate() : new Date();
        return date.getTime();
    }

    async fromData(field, value) {
        return new IntlDate(this.registry, value);
    }
}

new DateConverter();
