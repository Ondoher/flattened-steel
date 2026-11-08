import React, { Component } from "react";
import { FormControl, TextField, InputAdornment, FormHelperText } from "@mui/material";
import OnboardingContext from "OnboardingContext.js";
import IntlDate from "IntlDate.js";

export default class Date extends Component {
    static contextType = OnboardingContext;

    constructor(props) {
        super(props);
        this.firstTime = true;
        this.state= {value: ''};
    }

    getText(key) {
        return this.context.localize.t(key);
    }

    renderHelperText(error, helperText) {
        if (error && helperText) {
            return <FormHelperText>{helperText}</FormHelperText>
        }
    }

    setDefault() {
        if (this.firstTime) {
            this.locale = this.context.locale
            this.intlDate = new IntlDate(this.context.registry, this.props.defaultValue);
            this.setState({value: this.intlDate.stringify()})
        }
        this.firstTime = false;
    }

    changedLocale() {
        this.intlDate = new IntlDate(this.context.registry, this.intlDate);
        this.locale = this.context.locale;
        var value = this.intlDate.stringify();
        this.setState({value: value});
    }

    manageCursor(e) {
        var value = e.target.value;
        var caret = e.target.selectionStart;
        var atEnd = value.length === caret;
        var element = e.target;

        window.requestAnimationFrame(() => {
            if (atEnd) caret = this.state.value.length;
            element.selectionStart = caret;
            element.selectionEnd = caret;
        });
    }

    onChange(e) {
        this.manageCursor(e);

        var value = e.target.value;
        var fixed = this.intlDate.parseInput(value);
        this.setState({value: fixed})
    }

    onBlur() {
        this.setState({value: this.intlDate.stringify()})
        if (this.props.onBlur) this.props.onBlur({target: {value: this.intlDate, id: this.props.id}})
    }

    renderAdornment() {
        var format = `(${this.intlDate.makeFormat()})`;

        return (
            <InputAdornment position="end" >
                <span className="date-input-format">{format}</span>
            </InputAdornment>
        )
    }

    renderTextField() {
        var { label, ariaLabel, autocomplete, autoComplete, error } = this.props;

        label = this.getText(label);
        ariaLabel = ariaLabel ? this.getText(ariaLabel) : undefined;
        var autocomplete = autocomplete || autoComplete;

        return(
            <TextField
                variant={this.context.editVariant}
                value={this.state.value}
                error={error}
                label={label}
                InputProps={{
                    endAdornment: this.renderAdornment(),
                }}

                onChange={this.onChange.bind(this)}
                onBlur={this.onBlur.bind(this)}
                inputProps={{
                    "aria-label": ariaLabel,
                    autoComplete: autocomplete,
                }}
            />
        )
    }

    render() {
        this.setDefault();
        if (!this.locale) this.locale !== this.context.locale
        if (this.locale !== this.context.locale) this.changedLocale();
        var props = this.props;
        var error = props.error;
        var className = 'date' + (props.className ? ` ${props.className}` : '')
        var helperText = (error) ? props.helperText : '';
        return (
            <FormControl
                fullWidth
                className={className}
                variant={this.context.editVariant}
                error={error}
            >
                {this.renderTextField()}
                {this.renderHelperText(error, helperText)}
            </FormControl>
        )
    }
}
