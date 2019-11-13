"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const fs = require("fs");
async function createTranslationLoader() {
    const { parsers, diagnostics } = await importParsers();
    return (path) => {
        const content = fs.readFileSync(path, 'utf8');
        for (const [format, parser] of Object.entries(parsers)) {
            if (parser.canParse(path, content)) {
                const result = parser.parse(path, content);
                return { format, translation: result.translations, diagnostics };
            }
        }
        throw new Error('Unsupported translation file format.');
    };
}
exports.createTranslationLoader = createTranslationLoader;
async function importParsers() {
    try {
        // tslint:disable-next-line: no-implicit-dependencies
        const localizeDiag = await Promise.resolve().then(() => require('@angular/localize/src/tools/src/diagnostics'));
        const diagnostics = new localizeDiag.Diagnostics();
        const parsers = {
            json: new (await Promise.resolve().then(() => require(
            // tslint:disable-next-line:trailing-comma no-implicit-dependencies
            '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/simple_json_translation_parser'))).SimpleJsonTranslationParser(),
            xlf: new (await Promise.resolve().then(() => require(
            // tslint:disable-next-line:trailing-comma no-implicit-dependencies
            '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/xliff1_translation_parser'))).Xliff1TranslationParser(),
            xlf2: new (await Promise.resolve().then(() => require(
            // tslint:disable-next-line:trailing-comma no-implicit-dependencies
            '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/xliff2_translation_parser'))).Xliff2TranslationParser(),
            // The name ('xmb') needs to match the AOT compiler option
            xmb: new (await Promise.resolve().then(() => require(
            // tslint:disable-next-line:trailing-comma no-implicit-dependencies
            '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/xtb_translation_parser'))).XtbTranslationParser(diagnostics),
        };
        return { parsers, diagnostics };
    }
    catch (_a) {
        throw new Error(`Unable to load translation file parsers. Please ensure '@angular/localize' is installed.`);
    }
}
