"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_webpack_1 = require("@angular-devkit/build-webpack");
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const webpack_configs_1 = require("../angular-cli-files/models/webpack-configs");
const read_tsconfig_1 = require("../angular-cli-files/utilities/read-tsconfig");
const require_project_module_1 = require("../angular-cli-files/utilities/require-project-module");
const service_worker_1 = require("../angular-cli-files/utilities/service-worker");
const stats_1 = require("../angular-cli-files/utilities/stats");
const utils_1 = require("../utils");
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const webpackMerge = require('webpack-merge');
class BrowserBuilder {
    constructor(context) {
        this.context = context;
    }
    run(builderConfig) {
        const root = this.context.workspace.root;
        const projectRoot = core_1.resolve(root, builderConfig.root);
        const host = new core_1.virtualFs.AliasHost(this.context.host);
        const webpackBuilder = new build_webpack_1.WebpackBuilder(Object.assign({}, this.context, { host }));
        const options = utils_1.normalizeBuilderSchema(host, root, builderConfig);
        return rxjs_1.of(null).pipe(operators_1.concatMap(() => options.deleteOutputPath
            ? this._deleteOutputDir(root, core_1.normalize(options.outputPath), this.context.host)
            : rxjs_1.of(null)), operators_1.concatMap(() => {
            let webpackConfig;
            try {
                webpackConfig = this.buildWebpackConfig(root, projectRoot, host, options);
            }
            catch (e) {
                return rxjs_1.throwError(e);
            }
            return webpackBuilder.runWebpack(webpackConfig, exports.getBrowserLoggingCb(options.verbose));
        }), operators_1.concatMap(buildEvent => {
            if (buildEvent.success && !options.watch && options.serviceWorker) {
                return new rxjs_1.Observable(obs => {
                    service_worker_1.augmentAppWithServiceWorker(this.context.host, root, projectRoot, core_1.resolve(root, core_1.normalize(options.outputPath)), options.baseHref || '/', options.ngswConfigPath).then(() => {
                        obs.next({ success: true });
                        obs.complete();
                    }, (err) => {
                        obs.error(err);
                    });
                });
            }
            else {
                return rxjs_1.of(buildEvent);
            }
        }));
    }
    buildWebpackConfig(root, projectRoot, host, options) {
        // Ensure Build Optimizer is only used with AOT.
        if (options.buildOptimizer && !options.aot) {
            throw new Error('The `--build-optimizer` option cannot be used without `--aot`.');
        }
        let wco;
        const tsConfigPath = core_1.getSystemPath(core_1.normalize(core_1.resolve(root, core_1.normalize(options.tsConfig))));
        const tsConfig = read_tsconfig_1.readTsconfig(tsConfigPath);
        const projectTs = require_project_module_1.requireProjectModule(core_1.getSystemPath(projectRoot), 'typescript');
        const supportES2015 = tsConfig.options.target !== projectTs.ScriptTarget.ES3
            && tsConfig.options.target !== projectTs.ScriptTarget.ES5;
        wco = {
            root: core_1.getSystemPath(root),
            logger: this.context.logger,
            projectRoot: core_1.getSystemPath(projectRoot),
            buildOptions: options,
            tsConfig,
            tsConfigPath,
            supportES2015,
        };
        wco.buildOptions.progress = utils_1.defaultProgress(wco.buildOptions.progress);
        const webpackConfigs = [
            webpack_configs_1.getCommonConfig(wco),
            webpack_configs_1.getBrowserConfig(wco),
            webpack_configs_1.getStylesConfig(wco),
            webpack_configs_1.getStatsConfig(wco),
        ];
        if (wco.buildOptions.main || wco.buildOptions.polyfills) {
            const typescriptConfigPartial = wco.buildOptions.aot
                ? webpack_configs_1.getAotConfig(wco, host)
                : webpack_configs_1.getNonAotConfig(wco, host);
            webpackConfigs.push(typescriptConfigPartial);
        }
        const webpackConfig = webpackMerge(webpackConfigs);
        if (options.profile) {
            const smp = new SpeedMeasurePlugin({
                outputFormat: 'json',
                outputTarget: core_1.getSystemPath(core_1.join(root, 'speed-measure-plugin.json')),
            });
            return smp.wrap(webpackConfig);
        }
        return webpackConfig;
    }
    _deleteOutputDir(root, outputPath, host) {
        const resolvedOutputPath = core_1.resolve(root, outputPath);
        if (resolvedOutputPath === root) {
            throw new Error('Output path MUST not be project root directory!');
        }
        return host.exists(resolvedOutputPath).pipe(operators_1.concatMap(exists => exists
            // TODO: remove this concat once host ops emit an event.
            ? rxjs_1.concat(host.delete(resolvedOutputPath), rxjs_1.of(null)).pipe(operators_1.last())
            // ? of(null)
            : rxjs_1.of(null)));
    }
}
exports.BrowserBuilder = BrowserBuilder;
exports.getBrowserLoggingCb = (verbose) => (stats, config, logger) => {
    // config.stats contains our own stats settings, added during buildWebpackConfig().
    const json = stats.toJson(config.stats);
    if (verbose) {
        logger.info(stats.toString(config.stats));
    }
    else {
        logger.info(stats_1.statsToString(json, config.stats));
    }
    if (stats.hasWarnings()) {
        logger.warn(stats_1.statsWarningsToString(json, config.stats));
    }
    if (stats.hasErrors()) {
        logger.error(stats_1.statsErrorsToString(json, config.stats));
    }
};
exports.default = BrowserBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2Jyb3dzZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFhQSxpRUFBZ0Y7QUFDaEYsK0NBQWdHO0FBRWhHLCtCQUEwRDtBQUMxRCw4Q0FBc0Q7QUFHdEQsaUZBT3FEO0FBQ3JELGdGQUE0RTtBQUM1RSxrR0FBNkY7QUFDN0Ysa0ZBQTRGO0FBQzVGLGdFQUk4QztBQUM5QyxvQ0FBbUU7QUFFbkUsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQUNuRSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFFOUMsTUFBYSxjQUFjO0lBRXpCLFlBQW1CLE9BQXVCO1FBQXZCLFlBQU8sR0FBUCxPQUFPLENBQWdCO0lBQUksQ0FBQztJQUUvQyxHQUFHLENBQUMsYUFBeUQ7UUFDM0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQ3pDLE1BQU0sV0FBVyxHQUFHLGNBQU8sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RELE1BQU0sSUFBSSxHQUFHLElBQUksZ0JBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFnQyxDQUFDLENBQUM7UUFDcEYsTUFBTSxjQUFjLEdBQUcsSUFBSSw4QkFBYyxtQkFBTSxJQUFJLENBQUMsT0FBTyxJQUFFLElBQUksSUFBRyxDQUFDO1FBRXJFLE1BQU0sT0FBTyxHQUFHLDhCQUFzQixDQUNwQyxJQUFJLEVBQ0osSUFBSSxFQUNKLGFBQWEsQ0FDZCxDQUFDO1FBRUYsT0FBTyxTQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUNsQixxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxn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QUMsNkJBQXFCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ3hEO0lBQ0QsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUU7UUFDckIsTUFBTSxDQUFDLEtBQUssQ0FBQywyQkFBbUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDdkQ7QUFDSCxDQUFDLENBQUM7QUFFSixrQkFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBCdWlsZEV2ZW50LFxuICBCdWlsZGVyLFxuICBCdWlsZGVyQ29uZmlndXJhdGlvbixcbiAgQnVpbGRlckNvbnRleHQsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgTG9nZ2luZ0NhbGxiYWNrLCBXZWJwYWNrQnVpbGRlciB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC13ZWJwYWNrJztcbmltcG9ydCB7IFBhdGgsIGdldFN5c3RlbVBhdGgsIGpvaW4sIG5vcm1hbGl6ZSwgcmVzb2x2ZSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgY29uY2F0LCBvZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwLCBsYXN0LCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JzsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1pbXBsaWNpdC1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IFdlYnBhY2tDb25maWdPcHRpb25zIH0gZnJvbSAnLi4vYW5ndWxhci1jbGktZmlsZXMvbW9kZWxzL2J1aWxkLW9wdGlvbnMnO1xuaW1wb3J0IHtcbiAgZ2V0QW90Q29uZmlnLFxuICBnZXRCcm93c2VyQ29uZmlnLFxuICBnZXRDb21tb25Db25maWcsXG4gIGdldE5vbkFvdENvbmZpZyxcbiAgZ2V0U3RhdHNDb25maWcsXG4gIGdldFN0eWxlc0NvbmZpZyxcbn0gZnJvbSAnLi4vYW5ndWxhci1jbGktZmlsZXMvbW9kZWxzL3dlYnBhY2stY29uZmlncyc7XG5pbXBvcnQgeyByZWFkVHNjb25maWcgfSBmcm9tICcuLi9hbmd1bGFyLWNsaS1maWxlcy91dGlsaXRpZXMvcmVhZC10c2NvbmZpZyc7XG5pbXBvcnQgeyByZXF1aXJlUHJvamVjdE1vZHVsZSB9IGZyb20gJy4uL2FuZ3VsYXItY2xpLWZpbGVzL3V0aWxpdGllcy9yZXF1aXJlLXByb2plY3QtbW9kdWxlJztcbmltcG9ydCB7IGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlciB9IGZyb20gJy4uL2FuZ3VsYXItY2xpLWZpbGVzL3V0aWxpdGllcy9zZXJ2aWNlLXdvcmtlcic7XG5pbXBvcnQge1xuICBzdGF0c0Vycm9yc1RvU3RyaW5nLFxuICBzdGF0c1RvU3RyaW5nLFxuICBzdGF0c1dhcm5pbmdzVG9TdHJpbmcsXG59IGZyb20gJy4uL2FuZ3VsYXItY2xpLWZpbGVzL3V0aWxpdGllcy9zdGF0cyc7XG5pbXBvcnQgeyBkZWZhdWx0UHJvZ3Jlc3MsIG5vcm1hbGl6ZUJ1aWxkZXJTY2hlbWEgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBCcm93c2VyQnVpbGRlclNjaGVtYSwgTm9ybWFsaXplZEJyb3dzZXJCdWlsZGVyU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuY29uc3QgU3BlZWRNZWFzdXJlUGx1Z2luID0gcmVxdWlyZSgnc3BlZWQtbWVhc3VyZS13ZWJwYWNrLXBsdWdpbicpO1xuY29uc3Qgd2VicGFja01lcmdlID0gcmVxdWlyZSgnd2VicGFjay1tZXJnZScpO1xuXG5leHBvcnQgY2xhc3MgQnJvd3NlckJ1aWxkZXIgaW1wbGVtZW50cyBCdWlsZGVyPEJyb3dzZXJCdWlsZGVyU2NoZW1hPiB7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0KSB7IH1cblxuICBydW4oYnVpbGRlckNvbmZpZzogQnVpbGRlckNvbmZpZ3VyYXRpb248QnJvd3NlckJ1aWxkZXJTY2hlbWE+KTogT2JzZXJ2YWJsZTxCdWlsZEV2ZW50PiB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuY29udGV4dC53b3Jrc3BhY2Uucm9vdDtcbiAgICBjb25zdCBwcm9qZWN0Um9vdCA9IHJlc29sdmUocm9vdCwgYnVpbGRlckNvbmZpZy5yb290KTtcbiAgICBjb25zdCBob3N0ID0gbmV3IHZpcnR1YWxGcy5BbGlhc0hvc3QodGhpcy5jb250ZXh0Lmhvc3QgYXMgdmlydHVhbEZzLkhvc3Q8ZnMuU3RhdHM+KTtcbiAgICBjb25zdCB3ZWJwYWNrQnVpbGRlciA9IG5ldyBXZWJwYWNrQnVpbGRlcih7IC4uLnRoaXMuY29udGV4dCwgaG9zdCB9KTtcblxuICAgIGNvbnN0IG9wdGlvbnMgPSBub3JtYWxpemVCdWlsZGVyU2NoZW1hKFxuICAgICAgaG9zdCxcbiAgICAgIHJvb3QsXG4gICAgICBidWlsZGVyQ29uZmlnLFxuICAgICk7XG5cbiAgICByZXR1cm4gb2YobnVsbCkucGlwZShcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiBvcHRpb25zLmRlbGV0ZU91dHB1dFBhdGhcbiAgICAgICAgPyB0aGlzLl9kZWxldGVPdXRwdXREaXIocm9vdCwgbm9ybWFsaXplKG9wdGlvbnMub3V0cHV0UGF0aCksIHRoaXMuY29udGV4dC5ob3N0KVxuICAgICAgICA6IG9mKG51bGwpKSxcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiB7XG4gICAgICAgIGxldCB3ZWJwYWNrQ29uZmlnO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHdlYnBhY2tDb25maWcgPSB0aGlzLmJ1aWxkV2VicGFja0NvbmZpZyhyb290LCBwcm9qZWN0Um9vdCwgaG9zdCwgb3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3ZWJwYWNrQnVpbGRlci5ydW5XZWJwYWNrKHdlYnBhY2tDb25maWcsIGdldEJyb3dzZXJMb2dnaW5nQ2Iob3B0aW9ucy52ZXJib3NlKSk7XG4gICAgICB9KSxcbiAgICAgIGNvbmNhdE1hcChidWlsZEV2ZW50ID0+IHtcbiAgICAgICAgaWYgKGJ1aWxkRXZlbnQuc3VjY2VzcyAmJiAhb3B0aW9ucy53YXRjaCAmJiBvcHRpb25zLnNlcnZpY2VXb3JrZXIpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgICAgICAgIGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlcihcbiAgICAgICAgICAgICAgdGhpcy5jb250ZXh0Lmhvc3QsXG4gICAgICAgICAgICAgIHJvb3QsXG4gICAgICAgICAgICAgIHByb2plY3RSb290LFxuICAgICAgICAgICAgICByZXNvbHZlKHJvb3QsIG5vcm1hbGl6ZShvcHRpb25zLm91dHB1dFBhdGgpKSxcbiAgICAgICAgICAgICAgb3B0aW9ucy5iYXNlSHJlZiB8fCAnLycsXG4gICAgICAgICAgICAgIG9wdGlvbnMubmdzd0NvbmZpZ1BhdGgsXG4gICAgICAgICAgICApLnRoZW4oXG4gICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICBvYnMubmV4dCh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgb2JzLmVycm9yKGVycik7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBvZihidWlsZEV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGJ1aWxkV2VicGFja0NvbmZpZyhcbiAgICByb290OiBQYXRoLFxuICAgIHByb2plY3RSb290OiBQYXRoLFxuICAgIGhvc3Q6IHZpcnR1YWxGcy5Ib3N0PGZzLlN0YXRzPixcbiAgICBvcHRpb25zOiBOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWEsXG4gICkge1xuICAgIC8vIEVuc3VyZSBCdWlsZCBPcHRpbWl6ZXIgaXMgb25seSB1c2VkIHdpdGggQU9ULlxuICAgIGlmIChvcHRpb25zLmJ1aWxkT3B0aW1pemVyICYmICFvcHRpb25zLmFvdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgYC0tYnVpbGQtb3B0aW1pemVyYCBvcHRpb24gY2Fubm90IGJlIHVzZWQgd2l0aG91dCBgLS1hb3RgLicpO1xuICAgIH1cblxuICAgIGxldCB3Y286IFdlYnBhY2tDb25maWdPcHRpb25zPE5vcm1hbGl6ZWRCcm93c2VyQnVpbGRlclNjaGVtYT47XG5cbiAgICBjb25zdCB0c0NvbmZpZ1BhdGggPSBnZXRTeXN0ZW1QYXRoKG5vcm1hbGl6ZShyZXNvbHZlKHJvb3QsIG5vcm1hbGl6ZShvcHRpb25zLnRzQ29uZmlnKSkpKTtcbiAgICBjb25zdCB0c0NvbmZpZyA9IHJlYWRUc2NvbmZpZyh0c0NvbmZpZ1BhdGgpO1xuXG4gICAgY29uc3QgcHJvamVjdFRzID0gcmVxdWlyZVByb2plY3RNb2R1bGUoZ2V0U3lzdGVtUGF0aChwcm9qZWN0Um9vdCksICd0eXBlc2NyaXB0JykgYXMgdHlwZW9mIHRzO1xuXG4gICAgY29uc3Qgc3VwcG9ydEVTMjAxNSA9IHRzQ29uZmlnLm9wdGlvbnMudGFyZ2V0ICE9PSBwcm9qZWN0VHMuU2NyaXB0VGFyZ2V0LkVTM1xuICAgICAgJiYgdHNDb25maWcub3B0aW9ucy50YXJnZXQgIT09IHByb2plY3RUcy5TY3JpcHRUYXJnZXQuRVM1O1xuXG4gICAgd2NvID0ge1xuICAgICAgcm9vdDogZ2V0U3lzdGVtUGF0aChyb290KSxcbiAgICAgIGxvZ2dlcjogdGhpcy5jb250ZXh0LmxvZ2dlcixcbiAgICAgIHByb2plY3RSb290OiBnZXRTeXN0ZW1QYXRoKHByb2plY3RSb290KSxcbiAgICAgIGJ1aWxkT3B0aW9uczogb3B0aW9ucyxcbiAgICAgIHRzQ29uZmlnLFxuICAgICAgdHNDb25maWdQYXRoLFxuICAgICAgc3VwcG9ydEVTMjAxNSxcbiAgICB9O1xuXG4gICAgd2NvLmJ1aWxkT3B0aW9ucy5wcm9ncmVzcyA9IGRlZmF1bHRQcm9ncmVzcyh3Y28uYnVpbGRPcHRpb25zLnByb2dyZXNzKTtcblxuICAgIGNvbnN0IHdlYnBhY2tDb25maWdzOiB7fVtdID0gW1xuICAgICAgZ2V0Q29tbW9uQ29uZmlnKHdjbyksXG4gICAgICBnZXRCcm93c2VyQ29uZmlnKHdjbyksXG4gICAgICBnZXRTdHlsZXNDb25maWcod2NvKSxcbiAgICAgIGdldFN0YXRzQ29uZmlnKHdjbyksXG4gICAgXTtcblxuICAgIGlmICh3Y28uYnVpbGRPcHRpb25zLm1haW4gfHwgd2NvLmJ1aWxkT3B0aW9ucy5wb2x5ZmlsbHMpIHtcbiAgICAgIGNvbnN0IHR5cGVzY3JpcHRDb25maWdQYXJ0aWFsID0gd2NvLmJ1aWxkT3B0aW9ucy5hb3RcbiAgICAgICAgPyBnZXRBb3RDb25maWcod2NvLCBob3N0KVxuICAgICAgICA6IGdldE5vbkFvdENvbmZpZyh3Y28sIGhvc3QpO1xuICAgICAgd2VicGFja0NvbmZpZ3MucHVzaCh0eXBlc2NyaXB0Q29uZmlnUGFydGlhbCk7XG4gICAgfVxuXG4gICAgY29uc3Qgd2VicGFja0NvbmZpZyA9IHdlYnBhY2tNZXJnZSh3ZWJwYWNrQ29uZmlncyk7XG5cbiAgICBpZiAob3B0aW9ucy5wcm9maWxlKSB7XG4gICAgICBjb25zdCBzbXAgPSBuZXcgU3BlZWRNZWFzdXJlUGx1Z2luKHtcbiAgICAgICAgb3V0cHV0Rm9ybWF0OiAnanNvbicsXG4gICAgICAgIG91dHB1dFRhcmdldDogZ2V0U3lzdGVtUGF0aChqb2luKHJvb3QsICdzcGVlZC1tZWFzdXJlLXBsdWdpbi5qc29uJykpLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzbXAud3JhcCh3ZWJwYWNrQ29uZmlnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gd2VicGFja0NvbmZpZztcbiAgfVxuXG4gIHByaXZhdGUgX2RlbGV0ZU91dHB1dERpcihyb290OiBQYXRoLCBvdXRwdXRQYXRoOiBQYXRoLCBob3N0OiB2aXJ0dWFsRnMuSG9zdCkge1xuICAgIGNvbnN0IHJlc29sdmVkT3V0cHV0UGF0aCA9IHJlc29sdmUocm9vdCwgb3V0cHV0UGF0aCk7XG4gICAgaWYgKHJlc29sdmVkT3V0cHV0UGF0aCA9PT0gcm9vdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPdXRwdXQgcGF0aCBNVVNUIG5vdCBiZSBwcm9qZWN0IHJvb3QgZGlyZWN0b3J5IScpO1xuICAgIH1cblxuICAgIHJldHVybiBob3N0LmV4aXN0cyhyZXNvbHZlZE91dHB1dFBhdGgpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoZXhpc3RzID0+IGV4aXN0c1xuICAgICAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyBjb25jYXQgb25jZSBob3N0IG9wcyBlbWl0IGFuIGV2ZW50LlxuICAgICAgICA/IGNvbmNhdChob3N0LmRlbGV0ZShyZXNvbHZlZE91dHB1dFBhdGgpLCBvZihudWxsKSkucGlwZShsYXN0KCkpXG4gICAgICAgIC8vID8gb2YobnVsbClcbiAgICAgICAgOiBvZihudWxsKSksXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZ2V0QnJvd3NlckxvZ2dpbmdDYiA9ICh2ZXJib3NlOiBib29sZWFuKTogTG9nZ2luZ0NhbGxiYWNrID0+XG4gIChzdGF0cywgY29uZmlnLCBsb2dnZXIpID0+IHtcbiAgICAvLyBjb25maWcuc3RhdHMgY29udGFpbnMgb3VyIG93biBzdGF0cyBzZXR0aW5ncywgYWRkZWQgZHVyaW5nIGJ1aWxkV2VicGFja0NvbmZpZygpLlxuICAgIGNvbnN0IGpzb24gPSBzdGF0cy50b0pzb24oY29uZmlnLnN0YXRzKTtcbiAgICBpZiAodmVyYm9zZSkge1xuICAgICAgbG9nZ2VyLmluZm8oc3RhdHMudG9TdHJpbmcoY29uZmlnLnN0YXRzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ2dlci5pbmZvKHN0YXRzVG9TdHJpbmcoanNvbiwgY29uZmlnLnN0YXRzKSk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRzLmhhc1dhcm5pbmdzKCkpIHtcbiAgICAgIGxvZ2dlci53YXJuKHN0YXRzV2FybmluZ3NUb1N0cmluZyhqc29uLCBjb25maWcuc3RhdHMpKTtcbiAgICB9XG4gICAgaWYgKHN0YXRzLmhhc0Vycm9ycygpKSB7XG4gICAgICBsb2dnZXIuZXJyb3Ioc3RhdHNFcnJvcnNUb1N0cmluZyhqc29uLCBjb25maWcuc3RhdHMpKTtcbiAgICB9XG4gIH07XG5cbmV4cG9ydCBkZWZhdWx0IEJyb3dzZXJCdWlsZGVyO1xuIl19