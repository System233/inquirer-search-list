"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Base = require("inquirer/lib/prompts/base");
var observe = require("inquirer/lib/utils/events");
var figures = require("figures");
var Paginator = require("inquirer/lib/utils/paginator");
var chalk_1 = require("chalk");
var fuzzy = require("fuzzy");
var ignoreKeys = ["up", "down", "space"];
function defaultFilterRow(choice, query) {
    return fuzzy.test(query, choice.name);
}
;
function defaultRenderRow(choice, isSelected) {
    if (isSelected) {
        return "" + chalk_1.default.cyan(figures.pointer) + chalk_1.default.cyan(choice.name);
    }
    else {
        return " " + choice.name;
    }
}
function renderChoices(renderRow, choices, pointer) {
    var output = "";
    choices.forEach(function (choice, i) {
        output += renderRow(choice, i === pointer);
        output += "\n";
    });
    return output.replace(/\n$/, "");
}
var SearchBox = (function (_super) {
    __extends(SearchBox, _super);
    function SearchBox() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        var _this = _super.apply(this, params) || this;
        _this.pointer = 0;
        _this.selected = '';
        _this.list = [];
        _this.filterList = [];
        _this.paginator = new Paginator();
        var _a = _this.opt, choices = _a.choices, renderRow = _a.renderRow, filterRow = _a.filterRow;
        if (!choices) {
            _this.throwParamError("choices");
        }
        renderRow ? _this.renderRow = renderRow : _this.renderRow = defaultRenderRow;
        filterRow ? _this.filterRow = filterRow : _this.filterRow = defaultFilterRow;
        _this.filterList = _this.list = choices
            .filter(function () { return true; })
            .map(function (item, id) { return (__assign(__assign({}, item), { id: id })); });
        return _this;
    }
    SearchBox.prototype.render = function (error) {
        var message = this.getQuestion();
        var bottomContent = "";
        var tip = chalk_1.default.dim("(Press <enter> to submit)");
        if (this.status === "answered") {
            message += chalk_1.default.cyan(this.selected ? this.getCurrentItemName() : '');
        }
        else {
            message += tip + " " + this.rl.line;
            var choicesStr = renderChoices(this.renderRow, this.filterList, this.pointer);
            bottomContent = this.paginator.paginate(choicesStr, this.pointer, this.opt.pageSize);
        }
        if (error) {
            bottomContent = chalk_1.default.red(">> ") + error;
        }
        this.screen.render(message, bottomContent);
    };
    SearchBox.prototype.filterChoices = function () {
        var _this = this;
        this.filterList = this.list.filter(function (choice) { return _this.filterRow(choice, _this.rl.line); });
    };
    SearchBox.prototype.onDownKey = function () {
        var len = this.filterList.length;
        this.pointer = this.pointer < len - 1 ? this.pointer + 1 : 0;
        this.render();
    };
    SearchBox.prototype.onUpKey = function () {
        var len = this.filterList.length;
        this.pointer = this.pointer > 0 ? this.pointer - 1 : len - 1;
        this.render();
    };
    SearchBox.prototype.onAllKey = function () {
        this.render();
    };
    SearchBox.prototype.onEnd = function (state) {
        this.status = "answered";
        if (this.getCurrentItemName()) {
            this.selected = this.getCurrentItemName();
        }
        this.render();
        this.screen.done();
        this.done(state.value);
    };
    SearchBox.prototype.onError = function (state) {
        this.render(state.isValid);
    };
    SearchBox.prototype.onKeyPress = function () {
        this.pointer = 0;
        this.filterChoices();
        this.render();
    };
    SearchBox.prototype.getCurrentItem = function () {
        if (this.filterList.length) {
            return this.filterList[this.pointer];
        }
        else {
            return this.list[this.pointer];
        }
    };
    SearchBox.prototype.getCurrentItemValue = function () {
        return this.getCurrentItem().value;
    };
    SearchBox.prototype.getCurrentItemName = function () {
        return this.getCurrentItem().name;
    };
    SearchBox.prototype._run = function (cb) {
        this.done = cb;
        var events = observe(this.rl);
        var upKey = events.keypress.filter(function (e) {
            return e.key.name === "up" || (e.key.name === "p" && e.key.ctrl);
        });
        var downKey = events.keypress.filter(function (e) {
            return e.key.name === "down" || (e.key.name === "n" && e.key.ctrl);
        });
        var allKey = events.keypress.filter(function (e) { return e.key.name === "o" && e.key.ctrl; });
        var validation = this.handleSubmitEvents(events.line.map(this.getCurrentItemValue.bind(this)));
        validation.success.forEach(this.onEnd.bind(this));
        validation.error.forEach(this.onError.bind(this));
        upKey.forEach(this.onUpKey.bind(this));
        downKey.forEach(this.onDownKey.bind(this));
        allKey.takeUntil(validation.success).forEach(this.onAllKey.bind(this));
        events.keypress
            .filter(function (e) { return !e.key.ctrl && !ignoreKeys.includes(e.key.name); })
            .takeUntil(validation.success)
            .forEach(this.onKeyPress.bind(this));
        this.render();
        return this;
    };
    return SearchBox;
}(Base));
module.exports = SearchBox;
